
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

    // For now, return a simple response since we don't have Gemini API configured
    // This will prevent the 500 error and allow the chat to work
    const mockResponse = {
      text: "I'm your AI college consultant! I'm here to help you with your educational journey. However, the AI service is currently being set up. Please check back soon for full functionality.",
      error: null
    };

    console.log("Sending response:", mockResponse);

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
