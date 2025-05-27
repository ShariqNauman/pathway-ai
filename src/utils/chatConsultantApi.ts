
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/user";

interface Message {
  content: string;
  role: "user" | "model";
}

interface StreamingCallbacks {
  onTextUpdate?: (text: string) => void;
}

export interface GeminiResponse {
  text: string;
  error?: string;
}

export const getChatResponse = async (
  userMessage: string,
  previousMessages: Message[] = [],
  callbacks?: StreamingCallbacks,
  user?: UserProfile | null,
  primaryImage?: string | null,
  additionalImages?: string[],
  signal?: AbortSignal
): Promise<GeminiResponse> => {
  try {
    console.log("getChatResponse called with:", {
      userMessage: userMessage.substring(0, 100) + "...",
      previousMessagesCount: previousMessages.length,
      hasUser: !!user,
      hasPrimaryImage: !!primaryImage,
      additionalImagesCount: additionalImages?.length || 0
    });

    let systemInstruction = `You are a helpful AI college consultant. You speak naturally and casually, matching the user's energy and communication style. Don't be overly formal - just be genuine and supportive.

Key guidelines:
- Match the user's vibe - if they're casual, be casual. If they're formal, be more formal.
- Use natural language, contractions, and conversational tone
- Be encouraging and supportive without being fake
- Give practical, actionable advice
- Don't start every response with formal greetings
- Focus on being helpful rather than following a script
- When appropriate, use examples and analogies that relate to the user's interests`;

    if (user?.preferences) {
      const prefs = user.preferences;
      const userContext = [];
      
      if (prefs.intendedMajor) userContext.push(`studying ${prefs.intendedMajor}`);
      if (prefs.preferredCountry) userContext.push(`interested in ${prefs.preferredCountry}`);
      if (prefs.studyLevel) userContext.push(`pursuing ${prefs.studyLevel} level`);
      if (prefs.selectedDomains?.length > 0) userContext.push(`focused on ${prefs.selectedDomains.join(", ")}`);
      
      if (userContext.length > 0) {
        systemInstruction += `\n\nUser context: The user is ${userContext.join(", ")}. Use this info to personalize your responses, but don't constantly reference it.`;
      }
    }

    const requestBody: any = {
      message: userMessage,
      previousMessages: previousMessages,
      systemInstruction: systemInstruction
    };

    if (primaryImage) {
      requestBody.primaryImage = primaryImage;
    }

    if (additionalImages && additionalImages.length > 0) {
      requestBody.additionalImages = additionalImages;
    }

    console.log("Making request to gemini-chat function");
    
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: requestBody,
      signal
    });

    if (error) {
      console.error("Supabase function error:", error);
      return { text: "", error: "Failed to get response from AI. Please try again." };
    }

    console.log("Gemini function response received:", data);

    if (data.error) {
      console.error("Gemini API error:", data.error);
      return { text: "", error: data.error };
    }

    // Handle streaming response
    if (data.stream && callbacks?.onTextUpdate) {
      let fullText = "";
      
      // Simulate streaming by progressively updating text
      const words = data.text.split(' ');
      for (let i = 0; i < words.length; i++) {
        if (signal?.aborted) {
          break;
        }
        
        fullText += (i > 0 ? ' ' : '') + words[i];
        callbacks.onTextUpdate(fullText);
        
        // Add small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      return { text: fullText };
    }

    return { text: data.text || "I apologize, but I couldn't generate a response. Please try again." };
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log("Request was aborted");
      return { text: "", error: "Request cancelled" };
    }
    
    console.error("Error in getChatResponse:", error);
    return { 
      text: "", 
      error: "I'm having trouble connecting right now. Please check your internet connection and try again." 
    };
  }
};
