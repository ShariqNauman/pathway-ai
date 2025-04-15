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
import { Loader2, User, GraduationCap, DollarSign, Map, Globe, Flag, Phone } from "lucide-react";
import { UserPreferences } from "@/types/user";
import { majorDomains } from "@/data/majorDomains";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const OnboardingPage = () => {
  const { currentUser, updateUserPreferences, isLoading } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<UserPreferences>({
    intendedMajor: "",
    selectedDomains: [],
    budget: "",
    preferredCountry: "",
    preferredUniversityType: "",
    studyLevel: "undergraduate",
    curriculumGrades: {}, // Required field
    curriculumSubjects: [], // Initialize with empty array
    dateOfBirth: "",
    nationality: "",
    countryOfResidence: "",
    countryCode: "",
    phoneNumber: "",
    englishTestScore: ""
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

  useEffect(() => {
    document.title = "Welcome to Pathway | Complete Your Profile";
  }, []);

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
        return preferences.dateOfBirth && 
               preferences.nationality && 
               preferences.countryOfResidence && 
               preferences.countryCode && 
               preferences.phoneNumber;
      case 2:
        return preferences.intendedMajor && preferences.studyLevel;
      case 3:
        return preferences.budget !== "";
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
    "Germany", "France", "Japan", "South Korea", "China", "Pakistan", 
    "Netherlands", "Sweden", "Switzerland", "Singapore", "New Zealand", "Italy", "Spain", "Ireland", "Norway", "Denmark", 
    "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Oman", "Jordan", "Lebanon", "Egypt", "Other"
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
                <Label htmlFor="nationality">Nationality</Label>
                <Select 
                  onValueChange={(value) => updatePreference("nationality", value)}
                  value={preferences.nationality}
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

              <div className="space-y-3">
                <Label htmlFor="countryOfResidence">Country of Residence</Label>
                <Select 
                  onValueChange={(value) => updatePreference("countryOfResidence", value)}
                  value={preferences.countryOfResidence}
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

              <div className="space-y-3">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Select 
                    onValueChange={(value) => updatePreference("countryCode", value)}
                    value={preferences.countryCode}
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
                    placeholder="Enter phone number"
                    value={preferences.phoneNumber || ""}
                    onChange={(e) => updatePreference("phoneNumber", e.target.value)}
                    className="flex-1"
                  />
                </div>
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
                  onChange={(e) => updatePreference("budget", e.target.value)}
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
