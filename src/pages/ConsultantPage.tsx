
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatConsultant from "@/components/ChatConsultant";

const ConsultantPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      <Header />
      <main className="flex-grow">
        <ChatConsultant />
      </main>
      <Footer />
    </motion.div>
  );
};

export default ConsultantPage;
