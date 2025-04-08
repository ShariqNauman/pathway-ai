import { useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CurriculumDisplay from "@/components/CurriculumDisplay";
import ExtracurricularDragDrop from "@/components/ExtracurricularDragDrop";
import PersonalInfoDisplay from "@/components/PersonalInfoDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Settings, LogOut, Award, BookOpen, GraduationCap } from "lucide-react";
import { ExtracurricularActivity } from "@/types/user";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const DashboardPage = () => {
  const { currentUser, logout, isLoading, updateUserPreferences } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for missing essential fields
  const getMissingFields = () => {
    if (!currentUser?.preferences) return [];
    const prefs = currentUser.preferences;
    const missingFields = [];
    
    if (!prefs.intendedMajor) missingFields.push("intended major");
    if (!prefs.studyLevel) missingFields.push("study level");
    if (!prefs.highSchoolCurriculum) missingFields.push("high school curriculum");
    if (!prefs.preferredCountry) missingFields.push("preferred country");
    if (!prefs.budget) missingFields.push("budget");
    if (!prefs.curriculumSubjects || prefs.curriculumSubjects.length === 0) missingFields.push("curriculum subjects");
    
    return missingFields;
  };

  const missingFields = getMissingFields();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate("/login");
    }
  }, [currentUser, isLoading, navigate]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully"
    });
    navigate("/");
  };

  const handleActivitiesReorder = async (activities: ExtracurricularActivity[]) => {
    if (!currentUser) return;

    try {
      await updateUserPreferences({
        ...currentUser.preferences,
        extracurricularActivities: activities
      });
      
      toast({
        title: "Activities reordered",
        description: "Your activities have been reordered successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder activities. Please try again.",
        variant: "destructive"
      });
    }
  };

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

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
        <div className="max-w-5xl mx-auto">
          {missingFields.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your profile is incomplete. Please add your {missingFields.join(", ")} in your{' '}
                  <Link to="/profile/edit" className="font-medium underline hover:text-destructive/90">profile settings</Link> for better recommendations.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div className="flex items-center gap-4 mb-6 md:mb-0">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">Hello, {currentUser.name}</h1>
                <p className="text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/profile/edit")}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          <div className="mb-10">
            <PersonalInfoDisplay userProfile={currentUser} />
          </div>

          <div className="mb-10">
            <CurriculumDisplay 
              curriculum={currentUser.preferences.highSchoolCurriculum || ""} 
              subjects={currentUser.preferences.curriculumSubjects} 
              grades={currentUser.preferences.curriculumGrades} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardHeader>
                <CardTitle>Study Preferences</CardTitle>
                <CardDescription>Your academic preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Field of Study</dt>
                    <dd className="text-base">{currentUser.preferences.intendedMajor || "Not specified"}</dd>
                  </div>
                  {currentUser.preferences.selectedDomains && currentUser.preferences.selectedDomains.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Specializations</dt>
                      <dd className="text-base">
                        {currentUser.preferences.selectedDomains.join(", ")}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>Your budget information</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Yearly Budget</dt>
                    <dd className="text-base">
                      {currentUser.preferences.budget ? `$${currentUser.preferences.budget.toLocaleString()}` : "Not specified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Institution Type</dt>
                    <dd className="text-base capitalize">{currentUser.preferences.preferredUniversityType || "Not specified"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Preferences</CardTitle>
                <CardDescription>Your location preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Preferred Country</dt>
                    <dd className="text-base">{currentUser.preferences.preferredCountry || "Not specified"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          <div className="mb-10">
            <ExtracurricularDragDrop 
              activities={currentUser.preferences.extracurricularActivities}
              onActivitiesReorder={handleActivitiesReorder}
            />
          </div>

          <div className="mb-10">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Test Scores
                </CardTitle>
                <CardDescription>Your standardized test results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">SAT</h3>
                    </div>
                    {currentUser.preferences.satScore ? (
                      <p className="text-2xl font-bold">{currentUser.preferences.satScore}</p>
                    ) : (
                      <p className="text-muted-foreground">Not provided</p>
                    )}
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">ACT</h3>
                    </div>
                    {currentUser.preferences.actScore ? (
                      <p className="text-2xl font-bold">{currentUser.preferences.actScore}</p>
                    ) : (
                      <p className="text-muted-foreground">Not provided</p>
                    )}
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">English Proficiency</h3>
                    </div>
                    {currentUser.preferences.englishTestType ? (
                      <>
                        <p className="text-sm text-muted-foreground">{currentUser.preferences.englishTestType}</p>
                        <p className="text-2xl font-bold">{currentUser.preferences.englishTestScore}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Not provided</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default DashboardPage;
