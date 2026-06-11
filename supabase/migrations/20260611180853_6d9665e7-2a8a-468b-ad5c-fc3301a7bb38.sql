UPDATE auth.users
SET encrypted_password = crypt('BV0430', gen_salt('bf')),
    email_change = COALESCE(email_change, ''),
    updated_at = now()
WHERE id = '78365146-908b-46ea-81bb-9f828aa7815c';