
import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'shariqnaumann@gmail.com'; // Admin email with no limits

export async function checkAndUpdateLimits(
  userId: string, 
  feature: 'chat' | 'essay' | 'recommender'
): Promise<{ canUse: boolean; remaining: number; resetTime: string | null }> {
  try {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profile?.email === ADMIN_EMAIL) {
      return { canUse: true, remaining: 999, resetTime: null };
    }

    // Get current limits
    const { data: limits, error: fetchError } = await supabase
      .from('message_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const now = new Date();
    const todayUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const tomorrowUTC = new Date(todayUTC);
    tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);

    let currentLimits = limits;

    // Create limits record if it doesn't exist
    if (!currentLimits) {
      const { data: newLimits, error: insertError } = await supabase
        .from('message_limits')
        .insert({
          user_id: userId,
          message_count: 0,
          essay_count: 0,
          recommender_count: 0,
          last_reset: todayUTC.toISOString(),
          last_reset_essays: todayUTC.toISOString(),
          last_reset_recommender: todayUTC.toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;
      currentLimits = newLimits;
    }

    // Determine limits and reset field based on feature
    let dailyLimit: number;
    let currentCount: number;
    let lastResetField: string;
    let countField: string;

    switch (feature) {
      case 'chat':
        dailyLimit = 15;
        currentCount = currentLimits.message_count || 0;
        lastResetField = 'last_reset';
        countField = 'message_count';
        break;
      case 'essay':
        dailyLimit = 10;
        currentCount = currentLimits.essay_count || 0;
        lastResetField = 'last_reset_essays';
        countField = 'essay_count';
        break;
      case 'recommender':
        dailyLimit = 5;
        currentCount = currentLimits.recommender_count || 0;
        lastResetField = 'last_reset_recommender';
        countField = 'recommender_count';
        break;
      default:
        throw new Error('Invalid feature type');
    }

    const lastReset = new Date(currentLimits[lastResetField] || todayUTC);
    const shouldReset = lastReset < todayUTC;

    // Reset counts if needed
    if (shouldReset) {
      const updateData = {
        [countField]: 1,
        [lastResetField]: todayUTC.toISOString()
      };

      const { error: updateError } = await supabase
        .from('message_limits')
        .update(updateData)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return {
        canUse: true,
        remaining: dailyLimit - 1,
        resetTime: tomorrowUTC.toLocaleTimeString('en-US', { 
          hour12: false, 
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit'
        }) + ' UTC'
      };
    }

    // Check if user has reached limit
    if (currentCount >= dailyLimit) {
      return {
        canUse: false,
        remaining: 0,
        resetTime: tomorrowUTC.toLocaleTimeString('en-US', { 
          hour12: false, 
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit'
        }) + ' UTC'
      };
    }

    // Increment count
    const newCount = currentCount + 1;
    const { error: updateError } = await supabase
      .from('message_limits')
      .update({ [countField]: newCount })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return {
      canUse: true,
      remaining: dailyLimit - newCount,
      resetTime: tomorrowUTC.toLocaleTimeString('en-US', { 
        hour12: false, 
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' UTC'
    };

  } catch (error) {
    console.error('Error checking/updating limits:', error);
    // Default to allowing usage if there's an error
    return { canUse: true, remaining: 1, resetTime: null };
  }
}

// New function to check limits without updating them
export async function checkLimitsOnly(
  userId: string, 
  feature: 'chat' | 'essay' | 'recommender'
): Promise<{ canUse: boolean; remaining: number; resetTime: string | null }> {
  try {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profile?.email === ADMIN_EMAIL) {
      return { canUse: true, remaining: 999, resetTime: null };
    }

    // Get current limits
    const { data: limits, error: fetchError } = await supabase
      .from('message_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const now = new Date();
    const todayUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const tomorrowUTC = new Date(todayUTC);
    tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);

    let currentLimits = limits;

    // Create limits record if it doesn't exist
    if (!currentLimits) {
      const { data: newLimits, error: insertError } = await supabase
        .from('message_limits')
        .insert({
          user_id: userId,
          message_count: 0,
          essay_count: 0,
          recommender_count: 0,
          last_reset: todayUTC.toISOString(),
          last_reset_essays: todayUTC.toISOString(),
          last_reset_recommender: todayUTC.toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;
      currentLimits = newLimits;
    }

    // Determine limits and reset field based on feature
    let dailyLimit: number;
    let currentCount: number;
    let lastResetField: string;

    switch (feature) {
      case 'chat':
        dailyLimit = 15;
        currentCount = currentLimits.message_count || 0;
        lastResetField = 'last_reset';
        break;
      case 'essay':
        dailyLimit = 10;
        currentCount = currentLimits.essay_count || 0;
        lastResetField = 'last_reset_essays';
        break;
      case 'recommender':
        dailyLimit = 5;
        currentCount = currentLimits.recommender_count || 0;
        lastResetField = 'last_reset_recommender';
        break;
      default:
        throw new Error('Invalid feature type');
    }

    const lastReset = new Date(currentLimits[lastResetField] || todayUTC);
    const shouldReset = lastReset < todayUTC;

    // If should reset, return fresh count without updating database
    if (shouldReset) {
      return {
        canUse: true,
        remaining: dailyLimit,
        resetTime: tomorrowUTC.toLocaleTimeString('en-US', { 
          hour12: false, 
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit'
        }) + ' UTC'
      };
    }

    // Return current status without updating
    return {
      canUse: currentCount < dailyLimit,
      remaining: Math.max(0, dailyLimit - currentCount),
      resetTime: tomorrowUTC.toLocaleTimeString('en-US', { 
        hour12: false, 
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' UTC'
    };

  } catch (error) {
    console.error('Error checking limits:', error);
    return { canUse: true, remaining: 1, resetTime: null };
  }
}
