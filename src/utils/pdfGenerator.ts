
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EssaySegment } from '@/components/essay-checker/HighlightedEssay';
import { RatingCategory } from '@/components/essay-checker/EssayRating';

interface RatingsData {
  overall: number;
  categories: RatingCategory[];
}

export const generatePDF = async (
  segments: EssaySegment[],
  feedback: string,
  ratings?: RatingsData,
  essayType?: string,
  prompt?: string
) => {
  try {
    // Create a new jsPDF instance
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set up some variables for positioning
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    let yPos = margin;
    const lineHeight = 7;
    
    // Add title
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Essay Analysis Report", margin, yPos);
    yPos += 10;
    
    // Add essay type and prompt if available
    if (essayType) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Essay Type:", margin, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(essayType, margin + 25, yPos);
      yPos += lineHeight;
    }
    
    if (prompt) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("Prompt:", margin, yPos);
      yPos += lineHeight;
      
      pdf.setFont("helvetica", "normal");
      const promptLines = pdf.splitTextToSize(prompt, pageWidth);
      pdf.text(promptLines, margin, yPos);
      yPos += promptLines.length * 5 + 5;
    }
    
    // Add ratings if available
    if (ratings) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Ratings", margin, yPos);
      yPos += lineHeight;
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(`Overall Score: ${ratings.overall}/100`, margin, yPos);
      yPos += lineHeight * 1.5;
      
      // Add category ratings
      if (ratings.categories && Array.isArray(ratings.categories)) {
        for (const category of ratings.categories) {
          pdf.setFont("helvetica", "normal");
          pdf.text(`${category.name}: ${category.score}/100`, margin, yPos);
          yPos += lineHeight;
        }
      }
      
      yPos += 5;
    }
    
    // Add highlighted essay with feedback
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Essay with Feedback", margin, yPos);
    yPos += lineHeight * 1.5;
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    
    // Check if segments exist and are valid
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      pdf.text("No essay content available", margin, yPos);
      yPos += lineHeight * 2;
    } else {
      // Add essay text with annotations
      let aggregatedText = "";
      const annotations: {text: string, x: number, y: number, comment: string}[] = [];
      let currentLineY = yPos;
      let annotationCounter = 1;
      
      // First pass: collect all text to calculate line breaks properly
      for (const segment of segments) {
        if (segment && typeof segment.text === 'string') {
          aggregatedText += segment.text;
        }
      }
      
      const essayLines = pdf.splitTextToSize(aggregatedText, pageWidth - 5);
      
      // Second pass: add annotations for highlighted segments
      let processedChars = 0;
      let lineIndex = 0;
      let charIndex = 0;
      
      for (const segment of segments) {
        if (!segment || typeof segment.text !== 'string') continue;
        
        const segmentText = segment.text;
        
        for (let i = 0; i < segmentText.length; i++) {
          // If we've reached the end of the current line, move to the next line
          if (charIndex >= essayLines[lineIndex]?.length || !essayLines[lineIndex]) {
            lineIndex++;
            charIndex = 0;
            if (lineIndex < essayLines.length) {
              currentLineY += 5; // Line height
            }
          }
          
          // If this is the first character of a highlighted segment, add an annotation
          if (segment.highlighted && i === 0 && lineIndex < essayLines.length) {
            annotations.push({
              text: `${annotationCounter}`,
              x: margin + (charIndex * 2.5), // Approximate character width
              y: currentLineY,
              comment: segment.comment || ""
            });
            annotationCounter++;
          }
          
          charIndex++;
          processedChars++;
        }
      }
      
      // Add the essay text
      pdf.text(essayLines, margin, yPos);
      yPos += (essayLines.length * 5) + 15; // Add space after the essay
      
      // Add the annotations
      for (let i = 0; i < annotations.length; i++) {
        const ann = annotations[i];
        
        // Draw small circle around the number and red circle
        pdf.setDrawColor(255, 0, 0);
        pdf.setFillColor(255, 0, 0);
        pdf.circle(ann.x, ann.y - 3, 3, 'F');
        
        // Add the number in white
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text(`${i + 1}`, ann.x - 1, ann.y - 1);
        
        // Reset text color
        pdf.setTextColor(0, 0, 0);
      }
      
      // Add a new page for feedback if needed
      if (yPos > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yPos = margin;
      }
      
      // Add feedback comments
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Detailed Feedback", margin, yPos);
      yPos += lineHeight * 1.5;
      
      for (let i = 0; i < annotations.length; i++) {
        const ann = annotations[i];
        pdf.setFillColor(255, 0, 0);
        pdf.circle(margin + 3, yPos - 1, 3, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text(`${i + 1}`, margin + 2, yPos);
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        
        const commentLines = pdf.splitTextToSize(ann.comment, pageWidth - margin - 10);
        pdf.text(commentLines, margin + 8, yPos);
        
        yPos += commentLines.length * 5 + 7;
        
        // Add a new page if needed
        if (yPos > pdf.internal.pageSize.getHeight() - margin - 20 && i < annotations.length - 1) {
          pdf.addPage();
          yPos = margin;
        }
      }
    }
    
    // Add overall feedback
    if (feedback) {
      // Add a new page if needed
      if (yPos > pdf.internal.pageSize.getHeight() - margin - 60) {
        pdf.addPage();
        yPos = margin;
      }
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Overall Feedback", margin, yPos);
      yPos += lineHeight * 1.5;
      
      // Format the HTML feedback (remove HTML tags)
      const formattedFeedback = feedback
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' '); // Replace &nbsp; with space
        
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const feedbackLines = pdf.splitTextToSize(formattedFeedback, pageWidth);
      pdf.text(feedbackLines, margin, yPos);
    }
    
    // Save the PDF
    pdf.save("essay-analysis.pdf");
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
