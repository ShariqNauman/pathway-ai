
import React, { useState } from "react";
import { toast } from "sonner";
import EssayForm, { EssayFormValues } from "./essay-checker/EssayForm";
import FeedbackDisplay from "./essay-checker/FeedbackDisplay";
import { analyzeEssay } from "@/utils/essayAnalysis";
import { EssaySegment } from "./essay-checker/HighlightedEssay";
import EssayRating, { RatingCategory } from "./essay-checker/EssayRating";
import { Button } from "./ui/button";
import useUsageLimits from "@/hooks/useUsageLimits";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface EssayCheckerProps {
  initialSidebarOpen?: boolean;
}

const EssayChecker: React.FC<EssayCheckerProps> = ({ initialSidebarOpen = false }) => {
  const { currentUser } = useAuth();
  const { plan } = useSubscription();
  const { checkAndIncrement, used, limit, dailyUsed, dailyLimit } = useUsageLimits('essay');
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
  
  const handleAnalyzeEssay = async (data: EssayFormValues) => {
    if (!currentUser) {
      toast.error("Please sign in to use the Essay Analyzer");
      return;
    }
    
    // Check usage limits before analyzing
    const canProceed = await checkAndIncrement();
    if (!canProceed) {
      return;
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

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!hasAnalyzedOnce ? (
            <div>
              {currentUser && (
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Essay Analysis Usage:</span>{" "}
                    {used}/{limit} monthly, {dailyUsed}/{dailyLimit} today
                    {plan === "basic" && (
                      <span className="ml-2 text-xs">
                        <a href="/pricing" className="text-primary hover:underline">
                          Upgrade for more
                        </a>
                      </span>
                    )}
                  </p>
                </div>
              )}
              <EssayForm 
                onSubmit={handleAnalyzeEssay} 
                isAnalyzing={isAnalyzing}
                defaultValues={currentFormValues}
              />
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
              
              {currentUser && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Essay Analysis Usage:</span>{" "}
                    {used}/{limit} monthly, {dailyUsed}/{dailyLimit} today
                    {plan === "basic" && (
                      <span className="ml-2 text-xs">
                        <a href="/pricing" className="text-primary hover:underline">
                          Upgrade for more
                        </a>
                      </span>
                    )}
                  </p>
                </div>
              )}
          
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EssayChecker;
