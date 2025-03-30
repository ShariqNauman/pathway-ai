interface GeminiResponse {
  text: string;
  error?: string;
}

interface StreamingOptions {
  onTextUpdate: (text: string) => void;
}

// Use the provided API key
const GEMINI_API_KEY = "AIzaSyAaEYKy6P3WkHBArYGoxc1s0QW2fm3rTOI";

export async function getGeminiResponse(
  prompt: string,
  systemInstructions: string = "",
  previousMessages: {content: string, role: "user" | "model"}[] = [],
  streamingOptions?: StreamingOptions
): Promise<GeminiResponse> {
  try {
    // Using gemini-2.0-flash model as it's supported for this API version
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Add system instructions that guide the model to use preferences without restating them
    let enhancedSystemInstructions = systemInstructions;
    
    if (systemInstructions) {
      enhancedSystemInstructions = `${systemInstructions}
      
IMPORTANT INSTRUCTION: Use the information provided to personalize your responses but DO NOT explicitly list or repeat the user's preferences in your responses. Simply incorporate them naturally into your advice without mentioning them directly. Address the user's query directly and concisely. Remember the context of our ongoing conversation and respond accordingly.`;
    }
    
    // Prepare the request body with conversation history
    let requestBody: any = {
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    
    // If we have previous messages, construct a conversation
    if (previousMessages && previousMessages.length > 0) {
      // Add the system instructions to the first user message
      const contents = previousMessages.map((msg, index) => {
        if (index === 0 && msg.role === "user" && enhancedSystemInstructions) {
          return {
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: `${enhancedSystemInstructions}\n\n${msg.content}` }]
          };
        } else {
          return {
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
          };
        }
      });
      
      // Add the current prompt as the latest user message
      contents.push({
        role: "user",
        parts: [{ text: prompt }]
      });
      
      requestBody.contents = contents;
    } else {
      // If no previous messages, use the simple format
      const systemPrompt = enhancedSystemInstructions ? 
        `${enhancedSystemInstructions}\n\nUser message: ${prompt}` : 
        prompt;
      
      requestBody.contents = [
        {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
      ];
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error Response:", errorData);
      const errorMessage = errorData.error?.message || 
        errorData.error?.details?.[0]?.message ||
        `API Error (${response.status}): ${response.statusText}`;
      return { text: "", error: errorMessage };
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("Gemini API Response Error:", data.error);
      return { text: "", error: data.error.message || "An error occurred with the Gemini API" };
    }

    // Extract the response text from the Gemini API response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // If streaming is enabled, simulate streaming with chunks
    if (streamingOptions?.onTextUpdate) {
      const words = text.split(' ');
      let partialText = '';
      
      for (const word of words) {
        partialText += word + ' ';
        streamingOptions.onTextUpdate(partialText.trim());
        // Add a small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return { text };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return { 
      text: "", 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
}
