
CREATE TABLE public.match_export_log (
  match_id uuid PRIMARY KEY,
  storage_path text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  exported_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.match_export_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read match_export_log"
ON public.match_export_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete match_export_log"
ON public.match_export_log FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('match-exports', 'match-exports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "admins read match-exports objects"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'match-exports' AND public.has_role(auth.uid(), 'admin'));
