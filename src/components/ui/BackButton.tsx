
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface BackButtonProps {
  onBack?: () => void;
  label?: string;
  description?: React.ReactNode;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  onBack,
  label = 'Back to Dashboard',
  description
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };
  
  return (
    <motion.div 
      className="flex items-center cursor-pointer mb-4 text-gray-600 hover:text-gray-900 transition-colors"
      onClick={handleClick}
      whileHover={{ x: -5 }}
      transition={{ duration: 0.2 }}
    >
      <ArrowLeft size={20} className="mr-4" />
      {description ? (
        <div>
          <h1 className="text-2xl font-bold mb-1">{label}</h1>
          {description}
        </div>
      ) : (
        <span className="font-medium">{label}</span>
      )}
    </motion.div>
  );
};
