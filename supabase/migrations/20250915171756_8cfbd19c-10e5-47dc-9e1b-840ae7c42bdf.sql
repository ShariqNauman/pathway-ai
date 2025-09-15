-- Add gemini_api_key column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gemini_api_key TEXT;