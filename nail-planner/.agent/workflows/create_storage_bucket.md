---
description: Create Supabase Storage Bucket for Reference Images
---

## 1. Login to Supabase

Go to your [Supabase Dashboard](https://supabase.com/dashboard).

## 2. Navigate to Storage

Click on the **Storage** icon in the left sidebar (it looks like a box/archive).

## 3. Create a New Bucket

1. Click the **"New Bucket"** button.
2. Enter the name: `reference_images`
   - **Important:** The name must match exactly.
3. Toggle "Public bucket" to **ON**.
   - This allows the images to be displayed in your app without signed URLs.
4. Click **"Save"** or **"Create bucket"**.

## 4. Set Policies (Crucial!)

By default, uploads might be blocked. You need to allow public access.

1. Go to the **Configuration** tab of your new bucket (or click "Policies").
2. Under "Bucket Policies", click "New Policy".
3. Choose **"For full customization"** (or "Get started quickly" -> "Give anon users access to everything").
4. **Policy Name:** `Allow Public Uploads`
5. **Allowed Operations:** Check `SELECT`, `INSERT`, `UPDATE`.
6. **Target Roles:** Select `anon` and `authenticated`.
7. Click **"Review"** and **"Save"**.

_Your app should now be able to upload and display images!_
