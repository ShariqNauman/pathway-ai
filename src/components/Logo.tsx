
import { motion } from "framer-motion";

const Logo = () => {
  return (
    <motion.div 
      className="flex items-center"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <span className="text-xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Pathway AI
      </span>
    </motion.div>
  );
};

export default Logo;
