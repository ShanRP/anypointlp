
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
    <section id="features" className="py-24 bg-gray-50/95">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6 text-black"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Supercharge Your MuleSoft Development
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-600 max-w-2xl mx-auto"
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
          <motion.div variants={fadeInUp} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <FileCode2 className="text-purple-600" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Integration Generator</h3>
            <p className="text-gray-600 mb-4">Generate Mule flow code from specifications and diagrams, reducing development time.</p>
            <ErrorBoundary>
              <IntegrationFlow3D />
            </ErrorBoundary>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Code className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">DataWeave Generator</h3>
            <p className="text-gray-600 mb-4">Create complex data transformations effortlessly from input/output examples.</p>
            <ErrorBoundary>
              <DataWeaveTransform3D />
            </ErrorBoundary>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <FileCode2 className="text-green-600" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">RAML Generator</h3>
            <p className="text-gray-600 mb-4">Generate RAML specifications for your APIs quickly and accurately.</p>
            <ErrorBoundary>
              <ApiSpec3D />
            </ErrorBoundary>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
              <TestTube2 className="text-amber-600" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">MUnit Test Generator</h3>
            <p className="text-gray-600">Automatically generate comprehensive test cases for your Mule applications.</p>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
              <FileText className="text-red-600" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Documentation Generator</h3>
            <p className="text-gray-600">Create professional documentation for your flows and endpoints automatically.</p>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <Share2 className="text-indigo-600" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Exchange Marketplace</h3>
            <p className="text-gray-600">Share and discover reusable templates and components with the community.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
