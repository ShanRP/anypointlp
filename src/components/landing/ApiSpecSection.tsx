
import React from 'react';
import { Box, Text } from '@react-three/drei';
import { motion } from 'framer-motion';
import { ThreeDContainer, RotatingObject } from '@/utils/3dUtils';
import ApiSpec3D from '@/components/3d/ApiSpec3D';
import { Database, Code, FileJson } from 'lucide-react';

const ApiSpecSection: React.FC = () => {
  const features = [
    {
      title: 'RESTful API Design',
      description: 'Design robust, well-structured APIs that follow REST principles for maximum interoperability.',
      icon: <Code className="h-6 w-6 text-blue-500" />
    },
    {
      title: 'RAML Specification',
      description: 'Generate well-documented API specifications using RAML for clear communication.',
      icon: <FileJson className="h-6 w-6 text-green-500" />
    },
    {
      title: 'System API Layer',
      description: 'Create a foundation of system APIs to expose backend capabilities cleanly.',
      icon: <Database className="h-6 w-6 text-purple-500" />
    }
  ];

  return (
    <div className="py-24 bg-gradient-to-b from-gray-900/95 to-gray-800/95 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            API Specification
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Design and document your APIs with precision and clarity, making integration effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="w-full h-[400px]">
            <ApiSpec3D />
          </div>

          <div className="space-y-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex items-start gap-5"
              >
                <div className="flex-shrink-0 bg-gray-800 p-3 rounded-xl shadow-xl">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiSpecSection;
