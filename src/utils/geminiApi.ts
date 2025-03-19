
interface GeminiResponse {
  text: string;
  error?: string;
}

// Use the provided API key
const GEMINI_API_KEY = "AIzaSyAaEYKy6P3WkHBArYGoxc1s0QW2fm3rTOI";

export async function getGeminiResponse(
  prompt: string
): Promise<GeminiResponse> {
  try {
    // Using gemini-2.0-flash model as specified
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
                text: prompt,
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
