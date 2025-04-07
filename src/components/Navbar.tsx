
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false);
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-blue-600">React<span className="text-foreground">App</span></span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => scrollToSection('home')} 
                className="text-foreground hover:text-blue-600 transition-colors"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('features')} 
                className="text-foreground hover:text-blue-600 transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')} 
                className="text-foreground hover:text-blue-600 transition-colors"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('contact')} 
                className="text-foreground hover:text-blue-600 transition-colors"
              >
                Contact
              </button>
              <Button onClick={() => scrollToSection('contact')}>Get Started</Button>
            </div>
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-blue-600 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-t mt-2 animate-fade-in">
            <div className="px-2 py-3 space-y-1 sm:px-3">
              <button
                onClick={() => scrollToSection('home')}
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-blue-50 hover:text-blue-600 w-full text-left"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-blue-50 hover:text-blue-600 w-full text-left"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-blue-50 hover:text-blue-600 w-full text-left"
              >
                Testimonials
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-blue-50 hover:text-blue-600 w-full text-left"
              >
                Contact
              </button>
              <Button
                onClick={() => scrollToSection('contact')}
                className="w-full mt-4"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
