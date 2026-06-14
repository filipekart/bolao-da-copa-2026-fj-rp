UPDATE auth.users
SET encrypted_password = crypt('Weiss123', gen_salt('bf')),
    updated_at = now()
WHERE id IN (
  '23fd171b-7784-42d3-9afe-f064cb1c8bb5',
  '996e778b-188c-4800-95ba-12986cb26324',
  '076ba87f-8dad-4986-b67d-5073f8aa1c0f'
);