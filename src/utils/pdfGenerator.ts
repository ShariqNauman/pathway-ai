
import jsPDF from 'jspdf';
import { EssaySegment } from '@/components/essay-checker/HighlightedEssay';
import { RatingCategory } from '@/components/essay-checker/EssayRating';

type RatingData = {
  overall: number;
  categories: RatingCategory[];
};

export const generatePDF = async (
  segments: EssaySegment[] | null | undefined, 
  feedback?: string | null, 
  ratings?: RatingData | null,
  essayType?: string | null, 
  prompt?: string | null
): Promise<void> => {
  try {
    // Input validation - ensure segments exist and are an array
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      console.error("Invalid segments data:", segments);
      throw new Error("No valid essay content provided");
    }

    console.log("Generating PDF with segments:", segments.length);
    
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
    if (ratings && typeof ratings === 'object') {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Ratings", margin, yPos);
      yPos += lineHeight;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      
      if (typeof ratings.overall === 'number') {
        pdf.text(`Overall Score: ${ratings.overall}/100`, margin, yPos);
        yPos += lineHeight * 1.5;

        // Add category ratings
        if (Array.isArray(ratings.categories)) {
          for (const category of ratings.categories) {
            if (category && typeof category === 'object' && category.name && category.score !== undefined) {
              pdf.setFont("helvetica", "normal");
              pdf.text(`${category.name}: ${category.score}/100`, margin, yPos);
              yPos += lineHeight;
            }
          }
        }
        yPos += 5;
      }
    }

    // Add highlighted essay with feedback
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Essay with Feedback", margin, yPos);
    yPos += lineHeight * 1.5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    // Add essay text with annotations
    const annotations = [];
    let currentLineY = yPos;
    let annotationCounter = 1;
    let aggregatedText = "";

    // First pass: collect all text to calculate line breaks properly
    for (const segment of segments) {
      if (segment && segment.text) {
        aggregatedText += segment.text;
      }
    }

    if (!aggregatedText) {
      throw new Error("Essay content is empty");
    }

    const essayLines = pdf.splitTextToSize(aggregatedText, pageWidth - 5);

    // Second pass: add annotations for highlighted segments
    let processedChars = 0;
    let lineIndex = 0;
    let charIndex = 0;

    for (const segment of segments) {
      if (!segment || !segment.text) continue;
      
      const segmentText = segment.text;
      for (let i = 0; i < segmentText.length; i++) {
        // If we've reached the end of the current line, move to the next line
        if (charIndex >= essayLines[lineIndex].length) {
          lineIndex++;
          charIndex = 0;
          currentLineY += 5; // Line height
        }

        // If this is the first character of a highlighted segment, add an annotation
        if (segment.highlighted && i === 0) {
          annotations.push({
            text: `${annotationCounter}`,
            x: margin + charIndex * 2.5,
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
    yPos += essayLines.length * 5 + 15; // Add space after the essay

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
    if (annotations.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Detailed Feedback", margin, yPos);
      yPos += lineHeight * 1.5;

      for (let i = 0; i < annotations.length; i++) {
        const ann = annotations[i];
        if (!ann.comment) continue;
        
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
      const formattedFeedback = feedback.replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' '); // Replace &nbsp; with space

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const feedbackLines = pdf.splitTextToSize(formattedFeedback, pageWidth);
      pdf.text(feedbackLines, margin, yPos);
    }

    // Save the PDF
    pdf.save("essay-analysis.pdf");
    console.log("PDF generated successfully");
    return Promise.resolve();
  } catch (error) {
    console.error("Error generating PDF:", error);
    return Promise.reject(error);
  }
};
