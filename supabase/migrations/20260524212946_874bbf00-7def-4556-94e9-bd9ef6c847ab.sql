
ALTER VIEW public.v_group_standings SET (security_invoker = true);

CREATE POLICY "admins insert match-exports objects"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'match-exports' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update match-exports objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'match-exports' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'match-exports' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete match-exports objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'match-exports' AND public.has_role(auth.uid(), 'admin'));
