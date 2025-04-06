
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
          className="h-14 w-14 lg:h-16 lg:w-16" 
          style={{ filter: 'drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.2))' }}
        />
      </div>
      <span className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Pathway AI
      </span>
    </motion.div>
  );
};

export default Logo;
