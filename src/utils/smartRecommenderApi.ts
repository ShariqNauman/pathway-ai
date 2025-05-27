
import { supabase } from "@/integrations/supabase/client";

const MAX_DAILY_RECOMMENDER_REQUESTS = 5;

export const checkRecommenderLimit = async (userId: string): Promise<boolean> => {
  try {
    // Get current limit record
    const { data: limitData, error: limitError } = await supabase
      .from('message_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (limitError && limitError.code !== 'PGRST116') {
      console.error('Error checking recommender limit:', limitError);
      return false;
    }

    const now = new Date();
    const resetTime = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z');

    if (!limitData) {
      // Create new record if none exists
      const { error } = await supabase
        .from('message_limits')
        .insert({
          user_id: userId,
          recommender_count: 1,
          last_reset_recommender: resetTime.toISOString()
        });

      if (error) {
        console.error('Error creating recommender limit:', error);
        return false;
      }

      return true;
    }

    // Check if we need to reset the counter
    const lastReset = new Date(limitData.last_reset_recommender || limitData.last_reset);
    if (now > lastReset && now.getUTCDate() !== lastReset.getUTCDate()) {
      // Reset counter at UTC midnight
      const { error } = await supabase
        .from('message_limits')
        .update({
          recommender_count: 1,
          last_reset_recommender: resetTime.toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting recommender limit:', error);
        return false;
      }

      return true;
    }

    // Check if limit is reached
    if ((limitData.recommender_count || 0) >= MAX_DAILY_RECOMMENDER_REQUESTS) {
      return false;
    }

    // Increment counter
    const { error } = await supabase
      .from('message_limits')
      .update({
        recommender_count: (limitData.recommender_count || 0) + 1
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating recommender count:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in checkRecommenderLimit:', error);
    return false;
  }
};

export const getRecommenderCount = async (userId: string): Promise<{ count: number; isLimitReached: boolean }> => {
  try {
    const { data, error } = await supabase
      .from('message_limits')
      .select('recommender_count, last_reset_recommender, last_reset')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching recommender count:', error);
      return { count: 0, isLimitReached: false };
    }

    if (!data) {
      return { count: 0, isLimitReached: false };
    }

    const now = new Date();
    const lastReset = new Date(data.last_reset_recommender || data.last_reset);
    
    if (now > lastReset && now.getUTCDate() !== lastReset.getUTCDate()) {
      return { count: 0, isLimitReached: false };
    }

    const count = data.recommender_count || 0;
    return { 
      count, 
      isLimitReached: count >= MAX_DAILY_RECOMMENDER_REQUESTS 
    };
  } catch (error) {
    console.error('Error in getRecommenderCount:', error);
    return { count: 0, isLimitReached: false };
  }
};