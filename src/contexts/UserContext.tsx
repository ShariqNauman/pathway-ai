
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserCredentials, UserPreferences } from "@/types/user";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutInProgress, setIsLogoutInProgress] = useState(false);

  // Check for user session on mount
  useEffect(() => {
    // Immediately set isLoading to true to prevent flashing of unauthorized UI
    setIsLoading(true);
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session ? "User logged in" : "No session");
      
      if (session) {
        try {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error("Error fetching profile:", error);
            setCurrentUser(null);
          } else if (profileData) {
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
        } catch (error) {
          console.error("Profile fetch error:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    // THEN check for existing session
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session fetch error:", error);
        setIsLoading(false);
        return;
      }
      
      if (data.session) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (profileError) {
            console.error("Error fetching initial profile:", profileError);
            setCurrentUser(null);
          } else if (profileData) {
            setCurrentUser({
              id: data.session.user.id,
              email: data.session.user.email || '',
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
        } catch (error) {
          console.error("Profile fetch error:", error);
          setCurrentUser(null);
        }
      }
      
      setIsLoading(false);
    };
    
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: UserCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
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
      const { error } = await supabase.auth.signUp({
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
    // Prevent multiple logout attempts
    if (isLogoutInProgress) return;
    
    setIsLogoutInProgress(true);
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        toast("Failed to log out. Please try again.");
      } else {
        // Force clear the user state
        setCurrentUser(null);
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
