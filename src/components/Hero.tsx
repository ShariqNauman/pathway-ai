import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Hero = () => {
  const { currentUser } = useUser();
  
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

  const missingFields = currentUser ? getMissingFields() : [];
  const showWarning = !currentUser || missingFields.length > 0;

  const demoMessages = [
    { sender: "user", message: "Hi, I'm looking for universities for computer science with a budget of around $30,000 per year." },
    { sender: "ai", message: "I'd be happy to help you find universities for computer science within your budget. Could you tell me a bit more about your academic background and preferences? What country are you looking to study in?" },
    { sender: "user", message: "I'm looking to study in the United States. I have a GPA of 3.7/4.0 and an SAT score of 1380." },
    { sender: "ai", message: "Based on your academic profile and budget of $30,000 per year, here are some excellent universities for Computer Science in the United States:\n\n1. **Arizona State University** - Strong CS program with tuition around $29,800 for international students.\n\n2. **University of Texas at Arlington** - ABET-accredited CS program with tuition of approximately $28,500.\n\n3. **North Carolina State University** - Excellent tech connections with tuition around $29,200.\n\n4. **University of Massachusetts Amherst** - Top-ranked CS program with costs around $30,500.\n\n5. **Florida State University** - Growing CS department with tuition around $27,800.\n\nWould you like more specific information about any of these universities?" }
  ];

  return (
    <section className="relative min-h-screen pt-32 pb-20 px-6 lg:px-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/50 via-background to-background -z-10"></div>
      
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5OTk5OTkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bTAtMTJ2Nmg2di02aC02em0tMTIgMTJ2Nmg2di02aC02em0wLTEydjZoNnYtNmgtNnptMCAxMnYxMmgxMlYyMkgyNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50 -z-10"></div>
      
      <div className="max-w-7xl mx-auto">
        {!currentUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please <Link to="/login" className="font-medium underline hover:text-destructive/90">sign in</Link> or{' '}
                <Link to="/signup" className="font-medium underline hover:text-destructive/90">create an account</Link> to receive personalized university recommendations.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.span 
              className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-accent text-accent-foreground mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            >
              AI-Powered Education Guidance
            </motion.span>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            >
              Find your <span className="text-primary">perfect</span> 
              <br />educational pathway
            </motion.h1>
            
            <motion.div
              className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
            >
              <span className="font-medium">100% Free Platform</span>
            </motion.div>
            
            <motion.div
              className="mb-6 p-4 bg-accent/30 rounded-lg border border-primary/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center">
                  <img 
                    src="/lovable-uploads/21edf6cf-d44f-40a4-bb90-00dcc0318c7c.png" 
                    alt="Pathway AI Logo" 
                    className="h-8 w-8" 
                  />
                </div>
                <h3 className="font-medium text-lg">How Our AI Works</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Our advanced artificial intelligence analyzes your academic profile, goals, and preferences to match you with ideal universities. It processes data from 2,500+ institutions to provide personalized recommendations tailored just for you.
              </p>
            </motion.div>
            
            <motion.p 
              className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            >
              Personalized university recommendations and guidance powered by advanced AI to help you discover your ideal academic journey.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            >
              <Link to="/consultant" className="px-8 py-3 rounded-md bg-primary text-primary-foreground font-medium shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all w-full sm:w-auto text-center">
                Get Started
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden glass-card aspect-[4/3]">
              <img 
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80" 
                alt="University campus"
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <img 
                  src="/lovable-uploads/21edf6cf-d44f-40a4-bb90-00dcc0318c7c.png" 
                  alt="Pathway AI Logo" 
                  className="w-40 h-40 opacity-95"
                />
              </div>
              
              <motion.div 
                className="absolute top-6 left-6 glass-card rounded-lg px-4 py-3 shadow-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.7 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18.664a8.986 8.986 0 00-4-2.385v-1.5a1 1 0 01.55-.9l3.11-1.332a1 1 0 00.55-.9v-1.623l-5.366-2.3a.998.998 0 01-.418-.331c-.094.075-.205.159-.323.249 3.22 1.871 4.893 3.363 4.893 6.122 0 1.654-.555 3.063-1.696 4.125.156.132.296.248.418.331a1 1 0 001.222-.13zm-.826-1.19c.45-.627.69-1.287.69-2.072 0-1.509-1.009-2.297-2.902-3.397.934-.51 2.19-.547 3.343.716a8.132 8.132 0 01-1.131 4.753z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Universities</p>
                    <p className="text-sm font-semibold">2,500+ Options</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute bottom-6 right-6 glass-card rounded-lg px-4 py-3 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.8 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Satisfaction</p>
                    <p className="text-sm font-semibold">98% Student Rating</p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/30 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10"></div>
          </motion.div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 lg:mt-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">See the AI Consultant in Action</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch a quick demo of how our AI consultant helps students find the perfect universities for their academic journey.
          </p>
        </div>
        
        <div className="bg-card border rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-border p-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/21edf6cf-d44f-40a4-bb90-00dcc0318c7c.png" 
                alt="Pathway AI Logo" 
                className="h-10 w-10" 
              />
              <h3 className="font-bold">AI University Consultant</h3>
            </div>
          </div>
          
          <div className="p-6 max-h-[500px] overflow-y-auto">
            <div className="space-y-6">
              {demoMessages.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex ${item.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-2xl p-4 rounded-lg ${
                      item.sender === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    }`}
                  >
                    {item.sender === "ai" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ 
                          __html: item.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n\n/g, '<br /><br />') 
                        }} />
                      </div>
                    ) : (
                      <p>{item.message}</p>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-center mt-6">
                <Link to="/consultant" className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors">
                  <span>Try it yourself</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
