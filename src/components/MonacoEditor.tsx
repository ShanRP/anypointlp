
import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
  options?: Record<string, any>;
  style?: React.CSSProperties;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'plaintext',
  height = '100%',
  readOnly = false,
  options = {},
  style = {}
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  // Format detection for better language highlighting
  const getLanguage = (format: string) => {
    // Normalize format to lowercase
    const normalizedFormat = format.toLowerCase();
    
    // Map specific file extensions to their Monaco language
    switch (normalizedFormat) {
      case 'xml':
        return 'xml';
      case 'json':
        return 'json';
      case 'yaml':
      case 'yml':
      case 'raml':
        return 'yaml';
      case 'csv':
        return 'plaintext';
      case 'markdown':
      case 'md':
        return 'markdown';
      case 'dataweave':
      case 'dwl':
      case 'dw':
        return 'javascript'; // Using JavaScript highlighting for DataWeave for better syntax highlighting
      // Add any additional formats as needed
      default:
        // Check if this is a filename with an extension
        if (format.includes('.')) {
          const extension = format.split('.').pop()?.toLowerCase();
          if (extension) {
            return getLanguage(extension);
          }
        }
        
        return 'plaintext';
    }
  };

  // Use effect to trigger editor refresh when value or language changes
  useEffect(() => {
    // This is a no-op but it helps trigger Monaco's internal updates
    if (editorContainerRef.current) {
      const currentWidth = editorContainerRef.current.style.width;
      editorContainerRef.current.style.width = '100%';
      setTimeout(() => {
        if (editorContainerRef.current) {
          editorContainerRef.current.style.width = currentWidth;
        }
      }, 0);
    }
  }, [value, language]);

  const defaultOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    folding: true,
    lineNumbers: 'on' as const, 
    wordWrap: 'on' as const, 
    automaticLayout: true,
    fontSize: 14,
    tabSize: 2,
    formatOnPaste: true,
    formatOnType: true,
    roundedSelection: true,
    autoIndent: 'full' as const, 
    renderWhitespace: 'none' as const, 
    readOnly: readOnly,
    fixedOverflowWidgets: true
  };

  return (
    <div 
      ref={editorContainerRef}
      className="w-full h-full flex flex-col" 
      style={{ 
        minHeight: height || '400px',
        height: height || '100%',
        flexGrow: 1,
        ...style
      }}
    >
      <Editor
        height={height}
        defaultLanguage={getLanguage(language)}
        language={getLanguage(language)}
        value={value}
        onChange={onChange}
        theme="vs"
        options={{ ...defaultOptions, ...options }}
        className="flex-1"
      />
    </div>
  );
};

export default MonacoEditor;
