
import React, { useState } from "react";
import { toast } from "sonner";
import EssayForm, { EssayFormValues } from "./essay-checker/EssayForm";
import FeedbackDisplay from "./essay-checker/FeedbackDisplay";
import { analyzeEssay } from "@/utils/essayAnalysis";
import { EssaySegment } from "./essay-checker/HighlightedEssay";
import EssayRating, { RatingCategory } from "./essay-checker/EssayRating";
import { Button } from "./ui/button";
import { FileText } from "lucide-react";
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
  }>({ canUse: true, remaining: 0, resetTime: null });

  React.useEffect(() => {
    const fetchLimitInfo = async () => {
      const info = await checkLimitsOnly(currentUser?.id || null, 'essay');
      setLimitInfo(info);
    };

    fetchLimitInfo();
  }, [currentUser?.id]);
  
  const handleAnalyzeEssay = async (data: EssayFormValues) => {
    if (!limitInfo.canUse) {
      if (!currentUser) {
        toast.error("You've reached your weekly limit. Please sign in or create an account to continue.");
      } else {
        toast.error("You've reached your daily limit. Please try again tomorrow.");
      }
      return;
    }

    const result = await checkAndUpdateLimits(currentUser?.id || null, 'essay');
    if (!result.canUse) {
      if (!currentUser) {
        toast.error("You've reached your weekly limit. Please sign in or create an account to continue.");
      } else {
        toast.error("You've reached your daily limit. Please try again tomorrow.");
      }
      return;
    }

    setIsAnalyzing(true);
    setFeedback("");
    setHighlightedEssay([]);
    setRatings(undefined);
    setCurrentFormValues(data);
    setHasAnalyzedOnce(true);
    
    try {
      const analysisResult = await analyzeEssay(data.essayType, data.prompt, data.essay);
      
      if (!analysisResult || !analysisResult.highlightedEssay) {
        toast.error("Error analyzing essay. Please try again.");
        setIsAnalyzing(false);
        return;
      }
      
      setHighlightedEssay(analysisResult.highlightedEssay);
      setFeedback(analysisResult.feedback);
      setRatings(analysisResult.ratings);
      
      // Update limit info after successful analysis
      setLimitInfo(result);
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

  const shouldShowLimits = !limitInfo.isAdmin;

  const essayCountDisplay = shouldShowLimits && (
    <div className="text-sm text-muted-foreground text-center mt-4">
      {!limitInfo.canUse ? (
        <span className="text-destructive">
          {!currentUser ? "Weekly essay limit reached" : "Daily essay limit reached"}
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
                disabled={!limitInfo.canUse}
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
