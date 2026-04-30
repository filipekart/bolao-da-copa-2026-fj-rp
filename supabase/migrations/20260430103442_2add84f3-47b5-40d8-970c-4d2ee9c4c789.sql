UPDATE teams
SET flag_url = '/flags/' || regexp_replace(flag_url, '^https://flagcdn\.com/w\d+/([^.]+)\.png$', '\1') || '.png'
WHERE flag_url LIKE 'https://flagcdn.com/%';