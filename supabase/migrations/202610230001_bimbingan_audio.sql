-- Private recordings, isolated by the authenticated user's UUID in the object path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bimbingan-audio', 'bimbingan-audio', false, 26214400,
  array['audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav','audio/x-wav','audio/aac','audio/x-m4a'])
on conflict (id) do nothing;

create policy "Users read own bimbingan audio" on storage.objects for select to authenticated
using (bucket_id = 'bimbingan-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users upload own bimbingan audio" on storage.objects for insert to authenticated
with check (bucket_id = 'bimbingan-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete own bimbingan audio" on storage.objects for delete to authenticated
using (bucket_id = 'bimbingan-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
