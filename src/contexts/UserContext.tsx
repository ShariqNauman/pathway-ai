
import React, { createContext, useContext, useState, useEffect } from "react";
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

// A key for storing users in sessionStorage
const USERS_STORAGE_KEY = "app_users";
const CURRENT_USER_KEY = "user";

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    // Initialize users in sessionStorage if not present
    if (!sessionStorage.getItem(USERS_STORAGE_KEY)) {
      // Get users from localStorage first if they exist
      const localUsers = localStorage.getItem("users");
      if (localUsers) {
        sessionStorage.setItem(USERS_STORAGE_KEY, localUsers);
      } else {
        sessionStorage.setItem(USERS_STORAGE_KEY, "[]");
      }
    }
    
    setIsLoading(false);
  }, []);

  // For demo purposes, we'll use sessionStorage to sync across tabs but persist across page reloads
  const login = async (credentials: UserCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get users from sessionStorage first
      let users = JSON.parse(sessionStorage.getItem(USERS_STORAGE_KEY) || "[]");
      
      // If no users in sessionStorage, try localStorage as fallback
      if (users.length === 0) {
        const localUsers = localStorage.getItem("users");
        if (localUsers) {
          users = JSON.parse(localUsers);
          // Save to sessionStorage for future use
          sessionStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
      }
      
      const user = users.find((u: any) => u.email === credentials.email);
      
      if (user && user.password === credentials.password) {
        // Don't store password in current user
        const { password, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: UserCredentials & { name: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get users from both storages to make sure we have all users
      const sessionUsers = JSON.parse(sessionStorage.getItem(USERS_STORAGE_KEY) || "[]");
      const localUsers = JSON.parse(localStorage.getItem("users") || "[]");
      
      // Combine users from both sources, ensuring no duplicates
      let combinedUsers = [...sessionUsers];
      for (const localUser of localUsers) {
        if (!combinedUsers.some((u: any) => u.email === localUser.email)) {
          combinedUsers.push(localUser);
        }
      }
      
      // Check if user already exists
      if (combinedUsers.some((u: any) => u.email === userData.email)) {
        return false;
      }
      
      const newUser: UserProfile = {
        id: Date.now().toString(),
        email: userData.email,
        name: userData.name,
        preferences: {
          intendedMajor: "",
          budget: 0,
          preferredCountry: "",
          preferredUniversityType: "",
          studyLevel: ""
        },
        createdAt: new Date()
      };
      
      // Store with password for login simulation
      const userWithPassword = { ...newUser, password: userData.password };
      combinedUsers.push(userWithPassword);
      
      // Update both storages
      sessionStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(combinedUsers));
      localStorage.setItem("users", JSON.stringify(combinedUsers));
      
      // Set current user without password
      setCurrentUser(newUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateUserPreferences = (preferences: UserPreferences) => {
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      preferences: preferences
    };
    
    setCurrentUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    
    // Update in both storages
    const sessionUsers = JSON.parse(sessionStorage.getItem(USERS_STORAGE_KEY) || "[]");
    const updatedSessionUsers = sessionUsers.map((u: any) => 
      u.id === currentUser.id ? { ...u, preferences } : u
    );
    sessionStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedSessionUsers));
    
    const localUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedLocalUsers = localUsers.map((u: any) => 
      u.id === currentUser.id ? { ...u, preferences } : u
    );
    localStorage.setItem("users", JSON.stringify(updatedLocalUsers));
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
