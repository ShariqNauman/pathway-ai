
import { motion } from "framer-motion";

const Logo = () => {
  return (
    <motion.div 
      className="flex items-center"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mr-2">
        <img 
          src="/lovable-uploads/96a40c4b-78e6-487f-9ed0-48f7b1e567cf.png" 
          alt="Pathway AI Logo" 
          className="h-14 w-14 lg:h-16 lg:w-16" 
        />
      </div>
      <span className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Pathway AI
      </span>
    </motion.div>
  );
};

export default Logo;
