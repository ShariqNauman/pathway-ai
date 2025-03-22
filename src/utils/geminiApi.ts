
interface GeminiResponse {
  text: string;
  error?: string;
}

// Use the provided API key
const GEMINI_API_KEY = "AIzaSyAaEYKy6P3WkHBArYGoxc1s0QW2fm3rTOI";

export async function getGeminiResponse(
  prompt: string,
  systemInstructions: string = ""
): Promise<GeminiResponse> {
  try {
    // Using gemini-2.0-flash model as specified
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Add system instructions that guide the model to use preferences without restating them
    let enhancedSystemInstructions = systemInstructions;
    
    if (systemInstructions) {
      enhancedSystemInstructions = `${systemInstructions}
      
IMPORTANT INSTRUCTION: Use the information provided to personalize your responses but DO NOT explicitly list or repeat the user's preferences in your responses. Simply incorporate them naturally into your advice without mentioning them directly. Address the user's query directly and concisely.`;
    }
    
    // Prepare the system prompt with instructions
    const systemPrompt = enhancedSystemInstructions ? 
      `${enhancedSystemInstructions}\n\nUser message: ${prompt}` : 
      prompt;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
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
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      return { text: "", error: data.error.message || "An error occurred with the Gemini API" };
    }

    // Extract the response text from the Gemini API response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { text };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return { 
      text: "", 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
}
