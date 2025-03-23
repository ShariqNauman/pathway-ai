
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EssayChecker from "@/components/EssayChecker";

const EssayAnalyzerPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      {/* Main content with padding to avoid navbar overlap */}
      <main className="flex-1 flex flex-col pt-16">
        <div className="flex-1 flex flex-col h-[calc(100vh-9rem)]">
          <EssayChecker initialSidebarOpen={sidebarOpen} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EssayAnalyzerPage;
