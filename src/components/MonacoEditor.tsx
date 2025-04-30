
import React from 'react';
import Editor from '@monaco-editor/react';

export interface MonacoEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  placeholder?: string;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ 
  language, 
  value, 
  onChange, 
  readOnly = false,
  height = "100%",
  placeholder
}) => {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <Editor
      height={height}
      defaultLanguage={language}
      language={language}
      theme="vs-dark"
      value={value || placeholder}
      onChange={handleEditorChange}
      options={{
        readOnly,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: 'on',
        wordWrap: 'on',
        tabSize: 2,
      }}
    />
  );
};

export default MonacoEditor;
