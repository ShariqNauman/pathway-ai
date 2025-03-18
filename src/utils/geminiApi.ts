
interface GeminiResponse {
  text: string;
  error?: string;
}

// Fixed API key - replace "YOUR_FIXED_API_KEY" with the actual key provided by the user
const GEMINI_API_KEY = "YOUR_FIXED_API_KEY";

export async function getGeminiResponse(
  prompt: string
): Promise<GeminiResponse> {
  try {
    // Using gemini-2.0-flash model instead of gemini-1.0-pro
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
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
                text: `You are an AI university consultant named Pathway AI. Your role is to help students find the right universities, programs, and guide them through the application process. 
                
                Respond to the following question or statement from a student: "${prompt}"`,
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
