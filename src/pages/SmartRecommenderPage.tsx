
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Loader2, ChevronRight, Star, MapPin, DollarSign, GraduationCap, SkipForward, AlertCircle } from 'lucide-react';
import { getChatResponse } from '../utils/chatConsultantApi';
import { canUseRecommender, incrementRecommenderCount, isAdmin } from '../utils/messageLimits';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from "sonner";

interface Question {
  id: string;
  type: 'text' | 'select' | 'slider' | 'multi-select';
  question: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

interface University {
  id: string;
  name: string;
  location: string;
  tuitionRange: string;
  programMatch: number;
  requirements: string[];
  rankings: {
    global?: number;
    national?: number;
    program?: number;
  };
  tags: string[];
  applicationDeadline?: string;
  scholarshipInfo?: string;
  website: string;
  isSaving?: boolean;
}

interface UniversityData {
  id: string;
  name: string;
  location: string;
  tuitionRange: string;
  programMatch: number;
  requirements: string[];
  rankings: {
    global?: number;
    national?: number;
    program?: number;
  };
  tags: string[];
  website: string;
  applicationDeadline?: string;
  scholarshipInfo?: string;
}

export default function SmartRecommenderPage() {
  const { currentUser, saveUniversity, savedUniversities } = useAuth();
  const [currentStep, setCurrentStep] = useState<'profile' | 'questions' | 'results'>('profile');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<any>('');
  const [academicProfile, setAcademicProfile] = useState<any>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [remainingUses, setRemainingUses] = useState<number>(0);
  const [canUse, setCanUse] = useState<boolean>(true);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const slideIn = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  useEffect(() => {
    const checkLimits = async () => {
      if (currentUser?.id) {
        const adminStatus = await isAdmin(currentUser.id);
        setIsUserAdmin(adminStatus);
        
        if (!adminStatus) {
          const { canUse: canUseService, remaining } = await canUseRecommender(currentUser.id);
          setCanUse(canUseService);
          setRemainingUses(remaining);
        }
      }
    };

    checkLimits();
  }, [currentUser]);

  const generateQuestions = async () => {
    if (!currentUser?.id) {
      setError('Please log in to use the Smart Recommender.');
      return;
    }

    if (!isUserAdmin && !canUse) {
      setError('You have reached your daily limit for Smart Recommender. Please try again tomorrow.');
      return;
    }

    // Increment usage count when starting the process
    if (!isUserAdmin) {
      const success = await incrementRecommenderCount(currentUser.id);
      if (!success) {
        setError('Failed to update usage count. Please try again.');
        return;
      }
      
      // Update remaining uses
      const { remaining } = await canUseRecommender(currentUser.id);
      setRemainingUses(remaining);
    }

    setIsGeneratingQuestions(true);
    try {
      const prompt = `Generate a comprehensive set of questions to recommend universities to a student.
      Consider the user's profile data: ${JSON.stringify(currentUser?.preferences, null, 2)}
      
      Skip questions that are already answered in the profile.
      Questions should cover: academic interests, budget, location preferences, campus life, program specifics.
      
      Return a JSON array of questions in this exact format, nothing else:
      [
        {
          "id": "string",
          "type": "text" | "select" | "slider",
          "question": "string",
          "options": ["string"] (for select type only),
          "min": number (for slider type only),
          "max": number (for slider type only),
          "step": number (for slider type only)
        }
      ]`;

      const response = await getChatResponse(prompt);
      
      if (response.error) {
        throw new Error('Failed to generate questions');
      }

      const jsonText = response.text.replace(/```json\n?|\n?```/g, '').trim();
      const generatedQuestions = JSON.parse(jsonText);

      if (!Array.isArray(generatedQuestions)) {
        throw new Error('Invalid questions format');
      }

      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setCurrentStep('questions');
    } catch (err) {
      console.error('Failed to generate questions:', err);
      setError('Failed to generate questions. Please try again.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  useEffect(() => {
    if (currentUser?.preferences) {
      // Pre-fill answers from profile
      const initialAnswers: Record<string, any> = {};
      const prefs = currentUser.preferences;
      if (prefs.studyLevel) initialAnswers.studyLevel = prefs.studyLevel;
      if (prefs.intendedMajor) initialAnswers.intendedMajor = prefs.intendedMajor;
      if (prefs.preferredCountry) initialAnswers.preferredLocation = prefs.preferredCountry;
      if (prefs.budget) initialAnswers.budget = prefs.budget;
      if (prefs.highSchoolCurriculum) initialAnswers.curriculum = prefs.highSchoolCurriculum;
      if (prefs.grades) initialAnswers.academicPerformance = prefs.grades;
      
      setAnswers(initialAnswers);

      // Set academic profile
      setAcademicProfile({
        studyLevel: prefs.studyLevel,
        intendedMajor: prefs.intendedMajor,
        curriculum: prefs.highSchoolCurriculum,
        grades: prefs.grades,
        standardizedTests: prefs.standardizedTests,
        languageScores: prefs.languageScores
      });
    }
  }, [currentUser]);

  useEffect(() => {
    document.title = "Smart University Recommender | Pathway";
  }, []);

  const handleAnswer = () => {
    if (!currentAnswer) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: currentAnswer }));
    setCurrentAnswer('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      generateRecommendations();
    }
  };

  const handleSkip = () => {
    setCurrentAnswer('');
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      generateRecommendations();
    }
  };

  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      // Combine profile data with answers in a structured way
      const profileData = currentUser?.preferences || {};
      const academicProfile = {
        studyLevel: profileData.studyLevel || answers.studyLevel,
        intendedMajor: profileData.intendedMajor || answers.intendedMajor,
        curriculum: profileData.highSchoolCurriculum,
        grades: profileData.grades,
        standardizedTests: profileData.standardizedTests,
        languageScores: profileData.languageScores
      };

      const preferences = {
        location: profileData.preferredCountry || answers.preferredLocation,
        budget: profileData.budget || answers.budget,
        universitySize: answers.universitySize,
        campusEnvironment: answers.campusPreference,
        programDuration: answers.programDuration,
        researchFocus: answers.researchFocus,
        extracurriculars: profileData.extracurriculars,
        workExperience: profileData.workExperience
      };

      const prompt = `You are an expert university admissions consultant. Based on the following detailed student profile and preferences, recommend the 5 most suitable universities.

ACADEMIC PROFILE:
${JSON.stringify(academicProfile, null, 2)}

PREFERENCES AND REQUIREMENTS:
${JSON.stringify(preferences, null, 2)}

Consider these factors in order of priority:
1. Academic fit: Match the student's academic background (curriculum, grades, test scores) with program requirements
2. Major/Program availability: Ensure the university offers the intended major/program
3. Budget constraints: Stay within the specified budget range
4. Location preference: Consider preferred countries/regions
5. Language of instruction: Match student's language abilities
6. Campus and program characteristics: Size, environment, duration, research focus
7. Additional factors: Extracurricular opportunities, work experience relevance

For each university:
- Explain why it's a good match (in the requirements array)
- Include specific program details
- List concrete admission requirements
- Show rankings relevant to the specific program
- Add relevant tags (e.g., "Strong Research", "Merit Scholarships", "Industry Connections")
- Provide the direct URL to the university page

Return a JSON array in this exact format, nothing else:
[
  {
    "id": "string",
    "name": "string",
    "location": "string (City, Country)",
    "tuitionRange": "string ($XX,XXX - $XX,XXX per year)",
    "programMatch": number (0-100, based on how well ALL criteria are met),
    "requirements": [
      "string (Include specific program requirements and why it's a good match)"
    ],
    "rankings": {
      "global": number,
      "national": number,
      "program": number (specific to the intended major)
    },
    "tags": ["string"],
    "applicationDeadline": "string",
    "scholarshipInfo": "string (if within budget constraints)",
    "website": "string (direct URL to the relevant university page)"
  }
]

IMPORTANT: MAKE SURE THE OUTPUT IS IN THE JSON FORMAT ONLY, THERE SHOULD BE NO TEXT BESIDES THE JSON ARRAY`;

      const response = await getChatResponse(prompt);
      
      if (response.error) {
        console.error('API Error:', response.error);
        throw new Error('Failed to generate recommendations');
      }

      let recommendations;
      try {
        const jsonText = response.text.replace(/```json\n?|\n?```/g, '').trim();
        recommendations = JSON.parse(jsonText);
        
        if (!Array.isArray(recommendations)) {
          throw new Error('Response is not an array');
        }
        
        // Validate each university has required fields and meaningful data
        const isValid = recommendations.every(u => 
          u.id &&
          u.name &&
          u.location &&
          u.tuitionRange &&
          typeof u.programMatch === 'number' &&
          u.programMatch >= 0 &&
          u.programMatch <= 100 &&
          Array.isArray(u.requirements) &&
          u.requirements.length > 0 &&
          u.rankings &&
          (u.rankings.global || u.rankings.national || u.rankings.program) &&
          Array.isArray(u.tags) &&
          u.tags.length > 0 &&
          u.website
        );

        if (!isValid) {
          throw new Error('Invalid university format or missing critical data');
        }

        // Sort by program match score
        recommendations.sort((a, b) => b.programMatch - a.programMatch);
      } catch (parseError) {
        console.error('Failed to parse recommendations:', parseError, 'Response:', response.text);
        throw new Error('Failed to process university recommendations');
      }

      setUniversities(recommendations);
      setCurrentStep('results');
      setError(null);
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      setError('Failed to generate recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <Input
              placeholder="Type your answer..."
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnswer()}
            />
            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleAnswer}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                Skip
                <SkipForward className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 'select':
        return (
          <div className="space-y-4">
            <Select value={currentAnswer} onValueChange={setCurrentAnswer}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleAnswer} disabled={!currentAnswer}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                Skip
                <SkipForward className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 'slider':
        return (
          <div className="space-y-4">
            <Slider
              min={question.min}
              max={question.max}
              step={question.step}
              value={[currentAnswer || question.min]}
              onValueChange={([value]) => setCurrentAnswer(value)}
            />
            <div className="text-sm text-muted-foreground text-center">
              ${currentAnswer?.toLocaleString() || question.min?.toLocaleString()} USD
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleAnswer} disabled={!currentAnswer}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                Skip
                <SkipForward className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="text-center space-y-6">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="space-y-2"
              >
                <p className="text-2xl font-medium">Finding Your Perfect Matches</p>
                <p className="text-muted-foreground">Analyzing universities based on your preferences...</p>
              </motion.div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-20 px-4">
        <div className="max-w-5xl mx-auto">
          {isGeneratingQuestions ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <div className="text-center space-y-6">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="space-y-2"
                >
                  <p className="text-2xl font-medium">Analyzing Your Profile</p>
                  <p className="text-muted-foreground">Preparing personalized questions...</p>
                </motion.div>
              </div>
            </motion.div>
          ) : null}

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-4">Smart University Recommender</h1>
            <p className="text-muted-foreground text-lg">
              Get personalized university recommendations based on your profile and preferences
            </p>
          </motion.div>

          {!isUserAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <Card className="max-w-md mx-auto">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">
                      Daily Limit: {remainingUses}/5 recommendations remaining
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Resets daily at midnight UTC
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <Card className="border-destructive">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'profile' && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-6"
            >
              <motion.div variants={fadeIn} className="text-center">
                <h2 className="text-2xl font-semibold mb-4">Let's Find Your Perfect University Match</h2>
                <p className="text-muted-foreground mb-8">
                  We'll use your profile information and ask a few additional questions to find the best universities for you.
                </p>
                <Button
                  size="lg"
                  onClick={generateQuestions}
                  disabled={!isUserAdmin && !canUse}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Start Recommendation Process
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                {!isUserAdmin && !canUse && (
                  <p className="text-sm text-muted-foreground mt-2">
                    You have reached your daily limit. Please try again tomorrow.
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}

          {currentStep === 'questions' && questions.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="max-w-2xl mx-auto"
            >
              <motion.div
                key={currentQuestionIndex}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="bg-card rounded-lg p-8 shadow-lg border border-border"
              >
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-muted-foreground">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      className="bg-primary h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-6">{questions[currentQuestionIndex].question}</h3>
                {renderQuestion(questions[currentQuestionIndex])}
              </motion.div>
            </motion.div>
          )}

          {currentStep === 'results' && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-6"
            >
              <motion.h2
                variants={fadeIn}
                className="text-2xl font-semibold text-center mb-8"
              >
                Your Recommended Universities
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-8"
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep('profile');
                    setQuestions([]);
                    setCurrentQuestionIndex(0);
                    setUniversities([]);
                    setCurrentAnswer('');
                    setError(null);
                  }}
                  className="hover:scale-105 transition-transform"
                >
                  Start Over
                </Button>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                className="grid gap-6"
              >
                {universities.map((university, index) => (
                  <motion.div
                    key={university.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-6">
                        <div className="flex flex-col space-y-4">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-start justify-between"
                          >
                            <div className="space-y-1">
                              <h3 className="text-xl font-semibold">{university.name}</h3>
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{university.location}</span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Star className="h-5 w-5 text-yellow-400 mr-1" />
                              <span className="font-medium">{university.programMatch}% Match</span>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center text-muted-foreground"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>{university.tuitionRange}</span>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-2"
                          >
                            <h4 className="font-medium">Requirements:</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                              {university.requirements.map((req, index) => (
                                <motion.li
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.5 + index * 0.1 }}
                                >
                                  {req}
                                </motion.li>
                              ))}
                            </ul>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex flex-wrap gap-2"
                          >
                            {university.tags.map((tag, index) => (
                              <motion.span
                                key={tag}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20"
                              >
                                {tag}
                              </motion.span>
                            ))}
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="flex gap-3 mt-4"
                          >
                            <Button 
                              variant="outline" 
                              className="flex-1 hover:scale-105 transition-transform"
                              onClick={() => {
                                window.open(university.website, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              Learn More
                            </Button>
                            <Button 
                              className="flex-1 hover:scale-105 transition-transform"
                              onClick={async () => {
                                // Throttle save requests
                                if (university.isSaving) return;
                                university.isSaving = true;

                                try {
                                  // Debug: log savedUniversities
                                  console.log('Saved universities:', savedUniversities);

                                  // Check if the university is already saved
                                  const isAlreadySaved = savedUniversities?.some(
                                    (saved) => saved.university_data.id === university.id
                                  );

                                  if (isAlreadySaved) {
                                    toast("This university is already in your dashboard.");
                                    return;
                                  }

                                  // Save the university
                                  await saveUniversity(university);
                                  toast("University saved! You can view it in your dashboard.");
                                } catch (error) {
                                  toast("Failed to save university. Please try again later.");
                                } finally {
                                  university.isSaving = false;
                                }
                              }}
                            >
                              Save
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
