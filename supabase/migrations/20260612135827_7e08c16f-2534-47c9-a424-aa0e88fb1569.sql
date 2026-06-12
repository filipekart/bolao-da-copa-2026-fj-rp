CREATE TABLE public.public_ranking_tokens (
  token text PRIMARY KEY,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.public_ranking_tokens TO service_role;

ALTER TABLE public.public_ranking_tokens ENABLE ROW LEVEL SECURITY;

-- No client policies: only service_role (edge function) reads this table.

INSERT INTO public.public_ranking_tokens (token, label)
VALUES ('8d510b2b52c24d7da8391e3a8c0d31cf6773783d141e3756', 'Link público inicial');