
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserCredentials, UserPreferences } from "@/types/user";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UserContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  login: (credentials: UserCredentials) => Promise<boolean>;
  signup: (credentials: UserCredentials & { name: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserPreferences: (preferences: UserPreferences) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutInProgress, setIsLogoutInProgress] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session ? "User logged in" : "No session");
      
      if (session) {
        setCurrentSession(session);
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setCurrentSession(null);
        setIsLoading(false);
      }
    });

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session fetch error:", error);
          setIsLoading(false);
          return;
        }
        
        if (data.session) {
          setCurrentSession(data.session);
          fetchUserProfile(data.session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setIsLoading(false);
      }
    };
    
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }
      
      if (profileData) {
        // Define a type to properly type-check the profileData
        type ProfileData = {
          id: string;
          name?: string;
          email?: string;
          intended_major?: string;
          budget?: number;
          preferred_country?: string;
          preferred_university_type?: string;
          study_level?: string;
          sat_score?: number;
          act_score?: number;
          english_test_type?: string;
          english_test_score?: number;
          high_school_curriculum?: string;
          curriculum_grades?: Record<string, any>;
          curriculum_subjects?: string[];
          created_at: string;
        };
        
        // Cast the profileData to our defined type
        const typedProfileData = profileData as unknown as ProfileData;
        
        setCurrentUser({
          id: userId,
          email: currentSession?.user.email || '',
          name: typedProfileData.name || '',
          preferences: {
            intendedMajor: typedProfileData.intended_major || '',
            budget: typedProfileData.budget || 0,
            preferredCountry: typedProfileData.preferred_country || '',
            preferredUniversityType: typedProfileData.preferred_university_type || '',
            studyLevel: typedProfileData.study_level || '',
            satScore: typedProfileData.sat_score || undefined,
            actScore: typedProfileData.act_score || undefined,
            englishTestType: typedProfileData.english_test_type || undefined,
            englishTestScore: typedProfileData.english_test_score || undefined,
            highSchoolCurriculum: typedProfileData.high_school_curriculum || undefined,
            curriculumGrades: typedProfileData.curriculum_grades ? 
              Object.entries(typedProfileData.curriculum_grades).reduce((acc, [key, value]) => {
                acc[key] = String(value);
                return acc;
              }, {} as Record<string, string>) : 
              {},
            curriculumSubjects: typedProfileData.curriculum_subjects || []
          },
          createdAt: new Date(typedProfileData.created_at)
        });
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: UserCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error) {
        console.error('Login error:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: UserCredentials & { name: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name
          }
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isLogoutInProgress) return;
    
    setIsLogoutInProgress(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        toast("Failed to log out. Please try again.");
      } else {
        setCurrentUser(null);
        setCurrentSession(null);
        toast("Successfully logged out");
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast("Failed to log out. Please try again.");
    } finally {
      setIsLoading(false);
      setIsLogoutInProgress(false);
    }
  };

  const updateUserPreferences = async (preferences: UserPreferences) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          intended_major: preferences.intendedMajor,
          budget: preferences.budget,
          preferred_country: preferences.preferredCountry,
          preferred_university_type: preferences.preferredUniversityType,
          study_level: preferences.studyLevel,
          sat_score: preferences.satScore,
          act_score: preferences.actScore,
          english_test_type: preferences.englishTestType,
          english_test_score: preferences.englishTestScore,
          high_school_curriculum: preferences.highSchoolCurriculum,
          curriculum_grades: preferences.curriculumGrades,
          curriculum_subjects: preferences.curriculumSubjects,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      setCurrentUser({
        ...currentUser,
        preferences
      });
    } catch (error) {
      console.error('Failed to update user preferences:', error);
    }
  };

  const value = {
    currentUser,
    isLoading,
    login,
    signup,
    logout,
    updateUserPreferences
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
