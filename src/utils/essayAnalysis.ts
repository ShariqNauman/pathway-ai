
import { getGeminiResponse } from "./geminiApi";
import { renderMarkdown } from "./markdownUtils";
import { EssaySegment } from "@/components/essay-checker/HighlightedEssay";

export interface EssayAnalysisResult {
  highlightedEssay: EssaySegment[];
  feedback: string;
  error?: string;
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
      const feedbackMatch = response.text.match(/---OVERALL_FEEDBACK---\s*([\s\S]*?)$/);
      const overallFeedbackSection = feedbackMatch?.[1]?.trim() || "";
      
      if (!highlightedPartSection && !overallFeedbackSection) {
        // If we can't parse the response in the expected format, display the full response
        const renderedFeedback = await renderMarkdown(response.text);
        return { 
          highlightedEssay: [], 
          feedback: renderedFeedback 
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
        let lastIndex = 0;
        
        highlights.forEach(highlight => {
          if (!highlight.text) return;
          
          // Try to find the exact text match
          let startIndex = essay.indexOf(highlight.text, lastIndex);
          
          // If exact match fails, try a more flexible approach
          if (startIndex === -1) {
            // Try to find a close match by searching for a shorter substring
            const minLength = Math.min(highlight.text.length, 20);
            const searchText = highlight.text.substring(0, minLength);
            startIndex = essay.indexOf(searchText, lastIndex);
            
            if (startIndex === -1) {
              // If we still can't find it, just add this highlight as a separate note
              return;
            }
            
            // Adjust the text to what's actually in the essay
            highlight.text = essay.substring(startIndex, startIndex + highlight.text.length);
          }
          
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
        });
        
        // Add any remaining text
        if (lastIndex < essay.length) {
          segments.push({
            text: essay.substring(lastIndex),
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
      
      return {
        highlightedEssay: segments,
        feedback: finalFeedback
      };
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // If parsing fails, just display the raw response
      const renderedFeedback = await renderMarkdown(response.text);
      return { 
        highlightedEssay: [], 
        feedback: renderedFeedback,
        error: parseError instanceof Error ? parseError.message : "Unknown parsing error"
      };
    }
  } catch (error) {
    console.error("Error analyzing essay:", error);
    return { 
      highlightedEssay: [], 
      feedback: "An error occurred while analyzing your essay. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
