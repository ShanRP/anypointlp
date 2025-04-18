
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from 'lucide-react';
import CodingAssistantDialog from './ai/CodingAssistantDialog';
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

interface GeneratorCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: string;
  onClick?: () => void;
  badge?: string;
  bgColor?: string;
  badgeColor?: string;
  disabled?: boolean;
}

const GeneratorCard = ({ 
  title, 
  description, 
  icon, 
  type, 
  onClick, 
  badge,
  bgColor = 'from-purple-600 to-indigo-600', 
  badgeColor = 'bg-purple-500',
  disabled = false
}: GeneratorCardProps) => {
  // Handle Coding Assistant special case
  const [dialogOpen, setDialogOpen] = React.useState(false);
  
  if (type === 'codingAssistant') {
    return (
      <CodingAssistantDialog 
        isOpen={dialogOpen} 
        onOpenChange={setDialogOpen} 
        trigger={
          <motion.div
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="cursor-pointer"
            onClick={() => setDialogOpen(true)}
          >
            <Card className="h-full overflow-hidden border rounded-xl shadow-sm hover:shadow-lg transition-all train-border-card">
              <CardHeader className={`bg-gradient-to-r ${bgColor} text-white py-6 bg-opacity-90`}>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2.5 rounded-lg">
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl font-display">{title}</CardTitle>
                      {badge && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeColor} text-white font-montserrat`}>
                          {badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 h-20 flex items-center relative z-10 bg-white dark:bg-gray-900">
                <CardDescription className="text-gray-600 dark:text-gray-300 text-sm font-montserrat">{description}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        }
      />
    );
  }
  
  // Regular generator card
  const handleClick = () => {
    if (disabled) {
      toast("This feature is not yet available. Stay tuned for updates!", {
        description: "Coming Soon!",
        duration: 3000,
      });
      return;
    }
    onClick?.();
  };

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="cursor-pointer"
      onClick={handleClick}
    >
      <Card className="h-full overflow-hidden border rounded-xl shadow-sm hover:shadow-lg transition-all train-border-card">
        <CardHeader className={`bg-gradient-to-r ${bgColor} text-white py-6 bg-opacity-90`}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-lg">
              {icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-display">{title}</CardTitle>
                {badge && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeColor} text-white font-montserrat`}>
                    {badge}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 h-20 flex items-center relative z-10 bg-white dark:bg-gray-900">
          <CardDescription className="text-gray-600 dark:text-gray-300 text-sm font-montserrat">{description}</CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GeneratorCard;
