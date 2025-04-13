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
    return 'WARNING: You are not signed in. To receive personalized university recommendations and guidance, please sign in and complete your profile.';
  }
  
  const prefs = userProfile.preferences;
  const missingFields = [];

  // Check for essential fields
  if (!prefs.intendedMajor) missingFields.push("intended major");
  if (!prefs.studyLevel) missingFields.push("study level");
  if (!prefs.highSchoolCurriculum) missingFields.push("high school curriculum");
  if (!prefs.preferredCountry) missingFields.push("preferred country");
  if (!prefs.budget) missingFields.push("budget");
  if (!prefs.curriculumSubjects || prefs.curriculumSubjects.length === 0) missingFields.push("curriculum subjects");
  if (!prefs.nationality) missingFields.push("nationality");
  if (!prefs.countryOfResidence) missingFields.push("country of residence");
  
  // Add warning message if fields are missing
  const warningMessage = missingFields.length > 0 
    ? `WARNING: Your profile is incomplete. Please add the following information for better recommendations: ${missingFields.join(", ")}.\n\n`
    : '';

  const sections = [];

  // Personal Information (moved to top for prominence)
  const personalInfo = [
    prefs.nationality && `Nationality: ${prefs.nationality}`,
    prefs.countryOfResidence && `Country of Residence: ${prefs.countryOfResidence}`,
    prefs.dateOfBirth && `Date of Birth: ${prefs.dateOfBirth}`,
  ].filter(Boolean);

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

  if (personalInfo.length) sections.push("Personal Information:\n" + personalInfo.join("\n"));
  if (academic.length) sections.push("Academic Information:\n" + academic.join("\n"));
  if (curriculumDetails.length) sections.push("Curriculum Details:\n" + curriculumDetails.join("\n\n"));
  if (testScores.length) sections.push("Test Scores:\n" + testScores.join("\n"));
  if (locationFinancial.length) sections.push("Location & Financial Information:\n" + locationFinancial.join("\n"));
  if (activities.length) sections.push("Extracurricular Activities:\n" + activities.map(a => `- ${a}`).join("\n"));

  return warningMessage + sections.join("\n\n");
};

// Default system instructions for the AI consultant
const DEFAULT_SYSTEM_INSTRUCTIONS = `You are a friendly education consultant. Create natural conversations while being concise.

FIRST INTERACTION:
• Start with "How can I help you with your educational journey?"
• Listen to the user's needs without making assumptions
• Let them guide the conversation topic
• Show genuine interest in understanding their goals

HANDLING USER PROFILE:
• Always check the provided User Profile Information first
• Don't ask about information that's already in the profile
• Only ask for missing information that's relevant to the user's specific request

CONSULTATION STYLE:
• Keep responses under 4-5 sentences
• Use conversational tone but stay efficient
• Reference profile information naturally in responses
• Ask clarifying questions when needed

HANDLING IMAGES:
• When a user uploads an image, examine it carefully
• Describe what you see in the image when appropriate
• Answer questions related to the image content
• Provide relevant educational advice based on image content
• If you can't see the image clearly, politely ask for clarification

AREAS OF EXPERTISE & SUPPORT:
• Career exploration and planning
• Personal development and skill building
• Test preparation and academic improvement
• University selection and admissions (when requested)
• Study abroad opportunities
• Scholarship and funding options
• Alternative education paths
• Professional certifications
• Internship and work experience
• Industry insights and trends
• Research opportunities
• Visa processes

CONVERSATION GUIDELINES:
• Listen first, then advise
• Ask one question at a time
• Explain why you're asking each question
• Provide balanced perspectives
• Consider multiple educational pathways
• Respect user's preferences and constraints
• Offer practical, actionable advice

WHEN UNIVERSITY RECOMMENDATIONS ARE SPECIFICALLY REQUESTED:
Then gather the following information systematically:
1. Academic Information:
   • Intended major and specializations
   • Study level (undergraduate/graduate)
   • High school curriculum and grades
   • Standardized test scores (SAT/ACT)
   • English proficiency test scores
   • Academic achievements and honors

2. Personal Preferences:
   • Preferred countries for study
   • Preferred university type (public/private)
   • Budget constraints
   • Campus size preference
   • Location preference (urban/rural)
   • Climate preference
   • Cultural considerations

3. Career Goals:
   • Short-term career objectives
   • Long-term career aspirations
   • Industry preferences
   • Research interests (if applicable)
   • Internship/co-op preferences

4. Additional Factors:
   • Extracurricular activities
   • Leadership experience
   • Community involvement
   • Work experience
   • Special skills or talents
   • Visa requirements
   • Family considerations

Remember: 
• Let the user guide the conversation direction
• Only gather information relevant to their specific needs
• Don't assume university recommendations are the goal
• Be open to exploring various educational and career paths`;

export async function getGeminiResponse(
  prompt: string,
  systemInstructions: string = DEFAULT_SYSTEM_INSTRUCTIONS,
  previousMessages: {content: string, role: "user" | "model"}[] = [],
  streamingOptions?: StreamingOptions,
  userProfile?: any,
  imageData?: string | null,
  additionalImages?: string[],
  signal?: AbortSignal
): Promise<GeminiResponse> {
  try {
    const userProfileInfo = userProfile ? formatUserPreferences(userProfile) : '';
    const enhancedSystemInstructions = userProfileInfo ? 
      `${systemInstructions}\n\nUser Profile Information:\n${userProfileInfo}` : 
      systemInstructions;

    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${enhancedSystemInstructions}\n\n${prompt}`
            }
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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error Response:', errorData);
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated');
    }

    const content = data.candidates[0];
    if (!content || !content.content || !content.content.parts || content.content.parts.length === 0) {
      throw new Error('Invalid response format');
    }

    return {
      text: content.content.parts[0].text || '',
      error: undefined
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}