
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  color = 'purple'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4'
  };
  
  const colorClasses = {
    purple: 'border-purple-600 border-t-transparent',
    indigo: 'border-indigo-600 border-t-transparent', 
    blue: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent'
  };

  return (
    <motion.div 
      className={cn(
        "animate-spin rounded-full border-solid",
        sizeClasses[size],
        colorClasses[color as keyof typeof colorClasses] || colorClasses.purple,
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};

export default LoadingSpinner;
