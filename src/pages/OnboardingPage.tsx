import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, User, GraduationCap, DollarSign, Map } from "lucide-react";
import { UserPreferences } from "@/types/user";
import { majorDomains } from "@/data/majorDomains";
import { ScrollArea } from "@/components/ui/scroll-area";

const OnboardingPage = () => {
  const { currentUser, updateUserPreferences, isLoading } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<UserPreferences>({
    intendedMajor: "",
    selectedDomains: [],
    budget: 0,
    preferredCountry: "",
    preferredUniversityType: "",
    studyLevel: "",
    curriculumGrades: {}, // Required field
    curriculumSubjects: [], // Initialize with empty array
    dateOfBirth: "",
    address: "",
    phone: ""
  });

  const availableDomains = preferences.intendedMajor ? majorDomains[preferences.intendedMajor] || [] : [];

  const handleDomainChange = (domain: string) => {
    setPreferences(prev => {
      const currentDomains = prev.selectedDomains || [];
      const newDomains = currentDomains.includes(domain)
        ? currentDomains.filter(d => d !== domain)
        : [...currentDomains, domain];
      return { ...prev, selectedDomains: newDomains };
    });
  };

  useEffect(() => {
    if (currentUser?.preferences) {
      setPreferences(currentUser.preferences);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!majorDomains[preferences.intendedMajor]) {
      setPreferences(prev => ({ ...prev, selectedDomains: [] }));
    }
  }, [preferences.intendedMajor]);

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setStep(step + 1);
    } else {
      toast({
        title: "Please complete all fields",
        description: "All fields are required to proceed",
        variant: "destructive"
      });
    }
  };

  const validateCurrentStep = () => {
    switch (step) {
      case 1: // Personal Info
        return preferences.dateOfBirth && preferences.address && preferences.phone;
      case 2:
        return preferences.intendedMajor && preferences.studyLevel;
      case 3:
        return preferences.budget > 0;
      case 4:
        return preferences.preferredCountry && preferences.preferredUniversityType;
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    updateUserPreferences(preferences);
    toast({
      title: "Profile updated",
      description: "Your preferences have been saved successfully"
    });
    navigate("/dashboard");
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const majorOptions = [
    "Computer Science", "Engineering", "Business", "Medicine", 
    "Law", "Arts", "Humanities", "Education", "Sciences", "Other"
  ];

  const countryOptions = [
    "United States", "United Kingdom", "Canada", "Australia", 
    "Germany", "France", "Japan", "South Korea", "China", "Pakistan", "Other"
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      <Header />
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-lg p-8 rounded-lg shadow-lg bg-card"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Tell Us About You</h1>
            <p className="text-muted-foreground mt-2">
              Help us personalize your experience
            </p>
            
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((s) => (
                  <div 
                    key={s} 
                    className={`h-2 w-12 rounded-full ${
                      s === step ? "bg-primary" : 
                      s < step ? "bg-primary/60" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Personal Information</h2>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={preferences.dateOfBirth || ""}
                  onChange={(e) => updatePreference("dateOfBirth", e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter your address"
                  value={preferences.address || ""}
                  onChange={(e) => updatePreference("address", e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Enter your phone number"
                  value={preferences.phone || ""}
                  onChange={(e) => updatePreference("phone", e.target.value)}
                />
              </div>

              <Button onClick={handleNextStep} className="w-full">
                Continue
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Academic Goals</h2>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="major">What do you plan to study?</Label>
                <Select 
                  onValueChange={(value) => updatePreference("intendedMajor", value)}
                  value={preferences.intendedMajor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a field of study" />
                  </SelectTrigger>
                  <SelectContent>
                    {majorOptions.map((major) => (
                      <SelectItem key={major} value={major}>
                        {major}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {preferences.intendedMajor && availableDomains.length > 0 && (
                <div className="space-y-3">
                  <Label>Which specializations interest you? (Optional)</Label>
                  <ScrollArea className="h-[150px] rounded-md border p-4">
                    <div className="space-y-4">
                      {availableDomains.map((domain) => (
                        <div key={domain} className="flex items-center space-x-2">
                          <Checkbox
                            id={`domain-${domain}`}
                            checked={preferences.selectedDomains?.includes(domain)}
                            onCheckedChange={() => handleDomainChange(domain)}
                          />
                          <Label htmlFor={`domain-${domain}`} className="cursor-pointer">
                            {domain}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="space-y-3">
                <Label>What level are you planning to study?</Label>
                <RadioGroup 
                  className="flex flex-col space-y-3"
                  value={preferences.studyLevel}
                  onValueChange={(value) => updatePreference("studyLevel", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="undergraduate" id="undergraduate" />
                    <Label htmlFor="undergraduate">Undergraduate (Bachelor's)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="graduate" id="graduate" />
                    <Label htmlFor="graduate">Graduate (Master's)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="doctorate" id="doctorate" />
                    <Label htmlFor="doctorate">Doctorate (PhD)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNextStep} className="flex-1">
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Budget Information</h2>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="budget">What's your yearly budget for education? (USD)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  placeholder="E.g. 30000"
                  value={preferences.budget || ""}
                  onChange={(e) => updatePreference("budget", parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  This helps us recommend programs within your financial reach
                </p>
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNextStep} className="flex-1">
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Map className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Location Preferences</h2>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="country">Which country are you interested in studying?</Label>
                <Select 
                  onValueChange={(value) => updatePreference("preferredCountry", value)}
                  value={preferences.preferredCountry}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>What type of institution do you prefer?</Label>
                <RadioGroup 
                  className="flex flex-col space-y-3"
                  value={preferences.preferredUniversityType}
                  onValueChange={(value) => updatePreference("preferredUniversityType", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public">Public University</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private">Private University</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="either" id="either" />
                    <Label htmlFor="either">No Preference</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Complete"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default OnboardingPage;
