
import React, { useState } from "react";
import { motion } from "framer-motion";
import EssayForm, { EssayFormValues } from "./essay-checker/EssayForm";
import FeedbackDisplay from "./essay-checker/FeedbackDisplay";
import { analyzeEssay } from "@/utils/essayAnalysis";
import { EssaySegment } from "./essay-checker/HighlightedEssay";
import EssayRating, { RatingCategory } from "./essay-checker/EssayRating";
import { ScrollArea } from "./ui/scroll-area";

const EssayChecker = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [highlightedEssay, setHighlightedEssay] = useState<EssaySegment[]>([]);
  const [ratings, setRatings] = useState<{
    overall: number;
    categories: RatingCategory[];
  } | undefined>(undefined);
  
  const handleAnalyzeEssay = async (data: EssayFormValues) => {
    setIsAnalyzing(true);
    setFeedback("");
    setHighlightedEssay([]);
    setRatings(undefined);
    
    try {
      const result = await analyzeEssay(data.essayType, data.prompt, data.essay);
      setHighlightedEssay(result.highlightedEssay);
      setFeedback(result.feedback);
      setRatings(result.ratings);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
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
          className="grid lg:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Essay Input Form */}
          <div className="bg-card shadow-md rounded-xl p-6 border border-border">
            <EssayForm 
              onSubmit={handleAnalyzeEssay}
              isAnalyzing={isAnalyzing}
            />
          </div>
          
          {/* Feedback Display */}
          <div className="bg-card shadow-md rounded-xl p-6 border border-border">
            <div className="mb-4">
              <h3 className="text-xl font-semibold border-b pb-2 mb-4">Essay Analysis</h3>
              
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
        </motion.div>
        
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
    </section>
  );
};

export default EssayChecker;
