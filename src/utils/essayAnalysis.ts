
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

function generateDefaultHighlights(essay: string): { text: string; comment: string; }[] {
  // Create meaningful highlights by analyzing essay structure
  const sentences = essay.match(/[^.!?]+[.!?]+/g) || [];
  const paragraphs = essay.split('\n\n').filter(p => p.trim().length > 0);
  
  const highlights = [];
  
  // Always highlight the opening sentence
  if (sentences.length > 0) {
    highlights.push({
      text: sentences[0].trim(),
      comment: "Consider strengthening your opening to immediately capture the reader's attention with a more compelling hook."
    });
  }
  
  // Highlight a middle section for development
  if (sentences.length > 3) {
    const middleIndex = Math.floor(sentences.length / 2);
    highlights.push({
      text: sentences[middleIndex].trim(),
      comment: "This section could benefit from more specific examples or deeper reflection to strengthen your narrative."
    });
  }
  
  // Highlight conclusion if available
  if (sentences.length > 1) {
    highlights.push({
      text: sentences[sentences.length - 1].trim(),
      comment: "Consider making your conclusion more impactful by clearly connecting back to your main theme and showing growth."
    });
  }
  
  // Add paragraph-level feedback if we have multiple paragraphs
  if (paragraphs.length > 1 && highlights.length < 4) {
    const longParagraphs = paragraphs.filter(p => p.length > 200);
    if (longParagraphs.length > 0) {
      const firstLongParagraph = longParagraphs[0];
      const firstSentence = firstLongParagraph.match(/^[^.!?]+[.!?]+/)?.[0];
      if (firstSentence && !highlights.some(h => h.text === firstSentence.trim())) {
        highlights.push({
          text: firstSentence.trim(),
          comment: "This paragraph is quite long. Consider breaking it into smaller, more focused paragraphs for better readability."
        });
      }
    }
  }
  
  // Ensure we have at least 3 highlights
  if (highlights.length < 3 && sentences.length > highlights.length) {
    for (let i = 1; i < sentences.length && highlights.length < 3; i++) {
      const sentence = sentences[i].trim();
      if (!highlights.some(h => h.text === sentence)) {
        highlights.push({
          text: sentence,
          comment: "Consider revising this section for greater clarity and impact."
        });
      }
    }
  }
  
  return highlights.slice(0, 5); // Maximum 5 highlights
}

