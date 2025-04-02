import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Heart, Coffee, Star, Trophy } from "lucide-react";

const DonationsPage = () => {
  const donationTiers = [
    {
      title: "Buy me a coffee",
      amount: "5",
      icon: Coffee,
      description: "Support our mission to make quality education guidance accessible to everyone",
      benefits: ["Show your appreciation", "Help keep the platform free"]
    },
    {
      title: "Supporter",
      amount: "20",
      icon: Heart,
      description: "Help us maintain and improve our AI consultant and essay analysis tools",
      benefits: ["All previous benefits", "Priority feature requests", "Name in supporters list"]
    },
    {
      title: "Champion",
      amount: "50",
      icon: Star,
      description: "Enable us to add new features and expand our services",
      benefits: ["All previous benefits", "Early access to new features", "Monthly supporter badge"]
    },
    {
      title: "Patron",
      amount: "100",
      icon: Trophy,
      description: "Become a key contributor to our platform's growth",
      benefits: ["All previous benefits", "Direct input on feature development", "Patron badge", "Special mention"]
    }
  ];

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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Support Our Mission</h1>
            <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <span className="font-semibold">100% Free Platform</span>
            </div>
            <p className="text-xl text-muted-foreground">
              Help us keep education guidance free and accessible for students worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {donationTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <Card key={tier.title} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <CardTitle>{tier.title}</CardTitle>
                    </div>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">${tier.amount}</span>
                      <span className="text-muted-foreground"> USD</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {tier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-primary" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" onClick={() => window.open('https://ko-fi.com/yourname')}>
                      Donate ${tier.amount}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Why Support Us?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're committed to keeping our platform free for everyone. Your support helps us maintain our services, 
              improve our AI capabilities, and expand our features to help more students achieve their educational goals.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default DonationsPage; 