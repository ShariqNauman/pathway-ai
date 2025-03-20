
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      <Header />
      <main className="flex-grow pt-28 pb-16 px-6 lg:px-10">
        <div className="max-w-4xl mx-auto prose dark:prose-invert">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Terms of Service
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Pathway AI's services, you accept and agree to be bound by the terms
              and conditions of this agreement. If you do not agree to these terms, please do not use our services.
            </p>
            
            <h2>2. Description of Service</h2>
            <p>
              Pathway AI provides AI-powered educational consulting services and essay analysis tools.
              We reserve the right to modify, suspend, or discontinue any aspect of our services at any time.
            </p>
            
            <h2>3. User Accounts</h2>
            <p>
              Some features of our services may require user registration. You are responsible for maintaining
              the confidentiality of your account information and for all activities that occur under your account.
            </p>
            
            <h2>4. User Content</h2>
            <p>
              By submitting content to our service, you grant Pathway AI a worldwide, non-exclusive license to use,
              reproduce, and modify your content solely for the purpose of providing our services to you.
            </p>
            
            <h2>5. Privacy</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use
              your information.
            </p>
            
            <h2>6. Limitations of Liability</h2>
            <p>
              Pathway AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages
              resulting from your use of or inability to use our services.
            </p>
            
            <h2>7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Your continued use of our services after such
              changes constitutes your acceptance of the new terms.
            </p>
            
            <h2>8. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of Saudi Arabia.
            </p>
            
            <h2>9. Contact Information</h2>
            <p>
              If you have any questions about these terms, please contact us at shariqnaumann@gmail.com.
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default TermsPage;
