---
description: Add missing columns to Appointments table in Supabase
---

## 1. Open SQL Editor

Go to your [Supabase Dashboard](https://supabase.com/dashboard) and click on the **SQL Editor** icon in the left sidebar.

## 2. Paste and Run this Query

Copy the code block below, paste it into the editor, and click **RUN**.

```sql
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS client_phone text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS reference_image text;
```

## 3. Verify

1. Go to the **Table Editor** (spreadsheet icon).
2. Open the `appointments` table.
3. You should now see the new columns at the end!

_Now your app can save the phone number, notes, and image URL._
