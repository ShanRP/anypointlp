
import React, { useRef } from 'react';
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

  const getLanguage = (format: string) => {
    switch (format.toLowerCase()) {
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
      case 'edi':
        return 'plaintext';
      case 'dataweave':
      case 'dwl':
        return 'javascript'; // Using JavaScript highlighting for DataWeave for better syntax highlighting
      case 'markdown':
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

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
    readOnly: readOnly
  };

  return (
    <div 
      ref={editorContainerRef}
      className="w-full h-full flex flex-col" 
      style={{ 
        minHeight: '400px',
        height: '100%',
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
