
import React from "react";
import { FileText, Loader2, Download } from "lucide-react";
import { EssaySegment } from "./HighlightedEssay";
import HighlightedEssay from "./HighlightedEssay";
import EssayRating, { RatingCategory } from "./EssayRating";
import { Button } from "@/components/ui/button";
import { generatePDF } from "@/utils/pdfGenerator";

interface FeedbackDisplayProps {
  highlightedEssay: EssaySegment[];
  feedback: string;
  isAnalyzing: boolean;
  ratings?: {
    overall: number;
    categories: RatingCategory[];
  };
  essayType?: string;
  prompt?: string;
}

const FeedbackDisplay = ({ 
  highlightedEssay, 
  feedback, 
  isAnalyzing, 
  ratings,
  essayType,
  prompt
}: FeedbackDisplayProps) => {
  if (isAnalyzing) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Analyzing your essay...</p>
      </div>
    );
  }

  if (!highlightedEssay.length && !feedback) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 mb-4 opacity-20" />
        <p>Submit your essay to receive AI feedback</p>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    generatePDF(highlightedEssay, feedback, ratings, essayType, prompt);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Analysis Results</h3>
        {highlightedEssay.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        )}
      </div>

      {highlightedEssay.length > 0 && <HighlightedEssay segments={highlightedEssay} />}
      
      {feedback && (
        <div className="mt-6 border-t pt-6">
          <h4 className="font-medium mb-2 text-sm">Overall Feedback:</h4>
          <div 
            className="prose dark:prose-invert prose-sm max-w-none" 
            dangerouslySetInnerHTML={{ __html: feedback }} 
          />
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;
