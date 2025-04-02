interface GeminiResponse {
  text: string;
  error?: string;
}

interface StreamingOptions {
  onTextUpdate: (text: string) => void;
}

// Use the provided API key
const GEMINI_API_KEY = "AIzaSyAaEYKy6P3WkHBArYGoxc1s0QW2fm3rTOI";

// Format user preferences into a readable string
const formatUserPreferences = (userProfile: any) => {
  if (!userProfile) return '';
  
  const prefs = userProfile.preferences;
  const sections = [];

  // Academic Information
  const academic = [
    prefs.intendedMajor && `Field of Study: ${prefs.intendedMajor}`,
    prefs.selectedDomains?.length > 0 && `Specializations: ${prefs.selectedDomains.join(", ")}`,
    prefs.studyLevel && `Study Level: ${prefs.studyLevel}`,
    prefs.highSchoolCurriculum && `High School Curriculum: ${prefs.highSchoolCurriculum}`,
  ].filter(Boolean);

  // Curriculum Details
  const curriculumDetails = [];
  if (prefs.curriculumSubjects?.length > 0) {
    curriculumDetails.push(`Selected Subjects: ${prefs.curriculumSubjects.join(", ")}`);
  }
  if (Object.keys(prefs.curriculumGrades || {}).length > 0) {
    const grades = Object.entries(prefs.curriculumGrades)
      .map(([subject, grade]) => `${subject}: ${grade}`)
      .join("\n");
    curriculumDetails.push(`Grades:\n${grades}`);
  }

  // Test Scores
  const testScores = [
    prefs.satScore && `SAT Score: ${prefs.satScore}`,
    prefs.actScore && `ACT Score: ${prefs.actScore}`,
    prefs.englishTestType && `English Test: ${prefs.englishTestType} (Score: ${prefs.englishTestScore})`,
  ].filter(Boolean);

  // Location and Financial
  const locationFinancial = [
    prefs.preferredCountry && `Preferred Country: ${prefs.preferredCountry}`,
    prefs.preferredUniversityType && `Preferred Institution Type: ${prefs.preferredUniversityType}`,
    prefs.budget && `Yearly Budget: $${prefs.budget.toLocaleString()} USD`,
  ].filter(Boolean);

  // Extracurricular Activities
  const activities = prefs.extracurricularActivities?.map(activity => 
    `${activity.name} (${activity.position} at ${activity.organization}, ${activity.yearsInvolved})`
  ) || [];

  if (academic.length) sections.push("Academic Information:\n" + academic.join("\n"));
  if (curriculumDetails.length) sections.push("Curriculum Details:\n" + curriculumDetails.join("\n\n"));
  if (testScores.length) sections.push("Test Scores:\n" + testScores.join("\n"));
  if (locationFinancial.length) sections.push("Location & Financial Information:\n" + locationFinancial.join("\n"));
  if (activities.length) sections.push("Extracurricular Activities:\n" + activities.map(a => `- ${a}`).join("\n"));

  return sections.join("\n\n");
};

// Default system instructions for the AI consultant
const DEFAULT_SYSTEM_INSTRUCTIONS = `You are a friendly university consultant having a casual conversation. Follow these guidelines:

1. Start with 1-2 key qualifying questions about their priorities (e.g., location preference, program focus, campus environment)
2. Talk like a real person - use casual, friendly language
3. Keep each response focused and concise
4. Only ask what's essential and not already in their profile
5. Explain briefly why you're asking each question
6. Ask one question at a time and wait for their response
7. Once you have enough context (usually 2-3 exchanges), provide targeted university recommendations
8. When recommending, briefly explain why each university matches their specific needs
9. Keep the conversation flowing naturally - don't make it feel like a questionnaire

Remember: Your goal is to understand their key priorities first, then provide targeted recommendations. Be friendly and efficient, but don't rush to recommendations without understanding their needs.`;

export async function getGeminiResponse(
  prompt: string,
  systemInstructions: string = DEFAULT_SYSTEM_INSTRUCTIONS,
  previousMessages: {content: string, role: "user" | "model"}[] = [],
  streamingOptions?: StreamingOptions,
  userProfile?: any
): Promise<GeminiResponse> {
  try {
    // Format user profile information if available
    const userProfileInfo = userProfile ? formatUserPreferences(userProfile) : '';
    const enhancedSystemInstructions = userProfileInfo ? 
      `${systemInstructions}\n\nUser Profile Information:\n${userProfileInfo}` : 
      systemInstructions;

    // Using gemini-2.0-flash model as it's supported for this API version
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Prepare the request body
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: enhancedSystemInstructions ? 
                `${enhancedSystemInstructions}\n\n${prompt}` : 
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
      // Start with system instructions
      requestBody.contents = [{
        role: "user",
        parts: [{ text: enhancedSystemInstructions }]
      }];
      
      // Add all previous messages in sequence
      requestBody.contents.push(...previousMessages.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })));
      
      // Add the current message at the end
      requestBody.contents.push({
        role: "user",
        parts: [{ text: prompt }]
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
