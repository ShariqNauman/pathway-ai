
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
import ApiKeyModal from "./ApiKeyModal";

interface EssayCheckerProps {
  initialSidebarOpen?: boolean;
}

// Removed daily essay limits - now controlled by API key

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
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Removed essay limit checking - now controlled by API key

  // Removed essay count tracking - now controlled by API key
  
  const handleAnalyzeEssay = async (data: EssayFormValues) => {
    if (!currentUser?.id) {
      toast.error("Please sign in to analyze essays");
      return;
    }

    // Check if user has API key
    if (!currentUser.preferences.geminiApiKey) {
      setShowApiKeyModal(true);
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

  // Removed essay count display - no more limits

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
                disabled={false}
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
      
      <ApiKeyModal 
        open={showApiKeyModal}
        onOpenChange={setShowApiKeyModal}
        onSuccess={() => {
          // Retry the essay analysis after API key is saved
          if (currentFormValues.essay && currentFormValues.prompt) {
            handleAnalyzeEssay(currentFormValues);
          }
        }}
      />
    </div>
  );
};

export default EssayChecker;
