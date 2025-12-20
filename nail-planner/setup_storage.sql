-- 1. Create the storage bucket 'reference_images' if it doesn't exist
-- Note: If this fails, you can create the 'reference_images' bucket in the Storage Dashboard.
insert into storage.buckets (id, name, public)
values ('reference_images', 'reference_images', true)
on conflict (id) do nothing;

-- 2. Create Policies
-- We skip 'ALTER TABLE' because storage.objects already has RLS enabled by default.

-- Drop old policies to avoid conflicts if re-running
drop policy if exists "Reference Images Public Access" on storage.objects;
create policy "Reference Images Public Access"
on storage.objects for select
using ( bucket_id = 'reference_images' );

drop policy if exists "Authenticated Users Upload" on storage.objects;
create policy "Authenticated Users Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'reference_images' );

-- Update: Allow users to update their own files
drop policy if exists "Users Update Own Files" on storage.objects;
create policy "Users Update Own Files"
on storage.objects for update
to authenticated
using ( auth.uid() = owner )
with check ( bucket_id = 'reference_images' );

-- Delete: Allow users to delete their own files
drop policy if exists "Users Delete Own Files" on storage.objects;
create policy "Users Delete Own Files"
on storage.objects for delete
to authenticated
using ( auth.uid() = owner );
