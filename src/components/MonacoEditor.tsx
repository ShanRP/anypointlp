import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { useTheme } from '@/providers/ThemeProvider';

interface MonacoEditorProps {
  value: string;
  language?: string;
  theme?: string;
  height?: string;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  onChange?: (value: string | undefined) => void;
  onMount?: () => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  language = 'javascript',
  theme,
  height = '300px',
  options = {},
  onChange,
  onMount
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme: appTheme } = useTheme();
  const editorTheme = theme || (appTheme === 'dark' ? 'vs-dark' : 'vs');

  useEffect(() => {
    if (containerRef.current) {
      // Initialize Monaco editor
      editorRef.current = monaco.editor.create(containerRef.current, {
        value,
        language,
        theme: editorTheme,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        ...options
      });

      // Set up change event handler
      const changeModelDisposable = editorRef.current.onDidChangeModelContent(() => {
        if (onChange) {
          onChange(editorRef.current?.getValue());
        }
      });

      // Call onMount callback
      if (onMount) {
        setTimeout(() => {
          onMount();
        }, 100);
      }

      // Clean up
      return () => {
        changeModelDisposable.dispose();
        editorRef.current?.dispose();
      };
    }
  }, []);

  // Update value if it changes externally
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (value !== currentValue) {
        editorRef.current.setValue(value);
      }
    }
  }, [value]);

  // Update theme if it changes
  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setTheme(editorTheme);
    }
  }, [editorTheme]);

  return <div ref={containerRef} style={{ height, width: '100%' }} />;
};

export default MonacoEditor;
