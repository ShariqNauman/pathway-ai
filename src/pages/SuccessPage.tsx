
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { CheckCircle } from "lucide-react";

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    document.title = "Payment Successful | Pathway AI";
    
    // Get session ID from URL
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Verify the subscription and refresh subscription data
      const verifySubscription = async () => {
        try {
          setIsVerifying(true);
          await refreshSubscription();
          // Redirect to dashboard after a delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 5000);
        } catch (error) {
          console.error("Error verifying subscription:", error);
        } finally {
          setIsVerifying(false);
        }
      };
      
      verifySubscription();
    } else {
      // No session ID, redirect to home
      navigate('/');
    }
  }, [searchParams, refreshSubscription, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-8 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-card p-8 rounded-lg shadow-lg border border-border max-w-2xl mx-auto"
          >
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-24 w-24 text-green-500" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">
              Payment Successful!
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6">
              Thank you for subscribing to Pathway AI. Your account has been upgraded successfully.
            </p>
            
            {isVerifying ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-primary animate-bounce" />
                <div className="h-4 w-4 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                <div className="h-4 w-4 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 text-sm text-muted-foreground">Verifying subscription...</span>
              </div>
            ) : (
              <p className="text-muted-foreground">
                You will be redirected to the dashboard in a few seconds...
              </p>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SuccessPage;
