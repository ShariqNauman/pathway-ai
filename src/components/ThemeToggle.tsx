
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { motion } from "framer-motion";
import { Toggle } from "./ui/toggle";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center space-x-1"
    >
      <Toggle
        aria-label="Toggle theme"
        pressed={theme === "dark"}
        onPressedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="rounded-full p-2 hover:bg-accent"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: theme === "dark" ? 360 : 0 }}
          transition={{ duration: 0.5 }}
        >
          {theme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </motion.div>
      </Toggle>
    </motion.div>
  );
}
