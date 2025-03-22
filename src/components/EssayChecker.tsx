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
import { FileText, RotateCcw, Menu, Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

interface SavedEssay {
  id: string;
  essayType: string;
  prompt: string;
  essay: string;
  feedback: string;
  overallScore: number;
  createdAt: Date;
  // Store generated title separately since it's not in the database
  displayTitle: string;
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
    essayType: "Personal Statement/Essay",
    prompt: "",
    essay: ""
  });
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasAnalyzedOnce, setHasAnalyzedOnce] = useState(false);
  
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
          essayType: item.essay_type,
          prompt: item.prompt,
          essay: item.essay,
          feedback: item.feedback,
          overallScore: item.overall_score || 0,
          createdAt: new Date(item.created_at),
          displayTitle: generateEssayTitle(item.essay_type, item.prompt, item.essay, new Date(item.created_at))
        }));
        
        setSavedEssays(essays);
      }
    } catch (error) {
      console.error("Error fetching saved essays:", error);
    }
  };
  
  const generateEssayTitle = (essayType: string, prompt: string, essay: string, date: Date): string => {
    if (prompt && prompt.length > 0) {
      const words = prompt.split(' ');
      const shortPrompt = words.slice(0, 4).join(' ');
      
      if (shortPrompt.length > 30) {
        return shortPrompt.substring(0, 27) + '...';
      }
      
      return `${essayType}: ${shortPrompt}${words.length > 4 ? '...' : ''}`;
    } else if (essay && essay.length > 0) {
      const firstLine = essay.split('\n')[0].trim();
      if (firstLine.length > 5 && firstLine.length < 60) {
        return firstLine;
      }
      
      const words = essay.split(' ');
      const shortEssay = words.slice(0, 5).join(' ');
      
      if (shortEssay.length > 30) {
        return shortEssay.substring(0, 27) + '...';
      }
      
      return `${shortEssay}${words.length > 5 ? '...' : ''}`;
    }
    
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
    setHasAnalyzedOnce(true);
    
    try {
      const result = await analyzeEssay(essay.essayType, essay.prompt, essay.essay);
      
      if (result && result.highlightedEssay) {
        setHighlightedEssay(result.highlightedEssay);
        setRatings(result.ratings);
      } else {
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
      setHighlightedEssay([{ text: essay.essay, comment: null, highlighted: false }]);
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
    <>
      {currentUser && (
        <Sidebar collapsible="offcanvas" variant="floating">
          <SidebarHeader className="border-b">
            <div className="flex flex-col gap-2 px-3 py-2">
              <h3 className="font-semibold">Your Essays</h3>
              <p className="text-xs text-muted-foreground">Analyses are automatically saved</p>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Recent Analyses</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={startNewAnalysis}
                    className="flex items-center gap-2"
                  >
                    <Plus size={18} />
                    <span>New Analysis</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {savedEssays.map((essay) => (
                  <SidebarMenuItem key={essay.id}>
                    <SidebarMenuButton
                      onClick={() => loadSavedEssay(essay)}
                      isActive={currentAnalysisId === essay.id}
                      className="flex flex-col items-start min-h-[3rem] py-2"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <FileText size={16} className="shrink-0" />
                        <span className="truncate font-medium text-left">{essay.displayTitle}</span>
                      </div>
                      <span className="text-xs text-muted-foreground pl-6">
                        {formatDate(essay.createdAt)} - Score: {essay.overallScore}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center gap-2 m-2"
              onClick={startNewAnalysis}
            >
              <RotateCcw className="h-4 w-4" />
              New Analysis
            </Button>
          </SidebarFooter>
        </Sidebar>
      )}

      <section id="essay-checker" className="flex-1 py-8 px-4 md:px-6 w-full max-w-full">
        <div className="max-w-full">
          <div className="text-center mb-8">
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
            className="flex flex-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="w-full flex relative">
              {currentUser && (
                <div className="mb-4 md:hidden">
                  <SidebarTrigger />
                </div>
              )}
              
              <div className="flex-1">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card shadow-md rounded-xl p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">Essay Input</h3>
                    </div>
                    <EssayForm 
                      onSubmit={handleAnalyzeEssay}
                      isAnalyzing={isAnalyzing}
                      defaultValues={currentFormValues}
                    />
                  </div>
                  
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
    </>
  );
};

export default EssayChecker;
