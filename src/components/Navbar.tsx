
import React, { useState, useEffect } from 'react';
import { Logo } from './assets/Logo';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const navLinks = [
  { name: 'Why Curie', href: '#why-curie' },
  { name: 'Platform', href: '#platform' },
  { name: 'Use Cases', href: '#use-cases' },
  { name: 'Resources', href: '#resources' },
  { name: 'Company', href: '#company' },
  { name: 'Pricing', href: '#pricing' },
];

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-sm py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container px-4 mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href={session ? '/dashboard' : '/'} className="flex items-center z-10">
          <Logo className="text-2xl" />
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {session ? (
            <>
              <Link 
                to="/dashboard"
                className="text-gray-700 hover:text-black font-medium transition-colors"
              >
                Dashboard
              </Link>
              <a 
                href="#"
                className="text-gray-700 hover:text-black font-medium transition-colors"
              >
                My Agents
              </a>
              <a 
                href="#"
                className="text-gray-700 hover:text-black font-medium transition-colors"
              >
                Settings
              </a>
            </>
          ) : (
            <>
              {navLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 hover:text-black font-medium transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </>
          )}
        </nav>
        
        {/* CTA Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {session ? (
            <button 
              className="px-4 py-2 font-medium text-gray-700 hover:text-black transition-colors"
              onClick={handleSignOut}
            >
              Logout
            </button>
          ) : (
            <>
              <Link 
                to="/auth"
                className="px-4 py-2 font-medium text-gray-700 hover:text-black transition-colors"
              >
                Login
              </Link>
              <Link
                to="/auth?signup=true"
                className="px-4 py-2 rounded-full bg-black text-white font-medium hover:bg-black/90 transition-colors"
              >
                Sign up for Free
              </Link>
            </>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden z-10 p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {/* Mobile Menu */}
        <div className={`
          fixed inset-0 bg-white z-[40] md:hidden transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col px-6 pt-24 pb-8
        `}>
          <nav className="flex flex-col space-y-6 text-lg">
            {session ? (
              <>
                <Link 
                  to="/dashboard"
                  className="text-gray-800 hover:text-black font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <a 
                  href="#"
                  className="text-gray-800 hover:text-black font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Agents
                </a>
                <a 
                  href="#"
                  className="text-gray-800 hover:text-black font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </a>
              </>
            ) : (
              <>
                {navLinks.map((link) => (
                  <a 
                    key={link.name}
                    href={link.href}
                    className="text-gray-800 hover:text-black font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
              </>
            )}
          </nav>
          
          <div className="mt-auto space-y-4">
            {session ? (
              <button 
                className="w-full px-4 py-2 text-center font-medium text-gray-700 hover:text-black transition-colors"
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
              >
                Logout
              </button>
            ) : (
              <>
                <Link 
                  to="/auth"
                  className="block w-full px-4 py-2 text-center font-medium text-gray-700 hover:text-black transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/auth?signup=true"
                  className="block w-full px-4 py-2 rounded-full bg-black text-white text-center font-medium hover:bg-black/90 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up for Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
