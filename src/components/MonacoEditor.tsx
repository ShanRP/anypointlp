
import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
  options?: Record<string, any>;
  style?: React.CSSProperties;
  theme?: string;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'plaintext',
  height = '100%',
  readOnly = false,
  options = {},
  style,
  theme = 'vs'
}) => {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [timeoutExpired, setTimeoutExpired] = useState(false);

  // Set a timeout to show editor anyway after 5 seconds to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutExpired(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleEditorDidMount = () => {
    setIsEditorReady(true);
  };

  return (
    <div style={{ width: '100%', height, ...style }} className="relative">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        theme={theme}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading editor...</span>
          </div>
        }
        options={{
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          readOnly,
          wordWrap: 'on',
          automaticLayout: true, // This helps with resizing issues
          ...options
        }}
      />
      
      {/* Force show editor after timeout if it's taking too long */}
      {!isEditorReady && timeoutExpired && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button 
            className="px-4 py-2 bg-primary text-white rounded shadow"
            onClick={() => setIsEditorReady(true)}
          >
            Click to load editor
          </button>
        </div>
      )}
    </div>
  );
};

export default MonacoEditor;
