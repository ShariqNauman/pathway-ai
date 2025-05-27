import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkRecommenderLimit, getRecommenderCount } from "@/utils/smartRecommenderApi";
import SmartRecommenderLimits from "@/components/SmartRecommenderLimits";
import { Sparkles, BookOpen, Users, GraduationCap } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SmartRecommenderPage = () => {
  const { currentUser } = useUser();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState("");
  const [limitInfo, setLimitInfo] = useState<{ count: number; isLimitReached: boolean }>({ 
    count: 0, 
    isLimitReached: false 
  });

  useEffect(() => {
    const fetchLimitInfo = async () => {
      if (!currentUser?.id) return;
      
      const info = await getRecommenderCount(currentUser.id);
      setLimitInfo(info);
    };

    fetchLimitInfo();
  }, [currentUser?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error("Please sign in to use the Smart Recommender");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please enter your preferences and requirements");
      return;
    }

    if (limitInfo.isLimitReached) {
      toast.error("You've reached your daily limit of 5 recommendations. Please try again tomorrow at UTC midnight.");
      return;
    }

    setIsLoading(true);
    
    try {
      // Check limit before making the request
      const canUseRecommender = await checkRecommenderLimit(currentUser.id);
      
      if (!canUseRecommender) {
        toast.error("You've reached your daily limit of 5 recommendations. Please try again tomorrow at UTC midnight.");
        return;
      }

      const { data, error } = await supabase.functions.invoke('smart-recommender', {
        body: {
          prompt: prompt,
          userId: currentUser.id
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        toast.error('Failed to get recommendations. Please try again.');
        return;
      }

      if (data && data.recommendations) {
        setRecommendations(data.recommendations);
      } else {
        toast.error('No recommendations found. Please try again.');
      }
      
      // Refresh limit info after successful recommendation
      await fetchLimitInfo();
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast.error('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Smart Recommender</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get personalized university recommendations based on your preferences, academic background, and career goals.
          </p>
        </div>

        {currentUser && <SmartRecommenderLimits />}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enter Your Preferences & Requirements</CardTitle>
            <CardDescription>
              Provide detailed information about your academic background, interests, and career goals to receive the most relevant recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="e.g., I'm interested in studying Computer Science at a top-ranked university in the USA. I have a strong academic record and want to pursue research in AI."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Getting Recommendations...
                  </>
                ) : (
                  "Get Recommendations"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {recommendations && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <CardTitle>Your Personalized Recommendations</CardTitle>
              </div>
              <CardDescription>
                Based on your input, here are some universities that align with your preferences and goals.
              </CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{recommendations}</ReactMarkdown>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SmartRecommenderPage;
