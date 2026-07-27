-- Private bucket for uploaded print-job model files (STL/OBJ/3MF/etc).
-- Objects are keyed as "<uploader-uid>/<random>-<filename>".
insert into storage.buckets (id, name, public, file_size_limit)
values ('job-files', 'job-files', false, 104857600); -- 100 MB

-- Uploaders can only write into their own folder.
create policy "Users can upload job files into their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'job-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- The uploader (job requester) or the assigned provider can read the file.
create policy "Job file owner or assigned provider can read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'job-files'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or exists (
        select 1 from public.jobs j
        where j.model_file = storage.objects.name
          and j.provider_id = (select auth.uid())
      )
    )
  );

-- The uploader can delete their own files (e.g. cancelling a job before it's accepted).
create policy "Users can delete their own job files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'job-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
