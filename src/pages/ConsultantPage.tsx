import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatConsultant from "@/components/ChatConsultant";
import { Helmet } from "react-helmet-async";

const ConsultantPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to false so sidebar starts closed

  useEffect(() => {
    document.title = "AI College Consultant | Pathway";
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>AI Consultant | Educational Advisor</title>
        <meta name="description" content="Get personalized university advice from our AI consultant" />
      </Helmet>
      
      <Header />
      
      {/* Main content with padding to avoid navbar overlap */}
      <main className="flex-grow pt-28 pb-16 px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-6">AI College Consultant</h1>
          <p className="text-muted-foreground mb-8">
            Coming soon! Our AI College Consultant will help you navigate the college application process with personalized advice and guidance.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ConsultantPage;
