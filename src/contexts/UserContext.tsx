
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

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // For demo purposes, we'll use localStorage
  const login = async (credentials: UserCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would be an API call to verify credentials
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const user = storedUsers.find((u: any) => u.email === credentials.email);
      
      if (user && user.password === credentials.password) {
        // Don't store password in current user
        const { password, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
        localStorage.setItem("user", JSON.stringify(userWithoutPassword));
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
      
      // In a real app, this would be an API call to create a user
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      
      // Check if user already exists
      if (storedUsers.some((u: any) => u.email === userData.email)) {
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
      storedUsers.push(userWithPassword);
      localStorage.setItem("users", JSON.stringify(storedUsers));
      
      // Set current user without password
      setCurrentUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("user");
  };

  const updateUserPreferences = (preferences: UserPreferences) => {
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      preferences: preferences
    };
    
    setCurrentUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    
    // Also update in the users array
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = storedUsers.map((u: any) => 
      u.id === currentUser.id ? { ...u, preferences } : u
    );
    localStorage.setItem("users", JSON.stringify(updatedUsers));
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
