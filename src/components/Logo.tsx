
import { motion } from "framer-motion";

const Logo = () => {
  return (
    <motion.div 
      className="flex items-center"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mr-2 bg-primary/20 rounded-full p-1 flex items-center justify-center">
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 122 122" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 lg:h-8 lg:w-8"
        >
          <path d="M56.9 11.5C59.3 10.1 62.7 10.1 65.1 11.5L116.6 40.9C119.3 42.4 119.3 46.1 116.6 47.6L65.1 76.9C62.7 78.3 59.3 78.3 56.9 76.9L5.4 47.6C2.7 46.1 2.7 42.4 5.4 40.9L56.9 11.5Z" fill="#0d55c8"/>
          <path d="M37 50.9V69.9C37 71.1 37.4 72.3 38.2 73.3C41.4 77.4 48.1 83.1 61 83.1C73.9 83.1 80.6 77.4 83.8 73.3C84.6 72.3 85 71.1 85 69.9V50.9L61 64.9L37 50.9Z" fill="#0d55c8"/>
          <path d="M101 63.4C102.657 63.4 104 62.057 104 60.4V46.5L96 51.1V60.4C96 62.057 97.343 63.4 99 63.4H101Z" fill="#0d55c8"/>
          <path d="M98.1 100.4C96.4 92.3 94 82.3 94 74.3C94 70.4 90.4 67.6 86.7 68.7C83.7 69.5 82 72.3 82 75.4C82 83.4 85.4 97.3 87.5 105.4C88.1 107.7 86.5 110 84.1 110H84.1C82.5 110 81.1 108.9 80.6 107.4C78.2 99.4 74.6 87.2 74 79.1C73.8 77.3 72.3 76 70.5 76H70.5C68.4 76 66.8 77.7 67 79.8C67.7 87.9 71.3 100.1 73.7 108.1C74.9 112.2 78.7 115 83 115H85C90.1 115 94.3 111 95.1 105.9L98.1 100.4Z" fill="#65b2ff"/>
        </svg>
      </div>
      <span className="text-lg font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Pathway AI
      </span>
    </motion.div>
  );
};

export default Logo;
