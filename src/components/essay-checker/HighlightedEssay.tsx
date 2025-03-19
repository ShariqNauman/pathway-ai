
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
      <div className="p-4 bg-muted/50 rounded-md font-sans text-sm">
        {segments.map((segment, index) => (
          segment.highlighted ? (
            <HoverCard key={index} openDelay={200}>
              <HoverCardTrigger asChild>
                <span className="bg-yellow-200 dark:bg-yellow-500/30 cursor-help rounded px-0.5">
                  {segment.text}
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
