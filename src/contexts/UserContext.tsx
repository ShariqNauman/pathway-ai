import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { UserProfile, UserCredentials, UserPreferences, ExtracurricularActivity } from "@/types/user";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { analytics } from "@/utils/analytics";

interface UserContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  login: (credentials: UserCredentials) => Promise<boolean>;
  signup: (credentials: UserCredentials & { name: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserPreferences: (preferences: UserPreferences) => Promise<void>;
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
  const { handleError } = useErrorHandler();

  useEffect(() => {
    setIsLoading(true);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session ? "User logged in" : "No session");
      
      if (session) {
        setCurrentSession(session);
        analytics.identify(session.user.id, {
          email: session.user.email,
        });
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
          handleError(error, "Failed to check authentication status");
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
        handleError(err, "Error checking authentication status");
        setIsLoading(false);
      }
    };
    
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [handleError]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        handleError(error, "Failed to load user profile");
        return null;
      }

      // Helper functions for phone number parsing
      const parsePhoneCode = (phone: string | null): string => {
        if (!phone) return '';
        if (phone.includes(' ')) {
          return phone.split(' ')[0];
        }
        const match = phone.match(/^(\+\d{1,4})/);
        return match ? match[1] : '';
      };

      const parsePhoneNumber = (phone: string | null): string => {
        if (!phone) return '';
        if (phone.includes(' ')) {
          return phone.split(' ').slice(1).join(' ');
        }
        const match = phone.match(/^(\+\d{1,4})(.*)/);
        return match ? match[2] : phone;
      };

      if (profile) {
        
        const userPreferences: UserPreferences = {
          intendedMajor: profile.intended_major || '',
          selectedDomains: profile.selected_domains || [],
          budget: profile.budget !== null ? String(profile.budget) : '',
          preferredCountry: profile.preferred_country || '',
          preferredUniversityType: profile.preferred_university_type || '',
          studyLevel: profile.study_level || 'undergraduate',
          satScore: profile.sat_score !== null ? String(profile.sat_score) : '',
          actScore: profile.act_score !== null ? String(profile.act_score) : '',
          englishTestType: profile.english_test_type || '',
          englishTestScore: profile.english_test_score !== null ? String(profile.english_test_score) : '',
          highSchoolCurriculum: profile.high_school_curriculum || '',
          curriculumGrades: typeof profile.curriculum_grades === 'object' && profile.curriculum_grades !== null
            ? Object.entries(profile.curriculum_grades as Record<string, any>).reduce((acc, [key, value]) => {
                acc[key] = String(value);
                return acc;
              }, {} as Record<string, string>)
            : {},
          curriculumSubjects: profile.curriculum_subjects || [],
          extracurricularActivities: Array.isArray(profile.extracurricular_activities) 
            ? profile.extracurricular_activities.map((activity: any) => ({
                id: activity.id || '',
                name: activity.name || '',
                position: activity.position || '',
                organization: activity.organization || '',
                description: activity.description || '',
                yearsInvolved: activity.yearsInvolved || '',
                hoursPerWeek: typeof activity.hoursPerWeek === 'number' ? activity.hoursPerWeek : 0,
                weeksPerYear: typeof activity.weeksPerYear === 'number' ? activity.weeksPerYear : 0
              }))
            : [],
          dateOfBirth: profile.date_of_birth || '',
          nationality: profile.nationality || '',
          countryOfResidence: profile.countryofresidence || '',
          phoneNumber: parsePhoneNumber(profile.phone),
          countryCode: parsePhoneCode(profile.phone)
        };

        const userProfile: UserProfile = {
          id: userId,
          email: currentSession?.user.email || '',
          name: profile.name || '',
          preferences: userPreferences,
          createdAt: new Date(profile.created_at)
        };

        setCurrentUser(userProfile);
        setIsLoading(false);
        return userPreferences;
      }

      setIsLoading(false);
      return null;
    } catch (error) {
      handleError(error, "Error loading user profile");
      setIsLoading(false);
      return null;
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
        handleError(error, "Invalid email or password");
        return false;
      }
      
      analytics.track('user_login', { email: credentials.email });
      return true;
    } catch (error) {
      handleError(error, "Login failed");
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
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        handleError(error, "Failed to create account");
        return false;
      }

      // Send welcome email
      try {
        await supabase.functions.invoke('send-signup-email', {
          body: {
            name: userData.name,
            email: userData.email
          }
        });
        console.log('Welcome email sent successfully');
      } catch (emailError) {
        console.warn('Failed to send welcome email:', emailError);
        // Don't fail signup if email fails
      }
      
      analytics.track('user_signup', { 
        email: userData.email,
        name: userData.name 
      });
      return true;
    } catch (error) {
      handleError(error, "Signup failed");
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
        handleError(error, "Failed to log out");
      } else {
        setCurrentUser(null);
        setCurrentSession(null);
        analytics.track('user_logout');
        toast.success("Successfully logged out");
      }
    } catch (error) {
      handleError(error, "Logout failed");
    } finally {
      setIsLoading(false);
      setIsLogoutInProgress(false);
    }
  };

  const updateUserPreferences = async (preferences: UserPreferences) => {
    try {
      if (!currentUser) return;
      
      
      let formattedPhone = null;
      if (preferences.countryCode && preferences.phoneNumber) {
        formattedPhone = `${preferences.countryCode} ${preferences.phoneNumber.trim()}`;
      }
      
      let safeExtracurricularActivities = preferences.extracurricularActivities ? 
        preferences.extracurricularActivities.map(activity => ({
          id: activity.id || "",
          name: activity.name || "",
          position: activity.position || "",
          organization: activity.organization || "",
          description: activity.description || "",
          yearsInvolved: activity.yearsInvolved || "",
          hoursPerWeek: typeof activity.hoursPerWeek === 'number' ? activity.hoursPerWeek : 0,
          weeksPerYear: typeof activity.weeksPerYear === 'number' ? activity.weeksPerYear : 0
        })) : [];
      
      const profileUpdate = {
        intended_major: preferences.intendedMajor || null,
        selected_domains: preferences.selectedDomains || [],
        budget: preferences.budget ? Number(preferences.budget) : null,
        preferred_country: preferences.preferredCountry || null,
        preferred_university_type: preferences.preferredUniversityType || null,
        study_level: preferences.studyLevel || 'undergraduate',
        sat_score: preferences.satScore ? Number(preferences.satScore) : null,
        act_score: preferences.actScore ? Number(preferences.actScore) : null,
        english_test_type: preferences.englishTestType || null,
        english_test_score: preferences.englishTestScore ? Number(preferences.englishTestScore) : null,
        high_school_curriculum: preferences.highSchoolCurriculum || null,
        curriculum_grades: preferences.curriculumGrades || {},
        curriculum_subjects: preferences.curriculumSubjects || [],
        extracurricular_activities: safeExtracurricularActivities as unknown as Json[],
        date_of_birth: preferences.dateOfBirth || null,
        nationality: preferences.nationality || null,
        countryofresidence: preferences.countryOfResidence || null,
        phone: formattedPhone
      };

      const { error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', currentUser.id);
        
      if (error) {
        handleError(error, "Failed to update preferences");
        return;
      }
      
      setCurrentUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          preferences
        };
      });
      
      analytics.track('preferences_updated');
      toast.success("Preferences updated successfully");
    } catch (error) {
      handleError(error, "Failed to save preferences");
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
