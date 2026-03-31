import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

const REMINDER_INTERVALS = [60, 10]; // minutes before kickoff
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // check every 2 minutes
const STORAGE_KEY = 'match-reminders-sent';

function getSentReminders(): Record<string, number[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function markReminderSent(matchId: string, minutesBefore: number) {
  const sent = getSentReminders();
  if (!sent[matchId]) sent[matchId] = [];
  sent[matchId].push(minutesBefore);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sent));
}

function wasReminderSent(matchId: string, minutesBefore: number): boolean {
  const sent = getSentReminders();
  return sent[matchId]?.includes(minutesBefore) ?? false;
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function sendNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'match-reminder',
    });
  } catch {
    // Fallback: some mobile browsers don't support new Notification()
  }
}

export function useMatchReminders() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkReminders = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const maxAhead = new Date(now.getTime() + 65 * 60 * 1000); // 65 min ahead

    // Fetch upcoming matches within the next ~65 minutes
    const { data: matches, error: matchErr } = await supabase
      .from('v_matches_with_teams')
      .select('id, kickoff_at, home_team_name, away_team_name')
      .gte('kickoff_at', now.toISOString())
      .lte('kickoff_at', maxAhead.toISOString())
      .eq('status', 'SCHEDULED');

    if (matchErr || !matches?.length) return;

    // Fetch user's predictions for these matches
    const matchIds = matches.map(m => m.id!);
    const { data: predictions } = await supabase
      .from('match_predictions')
      .select('match_id')
      .eq('user_id', user.id)
      .in('match_id', matchIds);

    const predictedIds = new Set(predictions?.map(p => p.match_id) ?? []);

    // Check each match for reminders
    for (const match of matches) {
      if (!match.id || !match.kickoff_at) continue;
      if (predictedIds.has(match.id)) continue; // already bet

      const kickoff = new Date(match.kickoff_at);
      const minutesUntil = (kickoff.getTime() - now.getTime()) / (1000 * 60);

      for (const reminderMin of REMINDER_INTERVALS) {
        // Send if within range (e.g. 60min reminder: send between 58-62 min before)
        if (minutesUntil <= reminderMin + 2 && minutesUntil >= reminderMin - 2) {
          if (wasReminderSent(match.id, reminderMin)) continue;

          const timeLabel = reminderMin === 60 ? '1 hora' : '10 minutos';
          sendNotification(
            `⚽ Falta ${timeLabel}!`,
            `${match.home_team_name} × ${match.away_team_name} começa em ${timeLabel}. Faça seu palpite!`
          );
          markReminderSent(match.id, reminderMin);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Request permission on mount
    requestNotificationPermission();

    // Initial check
    checkReminders();

    // Periodic check
    intervalRef.current = setInterval(checkReminders, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, checkReminders]);
}
