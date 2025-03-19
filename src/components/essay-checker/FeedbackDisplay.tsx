
import React from "react";
import { FileText, Loader2 } from "lucide-react";
import { EssaySegment } from "./HighlightedEssay";
import HighlightedEssay from "./HighlightedEssay";

interface FeedbackDisplayProps {
  highlightedEssay: EssaySegment[];
  feedback: string;
  isAnalyzing: boolean;
}

const FeedbackDisplay = ({ highlightedEssay, feedback, isAnalyzing }: FeedbackDisplayProps) => {
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

  return (
    <div>
      {highlightedEssay.length > 0 && <HighlightedEssay segments={highlightedEssay} />}
      
      {feedback && (
        <div>
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
