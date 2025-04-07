
import React from 'react';
import { CustomButton } from './ui/CustomButton';
import { ArrowRight } from 'lucide-react';
import { Animation } from './ui/Animation';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50 to-purple-100/60 -z-10"></div>
      
      {/* Abstract Shapes */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 right-40 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Animation
            animation="custom"
            customVariants={{
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0 }
            }}
            duration={0.6}
            className="inline-block"
          >
            <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-medium text-purple-700 bg-purple-100 border border-purple-200 mx-auto shadow-sm">
              <motion.span 
                animate={{ 
                  scale: [1, 1.1, 1], 
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center"
              >
                ✨
              </motion.span>
              <span>MuleSoft Developer Portal</span>
            </div>
          </Animation>
          
          {/* Heading */}
          <Animation
            animation="custom"
            customVariants={{
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0 }
            }}
            duration={0.7}
            delay={0.2}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 mb-6">
              The only <span className="text-purple-600 relative">
                AI coding agents
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-purple-200" viewBox="0 0 100 12" preserveAspectRatio="none">
                  <path d="M0,0 Q50,12 100,0" fill="currentColor" />
                </svg>
              </span> <br className="hidden md:block" />
              optimized for MuleSoft
            </h1>
          </Animation>
          
          {/* Description */}
          <Animation
            animation="custom"
            customVariants={{
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0 }
            }}
            duration={0.7}
            delay={0.4}
          >
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Get it right the first time with CurieTech AI assistant
            </p>
          </Animation>
          
          {/* CTA Buttons */}
          <Animation
            animation="custom"
            customVariants={{
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0 }
            }}
            duration={0.7}
            delay={0.6}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <CustomButton 
                variant="primary" 
                size="lg"
                icon={<ArrowRight size={18} />}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                Test Drive
              </CustomButton>
              <CustomButton 
                variant="secondary"
                size="lg"
                className="bg-white text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                Sign Up for Free
              </CustomButton>
            </div>
          </Animation>
          
          {/* Trusted By Section */}
          <Animation
            animation="custom"
            customVariants={{
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0 }
            }}
            duration={0.7}
            delay={0.8}
          >
            <div className="mt-16">
              <p className="text-sm text-gray-500 mb-4">TRUSTED BY INDUSTRY LEADERS</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
                <div className="w-24 h-8 bg-gray-300 rounded-md animate-pulse"></div>
                <div className="w-24 h-8 bg-gray-300 rounded-md animate-pulse"></div>
                <div className="w-24 h-8 bg-gray-300 rounded-md animate-pulse"></div>
                <div className="w-24 h-8 bg-gray-300 rounded-md animate-pulse"></div>
                <div className="w-24 h-8 bg-gray-300 rounded-md animate-pulse"></div>
              </div>
            </div>
          </Animation>
        </div>
      </div>
    </section>
  );
};
