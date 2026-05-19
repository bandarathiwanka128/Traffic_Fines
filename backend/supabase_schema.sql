-- Run this in the Supabase SQL Editor to set up the database schema

-- Profiles table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id      UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name    TEXT NOT NULL,
  role    TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('admin', 'officer', 'citizen')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatically create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown'), 'citizen')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fines table
CREATE TABLE IF NOT EXISTS fines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_plate TEXT NOT NULL,
  owner_name    TEXT NOT NULL,
  owner_email   TEXT,
  violation     TEXT NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  location      TEXT NOT NULL,
  fine_date     TIMESTAMPTZ DEFAULT NOW(),
  due_date      TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'disputed')),
  paid_at       TIMESTAMPTZ,
  issued_by     UUID REFERENCES auth.users,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines    ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, only update their own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Fines: all authenticated users can read; inserts/updates/deletes handled server-side via service role
CREATE POLICY "fines_select" ON fines FOR SELECT USING (auth.role() = 'authenticated');
