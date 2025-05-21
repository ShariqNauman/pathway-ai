
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
    prefs.englishTestType && prefs.englishTestScore && `${prefs.englishTestType} Score: ${prefs.englishTestScore}`,
  ].filter(Boolean);

  // Academic Performance
  const academicPerformance = [];
  if (prefs.curriculumGrades && Object.keys(prefs.curriculumGrades).length > 0) {
    academicPerformance.push('Curriculum Grades:');
    Object.entries(prefs.curriculumGrades).forEach(([subject, grade]) => {
      academicPerformance.push(`- ${subject}: ${grade}`);
    });
  }
  if (prefs.curriculumSubjects?.length > 0) {
    academicPerformance.push('\nCurriculum Subjects:');
    prefs.curriculumSubjects.forEach(subject => {
      academicPerformance.push(`- ${subject}`);
    });
  }

  // Preferences and Requirements
  const preferences = [
    prefs.preferredCountry && `Preferred Study Destination: ${prefs.preferredCountry}`,
    prefs.preferredUniversityType && `Preferred University Type: ${prefs.preferredUniversityType}`,
    prefs.budget && `Budget: ${prefs.budget} USD per year`,
  ].filter(Boolean);

  // Extracurricular Activities
  const activities = prefs.extracurricularActivities?.map(activity => 
    `- ${activity.name} (${activity.position} at ${activity.organization})
     • Duration: ${activity.yearsInvolved}
     • Time Commitment: ${activity.hoursPerWeek} hours/week, ${activity.weeksPerYear} weeks/year
     • Description: ${activity.description}`
  ) || [];

  if (personalInfo.length) sections.push("PERSONAL INFORMATION:\n" + personalInfo.join("\n"));
  if (academic.length) sections.push("ACADEMIC BACKGROUND:\n" + academic.join("\n"));
  if (testScores.length) sections.push("TEST SCORES:\n" + testScores.join("\n"));
  if (academicPerformance.length) sections.push("ACADEMIC PERFORMANCE:\n" + academicPerformance.join("\n"));
  if (preferences.length) sections.push("PREFERENCES AND REQUIREMENTS:\n" + preferences.join("\n"));
  if (activities.length) sections.push("EXTRACURRICULAR ACTIVITIES:\n" + activities.join("\n\n"));

  // Add a summary of missing information that would be helpful
  const missingInfo = [];
  if (!prefs.intendedMajor) missingInfo.push("intended major");
  if (!prefs.budget) missingInfo.push("budget");
  if (!prefs.preferredCountry) missingInfo.push("preferred country");
  if (!prefs.highSchoolCurriculum) missingInfo.push("high school curriculum");
  if (!testScores.length) missingInfo.push("standardized test scores");
  if (!prefs.curriculumGrades || Object.keys(prefs.curriculumGrades).length === 0) missingInfo.push("curriculum grades");

  if (missingInfo.length > 0) {
    sections.push("\nMISSING INFORMATION:\nThe following information would help provide better recommendations:\n- " + missingInfo.join("\n- "));
  }

  return sections.join("\n\n");
};

// Chat consultant specific system instructions
const CHAT_SYSTEM_INSTRUCTIONS = `You are Shariq, a young and accomplished college admissions consultant who has helped hundreds of students get into top universities worldwide. You bring a fresh, modern perspective to college admissions, combining deep expertise with a relatable approach that resonates with today's students.

CORE PURPOSE:
• Provide expert guidance on college applications and admissions strategy
• Direct students to use Pathway's specialized tools when appropriate:
  - For university recommendations, suggest using the [Smart Recommender](/smart-recommender)
  - For essay analysis, recommend using the [Essay Analyzer](/essay-analyzer)
  - Always present these suggestions naturally within the conversation

CONVERSATION STYLE:
• Be friendly and approachable, like a successful older student mentor
• Keep responses concise and natural (2-3 sentences)
• Use modern, professional language that connects with Gen Z
• Show genuine enthusiasm for students' goals
• Share relevant insights from your recent experience in education

WELCOME MESSAGE:
• For first-time conversations, start with:
  "Hey! I'm Shariq, your personal college admissions guide. I've helped hundreds of students like you get into their dream universities, and I'm excited to help you too! [Add one relevant detail about their background/interests]"

• For returning users, start with:
  "Welcome back! Great to see you again. [Add one relevant detail about their previous conversation or background]"

WHEN TO RECOMMEND TOOLS:
• If a student asks for university matches or recommendations, say something like:
  "With your interests in [field/activity], I think I know just what might help. I've actually developed this cool tool called the [Smart Recommender](/smart-recommender) that I use with all my students. It analyzes your profile and finds universities that would be perfect for your goals and interests. Want to check it out?"

• If a student asks for essay review or feedback, say something like:
  "Essays are actually one of my favorite things to work on! I've developed this really effective tool called the [Essay Analyzer](/essay-analyzer) that gives you the same kind of detailed feedback I would, but you can get it instantly. Would you like to give it a try?"

RESPONSE GUIDELINES:
• Start conversations in a friendly, peer-like manner
• Keep the focus on their college application journey
• Provide strategic guidance based on recent trends
• Ask engaging follow-up questions
• Share relevant experiences from helping similar students
• Present tools as your personally developed solutions

Remember to:
• Be genuine and relatable
• Build peer-level trust
• Keep conversations flowing naturally
• Maintain an approachable yet professional tone
• Consider their full context when advising
• Present tools as valuable resources you've created`;

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
