
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { useUsageLimits } from "@/hooks/useUsageLimits";

const SmartRecommenderPage = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const { checkAndIncrementUsage, limits } = useUsageLimits();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Smart Recommender | Pathway AI";
  }, []);

  const handleGetRecommendations = async () => {
    if (!currentUser) {
      toast.error("Please log in to use the Smart Recommender", {
        action: {
          label: "Log In",
          onClick: () => navigate("/login")
        }
      });
      return;
    }
    
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('intended_major, preferred_country, selected_domains')
      .eq('id', currentUser.id)
      .single();
    
    if (!profile?.intended_major || !profile?.preferred_country || !profile?.selected_domains) {
      toast.error("Please complete your profile to get personalized recommendations", {
        action: {
          label: "Complete Profile",
          onClick: () => navigate("/onboarding")
        }
      });
      return;
    }

    // Check if user has reached their limit
    const canProceed = await checkAndIncrementUsage('recommender');
    if (!canProceed) {
      toast.error("You've reached your recommendations limit", {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/pricing")
        }
      });
      return;
    }
    
    setIsLoading(true);
    
    // Navigate to recommender dashboard
    try {
      navigate("/consultant?feature=recommender");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-b from-background to-primary/5">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Smart University Recommender
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our AI-powered system finds the perfect universities that match your academic profile, interests, and career goals.
          </p>

          {currentUser && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                You have used <span className="font-medium">{limits.recommender.used}</span> of your <span className="font-medium">{limits.recommender.limit === Infinity ? 'unlimited' : limits.recommender.limit}</span> monthly recommendations
              </p>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">How it works:</h3>
                <ul className="text-left text-muted-foreground space-y-2">
                  <li>1. Our AI analyzes your profile and academic history</li>
                  <li>2. We match your profile with thousands of universities</li>
                  <li>3. Get personalized recommendations with acceptance probabilities</li>
                </ul>
              </div>
              
              <Button 
                size="lg" 
                onClick={handleGetRecommendations}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Get My Recommendations"}
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Not ready yet? Update your <a href="/profile/edit" className="text-primary hover:underline">profile</a> for better recommendations.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default SmartRecommenderPage;
