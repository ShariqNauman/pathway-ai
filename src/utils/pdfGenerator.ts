import jsPDF from 'jspdf';
import { EssaySegment } from '@/components/essay-checker/HighlightedEssay';
import { RatingCategory } from '@/components/essay-checker/EssayRating';

type RatingData = {
  overall: number;
  categories: RatingCategory[];
};

// Define highlight colors - darker version for PDF to match website's appearance
const HIGHLIGHT_COLORS = [
  { r: 252, g: 165, b: 165 }, // Red-300 instead of Red-200
  { r: 147, g: 197, b: 253 }, // Blue-300 instead of Blue-200
  { r: 134, g: 239, b: 172 }, // Green-300 instead of Green-200
  { r: 253, g: 224, b: 71 }, // Yellow-300 instead of Yellow-200
  { r: 216, g: 180, b: 254 }, // Purple-300 instead of Purple-200
  { r: 249, g: 168, b: 212 }, // Pink-300 instead of Pink-200
  { r: 253, g: 186, b: 116 }, // Orange-300 instead of Orange-200
  { r: 165, g: 180, b: 252 }, // Indigo-300 instead of Indigo-200
  { r: 94, g: 234, b: 212 }, // Teal-300 instead of Teal-200
  { r: 103, g: 232, b: 249 }, // Cyan-300 instead of Cyan-200
];

// Function to generate unique colors if we run out of predefined ones
const generateUniqueColor = (index: number) => {
  // Use golden ratio to create well-distributed hues
  const goldenRatioConjugate = 0.618033988749895;
  const hue = (index * goldenRatioConjugate) % 1;
  
  // Convert HSL to RGB with high lightness for pastel colors
  const h = hue;
  const s = 0.5; // Medium saturation
  const l = 0.85; // High lightness for pastel
  
  // HSL to RGB conversion
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  
  let r, g, b;
  if (h < 1/6) {
    [r, g, b] = [c, x, 0];
  } else if (h < 2/6) {
    [r, g, b] = [x, c, 0];
  } else if (h < 3/6) {
    [r, g, b] = [0, c, x];
  } else if (h < 4/6) {
    [r, g, b] = [0, x, c];
  } else if (h < 5/6) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
};

// Get a color - either from predefined array or generate a unique one
const getUniqueColor = (index: number) => {
  if (index < HIGHLIGHT_COLORS.length) {
    return HIGHLIGHT_COLORS[index];
  }
  return generateUniqueColor(index);
};

