
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import MonacoEditor from './MonacoEditor';
import LoadingSpinner from './ui/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';

interface MUnitTestGeneratorProps {
  onTaskCreated?: (taskId: string) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
}

const MUnitTestGenerator: React.FC<MUnitTestGeneratorProps> = ({
  onTaskCreated,
  selectedWorkspaceId,
  onBack
}) => {
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspaces();
  const { saveMunitTask } = useWorkspaceTasks(selectedWorkspace?.id || '');
  
  const [description, setDescription] = useState('');
  const [flowImplementation, setFlowImplementation] = useState('');
  const [runtime, setRuntime] = useState('Mule 4.4, Java 8');
  const [numberOfScenarios, setNumberOfScenarios] = useState(1);
  const [generatedCode, setGeneratedCode] = useState('');
  const [taskName, setTaskName] = useState('MUnit Test Suite');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState('editor');
  
  const workspaceId = selectedWorkspaceId || selectedWorkspace?.id || '';
  
  const handleGenerate = async () => {
    if (!description) {
      toast.error('Please provide a description of the flow to test');
      return;
    }
    
    if (!flowImplementation) {
      toast.error('Please provide the flow implementation to test');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedCode('');
    
    try {
      toast.info('Generating MUnit test...');
      
      const response = await fetch(
        'https://xrdzfyxesrcbkatygoij.supabase.co/functions/v1/generate-munit',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
          },
          body: JSON.stringify({
            description,
            flowImplementation,
            runtime,
            numberOfScenarios,
            notes: ''
          })
        }
      );
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate MUnit test');
      }
      
      setGeneratedCode(data.code);
      setCurrentTab('result');
      toast.success('MUnit test generated successfully!');
    } catch (error: any) {
      console.error('Error generating MUnit test:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSave = async () => {
    if (!generatedCode) {
      toast.error('Please generate a MUnit test first');
      return;
    }
    
    if (!taskName) {
      toast.error('Please provide a name for the MUnit test');
      return;
    }
    
    if (!workspaceId) {
      toast.error('No workspace selected');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const data = await saveMunitTask({
        task_name: taskName,
        user_id: user?.id || '',
        workspace_id: workspaceId,
        description,
        flow_implementation: flowImplementation,
        flow_description: description,
        munit_content: generatedCode,
        runtime,
        number_of_scenarios: numberOfScenarios
      });
      
      toast.success('MUnit test saved successfully!');
      
      if (onTaskCreated && data && data[0]) {
        onTaskCreated(data[0].id);
      }
    } catch (error: any) {
      console.error('Error saving MUnit test:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MUnit Test Generator</h1>
          <p className="text-muted-foreground mt-1">
            Generate MUnit tests for your Mule flows
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Dashboard
          </Button>
        )}
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="editor">Input</TabsTrigger>
          <TabsTrigger value="result" disabled={!generatedCode}>
            Result
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>MUnit Test Configuration</CardTitle>
                <CardDescription>
                  Provide details about the flow you want to test
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taskName">Test Name</Label>
                  <Input
                    id="taskName"
                    placeholder="Enter a name for this MUnit test"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Flow Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the flow's purpose and behavior"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <Accordion type="single" collapsible defaultValue="flow-implementation">
                  <AccordionItem value="flow-implementation">
                    <AccordionTrigger>Flow Implementation</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Label htmlFor="flowImplementation">
                          Paste your Mule flow XML here
                        </Label>
                        <div className="border rounded-md">
                          <MonacoEditor
                            value={flowImplementation}
                            onChange={setFlowImplementation}
                            language="xml"
                            height="300px"
                            options={{
                              minimap: { enabled: false }
                            }}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="runtime">Runtime Environment</Label>
                    <Select
                      value={runtime}
                      onValueChange={setRuntime}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select runtime" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mule 4.4, Java 8">Mule 4.4 (Java 8)</SelectItem>
                        <SelectItem value="Mule 4.3, Java 8">Mule 4.3 (Java 8)</SelectItem>
                        <SelectItem value="Mule 4.2, Java 8">Mule 4.2 (Java 8)</SelectItem>
                        <SelectItem value="Mule 3.9, Java 8">Mule 3.9 (Java 8)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scenarios">Number of Test Scenarios</Label>
                    <Select
                      value={numberOfScenarios.toString()}
                      onValueChange={(value) => setNumberOfScenarios(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of scenarios" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Scenario</SelectItem>
                        <SelectItem value="2">2 Scenarios</SelectItem>
                        <SelectItem value="3">3 Scenarios</SelectItem>
                        <SelectItem value="4">4 Scenarios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !description || !flowImplementation}
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate MUnit Test'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="result">
          {generatedCode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Generated MUnit Test</CardTitle>
                  <CardDescription>
                    Review and save your generated MUnit test
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md">
                    <MonacoEditor
                      value={generatedCode}
                      language="xml"
                      height="500px"
                      readOnly={true}
                      options={{
                        minimap: { enabled: true }
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentTab('editor')}
                  >
                    Back to Editor
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode);
                        toast.success('Copied to clipboard!');
                      }}
                    >
                      Copy to Clipboard
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save MUnit Test'
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MUnitTestGenerator;
