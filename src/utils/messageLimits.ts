import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'shariqnaumann@gmail.com'; // Admin email with no limits

export async function checkAndUpdateLimits(
  userId: string, 
  feature: 'chat' | 'essay' | 'recommender'
): Promise<{ canUse: boolean; remaining: number; resetTime: string | null; isAdmin?: boolean }> {
  try {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profile?.email === ADMIN_EMAIL) {
      return { canUse: true, remaining: 999, resetTime: null, isAdmin: true };
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
        }) + ' UTC',
        isAdmin: false
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
        }) + ' UTC',
        isAdmin: false
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
      }) + ' UTC',
      isAdmin: false
    };

  } catch (error) {
    console.error('Error checking/updating limits:', error);
    // Default to allowing usage if there's an error
    return { canUse: true, remaining: 1, resetTime: null, isAdmin: false };
  }
}

// New function to check limits without updating them
export async function checkLimitsOnly(
  userId: string | null, 
  feature: 'chat' | 'essay' | 'recommender'
): Promise<{ canUse: boolean; remaining: number; resetTime: string | null; isAdmin?: boolean }> {
  try {
    // Handle unsigned users with weekly limits stored in localStorage
    if (!userId) {
      const storageKey = `unsigned_limits_${feature}`;
      const weeklyLimits = { chat: 5, essay: 1, recommender: 1 };
      const limit = weeklyLimits[feature];
      
      const stored = localStorage.getItem(storageKey);
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      
      let currentData = { count: 0, lastReset: now };
      
      if (stored) {
        try {
          currentData = JSON.parse(stored);
          // Reset if more than a week has passed
          if (now - currentData.lastReset > oneWeek) {
            currentData = { count: 0, lastReset: now };
            localStorage.setItem(storageKey, JSON.stringify(currentData));
          }
        } catch {
          currentData = { count: 0, lastReset: now };
          localStorage.setItem(storageKey, JSON.stringify(currentData));
        }
      }
      
      const remaining = Math.max(0, limit - currentData.count);
      const nextResetDate = new Date(currentData.lastReset + oneWeek);
      
      return {
        canUse: currentData.count < limit,
        remaining,
        resetTime: nextResetDate.toLocaleDateString() + ' (weekly reset)',
        isAdmin: false
      };
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profile?.email === ADMIN_EMAIL) {
      return { canUse: true, remaining: 999, resetTime: null, isAdmin: true };
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
        }) + ' UTC',
        isAdmin: false
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
      }) + ' UTC',
      isAdmin: false
    };

  } catch (error) {
    console.error('Error checking limits:', error);
    return { canUse: true, remaining: 1, resetTime: null, isAdmin: false };
  }
}
