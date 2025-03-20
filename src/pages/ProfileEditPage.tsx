
import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { UserPreferences } from "@/types/user";

const ProfileEditPage = () => {
  const { currentUser, updateUserPreferences, isLoading } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>({
    intendedMajor: "",
    budget: 0,
    preferredCountry: "",
    preferredUniversityType: "",
    studyLevel: ""
  });

  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser) {
      setPreferences(currentUser.preferences);
    }
  }, [currentUser, isLoading, navigate]);

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
    "Germany", "France", "Japan", "South Korea", "China", "Other"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return null; // Redirecting
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
          <div className="mb-8">
            <Button 
              variant="ghost" 
              className="mb-4" 
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Edit Your Profile</h1>
            <p className="text-muted-foreground mt-2">Update your preferences and settings</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
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

                <div className="space-y-3">
                  <Label>Study Level</Label>
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
              </CardContent>
            </Card>

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
                    onChange={(e) => updatePreference("budget", parseInt(e.target.value) || 0)}
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
      </main>
      <Footer />
    </motion.div>
  );
};

export default ProfileEditPage;
