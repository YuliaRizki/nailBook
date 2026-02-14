-- 1. Ensure RLS is enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing DELETE policy if needed to refresh it
DROP POLICY IF EXISTS "Users can delete their own appointments" ON appointments;

-- 3. Create/Re-create DELETE policy
CREATE POLICY "Users can delete their own appointments"
ON appointments FOR DELETE
USING (auth.uid() = user_id);

-- 4. Fix entries that might have NULL user_id (Assign to the specific Client)
-- CRITICAL STEP:
-- 1. Go to the "Authentication" tab in Supabase.
-- 2. Copy the "User UID" of your client (e.g., 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11').
-- 3. PASTE it inside the quotes below, replacing 'PASTE_YOUR_CLIENT_UID_HERE'.

UPDATE appointments 
SET user_id = '90ce5ceb-53e2-49ff-a9d8-48beb81400a8' 
WHERE user_id IS NULL;
