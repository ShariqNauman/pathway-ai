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

Important instructions:
1. Include 5-10 specific text excerpts that need improvement
2. Make sure each highlighted text is an EXACT match to text in the original essay
3. Keep comments concise and actionable (1-2 sentences)
4. For overall feedback, be constructive but honest about areas for improvement
5. ONLY use the format above with the exact section headers
6. Rate each category from 1-100, with higher numbers being better
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
      
      if (!highlightedPartSection && !overallFeedbackSection) {
        // If we can't parse the response in the expected format, display the full response
        const renderedFeedback = await renderMarkdown(response.text);
        return { 
          highlightedEssay: [], 
          feedback: renderedFeedback,
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
        });
      
      console.log("Parsed highlights:", highlights);
      
      // Create highlighted essay segments
      let segments: EssaySegment[] = [];
      
      if (highlights.length > 0) {
        let remainingEssay = essay;
        
        for (const highlight of highlights) {
          if (!highlight.text || !remainingEssay.includes(highlight.text)) continue;
          
          const startIndex = remainingEssay.indexOf(highlight.text);
          if (startIndex === -1) continue;
          
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
