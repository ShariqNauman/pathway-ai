
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ChatConsultant from "@/components/ChatConsultant";
import Testimonials from "@/components/Testimonials";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import EssayChecker from "@/components/EssayChecker";

const Index = () => {
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
        <Hero />
        <Features />
        <EssayChecker />
        <ChatConsultant />
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
    </motion.div>
  );
};

export default Index;
