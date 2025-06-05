
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
    <div className="flex flex-col min-h-screen bg-background">
      <Helmet>
        <title>AI Consultant | Educational Advisor</title>
        <meta name="description" content="Get personalized university advice from our AI consultant" />
      </Helmet>
      
      <Header />
      
      {/* Main content with padding to avoid navbar overlap */}
      <main className="flex-1 flex flex-col pt-16">
        <div className="flex-1 flex flex-col h-[calc(100vh-9rem)]">
          <ChatConsultant initialSidebarOpen={sidebarOpen} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ConsultantPage;
