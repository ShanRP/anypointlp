
import React from 'react';
import { motion } from 'framer-motion';

type LogoProps = {
  className?: string;
};

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className={`font-bold text-xl flex items-center ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.svg 
            width="32" 
            height="32" 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 text-purple-600"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <motion.path 
              d="M16 2L2 8L16 14L30 8L16 2Z" 
              fill="currentColor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            <motion.path 
              d="M2 16L16 22L30 16" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            />
            <motion.path 
              d="M2 24L16 30L30 24" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              opacity="0.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            />
          </motion.svg>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="font-geistMono"
        >
          <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">Anypoint</span>
          <span className="ml-1">LP</span>
        </motion.div>
      </div>
    </motion.div>
  );
};
