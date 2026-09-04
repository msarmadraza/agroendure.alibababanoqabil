-- Add onboarding-related columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'ur',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS face_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS cnic_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS cnic_number TEXT;
