import { getGeminiResponse } from "./geminiApi";
import { renderMarkdown } from "./markdownUtils";
import { EssaySegment } from "@/components/essay-checker/HighlightedEssay";
import { RatingCategory } from "@/components/essay-checker/EssayRating";
import { Lightbulb, Music, Waves, Heart, Target, ScanLine } from "lucide-react";

export interface EssayAnalysisResult {
  highlightedEssay: EssaySegment[];
  feedback: string;
  ratings?: {
    overall: number;
    categories: RatingCategory[];
  };
  error?: string;
}

function generateDefaultRatings(): {
  overall: number;
  categories: RatingCategory[];
} {
  return {
    overall: 85,
    categories: [
      {
        name: "Uniqueness",
        score: 87,
        description: "How original and distinctive your essay is compared to others.",
        icon: Lightbulb
      },
      {
        name: "Hook",
        score: 87,
        description: "How effectively your introduction captures the reader's attention.",
        icon: Target
      },
      {
        name: "Voice",
        score: 92,
        description: "How well your personal tone and style come through in your writing.",
        icon: Music
      },
      {
        name: "Flow",
        score: 82,
        description: "How smoothly your essay transitions between ideas and paragraphs.",
        icon: Waves
      },
      {
        name: "Authenticity",
        score: 92,
        description: "How genuine and true to yourself your essay feels.",
        icon: Heart
      },
      {
        name: "Conciseness",
        score: 82,
        description: "How efficiently you express your ideas without unnecessary words.",
        icon: ScanLine
      }
    ]
  };
}

