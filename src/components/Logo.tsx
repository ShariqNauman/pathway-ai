
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
          src="/lovable-uploads/21edf6cf-d44f-40a4-bb90-00dcc0318c7c.png" 
          alt="Pathway AI Logo" 
          className="h-10 w-10 lg:h-12 lg:w-12" 
        />
      </div>
      <span className="text-xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Pathway AI
      </span>
    </motion.div>
  );
};

export default Logo;
