import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BadgeDollarSign, Star, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const PricingPage = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    document.title = "Pricing | Pathway AI Plans";
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      <Header />
      <main className="flex-grow py-20 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Choose Your Plan
              </h1>
            </motion.div>
            <div className="inline-block bg-primary/10 text-primary px-6 py-3 rounded-full mb-6">
              <span className="font-semibold">Flexible pricing for every learner</span>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock premium features and personalized guidance with our affordable plans
            </p>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-16"
          >
            <div className="grid grid-cols-4 gap-6 max-w-screen-xl mx-auto">
              {/* Features Column */}
              <div className="bg-background shadow-md rounded-lg border border-border min-w-[180px]">
                <div className="p-6 h-[140px] flex flex-col justify-center">
                  <h2 className="text-xl font-bold text-muted-foreground">Features</h2>
                </div>
                <div className="px-6">
                  <ul className="space-y-[42px] text-muted-foreground">
                    <li className="min-h-[40px] flex items-center">
                      <div className="flex items-center gap-2">
                        <BadgeDollarSign className="h-5 w-5 text-primary" />
                        <span>Smart Recommender</span>
                      </div>
                    </li>
                    <li className="min-h-[40px] flex items-center">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" />
                        <span>Essay Analyzer</span>
                      </div>
                    </li>
                    <li className="min-h-[40px] flex items-center">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span>AI Consultant</span>
                      </div>
                    </li>
                    <li className="min-h-[40px] flex items-center">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span>Extras</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Basic Plan */}
              <Card className="relative overflow-hidden border-2 border-primary/20 shadow-lg min-w-[280px]">
                <CardHeader className="text-center p-6 h-[140px] flex flex-col justify-center">
                  <CardTitle className="text-2xl">Basic (Free)</CardTitle>
                  <CardDescription className="text-lg">Ideal for exploring features with daily help.</CardDescription>
                </CardHeader>
                <CardContent className="text-center px-6">
                  <ul className="space-y-[42px] text-muted-foreground">
                    <li className="min-h-[40px] flex items-center justify-center">5 uses/month</li>
                    <li className="min-h-[40px] flex items-center justify-center">3 essays/month</li>
                    <li className="min-h-[40px] flex items-center justify-center">
                      <div className="flex flex-col">
                        <span>10 messages/day</span>
                        <span className="text-sm text-muted-foreground/80">Max 100 messages/month</span>
                      </div>
                    </li>
                    <li className="min-h-[40px] flex items-center justify-center">-</li>
                  </ul>
                  {!currentUser && (
                    <Button size="lg" className="w-full mt-8">Get Started</Button>
                  )}
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="relative overflow-visible border-2 border-primary shadow-xl bg-gradient-to-b from-background to-primary/5 min-w-[280px]">
                <div className="absolute -top-4 left-0 right-0 text-center z-20">
                  <span className="bg-primary text-primary-foreground text-sm font-semibold px-6 py-1.5 rounded-full shadow-lg">
                    Most Popular
                  </span>
                </div>
                <CardHeader className="text-center p-6 pt-6 h-[140px] flex flex-col justify-center">
                  <CardTitle className="text-2xl">Pro – $7/month</CardTitle>
                  <CardDescription className="text-base">For serious applicants who want AI-backed support daily.</CardDescription>
                </CardHeader>
                <CardContent className="text-center px-6">
                  <ul className="space-y-[42px] text-muted-foreground">
                    <li className="min-h-[40px] flex items-center justify-center">60 uses/month</li>
                    <li className="min-h-[40px] flex items-center justify-center">30 essays/month</li>
                    <li className="min-h-[40px] flex items-center justify-center">30 messages/day</li>
                    <li className="min-h-[40px] flex items-center justify-center">-</li>
                  </ul>
                  <Button size="lg" className="w-full mt-8 bg-gradient-to-r from-primary to-primary/90">Choose Pro</Button>
                </CardContent>
              </Card>

              {/* Yearly Plan */}
              <Card className="relative overflow-visible border-2 border-primary/20 shadow-lg min-w-[280px]">
                <div className="absolute -top-6 left-0 right-0 text-center z-30">
                  <span className="bg-green-500 text-white text-sm font-semibold px-6 py-1.5 rounded-full shadow-lg">
                    Save 40%!
                  </span>
                </div>
                <CardHeader className="text-center p-6 h-[140px] flex flex-col justify-center">
                  <CardTitle className="text-2xl">Yearly – $50/year</CardTitle>
                  <CardDescription className="text-lg">Best value for long-term users.</CardDescription>
                </CardHeader>
                <CardContent className="text-center px-6">
                  <ul className="space-y-[42px] text-muted-foreground">
                    <li className="min-h-[40px] flex items-center justify-center">Unlimited</li>
                    <li className="min-h-[40px] flex items-center justify-center">360 essays/year</li>
                    <li className="min-h-[40px] flex items-center justify-center">50 messages/day</li>
                    <li className="min-h-[40px] flex items-center justify-center">
                      Priority support + 1 personalized Zoom/Chat consult
                    </li>
                  </ul>
                  <Button size="lg" className="w-full mt-8">Choose Yearly</Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <div className="text-center space-y-6">
            <h2 className="text-2xl font-semibold">Why Go Premium?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Unlock advanced features, get priority support, and accelerate your educational journey. Our premium plans are designed to empower students, professionals, and organizations to achieve more with Pathway AI.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default PricingPage;
