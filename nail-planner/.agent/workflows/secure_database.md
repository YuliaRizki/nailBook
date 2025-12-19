---
description: Secure the database with User Isolation (RLS)
---

# Secure Database & Enable Multi-tenancy

This workflow will isolate data so each user (nailist) only sees their own appointments.

1.  **Open the Supabase Dashboard**: Go to the **SQL Editor**.
2.  **Paste and Run** the following SQL script:

```sql
-- 1. Add user_id column if it doesn't exist
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();

-- 2. Enable Row Level Security (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy: Users can only SEE their own appointments
CREATE POLICY "Users can only see their own appointments"
ON appointments FOR SELECT
USING (auth.uid() = user_id);

-- 4. Create Policy: Users can only INSERT their own appointments
CREATE POLICY "Users can insert their own appointments"
ON appointments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Create Policy: Users can UPDATE their own appointments
CREATE POLICY "Users can update their own appointments"
ON appointments FOR UPDATE
USING (auth.uid() = user_id);

-- 6. Create Policy: Users can DELETE their own appointments
CREATE POLICY "Users can delete their own appointments"
ON appointments FOR DELETE
USING (auth.uid() = user_id);

-- 7. Fix existing rows (Optional: Assigns all current rows to YOU)
-- ONLY RUN THIS IF YOU ARE THE ONLY USER SO FAR
UPDATE appointments
SET user_id = auth.uid()
WHERE user_id IS NULL;
```

3.  **Verify**:
    - Go to **Table Editor** > `appointments`.
    - You should see a `user_id` column.
