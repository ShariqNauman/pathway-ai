
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatConsultant from "@/components/ChatConsultant";
import { SidebarProvider } from "@/components/ui/sidebar";

const ConsultantPage = () => {
  return (
    <SidebarProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex flex-col bg-background w-full"
      >
        <Header />
        <main className="flex-grow flex w-full">
          <ChatConsultant />
        </main>
        <Footer />
      </motion.div>
    </SidebarProvider>
  );
};

export default ConsultantPage;
