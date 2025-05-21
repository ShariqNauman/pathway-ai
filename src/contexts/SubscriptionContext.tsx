import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './UserContext';
import { toast } from 'sonner';

export interface SubscriptionLimits {
  recommender: {
    limit: number;
    used: number;
  };
  essayAnalyzer: {
    limit: number;
    used: number;
  };
  consultant: {
    limit: number;
    used: number;
    messagesPerDay: number;
  };
}

interface SubscriptionContextType {
  subscription: {
    planType: 'basic' | 'pro' | 'yearly';
    currentPeriodEnd: Date | null;
  };
  limits: SubscriptionLimits;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  openCheckout: (planType: 'pro' | 'yearly') => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const defaultLimits: SubscriptionLimits = {
  recommender: { limit: 5, used: 0 },
  essayAnalyzer: { limit: 3, used: 0 },
  consultant: { limit: 100, used: 0, messagesPerDay: 10 }
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: { planType: 'basic', currentPeriodEnd: null },
  limits: defaultLimits,
  isLoading: true,
  refreshSubscription: async () => {},
  openCheckout: async () => {},
  openCustomerPortal: async () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<{ 
    planType: 'basic' | 'pro' | 'yearly'; 
    currentPeriodEnd: Date | null 
  }>({ 
    planType: 'basic', 
    currentPeriodEnd: null 
  });
  const [limits, setLimits] = useState<SubscriptionLimits>(defaultLimits);

  const refreshSubscription = async () => {
    if (!currentUser) {
      setSubscription({ planType: 'basic', currentPeriodEnd: null });
      setLimits(defaultLimits);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error("Error checking subscription:", error);
        toast.error("Failed to check subscription status");
        return;
      }
      
      const planType = data?.subscription?.plan_type || 'basic';
      setSubscription({
        planType,
        currentPeriodEnd: data?.subscription?.current_period_end 
          ? new Date(data.subscription.current_period_end) 
          : null
      });
      
      // Fetch usage limits from message_limits table
      const { data: limitsData } = await supabase
        .from('message_limits')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      
      // Set limits based on plan type
      const newLimits = {
        recommender: {
          limit: planType === 'basic' ? 5 : 
                planType === 'pro' ? 60 : Infinity,
          used: limitsData?.recommender_count || 0
        },
        essayAnalyzer: {
          limit: planType === 'basic' ? 3 : 
                planType === 'pro' ? 30 : 360,
          used: limitsData?.essay_count || 0
        },
        consultant: {
          limit: planType === 'basic' ? 100 : 
                planType === 'pro' ? Infinity : Infinity,
          used: limitsData?.message_count || 0,
          messagesPerDay: planType === 'basic' ? 10 : 
                        planType === 'pro' ? 30 : 50
        }
      };
      
      setLimits(newLimits);
    } catch (err) {
      console.error("Exception during subscription check:", err);
      toast.error("Failed to check subscription status");
    } finally {
      setIsLoading(false);
    }
  };

  const openCheckout = async (planType: 'pro' | 'yearly') => {
    if (!currentUser) {
      toast.error("Please log in to subscribe");
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType }
      });
      
      if (error) {
        console.error("Error creating checkout session:", error);
        toast.error("Failed to create checkout session");
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Exception during checkout:", err);
      toast.error("Failed to create checkout session");
    }
  };

  const openCustomerPortal = async () => {
    if (!currentUser) {
      toast.error("Please log in to manage your subscription");
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error("Error creating customer portal session:", error);
        toast.error("Failed to open customer portal");
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Exception during customer portal session creation:", err);
      toast.error("Failed to open customer portal");
    }
  };

  // Refresh subscription whenever the user changes
  useEffect(() => {
    refreshSubscription();
  }, [currentUser?.id]);

  return (
    <SubscriptionContext.Provider value={{ 
      subscription, 
      limits, 
      isLoading, 
      refreshSubscription,
      openCheckout,
      openCustomerPortal
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
