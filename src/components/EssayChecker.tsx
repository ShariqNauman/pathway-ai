
import React, { useState } from "react";
import { toast } from "sonner";
import EssayForm, { EssayFormValues } from "./essay-checker/EssayForm";
import FeedbackDisplay from "./essay-checker/FeedbackDisplay";
import { analyzeEssay } from "@/utils/essayAnalysis";
import { EssaySegment } from "./essay-checker/HighlightedEssay";
import EssayRating, { RatingCategory } from "./essay-checker/EssayRating";
import { Button } from "./ui/button";
import { useUser } from "@/contexts/UserContext";
import { checkAndUpdateLimits, checkLimitsOnly } from "@/utils/messageLimits";

interface EssayCheckerProps {
  initialSidebarOpen?: boolean;
}

const EssayChecker: React.FC<EssayCheckerProps> = ({ initialSidebarOpen = false }) => {
  const { currentUser } = useUser();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [highlightedEssay, setHighlightedEssay] = useState<EssaySegment[]>([]);
  const [ratings, setRatings] = useState<{
    overall: number;
    categories: RatingCategory[];
  } | undefined>(undefined);
  const [currentFormValues, setCurrentFormValues] = useState<EssayFormValues>({
    essayType: "Personal Statement/Essay",
    prompt: "",
    essay: ""
  });
  const [hasAnalyzedOnce, setHasAnalyzedOnce] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{
    canUse: boolean;
    remaining: number;
    resetTime: string | null;
    isAdmin?: boolean;
  }>({ canUse: true, remaining: 0, resetTime: null, isAdmin: false });

  React.useEffect(() => {
    const fetchLimitInfo = async () => {
      const info = await checkLimitsOnly(currentUser?.id || null, 'essay');
      setLimitInfo(info);
    };
    fetchLimitInfo();
  }, [currentUser?.id]);
  
  const handleAnalyzeEssay = async (data: EssayFormValues) => {
    // For unsigned users, check and update localStorage limits
    if (!currentUser) {
      const storageKey = 'unsigned_limits_essay';
      const limit = 1;
      const stored = localStorage.getItem(storageKey);
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      
      let currentData = { count: 0, lastReset: now };
      
      if (stored) {
        try {
          currentData = JSON.parse(stored);
          if (now - currentData.lastReset > oneWeek) {
            currentData = { count: 0, lastReset: now };
          }
        } catch {
          currentData = { count: 0, lastReset: now };
        }
      }
      
      if (currentData.count >= limit) {
        toast.error("You've reached your weekly essay analysis limit. Please sign in for more analyses.");
        return;
      }
      
      // Update count
      currentData.count += 1;
      localStorage.setItem(storageKey, JSON.stringify(currentData));
      
      // Update limit info
      const remaining = Math.max(0, limit - currentData.count);
      const nextResetDate = new Date(currentData.lastReset + oneWeek);
      setLimitInfo({
        canUse: currentData.count < limit,
        remaining,
        resetTime: nextResetDate.toLocaleDateString() + ' (weekly reset)',
        isAdmin: false
      });
    } else {
      // For signed-in users, use the database limits
      const limitCheck = await checkAndUpdateLimits(currentUser.id, 'essay');
      if (!limitCheck.canUse && !limitCheck.isAdmin) {
        toast.error("You've reached your daily essay analysis limit. Please try again tomorrow.");
        return;
      }
      setLimitInfo(limitCheck);
    }

    setIsAnalyzing(true);
    setFeedback("");
    setHighlightedEssay([]);
    setRatings(undefined);
    setCurrentFormValues(data);
    setHasAnalyzedOnce(true);
    
    try {
      const result = await analyzeEssay(data.essayType, data.prompt, data.essay);
      
      if (!result || !result.highlightedEssay) {
        toast.error("Error analyzing essay. Please try again.");
        setIsAnalyzing(false);
        return;
      }
      
      setHighlightedEssay(result.highlightedEssay);
      setFeedback(result.feedback);
      setRatings(result.ratings);
    } catch (err) {
      console.error("Essay analysis error:", err);
      toast.error("Error analyzing essay. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startNewAnalysis = () => {
    setCurrentFormValues({
      essayType: "Personal Statement/Essay",
      prompt: "",
      essay: ""
    });
    setFeedback("");
    setHighlightedEssay([]);
    setRatings(undefined);
    setHasAnalyzedOnce(false);
  };

  // Don't show limits for admin users
  const shouldShowLimits = !limitInfo.isAdmin;

  const essayCountDisplay = shouldShowLimits && (
    <div className="text-sm text-muted-foreground text-center mt-4">
      {!limitInfo.canUse ? (
        <span className="text-destructive">
          {!currentUser 
            ? "Weekly essay analysis limit reached. Please sign in for more analyses." 
            : "Daily essay analysis limit reached"
          }
        </span>
      ) : (
        <span>
          Essays remaining {!currentUser ? "this week" : "today"}: {limitInfo.remaining}
          {limitInfo.resetTime && ` (Resets ${limitInfo.resetTime})`}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!hasAnalyzedOnce ? (
            <div>
              <EssayForm 
                onSubmit={handleAnalyzeEssay} 
                isAnalyzing={isAnalyzing}
                defaultValues={currentFormValues}
                disabled={!limitInfo.canUse && !limitInfo.isAdmin}
              />
              {essayCountDisplay}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Essay Analysis</h2>
                <Button 
                  variant="outline"
                  onClick={startNewAnalysis}
                  className="ml-4"
                >
                  Analyze New Essay
                </Button>
              </div>
              
              {ratings && (
                <EssayRating ratings={ratings} />
              )}
              
              <FeedbackDisplay
                highlightedEssay={highlightedEssay}
                feedback={feedback}
                isAnalyzing={isAnalyzing}
                ratings={ratings}
                essayType={currentFormValues.essayType}
                prompt={currentFormValues.prompt}
              />
              
              {essayCountDisplay}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EssayChecker;
