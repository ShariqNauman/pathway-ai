
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Heart, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const DonationsPage = () => {
  const { currentUser } = useAuth();
  const [donationAmount, setDonationAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDonation = async (amount: number) => {
    if (!currentUser) {
      toast.error("Please sign in to make a donation");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          amount: amount * 100, // Convert to cents
          mode: 'payment', // One-time payment
          success_url: `${window.location.origin}/donations?success=true`,
          cancel_url: `${window.location.origin}/donations?canceled=true`
        }
      });

      if (error) {
        console.error('Donation error:', error);
        toast.error('Failed to process donation. Please try again.');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Donation error:', error);
      toast.error('Failed to process donation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedAmounts = [5, 10, 25, 50, 100];

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
              <div className="flex items-center justify-center mb-6">
                <Heart className="h-12 w-12 text-red-500 mr-3" />
                <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  Support Pathway AI
                </h1>
              </div>
            </motion.div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Help us continue providing free AI-powered educational guidance to students worldwide. 
              Your support makes a difference in someone's educational journey.
            </p>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-8 mb-12"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Quick Donation
                </CardTitle>
                <CardDescription>
                  Choose a predefined amount for a quick donation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {predefinedAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => handleDonation(amount)}
                      disabled={isLoading || !currentUser}
                      className="h-12"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Amount</CardTitle>
                <CardDescription>
                  Enter any amount you'd like to donate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="pl-9"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const amount = parseFloat(donationAmount);
                      if (amount >= 1) {
                        handleDonation(amount);
                      } else {
                        toast.error("Please enter an amount of at least $1");
                      }
                    }}
                    disabled={isLoading || !currentUser || !donationAmount || parseFloat(donationAmount) < 1}
                    className="px-8"
                  >
                    Donate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="text-center space-y-6">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-3">How Your Donation Helps</h3>
                <div className="text-left space-y-2 text-muted-foreground">
                  <p>• Keeps our AI services running and up-to-date</p>
                  <p>• Allows us to maintain free access for students in need</p>
                  <p>• Helps us develop new features and improve existing ones</p>
                  <p>• Supports our mission to democratize educational guidance</p>
                </div>
              </CardContent>
            </Card>
            
            {!currentUser && (
              <p className="text-muted-foreground">
                Please <a href="/login" className="text-primary hover:underline">sign in</a> to make a donation.
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default DonationsPage;
