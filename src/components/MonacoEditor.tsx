
import React from 'react';
import Editor from '@monaco-editor/react';

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
  return (
    <div style={{ width: '100%', height, ...style }}>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        theme={theme}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          readOnly,
          wordWrap: 'on',
          ...options
        }}
      />
    </div>
  );
};

export default MonacoEditor;
