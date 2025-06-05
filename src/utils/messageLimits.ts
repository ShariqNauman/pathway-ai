
import { supabase } from '../integrations/supabase/client';

export interface MessageLimits {
  message_count: number;
  essay_count: number;
  recommender_count: number;
  last_reset: string;
  last_reset_essays: string;
  last_reset_recommender: string;
}

export const getMessageLimits = async (userId: string): Promise<MessageLimits | null> => {
  try {
    const { data, error } = await supabase
      .from('message_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching message limits:', error);
      return null;
    }

    if (!data) {
      // Create initial record
      const { data: newData, error: insertError } = await supabase
        .from('message_limits')
        .insert({
          user_id: userId,
          message_count: 0,
          essay_count: 0,
          recommender_count: 0,
          last_reset: new Date().toISOString(),
          last_reset_essays: new Date().toISOString(),
          last_reset_recommender: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating message limits:', insertError);
        return null;
      }

      return newData;
    }

    return data;
  } catch (error) {
    console.error('Error in getMessageLimits:', error);
    return null;
  }
};

export const incrementRecommenderCount = async (userId: string): Promise<boolean> => {
  try {
    const now = new Date();
    const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const todayUTC = new Date(utcNow.getFullYear(), utcNow.getMonth(), utcNow.getDate());

    // Get current limits
    const limits = await getMessageLimits(userId);
    if (!limits) return false;

    const lastResetDate = new Date(limits.last_reset_recommender);
    const lastResetUTC = new Date(lastResetDate.getTime() + lastResetDate.getTimezoneOffset() * 60000);
    const lastResetDayUTC = new Date(lastResetUTC.getFullYear(), lastResetUTC.getMonth(), lastResetUTC.getDate());

    let newCount = limits.recommender_count;
    let resetTime = limits.last_reset_recommender;

    // Reset count if it's a new day
    if (todayUTC > lastResetDayUTC) {
      newCount = 0;
      resetTime = todayUTC.toISOString();
    }

    // Increment count
    newCount += 1;

    const { error } = await supabase
      .from('message_limits')
      .update({
        recommender_count: newCount,
        last_reset_recommender: resetTime,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error incrementing recommender count:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in incrementRecommenderCount:', error);
    return false;
  }
};

export const canUseRecommender = async (userId: string): Promise<{ canUse: boolean; remaining: number }> => {
  try {
    const limits = await getMessageLimits(userId);
    if (!limits) return { canUse: false, remaining: 0 };

    const now = new Date();
    const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const todayUTC = new Date(utcNow.getFullYear(), utcNow.getMonth(), utcNow.getDate());

    const lastResetDate = new Date(limits.last_reset_recommender);
    const lastResetUTC = new Date(lastResetDate.getTime() + lastResetDate.getTimezoneOffset() * 60000);
    const lastResetDayUTC = new Date(lastResetUTC.getFullYear(), lastResetUTC.getMonth(), lastResetUTC.getDate());

    let currentCount = limits.recommender_count;

    // Reset count if it's a new day
    if (todayUTC > lastResetDayUTC) {
      currentCount = 0;
      // Update the reset time in database
      await supabase
        .from('message_limits')
        .update({
          recommender_count: 0,
          last_reset_recommender: todayUTC.toISOString(),
        })
        .eq('user_id', userId);
    }

    const maxRecommendations = 5;
    const remaining = Math.max(0, maxRecommendations - currentCount);
    const canUse = remaining > 0;

    return { canUse, remaining };
  } catch (error) {
    console.error('Error in canUseRecommender:', error);
    return { canUse: false, remaining: 0 };
  }
};

export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (error || !data) return false;

    const adminEmails = [
      'admin@pathway.com',
      'admin@example.com'
    ];

    return adminEmails.includes(data.email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
