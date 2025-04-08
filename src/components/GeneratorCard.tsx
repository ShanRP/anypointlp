
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from 'lucide-react';
import CodingAssistantDialog, { openCodingAssistantDialog } from './ai/CodingAssistantDialog';
import { motion } from 'framer-motion';

interface GeneratorCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: string;
  onClick?: () => void;
  badge?: string;
  bgColor?: string;
  badgeColor?: string;
}

const GeneratorCard = ({ 
  title, 
  description, 
  icon, 
  type, 
  onClick, 
  badge,
  bgColor = 'from-purple-600 to-indigo-600', 
  badgeColor = 'bg-purple-500'
}: GeneratorCardProps) => {
  // Handle Coding Assistant special case
  if (type === 'codingAssistant') {
    return (
      <motion.div
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className="cursor-pointer"
        onClick={() => openCodingAssistantDialog()}
      >
        <Card className="h-full overflow-hidden border rounded-xl shadow-sm hover:shadow-lg transition-all">
          <CardHeader className={`bg-gradient-to-r ${bgColor} text-white py-6`}>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-lg">
                {icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{title}</CardTitle>
                  {badge && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeColor} text-white`}>
                      {badge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 h-20 flex items-center">
            <CardDescription className="text-gray-600 dark:text-gray-300 text-sm">{description}</CardDescription>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  // Regular generator card
  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className="h-full overflow-hidden border rounded-xl shadow-sm hover:shadow-lg transition-all">
        <CardHeader className={`bg-gradient-to-r ${bgColor} text-white py-6`}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-lg">
              {icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{title}</CardTitle>
                {badge && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeColor} text-white`}>
                    {badge}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 h-20 flex items-center">
          <CardDescription className="text-gray-600 dark:text-gray-300 text-sm">{description}</CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GeneratorCard;
