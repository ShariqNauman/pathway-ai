import { motion } from "framer-motion";

export const StreamingAnimation = () => {
  return (
    <div className="flex items-center gap-2 mt-2 pl-1">
      <motion.div
        className="w-2 h-2 bg-primary/60 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="w-2 h-2 bg-primary/60 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />
      <motion.div
        className="w-2 h-2 bg-primary/60 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6,
        }}
      />
    </div>
  );
}; 