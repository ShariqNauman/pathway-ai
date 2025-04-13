import { motion } from "framer-motion";

export const StreamingAnimation = () => {
  return (
    <div className="flex items-center gap-1 mt-2 h-2">
      <motion.div
        className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0
        }}
      />
      <motion.div
        className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0.2
        }}
      />
      <motion.div
        className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0.4
        }}
      />
    </div>
  );
}; 