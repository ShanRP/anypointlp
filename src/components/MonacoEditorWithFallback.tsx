import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from './MonacoEditor'; // Your existing Monaco editor component
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

interface MonacoEditorWithFallbackProps {
  value: string;
  language?: string;
  height?: string;
  options?: any;
  onChange?: (value: string | undefined) => void;
  theme?: string;
  onMount?: () => void;
}

const MonacoEditorWithFallback: React.FC<MonacoEditorWithFallbackProps> = ({
  value,
  language = 'javascript',
  height = '300px',
  options = {},
  onChange,
  theme,
  onMount
}) => {
  const { theme: appTheme } = useTheme();
  const editorTheme = theme || (appTheme === 'dark' ? 'vs-dark' : 'vs');
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editorMounted, setEditorMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Set a timeout to detect if editor fails to load
    loadTimeoutRef.current = setTimeout(() => {
      if (!editorMounted) {
        setLoadError('Editor failed to load. Please refresh the page.');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);
  
  const handleEditorDidMount = () => {
    setEditorMounted(true);
    setIsLoading(false);
    
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    if (onMount) {
      onMount();
    }
  };
  
  // Fallback to a simple textarea if editor fails to load
  if (loadError) {
    return (
      <div className="border rounded-md overflow-hidden">
        <div className="bg-red-50 p-3 text-red-700 text-sm border-b">
          {loadError}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full p-4 font-mono text-sm"
          style={{ height, minHeight: '100px' }}
        />
      </div>
    );
  }
  
  return (
    <div className="relative" ref={containerRef}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Loading editor...
            </span>
          </div>
        </div>
      )}
      
      <MonacoEditor
        value={value}
        language={language}
        height={height}
        options={{
          ...options,
          automaticLayout: true,
        }}
        onChange={onChange}
        theme={editorTheme}
        onMount={handleEditorDidMount}
      />
    </div>
  );
};

export default MonacoEditorWithFallback;
