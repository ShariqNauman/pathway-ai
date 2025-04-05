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

// Highlight colors - pastels that work in both light and dark mode
const HIGHLIGHT_COLORS = [
  "bg-red-200 dark:bg-red-500/30 text-red-700 dark:text-red-300", // Red
  "bg-blue-200 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300", // Blue
  "bg-green-200 dark:bg-green-500/30 text-green-700 dark:text-green-300", // Green
  "bg-yellow-200 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300", // Yellow
  "bg-purple-200 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300", // Purple
  "bg-pink-200 dark:bg-pink-500/30 text-pink-700 dark:text-pink-300", // Pink
  "bg-orange-200 dark:bg-orange-500/30 text-orange-700 dark:text-orange-300", // Orange
  "bg-indigo-200 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300", // Indigo
  "bg-teal-200 dark:bg-teal-500/30 text-teal-700 dark:text-teal-300", // Teal
  "bg-cyan-200 dark:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300", // Cyan
];

// Corresponding badge colors for the numbering
const BADGE_COLORS = [
  "bg-red-500", // Red
  "bg-blue-500", // Blue
  "bg-green-500", // Green
  "bg-yellow-500", // Yellow
  "bg-purple-500", // Purple
  "bg-pink-500", // Pink
  "bg-orange-500", // Orange
  "bg-indigo-500", // Indigo
  "bg-teal-500", // Teal
  "bg-cyan-500", // Cyan
];

const HighlightedEssay = ({ segments }: HighlightedEssayProps) => {
  if (!segments.length) return null;

  // Get all highlighted segments in order of appearance
  const highlightedSegments = segments.filter(segment => segment.highlighted);
  
  // Map to track color index for each segment
  const segmentColorMap = new Map<EssaySegment, number>();
  
  // Assign colors to highlighted segments in sequence
  highlightedSegments.forEach((segment, index) => {
    segmentColorMap.set(segment, index % HIGHLIGHT_COLORS.length);
  });

  return (
    <div className="mb-6">
      <h4 className="font-medium mb-2 text-sm">Your Essay with Feedback:</h4>
      <div className="p-4 bg-muted/50 rounded-md font-sans text-sm whitespace-pre-wrap">
        {segments.map((segment, index) => (
          segment.highlighted ? (
            <HoverCard key={index} openDelay={200}>
              <HoverCardTrigger asChild>
                <span 
                  className={`${HIGHLIGHT_COLORS[segmentColorMap.get(segment) || 0]} cursor-help rounded px-0.5 relative group`}
                  data-segment-id={index}
                >
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
