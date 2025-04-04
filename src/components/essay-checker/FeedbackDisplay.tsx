
import React from "react";
import { FileText, Loader2, Download, AlertCircle } from "lucide-react";
import { EssaySegment } from "./HighlightedEssay";
import HighlightedEssay from "./HighlightedEssay";
import EssayRating, { RatingCategory } from "./EssayRating";
import { Button } from "@/components/ui/button";
import { generatePDF } from "@/utils/pdfGenerator";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (isAnalyzing) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Analyzing your essay...</p>
      </div>
    );
  }

  if (!highlightedEssay?.length && !feedback) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 mb-4 opacity-20" />
        <p>Submit your essay to receive AI feedback</p>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    try {
      setError(null);
      setIsGeneratingPDF(true);
      
      // Validate input data before generating PDF
      if (!Array.isArray(highlightedEssay) || highlightedEssay.length === 0) {
        throw new Error("Essay content is empty or invalid");
      }
      
      console.log("Starting PDF generation with data:", {
        essaySegmentsCount: highlightedEssay?.length || 0,
        hasFeedback: !!feedback,
        hasRatings: !!ratings,
        firstSegment: highlightedEssay[0]
      });
      
      await generatePDF(highlightedEssay, feedback, ratings, essayType, prompt);
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(`Failed to generate PDF: ${errorMessage}`);
      toast.error(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Analysis Results</h3>
        {highlightedEssay?.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {highlightedEssay?.length > 0 && <HighlightedEssay segments={highlightedEssay} />}
      
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
