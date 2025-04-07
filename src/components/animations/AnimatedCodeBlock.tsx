
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCodeBlockProps {
  code: string;
  language?: string;
  delay?: number;
  typingSpeed?: number;
}

export const AnimatedCodeBlock: React.FC<AnimatedCodeBlockProps> = ({
  code,
  language = 'xml',
  delay = 0,
  typingSpeed = 30,
}) => {
  const [displayedCode, setDisplayedCode] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    timeout = setTimeout(() => {
      setIsTyping(true);
      let i = 0;
      const typeNextChar = () => {
        if (i < code.length) {
          setDisplayedCode(code.substring(0, i + 1));
          i++;
          setTimeout(typeNextChar, typingSpeed);
        } else {
          setIsTyping(false);
        }
      };
      typeNextChar();
    }, delay);

    return () => clearTimeout(timeout);
  }, [code, delay, typingSpeed]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      className="relative bg-black/50 backdrop-blur-md rounded-lg border border-purple-500/30 overflow-hidden"
    >
      <div className="flex items-center p-2 bg-gray-900/70 border-b border-gray-800">
        <div className="flex space-x-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-gray-400 text-xs">
          {language === 'xml' ? 'mule-flow.xml' : 
           language === 'json' ? 'payload.json' : 
           language === 'dw' ? 'transform.dwl' : 
           language === 'raml' ? 'api.raml' : 'code-snippet'}
        </span>
      </div>
      <pre className="text-xs md:text-sm overflow-x-auto p-4">
        <code className={`text-purple-300 ${isTyping ? 'after:content-["_"] after:animate-pulse' : ''}`}>
          {displayedCode}
        </code>
      </pre>
      
      {/* Light effect simulation */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-70"
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scaleX: [0, 1, 0],
          x: ['-100%', '0%', '100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: 'loop',
        }}
      />
    </motion.div>
  );
};

export default AnimatedCodeBlock;
