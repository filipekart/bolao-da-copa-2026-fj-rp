import { useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = 'BN0qxh1ur9TdTR5b5GCuSHB9J1ay562QWXqh6mUBjxnWWPrNXSVNTFVw8Z6sfDv4qS6Y-PprcgBTgu2YkxFLeC4';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function usePushSubscription() {
  const { user } = useAuth();

  const subscribe = useCallback(async () => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();

      // If existing subscription was created with a different VAPID key, unsubscribe and recreate
      if (subscription) {
        const existingKey = subscription.options?.applicationServerKey;
        const expectedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        const existingArr = existingKey ? new Uint8Array(existingKey) : null;
        const matches = !!existingArr
          && existingArr.length === expectedKey.length
          && existingArr.every((b, i) => b === expectedKey[i]);
        if (!matches) {
          try { await subscription.unsubscribe(); } catch {}
          subscription = null;
        }
      }

      if (!subscription) {
        // If already granted (e.g. re-subscribe), go ahead; otherwise request
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;
        } else if (Notification.permission !== 'granted') {
          return;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
      }

      const key = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');
      if (!key || !auth) return;

      const { error } = await supabase
        .from('push_subscriptions' as any)
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: arrayBufferToBase64(key),
          auth: arrayBufferToBase64(auth),
        }, { onConflict: 'user_id,endpoint' });

      if (error) console.error('Failed to save push subscription:', error);
    } catch (err) {
      console.error('Push subscription error:', err);
    }
  }, [user]);

  return { subscribe };
}
