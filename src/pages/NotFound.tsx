
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center py-20 px-6">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block rounded-full bg-accent/50 p-6 mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            The page you were looking for doesn't exist or has been moved.
          </p>
          <Link 
            to="/" 
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-md font-medium shadow hover:shadow-lg hover:bg-primary/90 transition-all"
          >
            Return to Home
          </Link>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
