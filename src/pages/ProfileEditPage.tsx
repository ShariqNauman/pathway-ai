import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CurriculumSelector from "@/components/CurriculumSelector";
import ExtracurricularActivities from "@/components/ExtracurricularActivities";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Award, BookOpen } from "lucide-react";
import { UserPreferences } from "@/types/user";
import PersonalInfo from "@/components/PersonalInfo";
import { majorDomains } from "@/data/majorDomains";
import { ScrollArea } from "@/components/ui/scroll-area";

const ProfileEditPage = () => {
  const { currentUser, updateUserPreferences, isLoading } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>({
    intendedMajor: "",
    selectedDomains: [],
    budget: "",
    preferredCountry: "",
    preferredUniversityType: "",
    studyLevel: "undergraduate",
    satScore: undefined,
    actScore: undefined,
    englishTestType: undefined,
    englishTestScore: undefined,
    highSchoolCurriculum: undefined,
    curriculumGrades: {},
    curriculumSubjects: [],
    extracurricularActivities: []
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
    if (!isLoading && !currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser) {
      setPreferences(currentUser.preferences);
    }
  }, [currentUser, isLoading, navigate]);

  useEffect(() => {
    if (preferences.intendedMajor && !majorDomains[preferences.intendedMajor]) {
      setPreferences(prev => ({ ...prev, selectedDomains: [] }));
    }
  }, [preferences.intendedMajor]);

  useEffect(() => {
    document.title = "Edit Profile | Pathway";
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserPreferences(preferences);
    toast({
      title: "Profile updated",
      description: "Your preferences have been updated successfully"
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

  const curriculumOptions = [
    "US High School Diploma",
    "International Baccalaureate (IB)",
    "A-Levels (UK)",
    "European Baccalaureate",
    "French Baccalauréat",
    "German Abitur",
    "Indian CBSE/ISC",
    "Australian HSC",
    "Canadian High School",
    "Chinese Gaokao",
    "Japanese High School",
    "South Korean High School",
    "Brazilian Vestibular",
    "Russian Certificate of Secondary Education",
    "Italian Maturità",
    "Spanish Bachillerato",
    "NCEA (New Zealand)",
    "Singapore A-Levels",
    "Hong Kong DSE",
    "South African NSC",
    "Other"
  ];

  const englishTestOptions = [
    "TOEFL",
    "IELTS",
    "Duolingo English Test",
    "Cambridge English",
    "PTE Academic",
    "Other"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      <Header />
      <main className="flex-grow py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-8">
            <h1 className="text-3xl font-bold">Edit Your Profile</h1>
            
            <PersonalInfo />
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Academic Preferences Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Academic Preferences</CardTitle>
                  <CardDescription>Update your study preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="major">Field of Study</Label>
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
                      <Label>Specializations (Select all that apply)</Label>
                      <ScrollArea className="h-[200px] rounded-md border p-4">
                        <div className="space-y-4">
                          {availableDomains.map((domain) => (
                            <div key={domain} className="flex items-center space-x-2">
                              <Checkbox
                                id={domain}
                                checked={preferences.selectedDomains?.includes(domain)}
                                onCheckedChange={() => handleDomainChange(domain)}
                              />
                              <Label htmlFor={domain} className="cursor-pointer">
                                {domain}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* High School Curriculum Selector */}
              <CurriculumSelector />

              {/* Extracurricular Activities */}
              <ExtracurricularActivities />

              {/* Test Scores Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Test Scores
                  </CardTitle>
                  <CardDescription>Add your standardized test scores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="satScore">SAT Score (out of 1600)</Label>
                      <Input
                        id="satScore"
                        type="number"
                        min="400"
                        max="1600"
                        placeholder="Enter your SAT score"
                        value={preferences.satScore || ""}
                        onChange={(e) => updatePreference("satScore", e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="actScore">ACT Score (out of 36)</Label>
                      <Input
                        id="actScore"
                        type="number"
                        min="1"
                        max="36"
                        placeholder="Enter your ACT score"
                        value={preferences.actScore || ""}
                        onChange={(e) => updatePreference("actScore", e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="englishTest">English Proficiency Test</Label>
                    <Select 
                      onValueChange={(value) => updatePreference("englishTestType", value)}
                      value={preferences.englishTestType || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a test type" />
                      </SelectTrigger>
                      <SelectContent>
                        {englishTestOptions.map((test) => (
                          <SelectItem key={test} value={test}>
                            {test}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {preferences.englishTestType && (
                    <div className="space-y-3">
                      <Label htmlFor="englishScore">English Test Score</Label>
                      <Input
                        id="englishScore"
                        type="number"
                        min="0"
                        placeholder={`Enter your ${preferences.englishTestType} score`}
                        value={preferences.englishTestScore || ""}
                        onChange={(e) => updatePreference("englishTestScore", e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                  <CardDescription>Update your budget information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="budget">Yearly Budget (USD)</Label>
                    <Input
                      id="budget"
                      type="number"
                      min="0"
                      placeholder="E.g. 30000"
                      value={preferences.budget || ""}
                      onChange={(e) => updatePreference("budget", e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Institution Type</Label>
                    <RadioGroup 
                      className="flex flex-col space-y-3"
                      value={preferences.preferredUniversityType}
                      onValueChange={(value) => updatePreference("preferredUniversityType", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="public-edit" />
                        <Label htmlFor="public-edit">Public University</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="private-edit" />
                        <Label htmlFor="private-edit">Private University</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="either" id="either-edit" />
                        <Label htmlFor="either-edit">No Preference</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>

              {/* Location Preferences Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Location Preferences</CardTitle>
                  <CardDescription>Update your location preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="country">Preferred Country</Label>
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
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/dashboard")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default ProfileEditPage;