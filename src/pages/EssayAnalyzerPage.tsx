
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EssayChecker from "@/components/EssayChecker";
import { SidebarProvider } from "@/components/ui/sidebar";

const EssayAnalyzerPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex flex-1 w-full">
        <div className="flex-1 pt-16 pb-16"> {/* Added padding for header and footer space */}
          <SidebarProvider>
            <EssayChecker />
          </SidebarProvider>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EssayAnalyzerPage;
