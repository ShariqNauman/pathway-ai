
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const Footer = () => {
  return (
    <motion.footer
      id="contact"
      className="w-full bg-secondary/50 border-t border-border py-12 px-6 lg:px-10"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-4">
          <Link to="/">
            <Logo />
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your AI-powered university consultant helping you find the perfect educational path.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4">Navigation</h4>
          <ul className="space-y-3">
            <li>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="/recommender" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Smart Recommender
              </Link>
            </li>
            <li>
              <Link to="/essay-analyzer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Essay Analyzer
              </Link>
            </li>
            <li>
              <Link to="/consultant" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Consultant
              </Link>
            </li>
            <li>
              <Link to="/donations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Donations
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4">Legal</h4>
          <ul className="space-y-3">
            <li>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4">Contact</h4>
          <ul className="space-y-3">
            <li className="text-sm text-muted-foreground">shariqnaumann@gmail.com</li>
            <li className="text-sm text-muted-foreground">Jeddah, Saudi Arabia</li>
            <li className="flex space-x-4 mt-4">
              {[
                "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
                "M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z"
              ].map((d, i) => (
                <a key={i} href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox={i === 1 ? "0 0 15 15" : "0 0 24 24"}
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d={d} />
                  </svg>
                </a>
              ))}
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} Pathway AI. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;
