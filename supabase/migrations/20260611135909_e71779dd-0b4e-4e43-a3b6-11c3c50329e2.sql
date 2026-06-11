UPDATE auth.identities 
SET identity_data = jsonb_set(identity_data, '{email}', '"everton.souza@bncrealty.com.br"')
WHERE user_id = 'be45b694-8766-4383-a1aa-94e2f24d6ba7';

UPDATE auth.users
SET encrypted_password = crypt('bncrealty2026', gen_salt('bf')),
    updated_at = now()
WHERE id = 'be45b694-8766-4383-a1aa-94e2f24d6ba7';