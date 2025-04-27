# Setting Up Supabase Service Role Key

To enable anonymous reporting, we need to use the Supabase Service Role key which bypasses Row Level Security (RLS) policies. This key has admin privileges and should be kept secure.

## Getting Your Service Role Key

1. Go to your Supabase project dashboard
2. Click on "Settings" in the left sidebar
3. Click on "API" in the settings menu
4. Look for the "Project API keys" section
5. Copy the "service_role key" (it should be labeled as secret and show a warning about having full access)

## Adding to Environment Variables

Add the service role key to your `.env.local` file:

```
# Add this line to your .env.local file
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Important Security Notes

- The service role key bypasses all security policies and has full access to your database
- NEVER expose this key in client-side code
- NEVER commit this key to your repository
- ONLY use this key in server-side API routes (like we're doing in `/api/reports/route.ts`)
- In production, ensure your environment variables are properly secured

## How It Works

Our implementation uses:

- The service role key only for anonymous report submissions
- The regular anon key for authenticated user report submissions
- This approach allows both anonymous and authenticated reports while maintaining security

After adding this key to your environment variables, the anonymous report submissions should work properly.
