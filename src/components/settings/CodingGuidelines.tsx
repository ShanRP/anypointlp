
import React from 'react';
import { Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export const CodingGuidelines: React.FC = () => {
  return (
    <div className="space-y-4 bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800 text-white">
      <h2 className="text-lg font-semibold">Coding Guidelines</h2>
      <p className="text-sm text-gray-400">
        Files could contain coding guidelines, best practices etc. that organization follow for their code base
      </p>
      
      <motion.div 
        className="border border-dashed border-gray-700 rounded-md p-8 mt-4 bg-black/30 hover:bg-black/50 transition-colors"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 bg-gray-900 rounded-md">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Click or drag file to this area to upload</p>
            <p className="text-xs text-gray-400">PDF only, 5MB max file size</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
