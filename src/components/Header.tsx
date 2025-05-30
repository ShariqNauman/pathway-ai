import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import Logo from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogIn, User, ChevronDown, Sparkles, PenLine, MessageSquare } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const toolsItems = [
    {
      name: "Smart Recommender",
      href: "/recommender",
      description: "Get personalized university recommendations based on your profile",
      icon: Sparkles
    },
    {
      name: "Essay Analyzer",
      href: "/essay-analyzer",
      description: "Analyze and improve your college application essays",
      icon: PenLine
    },
    {
      name: "Consultant",
      href: "/consultant",
      description: "Get expert guidance for your college applications",
      icon: MessageSquare
    }
  ];

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Donations", href: "/donations" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  // Handler for Tools & Services scroll
  const handleToolsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      const section = document.getElementById("learn-more");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/#learn-more");
    }
  };

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 py-4 px-6 transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/">
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <ul className="flex items-center space-x-8">
            <li>
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === "/" ? "text-primary font-semibold" : "hover:text-primary"
                }`}
              >
                Home
              </Link>
            </li>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={`text-sm font-medium transition-colors group ${
                      ["/recommender", "/essay-analyzer", "/consultant"].includes(location.pathname)
                        ? "text-primary font-semibold"
                        : "hover:text-primary"
                    }`}
                    onClick={handleToolsClick}
                    asChild={false}
                  >
                    <span>Tools & Services</span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-[400px] p-4"
                    >
                      <ul className="grid gap-3">
                        {toolsItems.map((item) => (
                          <motion.li
                            key={item.name}
                            whileHover={{ scale: 1.02 }}
                            className="group"
                          >
                            <Link
                              to={item.href}
                              className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                                location.pathname === item.href
                                  ? "bg-accent text-accent-foreground"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <item.icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{item.name}</span>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {item.description}
                              </p>
                            </Link>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <li>
              <Link
                to="/donations"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === "/donations" ? "text-primary font-semibold" : "hover:text-primary"
                }`}
              >
                Donations
              </Link>
            </li>
          </ul>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {currentUser ? (
              <Link to="/dashboard">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Sign Up</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-4 md:hidden">
          <ThemeToggle />
          
          {currentUser && (
            <Link to="/dashboard">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-foreground focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-md shadow-lg"
          >
            <nav className="px-4 py-5 space-y-4">
              <div className="border-b border-border pb-2 mb-2">
                <span className="text-sm text-muted-foreground">
                  Tools & Services
                </span>
              </div>
              {toolsItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 py-2 transition-colors ${
                    location.pathname === item.href ? "text-primary font-semibold" : "text-foreground hover:text-primary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-border pt-2 mt-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block py-2 transition-colors ${
                      location.pathname === item.href ? "text-primary font-semibold" : "text-foreground hover:text-primary"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              
              {!currentUser && (
                <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                  <Link to="/login">
                    <Button variant="outline" className="w-full justify-start">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" />
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Header;
