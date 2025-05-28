
import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'shariqnaumann@gmail.com'; // Admin email with no limits

// Weekly limits for unsigned users
const UNSIGNED_WEEKLY_LIMITS = {
  chat: 5,
  essay: 1,
  recommender: 1
};

// Helper function to get the start of the current week (Monday)
function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Helper function to manage unsigned user limits in localStorage
function getUnsignedUserLimits() {
  const stored = localStorage.getItem('unsignedUserLimits');
  if (!stored) return null;
  
  try {
    const data = JSON.parse(stored);
    const weekStart = getWeekStart();
    
    // Check if we need to reset (new week)
    if (new Date(data.weekStart) < weekStart) {
      return null; // Reset needed
    }
    
    return data;
  } catch {
    return null;
  }
}

function setUnsignedUserLimits(chatCount: number, essayCount: number, recommenderCount: number) {
  const weekStart = getWeekStart();
  const data = {
    chatCount,
    essayCount,
    recommenderCount,
    weekStart: weekStart.toISOString()
  };
  localStorage.setItem('unsignedUserLimits', JSON.stringify(data));
}

export async function checkAndUpdateLimits(
  userId: string | null, 
  feature: 'chat' | 'essay' | 'recommender'
): Promise<{ canUse: boolean; remaining: number; resetTime: string | null; isAdmin?: boolean }> {
  try {
    // Handle unsigned users
    if (!userId) {
      let limits = getUnsignedUserLimits();
      
      if (!limits) {
        // Initialize limits for new week
        limits = {
          chatCount: 0,
          essayCount: 0,
          recommenderCount: 0,
          weekStart: getWeekStart().toISOString()
        };
      }

      const weeklyLimit = UNSIGNED_WEEKLY_LIMITS[feature];
      const currentCount = limits[`${feature}Count`];

      if (currentCount >= weeklyLimit) {
        return {
          canUse: false,
          remaining: 0,
          resetTime: 'Next Monday at 00:00 UTC'
        };
      }

      // Increment count
      const newCounts = { ...limits };
      newCounts[`${feature}Count`] = currentCount + 1;
      setUnsignedUserLimits(newCounts.chatCount, newCounts.essayCount, newCounts.recommenderCount);

      return {
        canUse: true,
        remaining: weeklyLimit - (currentCount + 1),
        resetTime: 'Next Monday at 00:00 UTC'
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

    // Get current limits for signed-in users
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
  userId: string | null, 
  feature: 'chat' | 'essay' | 'recommender'
): Promise<{ canUse: boolean; remaining: number; resetTime: string | null; isAdmin?: boolean }> {
  try {
    // Handle unsigned users
    if (!userId) {
      let limits = getUnsignedUserLimits();
      
      if (!limits) {
        // Initialize limits for new week
        limits = {
          chatCount: 0,
          essayCount: 0,
          recommenderCount: 0,
          weekStart: getWeekStart().toISOString()
        };
      }

      const weeklyLimit = UNSIGNED_WEEKLY_LIMITS[feature];
      const currentCount = limits[`${feature}Count`];

      return {
        canUse: currentCount < weeklyLimit,
        remaining: Math.max(0, weeklyLimit - currentCount),
        resetTime: 'Next Monday at 00:00 UTC'
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

    // Get current limits for signed-in users
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
