
import React, { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EssayForm, { EssayFormValues } from "./essay-checker/EssayForm";
import FeedbackDisplay from "./essay-checker/FeedbackDisplay";
import { analyzeEssay } from "@/utils/essayAnalysis";
import { EssaySegment } from "./essay-checker/HighlightedEssay";
import EssayRating, { RatingCategory } from "./essay-checker/EssayRating";
import { Button } from "./ui/button";
import { FileText } from "lucide-react";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { useUser } from "@/contexts/UserContext";

interface EssayCheckerProps {
  initialSidebarOpen?: boolean;
}

const EssayChecker: React.FC<EssayCheckerProps> = ({ initialSidebarOpen = false }) => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const { checkAndIncrementUsage, limits } = useUsageLimits();
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
      toast.error("Please log in to analyze essays", {
        action: {
          label: "Log In",
          onClick: () => navigate("/login")
        }
      });
      return;
    }

    // Check if user has reached their limit
    const canProceed = await checkAndIncrementUsage('essayAnalyzer');
    if (!canProceed) {
      toast.error("You've reached your essay analysis limit", {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/pricing")
        }
      });
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
            <>
              {currentUser && (
                <div className="mb-4 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    You have used <span className="font-medium">{limits.essayAnalyzer.used}</span> of your <span className="font-medium">{limits.essayAnalyzer.limit === Infinity ? 'unlimited' : limits.essayAnalyzer.limit}</span> monthly essay analyses
                  </p>
                </div>
              )}
              <EssayForm 
                onSubmit={handleAnalyzeEssay} 
                isAnalyzing={isAnalyzing}
                defaultValues={currentFormValues}
              />
            </>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EssayChecker;
