
import React, { useState } from 'react';
import { BackButton } from '@/components/ui/BackButton';
import MonacoEditor from '@/components/MonacoEditor';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface JsonToSchemaGeneratorProps {
  selectedWorkspaceId: string;
  onTaskCreated: (task: any) => void;
  onBack: () => void;
  onSaveTask: () => void;
}

const JsonToSchemaGenerator: React.FC<JsonToSchemaGeneratorProps> = ({
  selectedWorkspaceId,
  onTaskCreated,
  onBack,
  onSaveTask
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [schemaOutput, setSchemaOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateSchema = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "JSON Input Required",
        description: "Please enter JSON data to generate schema.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Validate JSON input
      JSON.parse(jsonInput);
      
      // In a real app, this would call an API endpoint to generate the schema
      // For now, we'll use a simplified approach to generate a basic schema
      setTimeout(() => {
        const sampleOutput = generateBasicSchema(jsonInput);
        setSchemaOutput(sampleOutput);
        
        // Create task record
        const newTask = {
          id: `task-${Date.now()}`,
          label: "JSON Schema",
          category: "json-to-schema",
          icon: "FileJson"
        };
        
        onTaskCreated(newTask);
        
        toast({
          title: "Schema Generated",
          description: "JSON schema has been successfully generated."
        });
        setIsGenerating(false);
      }, 1000);
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Invalid JSON",
        description: "Please ensure your input is valid JSON.",
        variant: "destructive"
      });
    }
  };

  const generateBasicSchema = (json: string) => {
    try {
      const data = JSON.parse(json);
      const schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {}
      };
      
      // Generate properties based on the input data
      if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach(key => {
          const value = data[key];
          let type = typeof value;
          
          if (Array.isArray(value)) {
            type = "array";
          } else if (value === null) {
            type = "null";
          }
          
          (schema.properties as any)[key] = { type };
        });
      }
      
      return JSON.stringify(schema, null, 2);
    } catch (error) {
      console.error("Error generating schema:", error);
      return '{}';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <BackButton onBack={onBack} label="Back to Dashboard" />
      
      <h1 className="text-2xl font-bold mb-6">JSON to Schema Generator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">JSON Input</h2>
          <div className="border rounded-md overflow-hidden">
            <MonacoEditor
              language="json"
              value={jsonInput}
              onChange={(value) => setJsonInput(value || '')}
              height="400px"
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Schema Output</h2>
          <div className="border rounded-md overflow-hidden">
            <MonacoEditor
              language="json"
              value={schemaOutput}
              onChange={(value) => setSchemaOutput(value || '')}
              height="400px"
              options={{ readOnly: true }}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-4">
        <Button 
          onClick={handleGenerateSchema}
          disabled={isGenerating}
        >
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Schema
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onSaveTask}
          disabled={!schemaOutput || isGenerating}
        >
          Save Task
        </Button>
      </div>
    </div>
  );
};

export default JsonToSchemaGenerator;
