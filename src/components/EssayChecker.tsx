
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, FileText, Loader2 } from "lucide-react";
import { getGeminiResponse } from "@/utils/geminiApi";
import { renderMarkdown } from "@/utils/markdownUtils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const essaySchema = z.object({
  essayType: z.string({
    required_error: "Please select an essay type",
  }),
  prompt: z.string().min(1, "Please enter the essay prompt"),
  essay: z.string().min(10, "Essay must be at least 10 characters"),
});

type EssayFormValues = z.infer<typeof essaySchema>;

const EssayChecker = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [highlightedEssay, setHighlightedEssay] = useState<any[]>([]);
  
  const form = useForm<EssayFormValues>({
    resolver: zodResolver(essaySchema),
    defaultValues: {
      essayType: "",
      prompt: "",
      essay: "",
    },
  });

  const analyzeEssay = async (data: EssayFormValues) => {
    setIsAnalyzing(true);
    setFeedback("");
    setHighlightedEssay([]);
    
    try {
      const promptForAI = `
You are an experienced college admissions officer evaluating the following ${data.essayType}. 

ESSAY PROMPT: "${data.prompt}"

ESSAY: "${data.essay}"

Please analyze this essay line by line as an admissions officer would. For each paragraph:
1. Identify specific parts that need improvement or refinement (with exact text excerpts).
2. For each identified part, provide a brief, constructive comment explaining why it needs improvement and how to make it stronger.
3. After analyzing all paragraphs, provide overall feedback (under 500 words) on the essay's strengths and weaknesses.

Format your response as follows:
---HIGHLIGHTED_PARTS---
[exact text that needs improvement]||[your comment]
[next text part]||[your comment]
...
---OVERALL_FEEDBACK---
[your detailed feedback here]
`;
      
      const response = await getGeminiResponse(promptForAI);
      
      if (response.error) {
        setFeedback(`Error analyzing essay: ${response.error}`);
        return;
      }
      
      // Parse the response
      const parts = response.text.split("---HIGHLIGHTED_PARTS---");
      if (parts.length > 1) {
        const highlightedPartSection = parts[1].split("---OVERALL_FEEDBACK---")[0].trim();
        const overallFeedbackSection = parts[1].split("---OVERALL_FEEDBACK---")[1]?.trim() || "";
        
        // Process highlighted parts
        const highlights = highlightedPartSection
          .split("\n")
          .filter(line => line.includes("||"))
          .map(line => {
            const [text, comment] = line.split("||").map(part => part.trim());
            return { text, comment };
          });
        
        // Create highlighted essay by marking up original text
        const essay = data.essay;
        const segments = [];
        let lastIndex = 0;
        
        highlights.forEach(highlight => {
          const startIndex = essay.indexOf(highlight.text, lastIndex);
          if (startIndex !== -1) {
            // Text before the highlight
            if (startIndex > lastIndex) {
              segments.push({
                text: essay.substring(lastIndex, startIndex),
                highlighted: false,
                comment: null,
              });
            }
            
            // The highlighted text
            segments.push({
              text: highlight.text,
              highlighted: true,
              comment: highlight.comment,
            });
            
            lastIndex = startIndex + highlight.text.length;
          }
        });
        
        // Add any remaining text
        if (lastIndex < essay.length) {
          segments.push({
            text: essay.substring(lastIndex),
            highlighted: false,
            comment: null,
          });
        }
        
        setHighlightedEssay(segments);
        
        // Process and set overall feedback
        const renderedFeedback = await renderMarkdown(overallFeedbackSection);
        setFeedback(renderedFeedback);
      } else {
        // If the AI didn't format correctly, just display the raw response
        const renderedFeedback = await renderMarkdown(response.text);
        setFeedback(renderedFeedback);
      }
    } catch (error) {
      console.error("Error analyzing essay:", error);
      setFeedback("An error occurred while analyzing your essay. Please try again.");
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(analyzeEssay)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="essayType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Essay Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select essay type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Personal Statement/Essay">Personal Statement/Essay</SelectItem>
                          <SelectItem value="Common App Essay">Common App Essay</SelectItem>
                          <SelectItem value="Supplemental Essay">Supplemental Essay</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Essay Prompt/Topic</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the essay prompt or topic" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="essay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Essay</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste your essay here..." 
                          className="min-h-[200px]" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Essay...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Analyze Essay
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
          
          {/* Feedback Display */}
          <div className="bg-card shadow-md rounded-xl p-6 border border-border overflow-auto max-h-[700px]">
            <div className="mb-4">
              <h3 className="text-xl font-semibold border-b pb-2 mb-4">Essay Analysis</h3>
              
              {highlightedEssay.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2 text-sm">Your Essay with Feedback:</h4>
                  <div className="p-4 bg-muted/50 rounded-md font-sans text-sm">
                    {highlightedEssay.map((segment, index) => (
                      segment.highlighted ? (
                        <HoverCard key={index} openDelay={200}>
                          <HoverCardTrigger asChild>
                            <span className="bg-yellow-200 dark:bg-yellow-500/30 cursor-help rounded px-0.5">
                              {segment.text}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="flex justify-between space-x-4">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold">Feedback</h4>
                                <p className="text-sm">{segment.comment}</p>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      ) : (
                        <span key={index}>{segment.text}</span>
                      )
                    ))}
                  </div>
                </div>
              )}
              
              {feedback && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">Overall Feedback:</h4>
                  <div 
                    className="prose dark:prose-invert prose-sm max-w-none" 
                    dangerouslySetInnerHTML={{ __html: feedback }} 
                  />
                </div>
              )}
              
              {!highlightedEssay.length && !feedback && !isAnalyzing && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <p>Submit your essay to receive AI feedback</p>
                </div>
              )}
              
              {isAnalyzing && (
                <div className="text-center py-12">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">Analyzing your essay...</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EssayChecker;
