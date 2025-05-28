
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatConsultant from "@/components/ChatConsultant";
import { Helmet } from "react-helmet-async";
import { useUser } from "@/contexts/UserContext";
import { checkLimitsOnly } from "@/utils/messageLimits";

const ConsultantPage = () => {
  const { currentUser } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to false so sidebar starts closed
  const [limitInfo, setLimitInfo] = useState<{
    canUse: boolean;
    remaining: number;
    resetTime: string | null;
    isAdmin?: boolean;
  }>({ canUse: true, remaining: 0, resetTime: null });

  useEffect(() => {
    document.title = "AI College Consultant | Pathway";
  }, []);

  useEffect(() => {
    const fetchLimitInfo = async () => {
      const info = await checkLimitsOnly(currentUser?.id || null, 'chat');
      setLimitInfo(info);
    };

    fetchLimitInfo();
  }, [currentUser?.id]);

  const shouldShowLimits = !limitInfo.isAdmin;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Helmet>
        <title>AI Consultant | Educational Advisor</title>
        <meta name="description" content="Get personalized university advice from our AI consultant" />
      </Helmet>
      
      <Header />
      
      {/* Main content with padding to avoid navbar overlap */}
      <main className="flex-1 flex flex-col pt-16">
        <div className="flex-1 flex flex-col h-[calc(100vh-9rem)]">
          <ChatConsultant initialSidebarOpen={sidebarOpen} />
          
          {/* Limit display */}
          {shouldShowLimits && (
            <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-3 shadow-lg">
              <div className="text-sm text-muted-foreground">
                {!limitInfo.canUse ? (
                  <span className="text-destructive">
                    {!currentUser ? "Weekly message limit reached" : "Daily message limit reached"}
                  </span>
                ) : (
                  <span>
                    Messages remaining {!currentUser ? "this week" : "today"}: {limitInfo.remaining}
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

export default ConsultantPage;
