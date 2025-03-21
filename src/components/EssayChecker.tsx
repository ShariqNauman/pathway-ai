
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
import { Folder, Save } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

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
          title: `${item.essay_type} essay - ${new Date(item.created_at).toLocaleDateString()}`,
          essayType: item.essay_type,
          prompt: item.prompt,
          essay: item.essay,
          feedback: item.feedback,
          overallScore: item.overall_score,
          createdAt: new Date(item.created_at)
        }));
        
        setSavedEssays(essays);
      }
    } catch (error) {
      console.error("Error fetching saved essays:", error);
    }
  };
  
  const handleAnalyzeEssay = async (data: EssayFormValues) => {
    setIsAnalyzing(true);
    setFeedback("");
    setHighlightedEssay([]);
    setRatings(undefined);
    setCurrentFormValues(data);
    
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
          const { data: savedData, error } = await supabase
            .from('essay_analyses')
            .insert({
              user_id: currentUser.id,
              essay_type: data.essayType,
              prompt: data.prompt,
              essay: data.essay,
              feedback: result.feedback,
              overall_score: result.ratings.overall
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
    
    try {
      // Convert feedback back to highlighted essay format
      const result = await analyzeEssay(essay.essayType, essay.prompt, essay.essay);
      
      if (result && result.highlightedEssay) {
        setHighlightedEssay(result.highlightedEssay);
        setRatings(result.ratings);
      } else {
        setHighlightedEssay([{ text: essay.essay, comment: null }]);
        setRatings({
          overall: essay.overallScore,
          categories: [
            { name: "Retrieved from saved essay", score: essay.overallScore }
          ]
        });
      }
    } catch (error) {
      console.error("Error loading highlighted essay:", error);
      // Fallback to showing plain essay
      setHighlightedEssay([{ text: essay.essay, comment: null }]);
    }
  };

  const updateEssayTitle = async (title: string) => {
    if (!currentUser || !currentAnalysisId) return;
    
    try {
      await supabase
        .from('essay_analyses')
        .update({ title })
        .eq('id', currentAnalysisId);
        
      fetchSavedEssays();
      toast("Essay saved with title: " + title);
    } catch (error) {
      console.error("Error updating essay title:", error);
    }
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
    <SidebarProvider defaultOpen={false}>
      <section id="essay-checker" className="py-20 px-6 lg:px-10 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.span 
              className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-accent text-accent-foreground mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              Essay Analyzer
            </motion.span>
            
            <motion.h2 
              className="text-3xl md:text-4xl font-display font-bold mb-6"
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
            className="flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Essay Sidebar */}
            {currentUser && (
              <Sidebar collapsible="offcanvas" variant="floating">
                <SidebarHeader className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Saved Essays</h3>
                    <p className="text-xs text-muted-foreground">Access your past analyses</p>
                  </div>
                  <SidebarTrigger />
                </SidebarHeader>
                
                <SidebarContent>
                  <SidebarGroupLabel>Recent Analyses</SidebarGroupLabel>
                  <SidebarMenu>
                    {savedEssays.map((essay) => (
                      <SidebarMenuItem key={essay.id}>
                        <SidebarMenuButton 
                          isActive={currentAnalysisId === essay.id}
                          onClick={() => loadSavedEssay(essay)}
                        >
                          <Folder className="h-4 w-4" />
                          <div className="flex flex-col items-start">
                            <span className="text-sm truncate">{essay.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(essay.createdAt)} - Score: {essay.overallScore}
                            </span>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarContent>
              </Sidebar>
            )}
          
            <div className="flex-1">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Essay Input Form */}
                <div className="bg-card shadow-md rounded-xl p-6 border border-border">
                  <EssayForm 
                    onSubmit={handleAnalyzeEssay}
                    isAnalyzing={isAnalyzing}
                    defaultValues={currentFormValues}
                  />
                </div>
                
                {/* Feedback Display */}
                <div className="bg-card shadow-md rounded-xl p-6 border border-border">
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-xl font-semibold border-b pb-2 mb-4">Essay Analysis</h3>
                    
                    {currentUser && feedback && !isAnalyzing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          const title = prompt("Enter a name for this essay analysis:", savedEssays.find(e => e.id === currentAnalysisId)?.title || `${currentFormValues.essayType} essay`);
                          if (title) updateEssayTitle(title);
                        }}
                      >
                        <Save className="h-4 w-4" />
                        Save Analysis
                      </Button>
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
                  className="mt-8 max-w-4xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <EssayRating ratings={ratings} />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </SidebarProvider>
  );
};

export default EssayChecker;
