
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

export interface UserPreferences {
  intendedMajor: string;
  budget: number;
  preferredCountry: string;
  preferredUniversityType: string;
  studyLevel: string;
  satScore?: number;
  actScore?: number;
  englishTestType?: string;
  englishTestScore?: number;
  highSchoolCurriculum?: string;
  curriculumGrades?: Record<string, string | number>; // Store grades for subjects
  curriculumSubjects?: string[]; // List of selected subjects
}
