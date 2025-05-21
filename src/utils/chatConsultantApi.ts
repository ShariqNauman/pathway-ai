
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/user";

export interface ChatResponse {
  text: string;
  error?: string;
  universities?: Array<{
    name: string;
    country: string;
    description?: string;
    programs?: string[];
    ranking?: number;
    website?: string;
  }>;
}

export const getChatResponse = async (
  message: string,
  previousMessages: { content: string; role: "user" | "model" }[],
  callbacks?: { onTextUpdate?: (text: string) => void },
  currentUser?: UserProfile | null,
  primaryImage?: string | null,
  additionalImages?: string[],
  abortSignal?: AbortSignal
): Promise<ChatResponse> => {
  try {
    // Prepare request body with user message and context
    const requestBody: any = {
      message,
      previousMessages,
      userPreferences: currentUser?.preferences || {}
    };
    
    // Add images if provided
    if (primaryImage) {
      requestBody.image = primaryImage;
      
      if (additionalImages && additionalImages.length > 0) {
        requestBody.additionalImages = additionalImages;
      }
    }

    // Make API request to get AI response
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    // Handle streaming responses
    if (callbacks?.onTextUpdate) {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let accumulatedText = "";
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk and update text
        const chunk = new TextDecoder().decode(value);
        try {
          const data = JSON.parse(chunk);
          accumulatedText = data.text || accumulatedText;
          callbacks.onTextUpdate(accumulatedText);
          
          if (data.error) {
            return {
              text: accumulatedText,
              error: data.error,
              universities: data.universities || []
            };
          }
        } catch (e) {
          // If it's not valid JSON, just treat as text
          accumulatedText += chunk;
          callbacks.onTextUpdate(accumulatedText);
        }
      }
      
      return {
        text: accumulatedText,
        universities: [] // Default empty array for streaming responses
      };
    } else {
      // For non-streaming responses
      const data = await response.json();
      return {
        text: data.response || "",
        universities: data.universities || [],
        error: data.error
      };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        text: "Response was aborted",
        error: "Request was cancelled"
      };
    }
    
    console.error("Error in getChatResponse:", error);
    return {
      text: "",
      error: error.message || "Failed to get response"
    };
  }
};

export const sendMessageToConsultant = async (message: string, conversationId?: string) => {
  try {
    // Create new conversation if none exists
    if (!conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .insert([{ 
          user_id: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();
      
      if (convError) {
        throw new Error(`Error creating conversation: ${convError.message}`);
      }
      
      conversationId = conversation.id;
    }

    // Insert user message
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert([{
        conversation_id: conversationId,
        content: message,
        sender: 'user'
      }]);
    
    if (messageError) {
      throw new Error(`Error sending message: ${messageError.message}`);
    }

    // For simplicity, we'll hard-code the AI response time between 1-3 seconds
    const responseTime = Math.floor(Math.random() * 2000) + 1000;
    
    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, responseTime));
    
    // Make API request to get AI response
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        conversationId
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Insert AI response
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert([{
        conversation_id: conversationId,
        content: data.response,
        sender: 'ai'
      }]);
    
    if (aiMessageError) {
      throw new Error(`Error saving AI response: ${aiMessageError.message}`);
    }

    // Update the message limits usage count
    try {
      // First get current count
      const { data: countData } = await supabase
        .from('message_limits')
        .select('message_count, last_reset')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const now = new Date();
      let messageCount = 1;
      let shouldReset = false;
      
      if (countData) {
        const lastReset = new Date(countData.last_reset);
        const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
        shouldReset = daysSinceReset >= 1;
        
        if (shouldReset) {
          messageCount = 1;
        } else {
          messageCount = (countData.message_count || 0) + 1;
        }
      }
      
      await supabase
        .from('message_limits')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          message_count: messageCount,
          last_reset: shouldReset ? now.toISOString() : undefined
        });
        
    } catch (error) {
      console.error('Error updating message count:', error);
      // Don't fail the operation if tracking fails
    }

    // Return AI response and conversation ID
    return {
      response: data.response,
      conversationId,
      universities: data.universities || []
    };
  } catch (error) {
    console.error("Error in sendMessageToConsultant:", error);
    throw error;
  }
};

export const loadConversationHistory = async (conversationId: string) => {
  try {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return messages || [];
  } catch (error) {
    console.error("Error loading conversation history:", error);
    throw error;
  }
};

export const getUserConversations = async () => {
  try {
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return conversations || [];
  } catch (error) {
    console.error("Error getting user conversations:", error);
    throw error;
  }
};

export const createNewConversation = async () => {
  try {
    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .insert([{ 
        user_id: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return conversation;
  } catch (error) {
    console.error("Error creating new conversation:", error);
    throw error;
  }
};
