export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  createdAt: Date;
}

export interface ExtracurricularActivity {
  id: string;
  name: string;
  position: string;
  organization: string;
  description: string;
  yearsInvolved: string;
  hoursPerWeek: number;
  weeksPerYear: number;
}

export interface UserPreferences {
  intendedMajor: string;
  selectedDomains: string[]; // Array of selected domains within the major
  budget: string;  // Changed from number to string for consistent handling
  preferredCountry: string;
  preferredUniversityType: string;
  studyLevel?: string; // Made optional since it will always be "undergraduate"
  satScore?: string;  // Changed from number to string
  actScore?: string;  // Changed from number to string
  englishTestType?: string;
  englishTestScore?: string;  // Changed from number to string
  highSchoolCurriculum?: string;
  curriculumGrades: Record<string, string>; // Changed to Record<string, string> for consistency
  curriculumSubjects?: string[]; // List of selected subjects
  extracurricularActivities?: ExtracurricularActivity[]; // Added extracurricular activities
  dateOfBirth?: string; // Added personal info fields
  nationality?: string;    // Added nationality 
  countryOfResidence?: string; // Added country of residence
  countryCode?: string;      // Added country code prefix
  phoneNumber?: string;      // Actual phone number
}
