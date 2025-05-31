-- Storage Policies for avatars bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow public to view profile images
CREATE POLICY "Allow public to view avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Allow users to update and delete their own files
CREATE POLICY "Allow users to update their own files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid() = owner OR auth.uid() = SPLIT_PART(name, '/', 1)::uuid));

CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid() = owner OR auth.uid() = SPLIT_PART(name, '/', 1)::uuid)); 
 