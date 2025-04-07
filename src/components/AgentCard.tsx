
import React from 'react';
import { motion } from "framer-motion";
import { useAnimations } from "@/utils/animationUtils";

type AgentCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
  link?: string;
  linkText?: string;
  className?: string;
  onClick?: () => void;
  badge?: string;
};

export const AgentCard: React.FC<AgentCardProps> = ({ 
  title, 
  description, 
  icon, 
  color = 'bg-purple-100',
  link,
  linkText = 'Learn more',
  className = '',
  onClick,
  badge
}) => {
  const { spring } = useAnimations();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div 
        className={`p-6 rounded-xl bg-white dark:bg-gray-800 border 
                  border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl 
                  transition-all group ${className}`}
      >
        <div className="relative">
          {badge && (
            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
          <div 
            className={`w-14 h-14 rounded-lg flex items-center justify-center mb-4 
                      ${color} group-hover:scale-110 transition-transform`}
          >
            {icon}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-colors">
          {title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{description}</p>
        
        {link && (
          <a 
            href={link} 
            className="text-sm font-medium text-purple-500 hover:text-purple-400 inline-flex items-center group-hover:translate-x-1 transition-transform"
          >
            {linkText}
            <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default AgentCard;
