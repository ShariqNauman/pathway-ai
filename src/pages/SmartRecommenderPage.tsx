import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Loader2, ChevronRight, Star, MapPin, DollarSign, GraduationCap } from 'lucide-react';
import { getGeminiResponse } from '../utils/geminiApi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from '../components/ui/use-toast';

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
  const { currentUser, saveUniversity } = useAuth();
  const [currentStep, setCurrentStep] = useState<'profile' | 'questions' | 'results'>('profile');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<any>('');
  const [academicProfile, setAcademicProfile] = useState<any>(null);

  const generateQuestions = async () => {
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

      const response = await getGeminiResponse(prompt);
      
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
- Provide the direct URL to the undergraduate/graduate admissions page (not the homepage)

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
    "website": "string (direct URL to the relevant admissions page based on study level)"
  }
]`;

      const response = await getGeminiResponse(prompt);
      
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
            <Button className="w-full" onClick={handleAnswer}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
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
            <Button className="w-full" onClick={handleAnswer} disabled={!currentAnswer}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
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
            <Button className="w-full" onClick={handleAnswer} disabled={!currentAnswer}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
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
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-24">
        <div className="max-w-2xl mx-auto px-4">
          {error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-destructive">{error}</div>
                <Button className="w-full mt-4" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : currentStep === 'profile' ? (
            <Card>
              <CardHeader>
                <CardTitle>Smart University Recommender</CardTitle>
                <CardDescription>
                  Get personalized university recommendations based on your profile and preferences.
                  {currentUser?.preferences ? 
                    ` We found ${Object.keys(answers).length} preferences in your profile.` : 
                    ' Please sign in to use your profile information.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={generateQuestions}
                >
                  Continue to Questions
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ) : currentStep === 'questions' && questions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
                <CardDescription>
                  {questions[currentQuestionIndex].question}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderQuestion(questions[currentQuestionIndex])}
              </CardContent>
            </Card>
          ) : currentStep === 'results' ? (
            <div className="space-y-4">
              {universities.map((university) => (
                <motion.div
                  key={university.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardHeader>
                      <div>
                        <CardTitle>{university.name}</CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {university.location}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4 inline mr-1" />
                            Tuition: {university.tuitionRange}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            <Star className="h-4 w-4 inline mr-1" />
                            Match: {university.programMatch}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {university.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold">Requirements:</h3>
                          <ul className="text-sm space-y-1">
                            {university.requirements.map((req, index) => (
                              <li key={index} className="flex items-center">
                                <GraduationCap className="h-4 w-4 mr-2 text-primary" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              try {
                                const url = new URL(university.website);
                                window.open(url.toString(), '_blank', 'noopener,noreferrer');
                              } catch (e) {
                                console.error('Invalid URL:', university.website);
                                const searchQuery = `${university.name} ${academicProfile.studyLevel} admissions`;
                                window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            Learn More
                          </Button>
                          <Button 
                            className="flex-1"
                            onClick={async () => {
                              try {
                                // Ensure all required fields are present
                                const universityData: UniversityData = {
                                  id: university.id,
                                  name: university.name,
                                  location: university.location,
                                  tuitionRange: university.tuitionRange,
                                  programMatch: university.programMatch,
                                  requirements: university.requirements,
                                  rankings: university.rankings,
                                  tags: university.tags,
                                  website: university.website,
                                  applicationDeadline: university.applicationDeadline,
                                  scholarshipInfo: university.scholarshipInfo
                                };
                                await saveUniversity(universityData);
                                toast({
                                  title: "University saved!",
                                  description: "You can view it in your dashboard.",
                                  duration: 3000,
                                });
                              } catch (error) {
                                console.error('Error saving university:', error);
                                toast({
                                  title: "Failed to save university",
                                  description: "Please try again later.",
                                  variant: "destructive",
                                  duration: 3000,
                                });
                              }
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
} 