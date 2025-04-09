
import React, { useState } from 'react';
import { ArrowLeft, Copy, Download, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useWorkspaceTasks, SampleDataPayload } from '@/hooks/useWorkspaceTasks';

interface SampleDataGeneratorProps {
  selectedWorkspaceId?: string;
  onBack?: () => void;
}

const SampleDataGenerator: React.FC<SampleDataGeneratorProps> = ({
  selectedWorkspaceId,
  onBack
}) => {
  const { user } = useAuth();
  const { saveSampleDataTask } = useWorkspaceTasks(selectedWorkspaceId || '');
  
  const [dataweaveScript, setDataweaveScript] = useState<%script%>(`%dw 2.0
output application/json
---
{
  "customers": (1 to 10) map {
    "id": $,
    "firstName": ["John", "Jane", "Alice", "Bob", "Charlie"][random() * 5],
    "lastName": ["Smith", "Doe", "Johnson", "Brown", "Wilson"][random() * 5],
    "email": "user" ++ $ ++ "@example.com",
    "age": 20 + (random() * 40) as Number {format: "##"},
    "active": random() > 0.3
  }
}`);
  
  const [generatedData, setGeneratedData] = useState('');
  const [generating, setGenerating] = useState(false);
  const [inputSchema, setInputSchema] = useState('');
  const [outputSchema, setOutputSchema] = useState('');
  const [sampleCount, setSampleCount] = useState(5);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      taskName: '',
      description: ''
    }
  });
  
  const handleGenerateData = async () => {
    if (!dataweaveScript.trim()) {
      toast.error('Please provide a DataWeave script');
      return;
    }
    
    setGenerating(true);
    
    try {
      // For demo/mock purposes, we'll generate some JSON based on the script
      // In a real application, this would call an API to execute the DataWeave script
      setTimeout(() => {
        try {
          // This is a simplified mock of what the DataWeave engine would do
          // In a real app, this would be handled by a proper DataWeave engine
          const sampleData = generateMockData(sampleCount);
          setGeneratedData(JSON.stringify(sampleData, null, 2));
          toast.success('Sample data generated successfully!');
        } catch (error) {
          console.error('Error parsing mock data:', error);
          toast.error('Failed to generate sample data');
        } finally {
          setGenerating(false);
        }
      }, 1500);
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast.error('Failed to generate sample data');
      setGenerating(false);
    }
  };
  
  const generateMockData = (count: number) => {
    // Very simplified mock generator
    // In a real app, this would be the result of executing the DataWeave script
    if (dataweaveScript.includes('customers')) {
      return {
        customers: Array.from({ length: count }, (_, i) => ({
          id: i + 1,
          firstName: ['John', 'Jane', 'Alice', 'Bob', 'Charlie'][Math.floor(Math.random() * 5)],
          lastName: ['Smith', 'Doe', 'Johnson', 'Brown', 'Wilson'][Math.floor(Math.random() * 5)],
          email: `user${i + 1}@example.com`,
          age: Math.floor(20 + Math.random() * 40),
          active: Math.random() > 0.3
        }))
      };
    } else {
      return Array.from({ length: count }, (_, i) => ({
        item: i + 1,
        value: `Sample ${i + 1}`,
        timestamp: new Date().toISOString(),
        metadata: {
          tags: ['sample', 'generated'],
          settings: {
            visible: true,
            priority: Math.floor(Math.random() * 5)
          }
        }
      }));
    }
  };
  
  const handleCopyToClipboard = () => {
    if (generatedData) {
      navigator.clipboard.writeText(generatedData);
      toast.success('Sample data copied to clipboard!');
    }
  };
  
  const handleDownload = () => {
    if (generatedData) {
      const blob = new Blob([generatedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Sample data downloaded!');
    }
  };
  
  const handleSaveTask = handleSubmit(async (data) => {
    if (!user || !selectedWorkspaceId) {
      toast.error('You must be logged in to save a task');
      return;
    }
    
    if (!generatedData) {
      toast.error('Please generate some sample data first');
      return;
    }
    
    try {
      const uniqueId = uuidv4().substring(0, 8);
      
      const payload: SampleDataPayload = {
        task_id: uniqueId,
        task_name: data.taskName || 'Sample Data Generator',
        user_id: user.id,
        workspace_id: selectedWorkspaceId,
        description: data.description || '',
        dataweave_script: dataweaveScript,
        input_schema: inputSchema,
        output_schema: outputSchema,
        generated_data: generatedData,
        sample_count: sampleCount,
        category: 'sampledata'
      };
      
      const result = await saveSampleDataTask(payload);
      
      if (result) {
        toast.success('Sample data task saved successfully!');
        if (onBack) {
          onBack();
        }
      }
    } catch (error) {
      console.error('Error saving sample data task:', error);
      toast.error('Failed to save sample data task');
    }
  });
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2" 
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Sample Data Generator</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">DataWeave Script</h2>
            <div className="h-72 border rounded-md overflow-hidden">
              <Editor
                language="javascript"
                value={dataweaveScript}
                onChange={(value) => setDataweaveScript(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14
                }}
              />
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sampleCount">Sample Count</Label>
                <Input
                  id="sampleCount"
                  type="number"
                  value={sampleCount}
                  onChange={(e) => setSampleCount(parseInt(e.target.value) || 5)}
                  min={1}
                  max={100}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  className="w-full" 
                  onClick={handleGenerateData}
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Generate Sample Data'}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <Tabs defaultValue="schema">
              <TabsList className="mb-4">
                <TabsTrigger value="schema">Schema</TabsTrigger>
                <TabsTrigger value="save">Save Task</TabsTrigger>
              </TabsList>
              
              <TabsContent value="schema">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="inputSchema">Input Schema (Optional)</Label>
                    <Textarea
                      id="inputSchema"
                      value={inputSchema}
                      onChange={(e) => setInputSchema(e.target.value)}
                      placeholder="Enter JSON schema for input"
                      className="h-32"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="outputSchema">Output Schema (Optional)</Label>
                    <Textarea
                      id="outputSchema"
                      value={outputSchema}
                      onChange={(e) => setOutputSchema(e.target.value)}
                      placeholder="Enter JSON schema for output"
                      className="h-32"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="save">
                <form onSubmit={handleSaveTask} className="space-y-4">
                  <div>
                    <Label htmlFor="taskName">Task Name</Label>
                    <Input
                      id="taskName"
                      placeholder="Enter a name for this task"
                      {...register('taskName', { required: 'Task name is required' })}
                    />
                    {errors.taskName && (
                      <p className="text-red-500 text-sm mt-1">{errors.taskName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter a description for this task"
                      {...register('description')}
                      className="h-24"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!generatedData}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Task
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Generated Sample Data</h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyToClipboard}
                disabled={!generatedData}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
                disabled={!generatedData}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          <div className="h-[600px] border rounded-md overflow-hidden">
            <Editor
              language="json"
              value={generatedData}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleDataGenerator;
