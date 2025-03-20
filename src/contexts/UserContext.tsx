
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserCredentials, UserPreferences } from "@/types/user";

interface UserContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  login: (credentials: UserCredentials) => Promise<boolean>;
  signup: (credentials: UserCredentials & { name: string }) => Promise<boolean>;
  logout: () => void;
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
  const [isLoading, setIsLoading] = useState(true);

  // Check for user session on mount
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileData) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profileData.name || '',
            preferences: {
              intendedMajor: profileData.intended_major || '',
              budget: profileData.budget || 0,
              preferredCountry: profileData.preferred_country || '',
              preferredUniversityType: profileData.preferred_university_type || '',
              studyLevel: profileData.study_level || ''
            },
            createdAt: new Date(profileData.created_at)
          });
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profileData }) => {
            if (profileData) {
              setCurrentUser({
                id: session.user.id,
                email: session.user.email || '',
                name: profileData.name || '',
                preferences: {
                  intendedMajor: profileData.intended_major || '',
                  budget: profileData.budget || 0,
                  preferredCountry: profileData.preferred_country || '',
                  preferredUniversityType: profileData.preferred_university_type || '',
                  studyLevel: profileData.study_level || ''
                },
                createdAt: new Date(profileData.created_at)
              });
            }
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: UserCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error) return false;
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
      const { error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name
          }
        }
      });
      
      if (error) return false;
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
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
          updated_at: new Date()
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
