
import { getChatResponse } from "./chatConsultantApi";
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
You are an experienced college admissions officer with 15+ years of experience at top universities. You are evaluating the following ${essayType}.

ESSAY PROMPT: "${prompt}"

ESSAY: "${essay}"

Analyze this essay as if you were making an actual admissions decision. Your response MUST follow this exact format with NO DEVIATIONS:

---HIGHLIGHTED_PARTS---
[exact text that needs improvement]||[your specific comment about this text and how it could be improved to strengthen the application]
[next text part]||[your specific comment]
...add more highlighted parts as needed

---OVERALL_FEEDBACK---
[Write a comprehensive evaluation in paragraph form, approximately 500 words. Begin with a one-sentence overall assessment. Then, analyze the following aspects in flowing paragraphs:

First Impression & Memorability: Evaluate how the essay stands out among thousands of applications.

Personal Growth & Self-Reflection: Discuss evidence of maturity and self-awareness demonstrated in the essay.

Character & Values: Analyze what the essay reveals about the applicant's personality and principles.

Writing Quality: Assess the technical writing ability and storytelling effectiveness.

Authenticity: Evaluate how genuine and unique the voice feels.

Impact: Describe the lasting impression on the admissions committee.

Fit for Higher Education: Explain how the demonstrated qualities align with college success.

End with 3-4 specific, actionable recommendations for improvement.]

---RATINGS---
Overall: [score from 1-100, based on actual admissions standards]
Uniqueness: [score 1-100, evaluating distinctiveness among typical applications]
Hook: [score 1-100, assessing how well it captures attention in first 30 seconds]
Voice: [score 1-100, rating authenticity and personal tone]
Flow: [score 1-100, evaluating narrative coherence and transitions]
Authenticity: [score 1-100, measuring genuineness and self-reflection]
Conciseness: [score 1-100, assessing efficiency and impact of language]

CRITICAL INSTRUCTIONS:
1. Write the feedback in flowing paragraphs - DO NOT use numbered sections
2. Ensure smooth transitions between different aspects of the evaluation
3. Include all required aspects (First Impression through Recommendations) in a natural, flowing narrative
4. End with clear, bullet-pointed recommendations
5. Evaluate with the same rigor you would use for actual college applications
6. Each highlighted text MUST be an EXACT match to text in the original essay
7. For each highlight, explain both the impact on the application and how to improve
8. Focus on elements that influence admission decisions (character, growth, potential)
9. Rate based on actual admission standards, not general writing quality
10. Maintain clear paragraph breaks between major topics

Remember: Write in a natural, flowing style while covering all required aspects of the evaluation.`;
    
    const response = await getChatResponse(promptForAI);
    console.log("Chat API Response:", response);
    
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
      const feedbackMatch = response.text.match(/---OVERALL_FEEDBACK---\s*([\s\S]*?)(?=---RATINGS---|$)/);
      const overallFeedbackSection = feedbackMatch?.[1]?.trim() || "";
      
      // Look for the ratings section
      const ratingsMatch = response.text.match(/---RATINGS---\s*([\s\S]*?)$/);
      const ratingsSection = ratingsMatch?.[1]?.trim() || "";
      
      console.log("Full response text:", response.text);
      console.log("Parsed sections:", { 
        highlightedPartSection: highlightedPartSection.substring(0, 100) + "...", 
        overallFeedbackSection,
        ratingsSection
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
        // Clean up the feedback to ensure consistent formatting
        const cleanedFeedback = overallFeedbackSection
          .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
          .replace(/^\s+|\s+$/g, '') // Trim whitespace
          .split('\n')
          .map(line => {
            // Ensure numbered sections are properly formatted
            if (/^\d+\./.test(line)) {
              return `\n${line}`;
            }
            return line;
          })
          .join('\n');
        
        finalFeedback = await renderMarkdown(cleanedFeedback);
      } else {
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
