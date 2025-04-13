import { useEffect, useState } from "react";
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
import { Loader2, Settings, LogOut, Award, BookOpen, GraduationCap, Book, ChevronDown, ChevronUp } from "lucide-react";
import { ExtracurricularActivity } from "@/types/user";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Star, DollarSign, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { currentUser, logout, isLoading, updateUserPreferences } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isTestScoresCollapsed, setIsTestScoresCollapsed] = useState(false);
  const [isCurriculumCollapsed, setIsCurriculumCollapsed] = useState(false);
  const { savedUniversities, removeSavedUniversity } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    document.title = "Dashboard | Pathway - Your College Journey";
  }, []);

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
    } catch (error) {
      console.error('Failed to reorder activities:', error);
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
            <Card>
              <CardHeader>
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">Profile Information</TabsTrigger>
                    <TabsTrigger value="universities">Saved Universities</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="profile">
                    <div className="space-y-6">
                      <div className="mb-6">
                        <PersonalInfoDisplay userProfile={currentUser} />
                      </div>

                      <Card className="mb-6">
                        <CardHeader className="relative">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <Book className="h-5 w-5 text-primary" />
                              High School Curriculum
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsCurriculumCollapsed(!isCurriculumCollapsed)}
                              className="h-8 w-8 p-0"
                            >
                              {isCurriculumCollapsed ? 
                                <ChevronDown className="h-5 w-5" /> : 
                                <ChevronUp className="h-5 w-5" />
                              }
                            </Button>
                          </div>
                        </CardHeader>
                        {!isCurriculumCollapsed && (
                          <CardContent>
                            <CurriculumDisplay 
                              curriculum={currentUser.preferences.highSchoolCurriculum || ""} 
                              subjects={currentUser.preferences.curriculumSubjects} 
                              grades={currentUser.preferences.curriculumGrades} 
                            />
                          </CardContent>
                        )}
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

                      <Card className="mb-6">
                        <CardHeader className="relative">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <Award className="h-5 w-5 text-primary" />
                              Test Scores
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsTestScoresCollapsed(!isTestScoresCollapsed)}
                              className="h-8 w-8 p-0"
                            >
                              {isTestScoresCollapsed ? 
                                <ChevronDown className="h-5 w-5" /> : 
                                <ChevronUp className="h-5 w-5" />
                              }
                            </Button>
                          </div>
                          <CardDescription>Your standardized test results</CardDescription>
                        </CardHeader>
                        {!isTestScoresCollapsed && (
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
                        )}
                      </Card>

                      <ExtracurricularDragDrop 
                        activities={currentUser.preferences.extracurricularActivities}
                        onActivitiesReorder={handleActivitiesReorder}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="universities">
                    <div className="space-y-4">
                      {savedUniversities && savedUniversities.length > 0 ? (
                        savedUniversities.map((saved) => (
                          <Card key={saved.id} className="overflow-hidden">
                            <CardContent className="p-6">
                              <div className="flex flex-col space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <h3 className="text-xl font-semibold">{saved.university_data.name}</h3>
                                    <div className="flex items-center text-muted-foreground">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      <span>{saved.university_data.location}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <Star className="h-5 w-5 text-yellow-400 mr-1" />
                                    <span className="font-medium">{saved.university_data.programMatch}% Match</span>
                                  </div>
                                </div>

                                <div className="flex items-center text-muted-foreground">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  <span>{saved.university_data.tuitionRange}</span>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-medium">Requirements:</h4>
                                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                    {saved.university_data.requirements.map((req, index) => (
                                      <li key={index}>{req}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {saved.university_data.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                <div className="flex gap-3 mt-4">
                                  <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => {
                                      window.open(saved.university_data.website, '_blank', 'noopener,noreferrer');
                                    }}
                                  >
                                    Learn More
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => {
                                      removeSavedUniversity(saved.id);
                                      toast({
                                        title: "University removed",
                                        description: "The university has been removed from your saved list.",
                                        duration: 3000,
                                      });
                                    }}
                                  >
                                    Remove
              </Button>
            </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No saved universities yet.</p>
                          <p className="mt-2">
                            Visit the{' '}
                            <Link to="/recommender" className="text-primary hover:underline">
                              Smart Recommender
                            </Link>
                            {' '}to find and save universities.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default DashboardPage;
