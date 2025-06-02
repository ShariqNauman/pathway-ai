
import { supabase } from '../integrations/supabase/client';

const ADMIN_EMAIL = 'shariqnaumann@gmail.com';

const LIMITS = {
  consultant: { authenticated: 20, unauthenticated: 5 },
  essays: { authenticated: 10, unauthenticated: 3 },
  recommender: { authenticated: 5, unauthenticated: 0 } // No access for unauthenticated users
};

export const checkMessageLimits = async (userId: string | null, feature: 'consultant' | 'essays' | 'recommender') => {
  console.log(`Checking ${feature} limits for user:`, userId);

  // Get user profile to check if admin
  let isAdmin = false;
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
    
    isAdmin = profile?.email === ADMIN_EMAIL;
    console.log('Is admin:', isAdmin, 'Email:', profile?.email);
  }

  // Admin has unlimited access
  if (isAdmin) {
    console.log('Admin user detected - unlimited access');
    return { 
      canUse: true, 
      remaining: 999, 
      resetTime: null, 
      isAdmin: true 
    };
  }

  if (!userId) {
    // Unauthenticated users have no access to recommender
    if (feature === 'recommender') {
      return { 
        canUse: false, 
        remaining: 0, 
        resetTime: 'Sign in required', 
        isAdmin: false 
      };
    }
    
    // For other features, use weekly limits for unauthenticated users
    const weeklyLimit = LIMITS[feature].unauthenticated;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const storageKey = `${feature}_usage_${startOfWeek.toISOString().split('T')[0]}`;
    const usage = parseInt(localStorage.getItem(storageKey) || '0');

    return {
      canUse: usage < weeklyLimit,
      remaining: Math.max(0, weeklyLimit - usage),
      resetTime: 'Sunday',
      isAdmin: false
    };
  }

  // For authenticated users, get or create limits record
  const { data: limits, error } = await supabase
    .from('message_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching limits:', error);
    throw error;
  }

  const now = new Date();
  const todayUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  
  let currentLimits = limits;
  
  if (!currentLimits) {
    // Create new limits record
    const { data: newLimits, error: createError } = await supabase
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

    if (createError) {
      console.error('Error creating limits:', createError);
      throw createError;
    }
    currentLimits = newLimits;
  }

  // Check if we need to reset limits (daily reset at midnight UTC)
  const lastResetField = feature === 'consultant' ? 'last_reset' : 
                        feature === 'essays' ? 'last_reset_essays' : 
                        'last_reset_recommender';
  
  const lastReset = new Date(currentLimits[lastResetField]);
  lastReset.setUTCHours(0, 0, 0, 0);
  
  const needsReset = todayUTC > lastReset;
  
  if (needsReset) {
    const countField = feature === 'consultant' ? 'message_count' : 
                      feature === 'essays' ? 'essay_count' : 
                      'recommender_count';
    
    const { data: updatedLimits, error: updateError } = await supabase
      .from('message_limits')
      .update({
        [countField]: 0,
        [lastResetField]: todayUTC.toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error resetting limits:', updateError);
      throw updateError;
    }
    currentLimits = updatedLimits;
  }

  const dailyLimit = LIMITS[feature].authenticated;
  const currentCount = feature === 'consultant' ? currentLimits.message_count : 
                      feature === 'essays' ? currentLimits.essay_count : 
                      currentLimits.recommender_count;
  
  const remaining = Math.max(0, dailyLimit - currentCount);
  const canUse = remaining > 0;

  // Calculate next reset time
  const nextReset = new Date(todayUTC);
  nextReset.setUTCDate(nextReset.getUTCDate() + 1);
  const resetTime = nextReset.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
  });

  return { 
    canUse, 
    remaining, 
    resetTime, 
    isAdmin: false 
  };
};

export const incrementUsage = async (userId: string | null, feature: 'consultant' | 'essays' | 'recommender') => {
  console.log(`Incrementing ${feature} usage for user:`, userId);

  // Check if admin
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
    
    const isAdmin = profile?.email === ADMIN_EMAIL;
    if (isAdmin) {
      console.log('Admin user - not incrementing usage');
      return;
    }
  }

  if (!userId) {
    // For unauthenticated users, increment localStorage
    if (feature !== 'recommender') { // Recommender not available for unauthenticated
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
      startOfWeek.setUTCHours(0, 0, 0, 0);

      const storageKey = `${feature}_usage_${startOfWeek.toISOString().split('T')[0]}`;
      const currentUsage = parseInt(localStorage.getItem(storageKey) || '0');
      localStorage.setItem(storageKey, (currentUsage + 1).toString());
    }
    return;
  }

  // For authenticated users, increment database count
  const countField = feature === 'consultant' ? 'message_count' : 
                    feature === 'essays' ? 'essay_count' : 
                    'recommender_count';

  const { error } = await supabase
    .from('message_limits')
    .update({
      [countField]: supabase.raw(`${countField} + 1`)
    })
    .eq('user_id', userId);

  if (error) {
    console.error(`Error incrementing ${feature} usage:`, error);
    throw error;
  }

  console.log(`${feature} usage incremented successfully`);
};

export const checkLimitsOnly = async (userId: string | null, feature: 'consultant' | 'essays' | 'recommender') => {
  return await checkMessageLimits(userId, feature);
};
