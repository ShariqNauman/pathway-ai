
import React from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export interface EssaySegment {
  text: string;
  highlighted: boolean;
  comment: string | null;
}

interface HighlightedEssayProps {
  segments: EssaySegment[];
}

const HighlightedEssay = ({ segments }: HighlightedEssayProps) => {
  if (!segments.length) return null;

  return (
    <div className="mb-6">
      <h4 className="font-medium mb-2 text-sm">Your Essay with Feedback:</h4>
      <div className="p-4 bg-muted/50 rounded-md font-sans text-sm whitespace-pre-wrap">
        {segments.map((segment, index) => (
          segment.highlighted ? (
            <HoverCard key={index} openDelay={200}>
              <HoverCardTrigger asChild>
                <span 
                  className="bg-red-200 dark:bg-red-500/30 text-red-700 dark:text-red-300 cursor-help rounded px-0.5 relative group"
                  data-segment-id={index}
                >
                  {segment.text}
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center opacity-80">
                    {index + 1}
                  </span>
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="flex justify-between space-x-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Feedback</h4>
                    <p className="text-sm">{segment.comment}</p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <span key={index}>{segment.text}</span>
          )
        ))}
      </div>
    </div>
  );
};

export default HighlightedEssay;