// Function to get exact text boundaries with better precision
function getExactTextBoundaries(text: string, segments: EssaySegment[]) {
  const boundaries: {start: number, end: number, segment: EssaySegment, index: number}[] = [];
  
  let currentPos = 0;
  for (const segment of segments) {
    const segmentStart = currentPos;
    const segmentEnd = segmentStart + segment.text.length;
    
    if (segment.highlighted) {
      boundaries.push({
        start: segmentStart,
        end: segmentEnd,
        segment,
        index: segments.filter(s => s.highlighted).indexOf(segment)
      });
    }
    
    currentPos = segmentEnd;
  }
  
  return boundaries;
}

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
    const lineHeight = 5; // For tighter text
    const fontSize = 10;
    const highlightPadding = 1; // Padding for highlight boxes

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
      checkPageBreak(50);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Ratings", margin, yPos);
      yPos += lineHeight;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      
      if (typeof ratings.overall === 'number') {
        pdf.text(`Overall Score: ${ratings.overall}/100`, margin, yPos);
        yPos += lineHeight * 1.5;

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

    // Add highlighted essay section
    checkPageBreak(20);
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Essay with Feedback", margin, yPos);
    yPos += lineHeight * 1.5;

    // Process segments and draw them with highlights
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(fontSize);
    
    // Get only highlighted segments
    const highlightedSegments = validSegments.filter(segment => segment.highlighted);

    // Compute exact boundaries for highlighted segments
    const segmentBoundaries = getExactTextBoundaries(
      validSegments.map(s => s.text).join(''), 
      validSegments
    );

    // Join all segments into one text for proper text flow
    const completeText = validSegments.map(segment => segment.text).join('');

    // Split text into paragraphs (preserve paragraph breaks)
    const paragraphs = completeText.split(/\n\s*\n/);

    let currentPosition = 0;

    // Process each paragraph 
    for (const paragraph of paragraphs) {
      // Split into lines that fit on the page width
      const lines = pdf.splitTextToSize(paragraph, pageWidth);
      
      // Track line start positions to correctly locate highlights
      const lineStartPositions: number[] = [];
      let lineStartPos = currentPosition;
      
      for (const line of lines) {
        lineStartPositions.push(lineStartPos);
        lineStartPos += line.length;
      }
      
      // Render each line
      for (let i = 0; i < lines.length; i++) {
        if (yPos > pageHeight - lineHeight) {
          addNewPage();
        }
        
        const line = lines[i];
        const lineStart = lineStartPositions[i];
        const lineEnd = lineStart + line.length;
        
        // Find all highlights that intersect with this line
        const lineHighlights: {
          text: string,
          startX: number,
          width: number,
          colorIdx: number
        }[] = [];
        
        for (const boundary of segmentBoundaries) {
          // Skip if highlight doesn't intersect with this line
          if (boundary.end <= lineStart || boundary.start >= lineEnd) continue;
          
          // Calculate segment part that appears on this line
          const segStartInLine = Math.max(0, boundary.start - lineStart);
          const segEndInLine = Math.min(line.length, boundary.end - lineStart);
          
          if (segEndInLine <= segStartInLine) continue;
          
          // Extract the exact text that should be highlighted
          const textToHighlight = line.substring(segStartInLine, segEndInLine);
          
          if (textToHighlight.trim().length === 0) continue;
          
          // Calculate the X position precisely with offset adjustment
          const textBefore = line.substring(0, segStartInLine);
          let xStart = margin + pdf.getStringUnitWidth(textBefore) * fontSize / pdf.internal.scaleFactor;
          // Apply a small adjustment to fix offset issues (slightly shift left)
          xStart -= 0.3; 
          
          // Calculate width precisely with slight extension
          const unadjustedWidth = pdf.getStringUnitWidth(textToHighlight) * fontSize / pdf.internal.scaleFactor;
          // Apply a small extension to ensure text is fully covered
          const width = unadjustedWidth + 0.6;
          
          // Add to highlights for this line
          lineHighlights.push({
            text: textToHighlight,
            startX: xStart,
            width: width,
            colorIdx: boundary.index % HIGHLIGHT_COLORS.length
          });
        }
        
        // Draw all highlights for this line
        for (const highlight of lineHighlights) {
          const color = HIGHLIGHT_COLORS[highlight.colorIdx];
          pdf.setFillColor(color.r, color.g, color.b);
          
          // Triple layer for opacity
          for (let l = 0; l < 3; l++) {
            pdf.rect(highlight.startX, yPos - fontSize * 0.7, highlight.width, fontSize + highlightPadding, 'F');
          }
        }
        
        // Add the text after all highlights are drawn
        pdf.setTextColor(0, 0, 0);
        pdf.text(line, margin, yPos);
        
        // Move to next line
        yPos += fontSize * 0.9; // Tight line spacing
      }
      
      // Update position tracker and add space between paragraphs
      currentPosition += paragraph.length + 2; // +2 for paragraph break
      yPos += lineHeight;
    }

    // Add comments section
    if (highlightedSegments.length > 0) {
      addNewPage();
      yPos = margin;
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Detailed Feedback", margin, yPos);
      yPos += lineHeight * 1.5;
      
      // Process each highlighted segment
      for (let i = 0; i < highlightedSegments.length; i++) {
        const segment = highlightedSegments[i];
        if (segment.comment) {
          // Add colored block for reference
          const colorIdx = i % HIGHLIGHT_COLORS.length;
          const color = HIGHLIGHT_COLORS[colorIdx];
          pdf.setFillColor(color.r, color.g, color.b);
          
          // Triple layer for opacity
          for (let l = 0; l < 3; l++) {
            pdf.rect(margin, yPos - fontSize * 0.5, 5, fontSize * 0.8, 'F');
          }
          
          // Add text after the colored block
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(fontSize);
          
          // Add segment text preview
          const previewText = segment.text.length > 40 
            ? segment.text.substring(0, 40) + '...' 
            : segment.text;
          
          pdf.setFont("helvetica", "italic");
          const previewLines = pdf.splitTextToSize(previewText, pageWidth - 15);
          pdf.text(previewLines, margin + 8, yPos);
          yPos += previewLines.length * lineHeight;
          
          // Add the comment below the preview
          pdf.setFont("helvetica", "normal");
          const commentLines = pdf.splitTextToSize(segment.comment, pageWidth - 10);
          pdf.text(commentLines, margin + 8, yPos);
          yPos += commentLines.length * lineHeight + 5;
          
          // Check for page break
          if (yPos > pageHeight - lineHeight * 2) {
            addNewPage();
          }
        }
      }
    }

    // Add overall feedback at the end
    if (feedback) {
      checkPageBreak(20);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Overall Feedback", margin, yPos);
      yPos += lineHeight * 1.5;
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      
      // Remove HTML tags if present
      const cleanFeedback = feedback.replace(/<\/?p>/g, '').replace(/<\/?[^>]+(>|$)/g, '');
      const feedbackLines = pdf.splitTextToSize(cleanFeedback, pageWidth);
      
      pdf.text(feedbackLines, margin, yPos);
      yPos += feedbackLines.length * lineHeight + 10;
    }

    // Save the PDF
    pdf.save('essay-analysis.pdf');

  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
