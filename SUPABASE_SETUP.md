# Supabase Setup for SJ Snap

## Setting Up Storage for Anonymous Uploads

To enable anonymous image uploads (without requiring sign-in), follow these steps in your Supabase project:

### 1. Create the Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to Storage in the sidebar
3. Click "Create Bucket"
4. Name the bucket `reports`
5. Select "Public bucket" to enable public access
6. Click "Create bucket"

### 2. Configure Storage Policies

For anonymous uploads to work, you need to set up appropriate policies:

1. Go to the "Policies" tab in your bucket
2. Copy the SQL from `lib/supabase/storage-policies.sql`
3. Navigate to the SQL Editor in Supabase
4. Paste and run the SQL to create the necessary policies

The policies will:

- Allow anyone to upload files to the `public/` folder in the reports bucket
- Allow anyone to read files from the `public/` folder in the reports bucket

### 3. Environment Variables

Make sure your environment variables are properly set in your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Testing

After setup, you should be able to upload images through the report page without signing in. The images will be stored in the Supabase `reports` bucket in the `public/` folder with timestamped filenames.
