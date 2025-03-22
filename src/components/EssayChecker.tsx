
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EssayForm, { EssayFormValues } from "./essay-checker/EssayForm";
import FeedbackDisplay from "./essay-checker/FeedbackDisplay";
import { analyzeEssay } from "@/utils/essayAnalysis";
import { EssaySegment } from "./essay-checker/HighlightedEssay";
import EssayRating, { RatingCategory } from "./essay-checker/EssayRating";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { FileText, RotateCcw, PanelLeft, Menu } from "lucide-react";

interface SavedEssay {
  id: string;
  title: string;
  essayType: string;
  prompt: string;
  essay: string;
  feedback: string;
  overallScore: number;
  createdAt: Date;
}

const EssayChecker = () => {
  const { currentUser } = useUser();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [highlightedEssay, setHighlightedEssay] = useState<EssaySegment[]>([]);
  const [ratings, setRatings] = useState<{
    overall: number;
    categories: RatingCategory[];
  } | undefined>(undefined);
  const [savedEssays, setSavedEssays] = useState<SavedEssay[]>([]);
  const [currentFormValues, setCurrentFormValues] = useState<EssayFormValues>({
    essayType: "personal",
    prompt: "",
    essay: ""
  });
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasAnalyzedOnce, setHasAnalyzedOnce] = useState(false);
  
  // Fetch saved essays when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchSavedEssays();
    }
  }, [currentUser]);
  
  const fetchSavedEssays = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('essay_analyses')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        const essays = data.map(item => ({
          id: item.id,
          title: item.title || generateEssayTitle(item.essay_type, item.prompt, new Date(item.created_at)),
          essayType: item.essay_type,
          prompt: item.prompt,
          essay: item.essay,
          feedback: item.feedback,
          overallScore: item.overall_score || 0,
          createdAt: new Date(item.created_at)
        }));
        
        setSavedEssays(essays);
      }
    } catch (error) {
      console.error("Error fetching saved essays:", error);
    }
  };
  
  // Generate a title for the essay
  const generateEssayTitle = (essayType: string, prompt: string, date: Date): string => {
    if (prompt && prompt.length > 0) {
      // Extract first few words from the prompt
      const words = prompt.split(' ');
      const shortPrompt = words.slice(0, 4).join(' ');
      
      if (shortPrompt.length > 30) {
        return shortPrompt.substring(0, 27) + '...';
      }
      
      return `${essayType}: ${shortPrompt}${words.length > 4 ? '...' : ''}`;
    }
    
    // Fallback if no prompt
    return `${essayType} essay - ${date.toLocaleDateString()}`;
  };
  
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
      
      // Save the analysis for logged-in users
      if (currentUser && result.ratings) {
        try {
          // Generate an appropriate title by analyzing the prompt and essay
          let essayTitle = generateEssayTitle(data.essayType, data.prompt, new Date());
          
          const { data: savedData, error } = await supabase
            .from('essay_analyses')
            .insert({
              user_id: currentUser.id,
              essay_type: data.essayType,
              prompt: data.prompt,
              essay: data.essay,
              feedback: result.feedback,
              overall_score: result.ratings.overall,
              title: essayTitle
            })
            .select();
            
          if (error) {
            console.error("Error saving essay analysis:", error);
          } else if (savedData && savedData.length > 0) {
            setCurrentAnalysisId(savedData[0].id);
            fetchSavedEssays();
          }
        } catch (err) {
          console.error("Failed to save essay analysis:", err);
        }
      }
    } catch (err) {
      console.error("Essay analysis error:", err);
      toast.error("Error analyzing essay. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSavedEssay = async (essay: SavedEssay) => {
    setCurrentFormValues({
      essayType: essay.essayType,
      prompt: essay.prompt,
      essay: essay.essay
    });
    setFeedback(essay.feedback);
    setCurrentAnalysisId(essay.id);
    setHasAnalyzedOnce(true);
    
    try {
      // Convert feedback back to highlighted essay format
      const result = await analyzeEssay(essay.essayType, essay.prompt, essay.essay);
      
      if (result && result.highlightedEssay) {
        setHighlightedEssay(result.highlightedEssay);
        setRatings(result.ratings);
      } else {
        // If we can't get the highlighted essay, create a simple fallback
        setHighlightedEssay([{ text: essay.essay, comment: null, highlighted: false }]);
        setRatings({
          overall: essay.overallScore,
          categories: [
            { 
              name: "Retrieved from saved essay", 
              score: essay.overallScore,
              description: "This is a saved essay analysis",
              icon: FileText
            }
          ]
        });
      }
    } catch (error) {
      console.error("Error loading highlighted essay:", error);
      // Fallback to showing plain essay
      setHighlightedEssay([{ text: essay.essay, comment: null, highlighted: false }]);
    }
  };

  const startNewAnalysis = () => {
    setCurrentFormValues({
      essayType: "personal",
      prompt: "",
      essay: ""
    });
    setFeedback("");
    setHighlightedEssay([]);
    setRatings(undefined);
    setCurrentAnalysisId(null);
    setHasAnalyzedOnce(false);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <section id="essay-checker" className="py-12">
      <div className="max-w-full">
        <div className="text-center mb-10">
          <motion.span 
            className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-accent text-accent-foreground mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            Essay Analyzer
          </motion.span>
          
          <motion.h2 
            className="text-3xl md:text-4xl font-display font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Perfect Your Application Essays
          </motion.h2>
          
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Get detailed, line-by-line feedback on your essays from our AI admissions expert. We'll highlight areas for improvement and provide actionable suggestions.
          </motion.p>
        </div>
        
        <motion.div 
          className="flex"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="w-full flex relative">
            {/* Essay Sidebar */}
            {currentUser && (
              <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block fixed md:relative z-20 h-[600px] w-64 md:w-64 bg-card border-r border-border shadow-lg md:shadow-none transition-all duration-300`}>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-border flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">Your Essays</h3>
                      <p className="text-xs text-muted-foreground">Analyses are automatically saved</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden" 
                      onClick={() => setSidebarOpen(false)}
                    >
                      <PanelLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="overflow-auto flex-1 p-2">
                    <div className="mb-2 text-xs font-medium text-muted-foreground px-2">
                      Recent Analyses
                    </div>
                    
                    <div className="space-y-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full justify-start gap-2 bg-accent/20 text-accent-foreground"
                        onClick={startNewAnalysis}
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>New Analysis</span>
                      </Button>
                      
                      {savedEssays.map((essay) => (
                        <Button 
                          key={essay.id}
                          variant={currentAnalysisId === essay.id ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start text-left h-auto py-2"
                          onClick={() => loadSavedEssay(essay)}
                        >
                          <div className="flex flex-col items-start w-full truncate">
                            <span className="text-sm truncate w-full">{essay.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(essay.createdAt)} - Score: {essay.overallScore}
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-2 border-t border-border">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full flex items-center gap-2"
                      onClick={startNewAnalysis}
                    >
                      <RotateCcw className="h-4 w-4" />
                      New Analysis
                    </Button>
                  </div>
                </div>
              </div>
            )}
          
            {/* Main Content */}
            <div className={`flex-1 ${currentUser ? 'md:ml-4' : ''}`}>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Essay Input Form */}
                <div className="bg-card shadow-md rounded-xl p-6 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Essay Input</h3>
                    {currentUser && (
                      <Button 
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                  <EssayForm 
                    onSubmit={handleAnalyzeEssay}
                    isAnalyzing={isAnalyzing}
                    defaultValues={currentFormValues}
                  />
                </div>
                
                {/* Feedback Display */}
                <div className="bg-card shadow-md rounded-xl p-6 border border-border">
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Essay Analysis</h3>
                    
                    {!feedback && !isAnalyzing && !hasAnalyzedOnce && (
                      <p className="text-sm text-muted-foreground italic">
                        Submit your essay to see analysis results
                      </p>
                    )}
                  </div>
                  
                  <ScrollArea className="h-[500px] pr-4">
                    <FeedbackDisplay
                      highlightedEssay={highlightedEssay}
                      feedback={feedback}
                      isAnalyzing={isAnalyzing}
                      ratings={ratings}
                    />
                  </ScrollArea>
                </div>
              </div>
              
              {/* Ratings Display - Separate Container */}
              {ratings && !isAnalyzing && (
                <motion.div
                  className="mt-8 mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <EssayRating ratings={ratings} />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EssayChecker;
