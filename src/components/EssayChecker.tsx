
import React, { useState } from "react";
import { toast } from "sonner";
import EssayForm, { EssayFormValues } from "./essay-checker/EssayForm";
import FeedbackDisplay from "./essay-checker/FeedbackDisplay";
import { analyzeEssay } from "@/utils/essayAnalysis";
import { EssaySegment } from "./essay-checker/HighlightedEssay";
import EssayRating, { RatingCategory } from "./essay-checker/EssayRating";
import { Button } from "./ui/button";
import { FileText } from "lucide-react";

interface EssayCheckerProps {
  initialSidebarOpen?: boolean;
}

const EssayChecker: React.FC<EssayCheckerProps> = ({ initialSidebarOpen }) => {
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
            <EssayForm 
              onSubmit={handleAnalyzeEssay} 
              isAnalyzing={isAnalyzing}
              defaultValues={currentFormValues}
            />
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
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EssayChecker;
