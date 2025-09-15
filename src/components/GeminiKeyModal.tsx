import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface GeminiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

const GeminiKeyModal = ({ open, onClose, onSave }: GeminiKeyModalProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter your Gemini API key");
      return;
    }

    if (!apiKey.startsWith("AIza")) {
      toast.error("Please enter a valid Gemini API key (should start with 'AIza')");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(apiKey.trim());
      setApiKey("");
      onClose();
      toast.success("Gemini API key saved successfully");
    } catch (error) {
      toast.error("Failed to save API key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Gemini API Key Required
          </DialogTitle>
          <DialogDescription>
            To use this feature, you need to provide your own Gemini API key. This ensures your usage is not limited and gives you full control.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Gemini API Key</Label>
            <Input
              id="gemini-key"
              type="password"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">How to get your Gemini API key:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Visit Google AI Studio</li>
              <li>Sign in with your Google account</li>
              <li>Generate a new API key</li>
              <li>Copy and paste it here</li>
            </ol>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Get API Key
            </Button>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !apiKey.trim()} className="flex-1">
              {isLoading ? "Saving..." : "Save Key"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeminiKeyModal;