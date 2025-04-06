-- SQL script to add the missing columns to the profiles table
-- This script should be run by a Supabase database administrator

-- Check if the 'countryofresidence' column already exists and add it if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'countryofresidence'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE public.profiles ADD COLUMN countryofresidence text;
    
    -- Add comment to the column
    COMMENT ON COLUMN public.profiles.countryofresidence IS 'Country where the user currently resides';
    
    RAISE NOTICE 'Column countryofresidence added successfully';
  ELSE
    RAISE NOTICE 'Column countryofresidence already exists';
  END IF;
END
$$;

-- Check if the 'nationality' column already exists and add it if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'nationality'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE public.profiles ADD COLUMN nationality text;
    
    -- Add comment to the column
    COMMENT ON COLUMN public.profiles.nationality IS 'User nationality or country of citizenship';
    
    RAISE NOTICE 'Column nationality added successfully';
  ELSE
    RAISE NOTICE 'Column nationality already exists';
  END IF;
END
$$; 