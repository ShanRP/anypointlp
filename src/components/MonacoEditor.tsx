
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
  style
}) => {
  return (
    <div style={{ width: '100%', height, ...style }}>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
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
