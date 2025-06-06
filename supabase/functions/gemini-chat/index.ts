
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      previousMessages = [], 
      systemInstruction,
      primaryImage,
      additionalImages 
    } = await req.json();

    console.log("Received request:", {
      messageLength: message?.length,
      previousMessagesCount: previousMessages?.length,
      hasSystemInstruction: !!systemInstruction,
      hasPrimaryImage: !!primaryImage,
      additionalImagesCount: additionalImages?.length || 0
    });

    // Enhanced response system for Shariq that maintains conversation context
    const generateShariqResponse = (userMessage: string, previousMessages: any[]) => {
      const lowercaseMessage = userMessage.toLowerCase();
      const hasConversationHistory = previousMessages.length > 1;
      
      // Check if this is truly the first interaction (no AI responses yet)
      const aiResponseCount = previousMessages.filter(msg => msg.role === 'model').length;
      const isFirstInteraction = aiResponseCount === 0;
      
      // If this is the very first interaction, give welcome
      if (isFirstInteraction) {
        if (lowercaseMessage.includes('hi') || lowercaseMessage.includes('hello') || lowercaseMessage.includes('hey')) {
          return "Hey! I'm Shariq, your AI college consultant. What's on your mind today?";
        }
        return "Hey! I'm Shariq, your AI college consultant. I'm here to help you navigate your educational journey. What would you like to talk about?";
      }
      
      // For ongoing conversations, respond naturally without re-introducing
      if (lowercaseMessage.includes('hi') || lowercaseMessage.includes('hello') || lowercaseMessage.includes('hey')) {
        const greetings = [
          "Hey there! What can I help you with?",
          "Hi! What's on your mind?",
          "Hello! How can I assist you today?",
          "Hey! What would you like to know?"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
      }
      
      // Handle questions about college applications
      if (lowercaseMessage.includes('application') || lowercaseMessage.includes('apply')) {
        return "Great question about applications! I can help you with everything from choosing the right schools to crafting your personal statement. What specific part of the application process are you thinking about?";
      }
      
      // Handle questions about majors
      if (lowercaseMessage.includes('major') || lowercaseMessage.includes('study')) {
        return "Choosing a major is a big decision! I can help you explore different fields, understand career prospects, and find programs that match your interests. What areas are you curious about?";
      }
      
      // Handle questions about universities
      if (lowercaseMessage.includes('university') || lowercaseMessage.includes('college') || lowercaseMessage.includes('school') || lowercaseMessage.includes('unis')) {
        return "I'd love to help you find the right university! There are so many factors to consider - location, program strength, campus culture, costs. What's most important to you in a university?";
      }
      
      // Handle questions about requirements
      if (lowercaseMessage.includes('requirement') || lowercaseMessage.includes('gpa') || lowercaseMessage.includes('test')) {
        return "Academic requirements can vary quite a bit between schools and programs. I can help you understand what you'll need and how to strengthen your application. What specific requirements are you wondering about?";
      }
      
      // Handle financial questions
      if (lowercaseMessage.includes('cost') || lowercaseMessage.includes('scholarship') || lowercaseMessage.includes('financial')) {
        return "Financing your education is definitely a key consideration. There are lots of options - scholarships, grants, work-study programs. I can help you understand what's available and how to apply. What's your situation?";
      }
      
      // Handle questions about previous conversation
      if (lowercaseMessage.includes('before') || lowercaseMessage.includes('earlier') || lowercaseMessage.includes('previous')) {
        return "I can see our conversation history, but could you remind me what specific topic you'd like to continue discussing? I want to make sure I give you the most helpful response.";
      }
      
      // Handle vague or unclear messages
      if (lowercaseMessage.length < 10 || lowercaseMessage.includes('what') || lowercaseMessage.includes('help')) {
        return "I'm here to help! Could you tell me more about what you're looking for? Are you thinking about applications, choosing schools, majors, requirements, or something else?";
      }
      
      // Default helpful response for ongoing conversation
      return "That's interesting! Can you tell me more about what you're looking for? I'm here to help with any aspect of your educational journey - whether it's applications, school selection, requirements, or planning your academic path.";
    };

    const responseText = generateShariqResponse(message, previousMessages);

    const mockResponse = {
      text: responseText,
      error: null
    };

    console.log("Sending Shariq response:", mockResponse);

    return new Response(JSON.stringify(mockResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in gemini-chat function:", error);
    return new Response(
      JSON.stringify({ 
        text: "", 
        error: "I'm having trouble connecting right now. Please try again later." 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
