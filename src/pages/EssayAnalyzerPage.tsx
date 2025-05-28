
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EssayChecker from "@/components/EssayChecker";

const EssayAnalyzerPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    document.title = "Essay Analyzer | AI-Powered Essay Feedback";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Main content with padding to avoid navbar overlap */}
      <main className="flex-1 pt-16">
        <div className="max-w-6xl mx-auto px-4 h-[calc(100vh-4rem)]">
          <EssayChecker initialSidebarOpen={sidebarOpen} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EssayAnalyzerPage;
