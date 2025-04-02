interface GeminiResponse {
  text: string;
  error?: string;
}

interface StreamingOptions {
  onTextUpdate: (text: string) => void;
}

// Use the provided API key
const GEMINI_API_KEY = "AIzaSyAaEYKy6P3WkHBArYGoxc1s0QW2fm3rTOI";

// Default system instructions for the AI consultant
const DEFAULT_SYSTEM_INSTRUCTIONS = `You are an efficient university consultant AI. Follow these guidelines:

1. Be concise and focused - ask only essential questions
2. Never repeat questions that have already been answered
3. Group related questions together instead of asking them one by one
4. Limit yourself to 3-5 key questions at a time
5. If you have enough information to make a recommendation, do so without asking more questions
6. Use the user's profile information when available instead of asking for it again
7. If a question is optional, mention that it's optional
8. When recommending universities, focus on the most relevant options first

Remember: Quality of information is more important than quantity of questions.`;

export async function getGeminiResponse(
  prompt: string,
  systemInstructions: string = DEFAULT_SYSTEM_INSTRUCTIONS,
  previousMessages: {content: string, role: "user" | "model"}[] = [],
  streamingOptions?: StreamingOptions
): Promise<GeminiResponse> {
  try {
    // Using gemini-2.0-flash model as it's supported for this API version
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Prepare the request body
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: systemInstructions ? 
                `${systemInstructions}\n\n${prompt}` : 
                prompt
            }
          ]
        }
      ],
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

    // Add previous messages if they exist
    if (previousMessages && previousMessages.length > 0) {
      requestBody.contents = previousMessages.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));
      
      // Add the current message at the end
      requestBody.contents.push({
        role: "user",
        parts: [{ 
          text: systemInstructions ? 
            `${systemInstructions}\n\n${prompt}` : 
            prompt 
        }]
      });
    }

    console.log('Gemini API Request:', JSON.stringify(requestBody, null, 2));
    
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
    console.log('Gemini API Response:', JSON.stringify(data, null, 2));
    
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
