
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/types/user";
import { User, Mail, Calendar, MapPin, Phone } from "lucide-react";

interface PersonalInfoProps {
  onUpdate?: () => void;
}

const PersonalInfo: React.FC<PersonalInfoProps> = ({ onUpdate }) => {
  const { currentUser, updateUserPreferences } = useUser();
  const { toast } = useToast();
  
  // Add personal info fields to the form
  const [personalInfo, setPersonalInfo] = useState({
    fullName: currentUser?.name || "",
    email: currentUser?.email || "",
    dateOfBirth: "",
    address: "",
    phone: ""
  });

  useEffect(() => {
    if (currentUser) {
      setPersonalInfo({
        fullName: currentUser.name || "",
        email: currentUser.email || "",
        dateOfBirth: currentUser.preferences.dateOfBirth || "",
        address: currentUser.preferences.address || "",
        phone: currentUser.preferences.phone || ""
      });
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    // Update only the preferences we can via the update preferences method
    updateUserPreferences({
      ...currentUser.preferences,
      dateOfBirth: personalInfo.dateOfBirth,
      address: personalInfo.address,
      phone: personalInfo.phone
    });

    toast({
      title: "Personal information saved",
      description: "Your personal information has been updated successfully"
    });

    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Add your personal information to complete your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={personalInfo.fullName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              disabled // Name is set during registration and can't be changed here
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={personalInfo.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              disabled // Email is set during registration and can't be changed here
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={personalInfo.dateOfBirth}
              onChange={handleInputChange}
              placeholder="Select your date of birth"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={personalInfo.address}
              onChange={handleInputChange}
              placeholder="Enter your address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              value={personalInfo.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
            />
          </div>
          
          <Button type="submit" className="w-full">Save Personal Information</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfo;
