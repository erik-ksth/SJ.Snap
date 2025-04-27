-- Create a public storage bucket for reports
-- Run this in the Supabase SQL editor

-- Create 'reports' bucket if it doesn't exist
-- Note: This needs to be run in the Supabase dashboard as SQL can't create buckets directly

-- Set up storage policies for anonymous uploads

-- Allow anonymous uploads to the reports bucket
CREATE POLICY "Allow anonymous uploads" 
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'reports' AND name LIKE 'public/%');

-- Allow public read access to the reports bucket
CREATE POLICY "Allow public read access" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'reports' AND name LIKE 'public/%');

-- Note: You'll need to create the 'reports' bucket in the Supabase dashboard
-- and set it to public access for these policies to work properly. 