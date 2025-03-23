
import { PanelLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EssayChecker from "@/components/EssayChecker";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const EssayAnalyzerPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area that takes full height between header and footer */}
        <div className="flex flex-1 relative">
          {/* Sidebar toggle button - positioned inside the content area */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-50 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelLeft size={20} />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          
          {/* Main content container with EssayChecker */}
          <div className="flex-1 h-full overflow-hidden">
            <EssayChecker initialSidebarOpen={sidebarOpen} />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default EssayAnalyzerPage;
