
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmartRecommender from "@/components/SmartRecommender";
import { useUser } from "@/contexts/UserContext";
import { checkLimitsOnly } from "@/utils/messageLimits";

const SmartRecommenderPage = () => {
  const { currentUser } = useUser();
  const [limitInfo, setLimitInfo] = useState<{
    canUse: boolean;
    remaining: number;
    resetTime: string | null;
    isAdmin?: boolean;
  }>({ canUse: true, remaining: 0, resetTime: null });

  useEffect(() => {
    document.title = "Smart Recommender | AI University Recommendations";
  }, []);

  useEffect(() => {
    const fetchLimitInfo = async () => {
      const info = await checkLimitsOnly(currentUser?.id || null, 'recommender');
      setLimitInfo(info);
    };

    fetchLimitInfo();
  }, [currentUser?.id]);

  const shouldShowLimits = !limitInfo.isAdmin;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Main content with padding to avoid navbar overlap */}
      <main className="flex-1 pt-16">
        <div className="h-[calc(100vh-4rem)]">
          <SmartRecommender />
          
          {/* Limit display */}
          {shouldShowLimits && (
            <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-3 shadow-lg">
              <div className="text-sm text-muted-foreground">
                {!limitInfo.canUse ? (
                  <span className="text-destructive">
                    {!currentUser ? "Weekly recommender limit reached" : "Daily recommender limit reached"}
                  </span>
                ) : (
                  <span>
                    Recommendations remaining {!currentUser ? "this week" : "today"}: {limitInfo.remaining}
                    {limitInfo.resetTime && ` (Resets ${limitInfo.resetTime})`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SmartRecommenderPage;
