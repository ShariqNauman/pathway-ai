
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

Please analyze this essay line by line and provide specific feedback. Your response MUST follow this exact format:

---HIGHLIGHTED_PARTS---
[exact text that needs improvement]||[your specific comment about this text]
[next text part]||[your specific comment]
...add more highlighted parts as needed

---OVERALL_FEEDBACK---
[provide detailed feedback on the entire essay's strengths and weaknesses in 400-500 words]

Important instructions:
1. Include 5-10 specific text excerpts that need improvement
2. Make sure each highlighted text is an EXACT match to text in the original essay
3. Keep comments concise and actionable (1-2 sentences)
4. For overall feedback, be constructive but honest about areas for improvement
5. ONLY use the format above with the exact section headers
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
      
      console.log("Parsed sections:", { 
        highlightedPartSection: highlightedPartSection.substring(0, 100) + "...", 
        overallFeedbackSection: overallFeedbackSection.substring(0, 100) + "..." 
      });
      
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
        let remainingEssay = essay;
        let processedChars = 0;
        
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
