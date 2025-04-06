
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { User, Calendar, Globe, Flag, Phone } from "lucide-react";

interface PersonalInfoProps {
  onUpdate?: () => void;
}

// Country list for dropdowns
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", 
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", 
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", 
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", 
  "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", 
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", 
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", 
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", 
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", 
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", 
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", 
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", 
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", 
  "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", 
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", 
  "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", 
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", 
  "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", 
  "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", 
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", 
  "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", 
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", 
  "Zambia", "Zimbabwe"
];

// Country code list for phone numbers
const COUNTRY_CODES = [
  {code: "+1", country: "United States/Canada"},
  {code: "+44", country: "United Kingdom"},
  {code: "+91", country: "India"},
  {code: "+61", country: "Australia"},
  {code: "+49", country: "Germany"},
  {code: "+33", country: "France"},
  {code: "+86", country: "China"},
  {code: "+81", country: "Japan"},
  {code: "+7", country: "Russia"},
  {code: "+55", country: "Brazil"},
  {code: "+52", country: "Mexico"},
  {code: "+27", country: "South Africa"},
  {code: "+82", country: "South Korea"},
  {code: "+39", country: "Italy"},
  {code: "+34", country: "Spain"},
  {code: "+31", country: "Netherlands"},
  {code: "+966", country: "Saudi Arabia"},
  {code: "+971", country: "United Arab Emirates"},
  {code: "+65", country: "Singapore"},
  {code: "+90", country: "Turkey"},
  {code: "+92", country: "Pakistan"},
  {code: "+20", country: "Egypt"},
  {code: "+234", country: "Nigeria"},
  {code: "+351", country: "Portugal"},
  {code: "+972", country: "Israel"},
  {code: "+60", country: "Malaysia"},
  {code: "+46", country: "Sweden"},
  {code: "+41", country: "Switzerland"},
  {code: "+45", country: "Denmark"},
  {code: "+47", country: "Norway"},
  {code: "+358", country: "Finland"},
  {code: "+48", country: "Poland"},
  {code: "+43", country: "Austria"},
  {code: "+380", country: "Ukraine"},
  {code: "+30", country: "Greece"},
  {code: "+36", country: "Hungary"},
  {code: "+62", country: "Indonesia"},
];

const PersonalInfo: React.FC<PersonalInfoProps> = ({ onUpdate }) => {
  const { currentUser, updateUserPreferences } = useUser();
  const { toast } = useToast();
  
  // Add personal info fields to the form
  const [personalInfo, setPersonalInfo] = useState({
    fullName: currentUser?.name || "",
    dateOfBirth: "",
    nationality: "",
    countryOfResidence: "",
    countryCode: "",
    phoneNumber: ""
  });

  useEffect(() => {
    if (currentUser) {
      // Initialize fields with current user data, ensuring countryOfResidence is set properly
      setPersonalInfo({
        fullName: currentUser.name || "",
        dateOfBirth: currentUser.preferences.dateOfBirth || "",
        nationality: currentUser.preferences.nationality || "",
        countryOfResidence: currentUser.preferences.countryOfResidence || "",
        countryCode: currentUser.preferences.countryCode || "",
        phoneNumber: currentUser.preferences.phoneNumber || ""
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

  const handleSelectChange = (name: string, value: string) => {
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
      nationality: personalInfo.nationality,
      countryOfResidence: personalInfo.countryOfResidence,
      countryCode: personalInfo.countryCode,
      phoneNumber: personalInfo.phoneNumber
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
            <Label htmlFor="nationality">Nationality</Label>
            <Select 
              value={personalInfo.nationality} 
              onValueChange={(value) => handleSelectChange("nationality", value)}
            >
              <SelectTrigger id="nationality">
                <SelectValue placeholder="Select your nationality" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {COUNTRIES.map((country) => (
                  <SelectItem key={`nationality-${country}`} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="countryOfResidence">Country of Residence</Label>
            <Select 
              value={personalInfo.countryOfResidence} 
              onValueChange={(value) => handleSelectChange("countryOfResidence", value)}
            >
              <SelectTrigger id="countryOfResidence">
                <SelectValue placeholder="Select your country of residence" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {COUNTRIES.map((country) => (
                  <SelectItem key={`residence-${country}`} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Select 
                value={personalInfo.countryCode} 
                onValueChange={(value) => handleSelectChange("countryCode", value)}
              >
                <SelectTrigger id="countryCode" className="w-[140px]">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {COUNTRY_CODES.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.code} ({item.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={personalInfo.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className="flex-1"
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full">Save Personal Information</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfo;
