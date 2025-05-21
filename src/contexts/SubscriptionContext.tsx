
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';
import { toast } from "sonner";

export type PlanType = 'basic' | 'pro' | 'yearly';

export interface PlanLimits {
  essayAnalyzer: {
    maxPerDay: number;
    maxPerMonth: number;
  };
  recommender: {
    maxPerDay: number;
    maxPerMonth: number;
  };
  consultant: {
    maxMessagesPerDay: number;
    maxMessagesPerMonth: number;
  };
}

export interface SubscriptionContextType {
  plan: PlanType;
  currentPeriodEnd: Date | null;
  isSubscriptionLoading: boolean;
  checkoutSubscription: (plan: 'pro' | 'yearly') => Promise<string>;
  openCustomerPortal: () => Promise<string>;
  refreshSubscription: () => Promise<void>;
  getPlanLimits: (plan: PlanType) => PlanLimits;
}

const planLimitsMap: Record<PlanType, PlanLimits> = {
  basic: {
    essayAnalyzer: {
      maxPerDay: 1,
      maxPerMonth: 3,
    },
    recommender: {
      maxPerDay: 1,
      maxPerMonth: 5,
    },
    consultant: {
      maxMessagesPerDay: 10,
      maxMessagesPerMonth: 100,
    },
  },
  pro: {
    essayAnalyzer: {
      maxPerDay: 3,
      maxPerMonth: 30,
    },
    recommender: {
      maxPerDay: 3,
      maxPerMonth: 60,
    },
    consultant: {
      maxMessagesPerDay: 30,
      maxMessagesPerMonth: 900,
    },
  },
  yearly: {
    essayAnalyzer: {
      maxPerDay: 5,
      maxPerMonth: 30,
    },
    recommender: {
      maxPerDay: 999, // Unlimited
      maxPerMonth: 999, // Unlimited
    },
    consultant: {
      maxMessagesPerDay: 50,
      maxMessagesPerMonth: 1500,
    },
  },
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [plan, setPlan] = useState<PlanType>('basic');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<Date | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState<boolean>(true);

  const getPlanLimits = (planType: PlanType): PlanLimits => {
    return planLimitsMap[planType];
  };

  const checkoutSubscription = async (selectedPlan: 'pro' | 'yearly'): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: selectedPlan },
      });

      if (error) {
        toast.error("Failed to create checkout session");
        throw new Error(error.message);
      }

      return data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout process");
      throw error;
    }
  };

  const openCustomerPortal = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) {
        toast.error("Failed to access customer portal");
        throw new Error(error.message);
      }

      return data.url;
    } catch (error) {
      console.error("Customer portal error:", error);
      toast.error("Failed to open customer portal");
      throw error;
    }
  };

  const refreshSubscription = async (): Promise<void> => {
    if (!currentUser) {
      setPlan('basic');
      setCurrentPeriodEnd(null);
      setIsSubscriptionLoading(false);
      return;
    }

    try {
      setIsSubscriptionLoading(true);
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) {
        console.error("Subscription check error:", error);
        toast.error("Failed to check subscription status");
        return;
      }

      setPlan(data.plan as PlanType);
      setCurrentPeriodEnd(data.current_period_end ? new Date(data.current_period_end) : null);
    } catch (error) {
      console.error("Subscription refresh error:", error);
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    // Refresh subscription when the user logs in
    if (currentUser) {
      refreshSubscription();
    } else {
      setPlan('basic');
      setCurrentPeriodEnd(null);
      setIsSubscriptionLoading(false);
    }
  }, [currentUser]);

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        currentPeriodEnd,
        isSubscriptionLoading,
        checkoutSubscription,
        openCustomerPortal,
        refreshSubscription,
        getPlanLimits,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
