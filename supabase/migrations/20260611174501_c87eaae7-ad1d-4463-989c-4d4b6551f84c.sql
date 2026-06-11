UPDATE auth.users
SET encrypted_password = crypt('papai1957', gen_salt('bf')),
    email_change = COALESCE(email_change, ''),
    updated_at = now()
WHERE id = '22885271-db77-4c0a-99d3-bb51bec95a29';