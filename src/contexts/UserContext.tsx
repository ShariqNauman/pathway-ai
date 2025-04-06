import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import { UserProfile, UserCredentials, UserPreferences, ExtracurricularActivity } from "@/types/user";
import { Session } from "@supabase/supabase-js";

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
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      // Helper functions for phone number parsing
      const parsePhoneCode = (phone: string | null): string => {
        if (!phone) return '';
        // If there's a space, the first part is the country code
        if (phone.includes(' ')) {
          return phone.split(' ')[0];
        }
        // Try to extract country code (usually starts with + and has 1-4 digits)
        const match = phone.match(/^(\+\d{1,4})/);
        return match ? match[1] : '';
      };

      const parsePhoneNumber = (phone: string | null): string => {
        if (!phone) return '';
        // If there's a space, the second part is the phone number
        if (phone.includes(' ')) {
          return phone.split(' ').slice(1).join(' ');
        }
        // Otherwise try to extract everything after the country code
        const match = phone.match(/^(\+\d{1,4})(.*)/);
        return match ? match[2] : phone;
      };

      if (profile) {
        // Convert profile data to UserPreferences format
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

        // Create user profile
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
      console.error('Error in fetchUserProfile:', error);
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
    try {
      if (!currentUser) return;
      
      // Format the phone number if both country code and phone number exist
      let formattedPhone = null;
      if (preferences.countryCode && preferences.phoneNumber) {
        // Store with a space between country code and number for consistent parsing
        formattedPhone = `${preferences.countryCode} ${preferences.phoneNumber.trim()}`;
      }
      
      // Process extracurricular activities safely
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
      
      // Map frontend field names to database column names
      // Convert string values to numbers for fields that require numbers in the database
      const profileUpdate = {
        intended_major: preferences.intendedMajor || null,
        selected_domains: preferences.selectedDomains || [],
        budget: preferences.budget ? parseFloat(preferences.budget) : null,
        preferred_country: preferences.preferredCountry || null,
        preferred_university_type: preferences.preferredUniversityType || null,
        study_level: preferences.studyLevel || 'undergraduate',
        sat_score: preferences.satScore ? parseFloat(preferences.satScore) : null,
        act_score: preferences.actScore ? parseFloat(preferences.actScore) : null,
        english_test_type: preferences.englishTestType || null,
        english_test_score: preferences.englishTestScore ? parseFloat(preferences.englishTestScore) : null,
        high_school_curriculum: preferences.highSchoolCurriculum || null,
        curriculum_grades: preferences.curriculumGrades || {},
        curriculum_subjects: preferences.curriculumSubjects || [],
        extracurricular_activities: safeExtracurricularActivities as unknown as Json[],
        date_of_birth: preferences.dateOfBirth || null,
        nationality: preferences.nationality || null,
        countryofresidence: preferences.countryOfResidence || null, // Map to correct DB column name
        phone: formattedPhone
      };
      
      console.log("Sending profile update to Supabase:", profileUpdate);

      // Update strategy:
      // 1. Try to update only the non-problematic fields first
      // 2. If that works, great!
      // 3. If not, check which column is missing and provide guidance

      // Try the update
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', currentUser.id);
        
      if (error) {
        console.error('Error updating preferences:', error);
        
        // Check for specific column errors
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes("column") && errorMsg.includes("schema cache")) {
          let missingColumns = [];
          
          if (errorMsg.includes("countryofresidence")) {
            missingColumns.push("countryofresidence");
          }
          
          if (errorMsg.includes("nationality")) {
            missingColumns.push("nationality");
          }
          
          if (missingColumns.length > 0) {
            // Create a more helpful error message
            const columnList = missingColumns.join(", ");
            const message = `Database schema issue: Missing columns (${columnList}). Please contact the database administrator to add these columns.`;
            console.error(message);
            toast.error(message);
            
            // Try to update without the problematic fields
            const safeUpdate = {...profileUpdate};
            missingColumns.forEach(col => {
              delete safeUpdate[col as keyof typeof safeUpdate];
            });
            
            console.log("Attempting update without missing columns:", safeUpdate);
            
            const { error: retryError } = await supabase
              .from('profiles')
              .update(safeUpdate)
              .eq('id', currentUser.id);
              
            if (retryError) {
              console.error("Failed even with safe update:", retryError);
              toast.error(`Failed to update preferences: ${retryError.message}`);
              return;
            } else {
              // Success with partial update
              console.log("Partial update successful (without missing columns)");
              toast.warning("Your preferences were partially updated. Some fields could not be saved due to database configuration.");
              
              // Update the current user with what we could save
              setCurrentUser(prev => {
                if (!prev) return null;
                // Create a new preferences object that excludes the fields we couldn't save
                const updatedPreferences = {...preferences};
                if (missingColumns.includes("nationality")) {
                  updatedPreferences.nationality = prev.preferences.nationality;
                }
                if (missingColumns.includes("countryofresidence")) {
                  updatedPreferences.countryOfResidence = prev.preferences.countryOfResidence;
                }
                return {
                  ...prev,
                  preferences: updatedPreferences
                };
              });
              
              return;
            }
          } else {
            toast.error(`Failed to update preferences: ${error.message}`);
          }
          return;
        } else {
          toast.error(`Failed to update preferences: ${error.message}`);
          return;
        }
      }
      
      // Success - full update worked
      setCurrentUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          preferences
        };
      });
      
      console.log("Preferences updated successfully");
      toast.success("Preferences updated successfully");
    } catch (error) {
      console.error("Exception during preference update:", error);
      toast.error("An unexpected error occurred while saving your preferences");
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
