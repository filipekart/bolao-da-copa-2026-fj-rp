CREATE TABLE public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  ref_key text NOT NULL,
  window_label text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, ref_key, window_label)
);

CREATE INDEX idx_notification_log_user_kind ON public.notification_log (user_id, kind, window_label);

GRANT ALL ON public.notification_log TO service_role;

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON public.notification_log FOR ALL TO service_role USING (true) WITH CHECK (true);