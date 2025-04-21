import React from 'react';
import { motion } from 'framer-motion';
import { Code, TestTube2, FileCode2, FileText, Share2 } from 'lucide-react';
import IntegrationFlow3D from '../3d/IntegrationFlow3D';
import DataWeaveTransform3D from '../3d/DataWeaveTransform3D';
import ApiSpec3D from '../3d/ApiSpec3D';
import ErrorBoundary from '../ErrorBoundary';

export const Features = () => {
  const fadeInUp = {
    initial: { y: 60, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <section id="features" className="py-24 bg-black relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-transparent z-0"></div>
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-radial from-purple-500/20 via-purple-700/5 to-transparent opacity-70 blur-3xl z-0"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-indigo-900/20 to-transparent rounded-full blur-3xl opacity-30 transform -translate-x-1/3 translate-y-1/3"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMmgxdjFoLTF2LTF6bS0yLTJoMXYxaC0xdi0xem0yLTJoMXYxaC0xdi0xem0tMiAyaDF2MWgtMXYtMXptLTItMmgxdjFoLTF2LTF6bTggMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0tMi0yaDF2MWgtMXYtMXptLTIgMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0xMC00aDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0xNi0xMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0xNi0xMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 z-0"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Supercharge Your MuleSoft Development
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-300 max-w-2xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Our AI-powered tools help you build MuleSoft integrations faster and more efficiently with less boilerplate.
          </motion.p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <motion.div 
            variants={fadeInUp} 
            className="bg-black/40 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-800 hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-xl"></div>
            <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center mb-6 relative z-10">
              <FileCode2 className="text-purple-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white relative z-10">Integration Generator</h3>
            <p className="text-gray-400 mb-4 relative z-10">Generate Mule flow code from specifications and diagrams, reducing development time.</p>
            {/* <ErrorBoundary>
              <div className="relative z-10 mt-4">
                <IntegrationFlow3D />
              </div>
            </ErrorBoundary> */}
          </motion.div>

          <motion.div 
            variants={fadeInUp} 
            className="bg-black/40 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-800 hover:border-blue-500/30 transition-all duration-300 group relative overflow-hidden"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-xl"></div>
            <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center mb-6 relative z-10">
              <Code className="text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white relative z-10">DataWeave Generator</h3>
            <p className="text-gray-400 mb-4 relative z-10">Create complex data transformations effortlessly from input/output examples.</p>
            {/* <ErrorBoundary>
              <div className="relative z-10 mt-4">
                <DataWeaveTransform3D />
              </div>
            </ErrorBoundary> */}
          </motion.div>

          <motion.div 
            variants={fadeInUp} 
            className="bg-black/40 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-800 hover:border-green-500/30 transition-all duration-300 group relative overflow-hidden"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-xl"></div>
            <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center mb-6 relative z-10">
              <FileCode2 className="text-green-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white relative z-10">RAML Generator</h3>
            <p className="text-gray-400 mb-4 relative z-10">Generate RAML specifications for your APIs quickly and accurately.</p>
            {/* <ErrorBoundary>
              <div className="relative z-10 mt-4">
                <ApiSpec3D />
              </div>
            </ErrorBoundary> */}
          </motion.div>

          <motion.div 
            variants={fadeInUp} 
            className="bg-black/40 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-800 hover:border-amber-500/30 transition-all duration-300 group relative overflow-hidden"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-xl"></div>
            <div className="w-12 h-12 bg-amber-900/50 rounded-lg flex items-center justify-center mb-6 relative z-10">
              <TestTube2 className="text-amber-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white relative z-10">MUnit Test Generator</h3>
            <p className="text-gray-400 relative z-10">Automatically generate comprehensive test cases for your Mule applications.</p>
          </motion.div>

          <motion.div 
            variants={fadeInUp} 
            className="bg-black/40 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-800 hover:border-red-500/30 transition-all duration-300 group relative overflow-hidden"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-xl"></div>
            <div className="w-12 h-12 bg-red-900/50 rounded-lg flex items-center justify-center mb-6 relative z-10">
              <FileText className="text-red-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white relative z-10">Documentation Generator</h3>
            <p className="text-gray-400 relative z-10">Create professional documentation for your flows and endpoints automatically.</p>
          </motion.div>

          <motion.div 
            variants={fadeInUp} 
            className="bg-black/40 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-800 hover:border-indigo-500/30 transition-all duration-300 group relative overflow-hidden"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-xl"></div>
            <div className="w-12 h-12 bg-indigo-900/50 rounded-lg flex items-center justify-center mb-6 relative z-10">
              <Share2 className="text-indigo-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-white relative z-10">Exchange Marketplace</h3>
            <p className="text-gray-400 relative z-10">Share and discover reusable templates and components with the community.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
