import { useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CurriculumDisplay from "@/components/CurriculumDisplay";
import ExtracurricularDisplay from "@/components/ExtracurricularDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Settings, LogOut, Award, BookOpen, GraduationCap, Book } from "lucide-react";

const DashboardPage = () => {
  const { currentUser, logout, isLoading } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

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
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Study Level</dt>
                    <dd className="text-base capitalize">{currentUser.preferences.studyLevel || "Not specified"}</dd>
                  </div>
                  {currentUser.preferences.highSchoolCurriculum && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">High School Curriculum</dt>
                      <dd className="text-base">{currentUser.preferences.highSchoolCurriculum}</dd>
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
            <CurriculumDisplay 
              curriculum={currentUser.preferences.highSchoolCurriculum || ""} 
              subjects={currentUser.preferences.curriculumSubjects} 
              grades={currentUser.preferences.curriculumGrades} 
            />
          </div>

          <div className="mb-10">
            <ExtracurricularDisplay 
              activities={currentUser.preferences.extracurricularActivities}
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

          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Recommendations</h2>
            <div className="bg-muted/50 p-8 rounded-lg text-center">
              <p className="text-lg text-muted-foreground">
                Based on your preferences, we'll be providing personalized university recommendations soon.
              </p>
              <Button className="mt-4" onClick={() => navigate("/consultant")}>
                Talk to AI Consultant
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default DashboardPage;
