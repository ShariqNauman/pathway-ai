
import { useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';

type FeatureType = 'recommender' | 'essayAnalyzer' | 'consultant';

export function useUsageLimits() {
  const { currentUser } = useUser();
  const { limits, refreshSubscription } = useSubscription();
  const [isUpdating, setIsUpdating] = useState(false);

  const checkAndIncrementUsage = async (featureType: FeatureType): Promise<boolean> => {
    if (!currentUser) {
      toast.error("Please log in to use this feature");
      return false;
    }

    const limitKey = featureType === 'recommender' 
      ? 'recommender_count'
      : featureType === 'essayAnalyzer'
      ? 'essay_count'
      : 'message_count';

    const resetKey = featureType === 'recommender' 
      ? 'last_reset_recommender'
      : featureType === 'essayAnalyzer'
      ? 'last_reset_essays'
      : 'last_reset';

    // Check if the user has reached their limit
    const limitInfo = limits[featureType];
    if (limitInfo.used >= limitInfo.limit && limitInfo.limit !== Infinity) {
      toast.error(`You have reached your ${featureType} usage limit. Please upgrade your plan for more.`);
      return false;
    }

    try {
      setIsUpdating(true);
      
      // First, get current usage
      const { data: limitsData, error: fetchError } = await supabase
        .from('message_limits')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching usage limits:", fetchError);
        return false;
      }

      // Check if we need to reset monthly counters
      const now = new Date();
      let shouldReset = false;
      
      if (limitsData && limitsData[resetKey]) {
        const lastReset = new Date(limitsData[resetKey]);
        // Reset if it's been more than a month
        const monthDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                         now.getMonth() - lastReset.getMonth();
        shouldReset = monthDiff >= 1;
      }

      // Update or insert usage record
      let updateData: Record<string, any> = { user_id: currentUser.id };

      if (!limitsData || !limitsData[limitKey] || shouldReset) {
        // First time use or reset counter
        updateData[limitKey] = 1;
        updateData[resetKey] = now.toISOString();
      } else {
        // Increment counter
        updateData[limitKey] = (limitsData[limitKey] || 0) + 1;
      }

      // Update the database
      const { error: updateError } = await supabase
        .from('message_limits')
        .upsert(updateData);

      if (updateError) {
        console.error("Error updating usage limits:", updateError);
        return false;
      }

      // Refresh subscription to get latest usage
      await refreshSubscription();
      
      return true;
    } catch (error) {
      console.error("Error in checkAndIncrementUsage:", error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    limits,
    isUpdating,
    checkAndIncrementUsage
  };
}
