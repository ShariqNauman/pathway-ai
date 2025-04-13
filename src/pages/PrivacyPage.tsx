import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const PrivacyPage = () => {
  useEffect(() => {
    document.title = "Privacy Policy | Pathway";
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
      <main className="flex-grow pt-28 pb-16 px-6 lg:px-10">
        <div className="max-w-4xl mx-auto prose dark:prose-invert">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Privacy Policy
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, 
              submit an essay for analysis, or contact us. This may include your name, email address, 
              and the content of your essays or messages.
            </p>
            
            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, 
              to communicate with you, and to develop new products and services.
            </p>
            
            <h2>3. Data Storage and Security</h2>
            <p>
              We implement reasonable security measures to protect your personal information. 
              However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
            
            <h2>4. Sharing Your Information</h2>
            <p>
              We do not sell your personal information. We may share your information with third-party 
              service providers who help us deliver our services, but only as necessary to provide these services to you.
            </p>
            
            <h2>5. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information. You may also have 
              additional rights depending on your location.
            </p>
            
            <h2>6. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our service and 
              hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
            
            <h2>7. Children's Privacy</h2>
            <p>
              Our service is not directed to children under 13. We do not knowingly collect personal 
              information from children under 13.
            </p>
            
            <h2>8. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page.
            </p>
            
            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at shariqnaumann@gmail.com.
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
};

export default PrivacyPage;
