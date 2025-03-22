
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EssayChecker from "@/components/EssayChecker";
import { SidebarProvider } from "@/components/ui/sidebar";

const EssayAnalyzerPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex flex-1 w-full pt-16"> {/* Changed from fixed margin to pt-16 padding-top */}
        <SidebarProvider>
          <div className="flex flex-1 w-full">
            <EssayChecker />
          </div>
        </SidebarProvider>
      </div>
      <Footer />
    </div>
  );
};

export default EssayAnalyzerPage;
