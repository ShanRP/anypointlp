
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useAnimations } from "@/utils/animationUtils";
import { Link } from "react-router-dom";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { fadeIn } = useAnimations();

  return (
    <footer className="bg-black/95 text-white py-16 z-10 relative" id="contact">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              AnypointLP
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Transforming MuleSoft workflows with AI-powered solutions for developers, architects, and businesses.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="mailto:info@anypointlp.com" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className="font-semibold text-lg mb-4">Product</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="#features" className="hover:text-purple-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-purple-400 transition-colors">
                  Security
                </a>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-purple-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/auth?signup=true" className="hover:text-purple-400 transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="font-semibold text-lg mb-4">Resources</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link to="/about" className="hover:text-purple-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <a href="https://blogs.mulecraft.in/" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <Link to="/docs" className="hover:text-purple-400 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <a href="#contact" className="hover:text-purple-400 transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className="font-semibold text-lg mb-4">Legal</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link to="/terms" className="hover:text-purple-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-purple-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-purple-400 transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/compliance" className="hover:text-purple-400 transition-colors">
                  Compliance
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          className="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p>&copy; {currentYear} AnypointLP. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-4 justify-center">
            <a href="#" className="hover:text-purple-400 transition-colors">Terms</a>
            <span className="hidden md:inline">•</span>
            <a href="#" className="hover:text-purple-400 transition-colors">Privacy</a>
            <span className="hidden md:inline">•</span>
            <a href="#" className="hover:text-purple-400 transition-colors">Cookies</a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
