-- Make avatars bucket public
update storage.buckets
set public = true
where id = 'avatars';

-- Drop restrictive policies
drop policy if exists "Avatar owners can read" on storage.objects;

-- Allow public read access
create policy "Public can read avatars" on storage.objects
for select
using ( bucket_id = 'avatars' );







