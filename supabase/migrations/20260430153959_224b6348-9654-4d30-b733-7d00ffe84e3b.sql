UPDATE auth.users
SET encrypted_password = crypt('PSG1234', gen_salt('bf')),
    updated_at = now()
WHERE id IN ('eb3908cd-ee7a-4661-9d0f-f2cf57864cc4', '43dc24bf-6643-4ae3-a4df-1c1510aab3a9');