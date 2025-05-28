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
import { supabase } from "@/integrations/supabase/client";

interface EssayCheckerProps {
  initialSidebarOpen?: boolean;
}

const MAX_DAILY_ESSAYS = 10;
const ADMIN_EMAIL = 'shariqnaumann@gmail.com';

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
  const [essayCount, setEssayCount] = useState<number>(0);
  const [isLimitReached, setIsLimitReached] = useState(false);

  const getWeeklyLimits = () => {
    const stored = localStorage.getItem('weeklyLimits');
    if (stored) {
      const parsed = JSON.parse(stored);
      const now = new Date();
      const lastReset = new Date(parsed.lastReset);
      const weeksDiff = Math.floor((now.getTime() - lastReset.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      if (weeksDiff >= 1) {
        const newLimits = { chat: 0, essay: 0, recommender: 0, lastReset: now.toISOString() };
        localStorage.setItem('weeklyLimits', JSON.stringify(newLimits));
        return newLimits;
      }
      return parsed;
    }
    
    const newLimits = { chat: 0, essay: 0, recommender: 0, lastReset: new Date().toISOString() };
    localStorage.setItem('weeklyLimits', JSON.stringify(newLimits));
    return newLimits;
  };

  const updateWeeklyLimits = (feature: string) => {
    const limits = getWeeklyLimits();
    limits[feature]++;
    localStorage.setItem('weeklyLimits', JSON.stringify(limits));
  };

  const checkEssayLimit = async (userId: string) => {
    try {
      const { data: limitData, error: limitError } = await supabase
        .from('message_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (limitError && limitError.code !== 'PGRST116') {
        console.error('Error checking essay limit:', limitError);
        return false;
      }

      const now = new Date();
      const resetTime = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z');

      if (!limitData) {
        const { error } = await supabase
          .from('message_limits')
          .insert({
            user_id: userId,
            essay_count: 1,
            last_reset_essays: resetTime.toISOString()
          });

        if (error) {
          console.error('Error creating essay limit:', error);
          return false;
        }

        setEssayCount(1);
        return true;
      }

      const lastReset = new Date(limitData.last_reset_essays || limitData.last_reset);
      if (now > lastReset && now.getUTCDate() !== lastReset.getUTCDate()) {
        const { error } = await supabase
          .from('message_limits')
          .update({
            essay_count: 1,
            last_reset_essays: resetTime.toISOString()
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Error resetting essay limit:', error);
          return false;
        }

        setEssayCount(1);
        return true;
      }

      if ((limitData.essay_count || 0) >= MAX_DAILY_ESSAYS) {
        setIsLimitReached(true);
        return false;
      }

      const { error } = await supabase
        .from('message_limits')
        .update({
          essay_count: (limitData.essay_count || 0) + 1
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating essay count:', error);
        return false;
      }

      setEssayCount((limitData.essay_count || 0) + 1);
      return true;
    } catch (error) {
      console.error('Error in checkEssayLimit:', error);
      return false;
    }
  };

  React.useEffect(() => {
    const fetchEssayCount = async () => {
      if (currentUser?.id) {
        // Check if user is admin
        if (currentUser.email === ADMIN_EMAIL) {
          setEssayCount(0);
          setIsLimitReached(false);
          return;
        }

        const { data, error } = await supabase
          .from('message_limits')
          .select('essay_count, last_reset_essays, last_reset')
          .eq('user_id', currentUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching essay count:', error);
          return;
        }

        if (data) {
          const now = new Date();
          const lastReset = new Date(data.last_reset_essays || data.last_reset);
          
          if (now > lastReset && now.getUTCDate() !== lastReset.getUTCDate()) {
            setEssayCount(0);
            setIsLimitReached(false);
          } else {
            setEssayCount(data.essay_count || 0);
            setIsLimitReached((data.essay_count || 0) >= MAX_DAILY_ESSAYS);
          }
        }
      } else {
        // Handle unsigned users
        const weeklyLimits = getWeeklyLimits();
        setEssayCount(weeklyLimits.essay);
        setIsLimitReached(weeklyLimits.essay >= 1);
      }
    };

    fetchEssayCount();
  }, [currentUser?.id, currentUser?.email]);
  
  const handleAnalyzeEssay = async (data: EssayFormValues) => {
    if (currentUser?.id) {
      // Check if user is admin
      if (currentUser.email === ADMIN_EMAIL) {
        // Admin has no limits, proceed directly
      } else {
        if (isLimitReached) {
          toast.error(`You've reached your daily limit of ${MAX_DAILY_ESSAYS} essays. Please try again tomorrow at UTC midnight.`);
          return;
        }

        const canAnalyze = await checkEssayLimit(currentUser.id);
        if (!canAnalyze) {
          toast.error(`You've reached your daily limit of ${MAX_DAILY_ESSAYS} essays. Please try again tomorrow at UTC midnight.`);
          return;
        }
      }
    } else {
      // Unsigned user
      const weeklyLimits = getWeeklyLimits();
      if (weeklyLimits.essay >= 1) {
        toast.error("You've reached your weekly limit of 1 essay analysis. Please sign in for more uses or try again next week.");
        return;
      }
      updateWeeklyLimits('essay');
      setEssayCount(1);
      setIsLimitReached(true);
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

  const essayCountDisplay = (
    <div className="text-sm text-muted-foreground text-center mt-4">
      {currentUser ? (
        currentUser.email === ADMIN_EMAIL ? null : (
          isLimitReached ? (
            <span className="text-destructive">Daily essay limit reached ({MAX_DAILY_ESSAYS}/{MAX_DAILY_ESSAYS})</span>
          ) : (
            <span>Essays remaining today: {MAX_DAILY_ESSAYS - essayCount}/{MAX_DAILY_ESSAYS}</span>
          )
        )
      ) : (
        isLimitReached ? (
          <span className="text-destructive">Weekly essay limit reached (1/1). Sign in for more uses.</span>
        ) : (
          <span>Essays remaining this week: {1 - essayCount}/1</span>
        )
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
                disabled={isLimitReached}
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
