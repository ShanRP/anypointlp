
import React from 'react';
import { Logo } from './assets/Logo';
import { Github, Linkedin, Twitter, Mail, ArrowRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container px-4 mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div className="col-span-1 lg:col-span-1">
            <Logo className="mb-4" />
            <p className="text-gray-600 mb-4">
              A centralized hub for MuleSoft developers to access resources, tools, and community support.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Features</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">AI Tools</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Community</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Marketplace</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Certification</a></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Documentation</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Tutorials</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">FAQs</a></li>
              <li><a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Support</a></li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Stay Updated</h3>
            <p className="text-gray-600 mb-4">Subscribe to our newsletter for the latest updates and features.</p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button className="bg-purple-600 text-white p-2 rounded-r-md hover:bg-purple-700 transition-colors">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Anypoint Learning Platform. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-purple-600 text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-purple-600 text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-purple-600 text-sm transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
