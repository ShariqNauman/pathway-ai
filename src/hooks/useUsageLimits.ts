
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, PlanType } from '@/contexts/SubscriptionContext';
import { toast } from "sonner";

export type FeatureType = 'essay' | 'recommender' | 'consultant';

export interface UsageLimits {
  used: number;
  limit: number;
  dailyUsed: number;
  dailyLimit: number;
  isLimited: boolean;
  canUse: boolean;
  checkAndIncrement: () => Promise<boolean>;
}

export default function useUsageLimits(feature: FeatureType): UsageLimits {
  const { currentUser } = useAuth();
  const { plan, getPlanLimits } = useSubscription();
  
  const [used, setUsed] = useState<number>(0);
  const [dailyUsed, setDailyUsed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const planLimits = getPlanLimits(plan);
  
  let dailyLimit = 1;
  let monthlyLimit = 1;
  
  switch (feature) {
    case 'essay':
      dailyLimit = planLimits.essayAnalyzer.maxPerDay;
      monthlyLimit = planLimits.essayAnalyzer.maxPerMonth;
      break;
    case 'recommender':
      dailyLimit = planLimits.recommender.maxPerDay;
      monthlyLimit = planLimits.recommender.maxPerMonth;
      break;
    case 'consultant':
      dailyLimit = planLimits.consultant.maxMessagesPerDay;
      monthlyLimit = planLimits.consultant.maxMessagesPerMonth;
      break;
  }
  
  const isLimited = dailyLimit !== 999 && monthlyLimit !== 999;
  const canUse = dailyUsed < dailyLimit && used < monthlyLimit;
  
  const fetchUsageData = async () => {
    if (!currentUser) {
      setUsed(0);
      setDailyUsed(0);
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("message_limits")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching usage data:", error);
        return;
      }
      
      const today = new Date();
      const now = today.toISOString();
      
      if (data) {
        let resetField: string | null = null;
        let countField: string | null = null;
        
        // Determine which fields to use based on feature
        switch (feature) {
          case 'essay':
            resetField = 'last_reset_essays';
            countField = 'essay_count';
            break;
          case 'recommender':
            resetField = 'last_reset_recommender';
            countField = 'recommender_count';
            break;
          case 'consultant':
            resetField = 'last_reset';
            countField = 'message_count';
            break;
        }
        
        // Reset daily count if it's a new day
        if (resetField && countField && data[resetField]) {
          const lastReset = new Date(data[resetField]);
          const isNewDay = today.getDate() !== lastReset.getDate() || 
                           today.getMonth() !== lastReset.getMonth() || 
                           today.getFullYear() !== lastReset.getFullYear();
                           
          if (isNewDay) {
            // It's a new day, reset daily count
            setDailyUsed(0);
            
            // Update the reset timestamp in DB (don't await, let it happen in background)
            const updateData = {
              user_id: currentUser.id,
              [resetField]: now
            };
            
            await supabase
              .from("message_limits")
              .upsert(updateData, { onConflict: "user_id" });
          } else {
            // Same day, set daily used from data
            setDailyUsed(data[countField] || 0);
          }
        } else {
          setDailyUsed(data[countField] || 0);
        }
        
        // Set monthly count - this is more of a rolling count, not a calendar month
        setUsed(data[countField] || 0);
      } else {
        setUsed(0);
        setDailyUsed(0);
      }
    } catch (error) {
      console.error("Error in fetchUsageData:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkAndIncrement = async (): Promise<boolean> => {
    if (isLoading) {
      // Wait for loading to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      return checkAndIncrement();
    }
    
    if (!currentUser) {
      toast.error("You need to be logged in to use this feature.");
      return false;
    }
    
    if (!canUse) {
      if (dailyUsed >= dailyLimit) {
        toast.error(`Daily ${feature} limit reached. Please try again tomorrow or upgrade your plan.`);
      } else {
        toast.error(`Monthly ${feature} limit reached. Please upgrade your plan to continue.`);
      }
      return false;
    }
    
    try {
      let countField: string;
      let resetField: string;
      
      switch (feature) {
        case 'essay':
          countField = 'essay_count';
          resetField = 'last_reset_essays';
          break;
        case 'recommender':
          countField = 'recommender_count';
          resetField = 'last_reset_recommender';
          break;
        case 'consultant':
        default:
          countField = 'message_count';
          resetField = 'last_reset';
          break;
      }
      
      const now = new Date().toISOString();
      
      // Get current counts first
      const { data: currentData } = await supabase
        .from("message_limits")
        .select(countField)
        .eq("user_id", currentUser.id)
        .maybeSingle();
      
      const currentCount = (currentData?.[countField] || 0) + 1;
      
      // Update the counts with properly typed data
      const updateData: {
        user_id: string;
        [key: string]: any;
      } = {
        user_id: currentUser.id,
        [countField]: currentCount
      };
      
      // Only update reset time if not already set today
      const { data: existingData } = await supabase
        .from("message_limits")
        .select(resetField)
        .eq("user_id", currentUser.id)
        .maybeSingle();
        
      if (!existingData?.[resetField]) {
        updateData[resetField] = now;
      }
      
      const { error: updateError } = await supabase
        .from("message_limits")
        .upsert(updateData, { onConflict: "user_id" });
      
      if (updateError) {
        console.error("Error updating usage counts:", updateError);
        return false;
      }
      
      // Update local state
      setUsed(currentCount);
      setDailyUsed(currentCount);
      
      return true;
    } catch (error) {
      console.error("Error in checkAndIncrement:", error);
      return false;
    }
  };
  
  useEffect(() => {
    fetchUsageData();
  }, [currentUser, feature]);
  
  return {
    used,
    limit: monthlyLimit,
    dailyUsed,
    dailyLimit,
    isLimited,
    canUse,
    checkAndIncrement
  };
}
