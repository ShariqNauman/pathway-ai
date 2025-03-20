
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
      className="min-h-screen flex flex-col"
    >
      <Header />
      <main className="flex-grow">
        <EssayChecker />
      </main>
      <Footer />
    </motion.div>
  );
};

export default EssayAnalyzerPage;