export async function analyzeEssay(
  essayType: string,
  prompt: string,
  essay: string
): Promise<EssayAnalysisResult> {
  try {
    const promptForAI = `You are an experienced college admissions officer with 15+ years of experience at top universities. You are evaluating the following ${essayType}.

ESSAY PROMPT: "${prompt}"

ESSAY: "${essay}"

Analyze this essay as if you were making an actual admissions decision. Your response MUST follow this exact format with NO DEVIATIONS:

---HIGHLIGHTED_PARTS---
IMPORTANT: You MUST provide at least 3-5 highlighted text segments from the essay. Each highlight should be an exact quote from the essay followed by specific feedback.

[exact text from essay]||[specific feedback about this text and how to improve it]
[next exact text from essay]||[specific feedback about this text and how to improve it]
[continue with 3-5 total highlights]

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
1. You MUST provide highlighted parts - this is essential for the analysis
2. Each highlighted text MUST be an EXACT match to text in the original essay
3. Provide specific, actionable feedback for each highlight
4. Write flowing paragraphs in the feedback section
5. Rate based on actual admission standards`;
    
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
        overallFeedbackSection: overallFeedbackSection.substring(0, 100) + "...",
        ratingsSection
      });
      
      // Process highlighted parts with fallback to defaults
      let highlights = [];
      
      if (highlightedPartSection && highlightedPartSection.trim()) {
        highlights = highlightedPartSection
          .split("\n")
          .filter(line => line.includes("||"))
          .map(line => {
            const [text, comment] = line.split("||").map(part => part.trim());
            return { text, comment };
          })
          .filter(highlight => highlight.text && highlight.text.length > 0);
      }
      
      // If no highlights were parsed or too few, generate defaults
      if (highlights.length < 3) {
        console.warn("Insufficient highlighted parts found, generating defaults");
        const defaultHighlights = generateDefaultHighlights(essay);
        highlights = [...highlights, ...defaultHighlights].slice(0, 5);
      }
      
      console.log("Final highlights:", highlights);
      
      // Create highlighted essay segments
      let segments: EssaySegment[] = [];
      
      if (highlights.length > 0) {
        let remainingEssay = essay;
        
        for (const highlight of highlights) {
          // Skip invalid highlights
          if (!highlight.text || highlight.text.length < 3) continue;
          
          // Find the highlight in the remaining essay
          const highlightIndex = remainingEssay.toLowerCase().indexOf(highlight.text.toLowerCase());
          
          if (highlightIndex === -1) {
            console.warn(`Could not find highlight text: "${highlight.text}" in essay`);
            continue;
          }
          
          // Add non-highlighted text before this highlight
          if (highlightIndex > 0) {
            segments.push({
              text: remainingEssay.substring(0, highlightIndex),
              highlighted: false,
              comment: null,
            });
          }
          
          // Add the highlighted text (use the actual text from essay to preserve formatting)
          const actualText = remainingEssay.substring(highlightIndex, highlightIndex + highlight.text.length);
          segments.push({
            text: actualText,
            highlighted: true,
            comment: highlight.comment,
          });
          
          // Update the remaining essay
          remainingEssay = remainingEssay.substring(highlightIndex + highlight.text.length);
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
        // If no highlights, just display the original essay
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
        finalFeedback = await renderMarkdown(response.text);
      }
      
      // Parse ratings
      let ratings = generateDefaultRatings();
      
      if (ratingsSection) {
        try {
          // Parse overall rating
          const overallMatch = ratingsSection.match(/Overall:\s*(\d+)/i);
          if (overallMatch && overallMatch[1]) {
            const overallScore = parseInt(overallMatch[1], 10);
            if (!isNaN(overallScore) && overallScore >= 1 && overallScore <= 100) {
              ratings.overall = overallScore;
            }
          }
          
          // Parse category ratings
          const categoryMap: Record<string, string> = {
            'Uniqueness': 'Uniqueness',
            'Hook': 'Hook',
            'Voice': 'Voice',
            'Flow': 'Flow',
            'Authenticity': 'Authenticity',
            'Conciseness': 'Conciseness'
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
        }
      }
      
      return {
        highlightedEssay: segments,
        feedback: finalFeedback,
        ratings
      };
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      
      // Fallback: create default highlights and use raw response
      const defaultHighlights = generateDefaultHighlights(essay);
      let segments: EssaySegment[] = [];
      let remainingEssay = essay;
      
      for (const highlight of defaultHighlights) {
        const highlightIndex = remainingEssay.indexOf(highlight.text);
        if (highlightIndex !== -1) {
          if (highlightIndex > 0) {
            segments.push({
              text: remainingEssay.substring(0, highlightIndex),
              highlighted: false,
              comment: null,
            });
          }
          
          segments.push({
            text: highlight.text,
            highlighted: true,
            comment: highlight.comment,
          });
          
          remainingEssay = remainingEssay.substring(highlightIndex + highlight.text.length);
        }
      }
      
      if (remainingEssay.length > 0) {
        segments.push({
          text: remainingEssay,
          highlighted: false,
          comment: null,
        });
      }
      
      const renderedFeedback = await renderMarkdown(response.text);
      return { 
        highlightedEssay: segments,
        feedback: renderedFeedback,
        ratings: generateDefaultRatings(),
        error: parseError instanceof Error ? parseError.message : "Unknown parsing error"
      };
    }
  } catch (error) {
    console.error("Error analyzing essay:", error);
    
    // Final fallback with default highlights
    const defaultHighlights = generateDefaultHighlights(essay);
    const segments: EssaySegment[] = [{
      text: essay,
      highlighted: false,
      comment: null,
    }];
    
    return { 
      highlightedEssay: segments,
      feedback: "An error occurred while analyzing your essay. Please try again.",
      ratings: generateDefaultRatings(),
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
