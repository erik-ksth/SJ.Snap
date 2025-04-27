-- Create profiles table to store user profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reports table for incident reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),  -- Making user_id optional (removed NOT NULL)
  description TEXT NOT NULL,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create policies for reports
-- Anyone can view reports
DROP POLICY IF EXISTS "Anyone can view reports" ON reports;
CREATE POLICY "Anyone can view reports" 
  ON reports FOR SELECT 
  USING (true);

-- Anyone can create anonymous reports (with null user_id)
DROP POLICY IF EXISTS "Anyone can create anonymous reports" ON reports;
CREATE POLICY "Anyone can create anonymous reports" 
  ON reports FOR INSERT 
  WITH CHECK (user_id IS NULL);

-- Authenticated users can create their own reports
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
CREATE POLICY "Authenticated users can create reports" 
  ON reports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
CREATE POLICY "Users can update own reports" 
  ON reports FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 