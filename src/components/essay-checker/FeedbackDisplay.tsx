import React from "react";
import { FileText, Loader2 } from "lucide-react";
import { EssaySegment } from "./HighlightedEssay";
import HighlightedEssay from "./HighlightedEssay";
import EssayRating, { RatingCategory } from "./EssayRating";
import { Lightbulb, Music, Waves, Heart, Target, ScanLine } from "lucide-react";

interface FeedbackDisplayProps {
  highlightedEssay: EssaySegment[];
  feedback: string;
  isAnalyzing: boolean;
  ratings?: {
    overall: number;
    categories: RatingCategory[];
  };
}

const defaultRatings = {
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

const FeedbackDisplay = ({ highlightedEssay, feedback, isAnalyzing, ratings = defaultRatings }: FeedbackDisplayProps) => {
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
    <div className="space-y-6">
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

      {highlightedEssay.length > 0 && feedback && (
        <div className="mt-8 border-t pt-6">
          <EssayRating ratings={ratings} />
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;
