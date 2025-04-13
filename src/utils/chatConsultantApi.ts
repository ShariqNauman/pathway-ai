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
  if (!userProfile) {
    return 'WARNING: You are not signed in. To receive personalized guidance, please sign in and complete your profile.';
  }
  
  const prefs = userProfile.preferences;
  const sections = [];

  // Personal Information
  const personalInfo = [
    prefs.nationality && `Nationality: ${prefs.nationality}`,
    prefs.countryOfResidence && `Country of Residence: ${prefs.countryOfResidence}`,
    prefs.dateOfBirth && `Date of Birth: ${prefs.dateOfBirth}`,
  ].filter(Boolean);

  // Academic Information
  const academic = [
    prefs.intendedMajor && `Field of Study: ${prefs.intendedMajor}`,
    prefs.selectedDomains?.length > 0 && `Areas of Interest: ${prefs.selectedDomains.join(", ")}`,
    prefs.studyLevel && `Study Level: ${prefs.studyLevel}`,
    prefs.highSchoolCurriculum && `High School Curriculum: ${prefs.highSchoolCurriculum}`,
  ].filter(Boolean);

  // Test Scores
  const testScores = [
    prefs.satScore && `SAT Score: ${prefs.satScore}`,
    prefs.actScore && `ACT Score: ${prefs.actScore}`,
    prefs.englishTestType && `English Test: ${prefs.englishTestType} (Score: ${prefs.englishTestScore})`,
  ].filter(Boolean);

  // Extracurricular Activities
  const activities = prefs.extracurricularActivities?.map(activity => 
    `${activity.name} (${activity.position} at ${activity.organization}, ${activity.yearsInvolved})`
  ) || [];

  if (personalInfo.length) sections.push("Personal Information:\n" + personalInfo.join("\n"));
  if (academic.length) sections.push("Academic Information:\n" + academic.join("\n"));
  if (testScores.length) sections.push("Test Scores:\n" + testScores.join("\n"));
  if (activities.length) sections.push("Extracurricular Activities:\n" + activities.map(a => `- ${a}`).join("\n"));

  return sections.join("\n\n");
};

// Chat consultant specific system instructions
const CHAT_SYSTEM_INSTRUCTIONS = `You are a friendly and knowledgeable educational consultant chatbot. Your role is to help students with their educational journey, career planning, and academic decisions.

CONVERSATION STYLE:
• Be friendly, empathetic, and professional
• Keep responses concise (2-4 sentences per point)
• Use natural, conversational language
• Show genuine interest in the student's goals
• Be encouraging and supportive

CONVERSATION FLOW:
• First message: Greet warmly and ask how you can help
• Follow-up messages: Reference previous context
• Ask clarifying questions when needed
• Provide actionable advice and next steps

KEY RESPONSIBILITIES:
• Academic guidance and course selection
• Career exploration and planning
• Study strategies and time management
• Test preparation advice
• College application support
• Extracurricular activity suggestions
• Skill development recommendations

WHEN HANDLING IMAGES:
• Analyze academic documents, transcripts, or schedules
• Provide feedback on essays or written work
• Help interpret test scores or academic reports
• Guide through application materials

IMPORTANT GUIDELINES:
• Maintain conversation context between messages
• Reference user's profile information when relevant
• Provide specific, actionable advice
• Break down complex topics into manageable steps
• Encourage questions and clarification
• Stay within your knowledge scope
• Suggest reliable resources when appropriate

Remember to:
• Be encouraging but realistic
• Focus on the student's specific needs
• Maintain a supportive and professional tone
• Guide rather than direct
• Empower students to make informed decisions`;

export async function getChatResponse(
  prompt: string,
  previousMessages: {content: string, role: "user" | "model"}[] = [],
  streamingOptions?: StreamingOptions,
  userProfile?: any,
  imageData?: string | null,
  additionalImages?: string[],
  signal?: AbortSignal
): Promise<GeminiResponse> {
  console.log("getChatResponse called with:", {
    promptLength: prompt.length,
    previousMessagesCount: previousMessages.length,
    hasStreamingOptions: !!streamingOptions,
    hasUserProfile: !!userProfile,
    hasImageData: !!imageData,
    additionalImagesCount: additionalImages?.length
  });

  try {
    const userProfileInfo = userProfile ? formatUserPreferences(userProfile) : '';
    
    // Format conversation history
    const conversationContext = previousMessages.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n\n');
    
    // Combine all context
    const fullContext = [
      CHAT_SYSTEM_INSTRUCTIONS,
      userProfileInfo && `\nUSER PROFILE:\n${userProfileInfo}`,
      conversationContext && `\nCONVERSATION HISTORY:\n${conversationContext}`,
      `\nCURRENT USER MESSAGE: ${prompt}`
    ].filter(Boolean).join('\n\n');

    console.log("Prepared request data:", {
      hasUserProfileInfo: !!userProfileInfo,
      hasConversationContext: !!conversationContext,
      contextLength: fullContext.length
    });

    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: fullContext
            },
            ...(imageData ? [{
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData.split(',')[1]
              }
            }] : []),
            ...(additionalImages || []).map(img => ({
              inline_data: {
                mime_type: "image/jpeg",
                data: img.split(',')[1]
              }
            }))
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
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

    console.log("Making API request to:", url);
    console.log("Request body structure:", {
      hasContents: !!requestBody.contents,
      partsCount: requestBody.contents[0].parts.length,
      textLength: requestBody.contents[0].parts[0].text.length
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    console.log("Received API response:", {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API response data structure:", {
      hasCandidates: !!data.candidates,
      candidatesCount: data.candidates?.length,
      firstCandidateHasContent: data.candidates?.[0]?.content != null
    });
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error("No candidates in response:", data);
      throw new Error('No response generated');
    }

    const content = data.candidates[0];
    if (!content || !content.content || !content.content.parts || content.content.parts.length === 0) {
      console.error("Invalid content structure:", content);
      throw new Error('Invalid response format');
    }

    const responseText = content.content.parts[0].text || '';
    console.log("Successfully generated response", {
      responseLength: responseText.length
    });

    return {
      text: responseText,
      error: undefined
    };
  } catch (error) {
    console.error('Chat API Error:', {
      error,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      text: '',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
} 