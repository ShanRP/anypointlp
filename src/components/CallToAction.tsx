
import React from 'react';
import { CustomButton } from './ui/CustomButton';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Animation } from './ui/Animation';
import { motion } from 'framer-motion';

export const CallToAction: React.FC = () => {
  const benefitItems = [
    "Automate repetitive coding tasks",
    "Reduce development time by 80%",
    "Ensure code quality and consistency",
    "Accelerate team onboarding"
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-800 -z-10"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 right-20 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/2 md:pr-8">
            <Animation
              animation="custom"
              customVariants={{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0 }
              }}
              duration={0.8}
              triggerOnce
            >
              <div className="inline-block px-3 py-1 mb-4 text-sm font-medium text-white bg-white/10 rounded-full backdrop-blur-sm border border-white/20 font-montserrat">
                ACCELERATE YOUR WORKFLOW
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white font-display">
                Deliver MuleSoft projects faster
              </h2>
            </Animation>
            
            <Animation
              animation="custom"
              customVariants={{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              }}
              duration={0.8}
              delay={0.2}
              triggerOnce
            >
              <p className="text-xl text-white/90 mb-8 font-montserrat">
                Our comprehensive suite of AI coding agents enables teams to get exceptional accuracy on coding tasks, reduce development time from hours to minutes and achieve 10X acceleration.
              </p>
            </Animation>

            {/* Benefits */}
            <div className="mb-8">
              {benefitItems.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                  className="flex items-center mb-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span className="text-white font-montserrat">{item}</span>
                </motion.div>
              ))}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mb-10">
              <Animation
                animation="custom"
                customVariants={{
                  initial: { scale: 0.9, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  exit: { opacity: 0 }
                }}
                duration={0.8}
                delay={0.4}
                triggerOnce
                className="text-left p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 stats-card group"
              >
                <div className="text-5xl font-bold mb-2 text-white font-display">10x</div>
                <p className="text-white/80 font-montserrat">Acceleration with tedious, time consuming tasks</p>
              </Animation>
              
              <Animation
                animation="custom"
                customVariants={{
                  initial: { scale: 0.9, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  exit: { opacity: 0 }
                }}
                duration={0.8}
                delay={0.6}
                triggerOnce
                className="text-left p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 stats-card group"
              >
                <div className="text-5xl font-bold mb-2 text-white font-display">30%</div>
                <p className="text-white/80 font-montserrat">Cost savings eliminating manual, erroneous efforts</p>
              </Animation>
            </div>
            
            {/* CTA Buttons */}
            <Animation
              animation="custom"
              customVariants={{
                initial: { y: 20, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { opacity: 0 }
              }}
              duration={0.8}
              delay={0.8}
              triggerOnce
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <CustomButton 
                  variant="primary" 
                  size="lg"
                  icon={<ArrowRight size={18} />}
                  className="bg-white text-purple-700 hover:bg-gray-100 font-montserrat"
                >
                  Test Drive
                </CustomButton>
                <CustomButton 
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10 font-montserrat"
                >
                  Sign Up for Free
                </CustomButton>
              </div>
            </Animation>
          </div>
          
          <div className="md:w-1/2">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative"
            >
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-xl">
                <div className="h-64 bg-white/10 rounded-lg animate-pulse"></div>
                <div className="mt-4 h-6 w-3/4 bg-white/10 rounded animate-pulse"></div>
                <div className="mt-2 h-4 bg-white/10 rounded animate-pulse"></div>
                <div className="mt-2 h-4 w-2/3 bg-white/10 rounded animate-pulse"></div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-60"></div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-60"></div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
