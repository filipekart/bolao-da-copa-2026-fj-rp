
-- 1. Restrict the profiles realtime publication to non-sensitive columns (exclude pix_key)
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles (id, approved, display_name);

-- 2. Enable RLS on realtime.messages and scope channel access by user id in topic
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users subscribe to own-scoped channels" ON realtime.messages;
CREATE POLICY "Users subscribe to own-scoped channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (realtime.topic() LIKE '%' || auth.uid()::text || '%');

DROP POLICY IF EXISTS "Users broadcast to own-scoped channels" ON realtime.messages;
CREATE POLICY "Users broadcast to own-scoped channels"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (realtime.topic() LIKE '%' || auth.uid()::text || '%');
