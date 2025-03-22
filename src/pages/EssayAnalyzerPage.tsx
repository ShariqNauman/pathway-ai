
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EssayChecker from "@/components/EssayChecker";

const EssayAnalyzerPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col bg-accent/10"
    >
      <Header />
      <main className="flex-grow container mx-auto px-0 md:px-4 overflow-hidden">
        <EssayChecker />
      </main>
      <Footer />
    </motion.div>
  );
};

export default EssayAnalyzerPage;
