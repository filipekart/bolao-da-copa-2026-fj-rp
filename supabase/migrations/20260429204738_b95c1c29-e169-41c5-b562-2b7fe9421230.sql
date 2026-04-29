UPDATE auth.users
SET encrypted_password = crypt('BV072', gen_salt('bf')),
    updated_at = now()
WHERE id = '0198f4ab-4600-4fd9-9dce-051e23171d46';