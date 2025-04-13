import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Heart, Coffee, GraduationCap, Sparkles } from "lucide-react";
import { useEffect } from "react";

const DonationsPage = () => {
  useEffect(() => {
    document.title = "Support Pathway | Keep Education Accessible";
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Support Our Mission
              </h1>
            </motion.div>
            <div className="inline-block bg-primary/10 text-primary px-6 py-3 rounded-full mb-6">
              <span className="font-semibold">100% Free Platform</span>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help us keep education guidance free and accessible for students worldwide
            </p>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-16"
          >
            <Card className="relative overflow-hidden border-2 border-primary/20 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
                <div className="absolute inset-0 bg-primary/10 rounded-full"></div>
              </div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl mb-3 flex items-center justify-center gap-3">
                  <Heart className="h-8 w-8 text-primary animate-pulse" />
                  Make a Difference
                </CardTitle>
                <CardDescription className="text-lg">
                  Your contribution helps us improve and expand our services
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex flex-col items-center p-4 rounded-lg bg-primary/5">
                    <GraduationCap className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Support Education</h3>
                    <p className="text-sm text-muted-foreground">Help students achieve their dreams</p>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-primary/5">
                    <Coffee className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Fuel Development</h3>
                    <p className="text-sm text-muted-foreground">Enable new features and improvements</p>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-primary/5">
                    <Sparkles className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Create Impact</h3>
                    <p className="text-sm text-muted-foreground">Shape the future of education</p>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90"
                  onClick={() => window.open('https://ko-fi.com/pathwayai')}
                >
                  Make a Donation
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <div className="text-center space-y-6">
            <h2 className="text-2xl font-semibold">Why Support Us?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We believe in making quality education guidance accessible to everyone. Your support, no matter the amount, 
              helps us maintain our services, improve our AI capabilities, and expand our features to help more students 
              achieve their educational goals. Together, we can make a difference in students' lives worldwide.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default DonationsPage; 