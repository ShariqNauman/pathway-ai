
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
}