export async function analyzeEssay(
  essayType: string,
  prompt: string,
  essay: string
): Promise<EssayAnalysisResult> {
  try {
    const promptForAI = `
You are an experienced college admissions officer evaluating the following ${essayType}.

ESSAY PROMPT: "${prompt}"

ESSAY: "${essay}"

Please analyze this essay line by line and provide specific feedback. Your response MUST follow this exact format:

---HIGHLIGHTED_PARTS---
[exact text that needs improvement]||[your specific comment about this text]
[next text part]||[your specific comment]
...add more highlighted parts as needed

---OVERALL_FEEDBACK---
[provide detailed feedback on the entire essay's strengths and weaknesses in 400-500 words]

---RATINGS---
Overall: [score from 1-100]
Uniqueness: [score from 1-100]
Hook: [score from 1-100]
Voice: [score from 1-100]
Flow: [score from 1-100]
Authenticity: [score from 1-100]
Conciseness: [score from 1-100]

CRITICAL INSTRUCTIONS:
1. You MUST include 5-10 specific text excerpts that need improvement
2. Each highlighted text MUST be an EXACT match to text in the original essay
3. Never leave the HIGHLIGHTED_PARTS section empty - always find at least 5 areas to provide feedback on
4. For each highlighted part, select a meaningful text chunk (typically 5-20 words) that can stand alone with your comment
5. Keep comments concise and actionable (1-2 sentences)
6. Ensure your highlighted sections don't overlap
7. Make sure to cover different aspects of the essay when highlighting (don't focus only on one issue)
8. For overall feedback, be constructive but honest about areas for improvement
9. ONLY use the format above with the exact section headers
10. Rate each category from 1-100, with higher numbers being better
`;
    
    const response = await getGeminiResponse(promptForAI);
    console.log("Gemini API Response:", response);
    
    if (response.error) {
      return { 
        highlightedEssay: [], 
        feedback: `Error analyzing essay: ${response.error}`,
        error: response.error 
      };
    }
    
    // Parse the response with improved error handling
    try {
      // Look for the highlighted parts section
      const highlightedMatch = response.text.match(/---HIGHLIGHTED_PARTS---\s*([\s\S]*?)(?:---OVERALL_FEEDBACK---|$)/);
      const highlightedPartSection = highlightedMatch?.[1]?.trim() || "";
      
      // Look for the overall feedback section
      const feedbackMatch = response.text.match(/---OVERALL_FEEDBACK---\s*([\s\S]*?)(?:---RATINGS---|$)/);
      const overallFeedbackSection = feedbackMatch?.[1]?.trim() || "";
      
      // Look for the ratings section
      const ratingsMatch = response.text.match(/---RATINGS---\s*([\s\S]*?)$/);
      const ratingsSection = ratingsMatch?.[1]?.trim() || "";
      
      console.log("Parsed sections:", { 
        highlightedPartSection: highlightedPartSection.substring(0, 100) + "...", 
        overallFeedbackSection: overallFeedbackSection.substring(0, 100) + "...",
        ratingsSection: ratingsSection
      });
      
      // Improved handling for missing highlighted parts
      if (!highlightedPartSection || !highlightedPartSection.trim()) {
        console.warn("No highlighted parts found in AI response");
        
        // Create default highlight sections by analyzing the essay
        // This ensures we always have some highlighted parts even if the AI didn't provide them
        const sentences = essay.match(/[^.!?]+[.!?]+/g) || [];
        const highlightedSentences = sentences
          .filter((_, index) => index % 3 === 0) // Highlight every third sentence
          .slice(0, 5); // Maximum 5 highlights
        
        const defaultHighlights = highlightedSentences.map(sentence => ({
          text: sentence.trim(),
          comment: "Consider revising this section for clarity and impact."
        }));
        
        // Process feedback as normal
        let finalFeedback = "";
        if (overallFeedbackSection) {
          finalFeedback = await renderMarkdown(overallFeedbackSection);
        } else {
          finalFeedback = await renderMarkdown(response.text);
        }
        
        // Parse segments from our default highlights
        const segments: EssaySegment[] = [];
        let remainingEssay = essay;
        
        for (const highlight of defaultHighlights) {
          if (!remainingEssay.includes(highlight.text)) continue;
          
          const startIndex = remainingEssay.indexOf(highlight.text);
          
          // Add non-highlighted text before this highlight
          if (startIndex > 0) {
            segments.push({
              text: remainingEssay.substring(0, startIndex),
              highlighted: false,
              comment: null,
            });
          }
          
          // Add the highlighted text
          segments.push({
            text: highlight.text,
            highlighted: true,
            comment: highlight.comment,
          });
          
          // Update the remaining essay
          remainingEssay = remainingEssay.substring(startIndex + highlight.text.length);
        }
        
        // Add any remaining text
        if (remainingEssay.length > 0) {
          segments.push({
            text: remainingEssay,
            highlighted: false,
            comment: null,
          });
        }
        
        return {
          highlightedEssay: segments,
          feedback: finalFeedback,
          ratings: generateDefaultRatings()
        };
      }
      
      // Process highlighted parts
      const highlights = highlightedPartSection
        .split("\n")
        .filter(line => line.includes("||"))
        .map(line => {
          const [text, comment] = line.split("||").map(part => part.trim());
          return { text, comment };
        })
        .filter(highlight => highlight.text && highlight.text.length > 0);
      
      console.log("Parsed highlights:", highlights);
      
      // If we still don't have highlights after parsing, create some default ones
      if (highlights.length === 0) {
        const sentences = essay.match(/[^.!?]+[.!?]+/g) || [];
        const highlightedSentences = sentences
          .filter((_, index) => index % 3 === 0)
          .slice(0, 5);
          
        for (const sentence of highlightedSentences) {
          highlights.push({
            text: sentence.trim(),
            comment: "Consider revising this section for clarity and impact."
          });
        }
      }
      
      // Create highlighted essay segments with improved matching
      let segments: EssaySegment[] = [];
      
      if (highlights.length > 0) {
        let remainingEssay = essay;
        
        for (const highlight of highlights) {
          // Skip invalid highlights
          if (!highlight.text || highlight.text.length < 3) continue;
          
          // Improved matching for highlights that might have whitespace differences
          const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const flexibleRegex = new RegExp(escapedText.replace(/\s+/g, '\\s+'), 'i');
          const match = remainingEssay.match(flexibleRegex);
          
          if (!match) {
            console.warn(`Could not find highlight text: "${highlight.text}" in essay`);
            continue;
          }
          
          const matchedText = match[0];
          const startIndex = match.index || 0;
          
          // Add non-highlighted text before this highlight
          if (startIndex > 0) {
            segments.push({
              text: remainingEssay.substring(0, startIndex),
              highlighted: false,
              comment: null,
            });
          }
          
          // Add the highlighted text
          segments.push({
            text: matchedText,
            highlighted: true,
            comment: highlight.comment,
          });
          
          // Update the remaining essay
          remainingEssay = remainingEssay.substring(startIndex + matchedText.length);
        }
        
        // Add any remaining text
        if (remainingEssay.length > 0) {
          segments.push({
            text: remainingEssay,
            highlighted: false,
            comment: null,
          });
        }
      } else {
        // If no highlights were found, just display the original essay
        segments = [{
          text: essay,
          highlighted: false,
          comment: null,
        }];
      }
      
      // Process and set overall feedback
      let finalFeedback = "";
      if (overallFeedbackSection) {
        finalFeedback = await renderMarkdown(overallFeedbackSection);
      } else {
        // If no overall feedback section was found, display what we got
        finalFeedback = await renderMarkdown(response.text);
      }
      
      // Parse ratings
      let ratings = generateDefaultRatings();
      
      if (ratingsSection) {
        try {
          const ratingLines = ratingsSection.split('\n').filter(line => line.includes(':'));
          
          // Parse overall rating
          const overallMatch = ratingsSection.match(/Overall:\s*(\d+)/i);
          if (overallMatch && overallMatch[1]) {
            const overallScore = parseInt(overallMatch[1], 10);
            if (!isNaN(overallScore) && overallScore >= 1 && overallScore <= 100) {
              ratings.overall = overallScore;
            }
          }
          
          // Parse category ratings
          const categoryMap: Record<string, keyof typeof ratings.categories[0]> = {
            'Uniqueness': 'name',
            'Hook': 'name',
            'Voice': 'name',
            'Flow': 'name',
            'Authenticity': 'name',
            'Conciseness': 'name'
          };
          
          Object.keys(categoryMap).forEach(category => {
            const regex = new RegExp(`${category}:\\s*(\\d+)`, 'i');
            const match = ratingsSection.match(regex);
            
            if (match && match[1]) {
              const score = parseInt(match[1], 10);
              if (!isNaN(score) && score >= 1 && score <= 100) {
                const categoryIndex = ratings.categories.findIndex(c => c.name === category);
                if (categoryIndex !== -1) {
                  ratings.categories[categoryIndex].score = score;
                }
              }
            }
          });
          
        } catch (ratingError) {
          console.error("Error parsing ratings:", ratingError);
          // Use default ratings if parsing fails
        }
      }
      
      return {
        highlightedEssay: segments,
        feedback: finalFeedback,
        ratings
      };
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // If parsing fails, just display the raw response
      const renderedFeedback = await renderMarkdown(response.text);
      return { 
        highlightedEssay: [], 
        feedback: renderedFeedback,
        ratings: generateDefaultRatings(),
        error: parseError instanceof Error ? parseError.message : "Unknown parsing error"
      };
    }
  } catch (error) {
    console.error("Error analyzing essay:", error);
    return { 
      highlightedEssay: [], 
      feedback: "An error occurred while analyzing your essay. Please try again.",
      ratings: generateDefaultRatings(),
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
