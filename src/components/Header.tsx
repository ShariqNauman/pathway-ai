
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 lg:px-10",
        scrolled ? "py-4 glass shadow-sm" : "py-6"
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center space-x-8">
          {[
            { name: "Home", to: "/" },
            { name: "About", to: "/about" },
            { name: "Universities", to: "/universities" },
            { name: "Contact", to: "/contact" },
          ].map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition-all hover:text-primary",
                  isActive ? "text-primary" : "text-foreground/80"
                )
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <button className="hidden md:block px-5 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md transition-all hover:bg-primary/90">
            Get Started
          </button>
          <button className="block md:hidden p-2 text-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
