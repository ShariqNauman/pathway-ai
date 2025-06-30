
-- Add Smart Recommender tracking columns to the message_limits table
ALTER TABLE message_limits 
ADD COLUMN IF NOT EXISTS smart_recommender_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_smart_recommender timestamp with time zone DEFAULT now();

-- Create or replace function to check and reset Smart Recommender limits
CREATE OR REPLACE FUNCTION check_and_reset_smart_recommender_limit(user_uuid uuid)
RETURNS TABLE(current_count integer, limit_reached boolean) 
LANGUAGE plpgsql
AS $$
DECLARE
    user_limits RECORD;
    daily_limit integer := 5;
BEGIN
    -- Get or create user limits record
    SELECT * INTO user_limits 
    FROM message_limits 
    WHERE user_id = user_uuid;
    
    -- If no record exists, create one
    IF user_limits IS NULL THEN
        INSERT INTO message_limits (user_id, smart_recommender_count, last_reset_smart_recommender)
        VALUES (user_uuid, 0, NOW())
        RETURNING * INTO user_limits;
    END IF;
    
    -- Check if we need to reset (if last reset was before today UTC)
    IF DATE(user_limits.last_reset_smart_recommender AT TIME ZONE 'UTC') < DATE(NOW() AT TIME ZONE 'UTC') THEN
        UPDATE message_limits 
        SET smart_recommender_count = 0, 
            last_reset_smart_recommender = NOW()
        WHERE user_id = user_uuid;
        user_limits.smart_recommender_count := 0;
    END IF;
    
    -- Return current count and whether limit is reached
    RETURN QUERY SELECT 
        user_limits.smart_recommender_count,
        user_limits.smart_recommender_count >= daily_limit;
END;
$$;

-- Create or replace function to increment Smart Recommender usage
CREATE OR REPLACE FUNCTION increment_smart_recommender_usage(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    current_status RECORD;
BEGIN
    -- Check current status first
    SELECT * INTO current_status 
    FROM check_and_reset_smart_recommender_limit(user_uuid);
    
    -- If limit not reached, increment
    IF NOT current_status.limit_reached THEN
        UPDATE message_limits 
        SET smart_recommender_count = smart_recommender_count + 1
        WHERE user_id = user_uuid;
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;
