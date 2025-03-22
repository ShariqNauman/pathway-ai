
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatConsultant from "@/components/ChatConsultant";
import { SidebarProvider } from "@/components/ui/sidebar";

const ConsultantPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex w-full pt-16" // Added pt-16 to prevent header overlap
      >
        <SidebarProvider>
          <div className="flex flex-1 w-full">
            <ChatConsultant />
          </div>
        </SidebarProvider>
      </motion.div>
      <Footer />
    </div>
  );
};

export default ConsultantPage;
