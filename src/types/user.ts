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
  budget: number;
  preferredCountry: string;
  preferredUniversityType: string;
  studyLevel: string;
  satScore?: number;
  actScore?: number;
  englishTestType?: string;
  englishTestScore?: number;
  highSchoolCurriculum?: string;
  curriculumGrades: Record<string, string>; // Changed to Record<string, string> for consistency
  curriculumSubjects?: string[]; // List of selected subjects
  extracurricularActivities?: ExtracurricularActivity[]; // Added extracurricular activities
  dateOfBirth?: string; // Added personal info fields
  address?: string;    // Added personal info fields
  phone?: string;      // Added personal info fields
}
