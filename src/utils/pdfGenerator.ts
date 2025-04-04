
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
    console.log("PDF Generation - Input validation check:", {
      segmentsProvided: !!segments,
      segmentsIsArray: Array.isArray(segments),
      segmentsLength: segments ? segments.length : 0,
      feedbackProvided: !!feedback,
      ratingsProvided: !!ratings
    });
    
    // Input validation - ensure segments exist and are an array
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      console.error("Invalid segments data:", segments);
      throw new Error("No valid essay content provided");
    }

    // Check that segments contain valid text
    const validSegments = segments.filter(seg => seg && typeof seg.text === 'string');
    if (validSegments.length === 0) {
      console.error("No valid text in segments:", segments);
      throw new Error("Essay segments contain no valid text");
    }

    console.log("Generating PDF with segments:", validSegments.length);
    
    // Create a new jsPDF instance
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set up some variables for positioning
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
    let yPos = margin;
    const lineHeight = 7;
    const fontSize = 10;

    // Function to add a new page
    const addNewPage = () => {
      pdf.addPage();
      yPos = margin;
    };

    // Check if we need to add a new page
    const checkPageBreak = (neededSpace: number) => {
      if (yPos + neededSpace > pageHeight + margin) {
        addNewPage();
        return true;
      }
      return false;
    };

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
      checkPageBreak(50); // Approximate space needed for ratings
      
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
    checkPageBreak(20); // Check if we need to add a page for the essay
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Essay with Feedback", margin, yPos);
    yPos += lineHeight * 1.5;
    
    // Store all segment data for precise annotation placement
    const segmentData: Array<{
      text: string;
      startIndex: number;
      endIndex: number;
      highlighted: boolean;
      comment: string | null;
    }> = [];
    
    // Process the essay segments into a continuous text
    let fullEssayText = "";
    for (const segment of validSegments) {
      const startIndex = fullEssayText.length;
      fullEssayText += segment.text;
      const endIndex = fullEssayText.length;
      
      segmentData.push({
        text: segment.text,
        startIndex,
        endIndex,
        highlighted: segment.highlighted,
        comment: segment.comment
      });
    }

    // Split the full essay text into lines that fit the page
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(fontSize);
    const essayLines = pdf.splitTextToSize(fullEssayText, pageWidth);
    
    // Calculate how many pages will be needed for the essay
    const linesPerPage = Math.floor((pageHeight - lineHeight * 2) / (fontSize * 0.5));
    const totalPages = Math.ceil(essayLines.length / linesPerPage);
    
    console.log(`Essay will be split across ${totalPages} pages with ~${linesPerPage} lines per page`);

    // Track annotation positions and the annotations themselves
    const annotations: Array<{
      number: number;
      x: number;
      y: number;
      comment: string;
    }> = [];
    
    // Draw essay text and place markers
    let lineIndex = 0;
    let annotationCounter = 1;
    
    // Character tracking for annotation placement
    let charPosition = 0;
    let currentLine = 0;
    
    // Iterate through lines and place them on pages
    for (let i = 0; i < essayLines.length; i++) {
      const line = essayLines[i];
      
      // Add a new page if needed
      if (yPos > pageHeight - lineHeight) {
        addNewPage();
      }
      
      // Get the width of a character to help with positioning
      const charWidth = pdf.getStringUnitWidth("A") * fontSize / pdf.internal.scaleFactor;
      
      // Track the character positions on this line
      for (let c = 0; c < line.length; c++) {
        const globalCharPos = charPosition + c;
        
        // Check if this character is at the start of a highlighted segment
        for (const segment of segmentData) {
          if (segment.highlighted && globalCharPos === segment.startIndex) {
            // Place an annotation marker here
            const xPos = margin + (c * charWidth);
            const yPos_marker = yPos - 3; // Slightly above the text
            
            annotations.push({
              number: annotationCounter,
              x: xPos,
              y: yPos_marker,
              comment: segment.comment || ""
            });
            
            annotationCounter++;
          }
        }
      }
      
      // Add the line text
      pdf.text(line, margin, yPos);
      charPosition += line.length;
      yPos += fontSize * 0.5;
      currentLine++;
    }
    
    // Add the markers for annotations
    for (const ann of annotations) {
      pdf.setDrawColor(255, 0, 0);
      pdf.setFillColor(255, 0, 0);
      pdf.circle(ann.x, ann.y, 3, 'F');
      
      // Add white number inside the circle
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      
      // Center the number in the circle
      const numberText = ann.number.toString();
      const numberWidth = pdf.getStringUnitWidth(numberText) * 8 / pdf.internal.scaleFactor;
      pdf.text(numberText, ann.x - (numberWidth / 2), ann.y + 2);
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
    }

    // Add a new page for detailed feedback
    addNewPage();

    // Add detailed feedback for annotations
    if (annotations.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Detailed Feedback", margin, yPos);
      yPos += lineHeight * 1.5;

      for (let i = 0; i < annotations.length; i++) {
        const ann = annotations[i];
        
        // Check if we need a new page
        if (yPos > pageHeight - 30) {
          addNewPage();
        }
        
        // Draw the red circle with number
        pdf.setFillColor(255, 0, 0);
        pdf.circle(margin + 3, yPos - 1, 3, 'F');
        
        // Add white number
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text((i + 1).toString(), margin + 2, yPos);
        
        // Reset color and add the comment
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        
        const commentLines = pdf.splitTextToSize(ann.comment, pageWidth - 15);
        pdf.text(commentLines, margin + 8, yPos);
        yPos += commentLines.length * 5 + 7;
      }
    }

    // Add overall feedback
    if (feedback) {
      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        addNewPage();
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
      
      // Check if feedback might need multiple pages
      for (let i = 0; i < feedbackLines.length; i++) {
        if (yPos > pageHeight - lineHeight) {
          addNewPage();
        }
        pdf.text(feedbackLines[i], margin, yPos);
        yPos += lineHeight;
      }
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
