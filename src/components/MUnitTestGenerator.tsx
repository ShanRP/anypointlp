import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMUnitRepositoryData } from '@/hooks/useMUnitRepositoryData';
import MonacoEditor from './MonacoEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';

import { useUserCredits } from '@/hooks/useUserCredits';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MUnitTestGeneratorProps = {
  onTaskCreated?: (task: any) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onSaveTask?: (id: string) => void;
};

const runtimeOptions = [
  { label: 'Mule 3.9.0', value: '3.9.0' },
  { label: 'Mule 4.3.0', value: '4.3.0' },
  { label: 'Mule 4.4.0', value: '4.4.0' },
  { label: 'Mule 4.5.0', value: '4.5.0' }
];

const MUnitTestGenerator: React.FC<MUnitTestGeneratorProps> = ({
  onTaskCreated,
  selectedWorkspaceId,
  onBack,
  onSaveTask
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [sourceType, setSourceType] = useState<'noRepository' | 'withRepository' | 'local'>('noRepository');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [flowImplementation, setFlowImplementation] = useState('');
  const [runtime, setRuntime] = useState('4.4.0');
  const [scenarioCount, setScenarioCount] = useState(1);
  const [generatedTests, setGeneratedTests] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('input');
  const { user } = useAuth();
  const { useCredit } = useUserCredits();
  const { saveMunitTask } = useWorkspaceTasks(selectedWorkspaceId);
  const { 
    repositories, 
    selectedRepository, 
    selectRepository, 
    branches, 
    selectedBranch, 
    selectBranch, 
    files, 
    selectedFilePath, 
    selectFile, 
    fileContent, 
    loading 
  } = useMUnitRepositoryData();

  const handleGenerate = async () => {
    if (!description) {
      toast({
        title: "Missing information",
        description: "Please provide a description for the test.",
        variant: "destructive"
      });
      return;
    }

    if (!flowImplementation) {
      toast({
        title: "Missing flow implementation",
        description: "Please provide the flow implementation to generate tests for.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const taskId = uuidv4();
      
      console.log("Sending request with payload:", {
        description,
        notes,
        flowImplementation,
        runtime,
        numberOfScenarios: scenarioCount
      });
      
      const { data, error } = await supabase.functions.invoke('generate-munit', {
        body: {
          description,
          notes,
          flowImplementation,
          runtime,
          numberOfScenarios: scenarioCount
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Now that we have a successful result, use a credit
      const canUseCredit = await useCredit();
      if (!canUseCredit) {
        throw new Error("Could not use credit. Check your credit balance.");
      }

      console.log("Response from generate-munit:", data);
      
      setGeneratedTests(data.code || "// No tests generated");

      // Save task to database
      const task_id = `MUNIT-${Date.now().toString(36).toUpperCase()}`;
      
      const munitData = {
        workspace_id: selectedWorkspaceId,
        task_id: task_id,
        task_name: `MUnit Test for ${description.substring(0, 30)}${description.length > 30 ? '...' : ''}`,
        user_id: user?.id || 'anonymous',
        description: description,
        flow_description: description,
        flow_implementation: flowImplementation,
        munit_content: data.code,
        runtime: runtime,
        number_of_scenarios: scenarioCount
      };
      
      const savedTask = await saveMunitTask(munitData);

      if (savedTask) {
        // toast.success(`MUnit test saved with ID: ${task_id}`);
        console.log(`MUnit test saved with ID: ${task_id}`)
        
        if (onSaveTask) {
          onSaveTask(task_id);
        }
        
        if (onTaskCreated) {
          onTaskCreated({
            id: task_id,
            label: `MUnit Test for ${description.substring(0, 30)}${description.length > 30 ? '...' : ''}`,
            category: 'munit',
            icon: <RefreshCw className="h-4 w-4 mr-2" />,
            workspace_id: selectedWorkspaceId
          });
        }
      } else {
        // toast.error('Failed to save MUnit test');
        console.log('Failed to save MUnit test')
      }

      if (onTaskCreated && selectedWorkspaceId) {
        onTaskCreated({
          id: taskId,
          label: description.substring(0, 30) + (description.length > 30 ? '...' : ''),
          category: 'munit',
          icon: "TestTube2",
          workspace_id: selectedWorkspaceId,
          content: {
            description,
            notes,
            flow: flowImplementation,
            tests: data.code,
            runtime,
            scenarioCount
          }
        });

        toast({
          title: "Success!",
          description: "MUnit tests generated successfully.",
        });

        if (onSaveTask) {
          onSaveTask(taskId);
        }
      }
      
      setActiveTab('result');
    } catch (error) {
      console.error('Error generating MUnit tests:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate MUnit tests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setDescription('');
    setNotes('');
    setFlowImplementation('');
    setRuntime('4.4.0');
    setScenarioCount(1);
    setGeneratedTests('');
    setActiveTab('input');
  };

  const handleFileSelect = (filePath: string) => {
    selectFile(filePath);
    if (fileContent) {
      setFlowImplementation(fileContent);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack || (() => navigate('/dashboard'))}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">MUnit Test Generator</h1>
          <p className="text-muted-foreground">Generate MUnit tests for your Mule flows</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto flex flex-col">
        <motion.div 
          className="mb-6 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.5 }}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="space-y-6 flex-1 flex flex-col h-full">
            <div className="mb-6">
              <RadioGroup 
                value={sourceType} 
                onValueChange={(value) => setSourceType(value as 'noRepository' | 'withRepository' | 'local')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="noRepository" id="noRepository" />
                  <Label htmlFor="noRepository">No Repository</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="withRepository" id="withRepository" />
                  <Label htmlFor="withRepository">With Repository</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="local" id="local" />
                  <Label htmlFor="local">Upload from Computer</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4 flex-1 flex flex-col">
              <div>
                <Label htmlFor="description" className="font-medium mb-1 block">Description<span className="text-red-500">*</span></Label>
                <Textarea 
                  id="description"
                  placeholder="Describe what the MUnit test should validate"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="font-medium mb-1 block">Notes (optional)</Label>
                <Textarea 
                  id="notes"
                  placeholder="Add any additional notes or context for the test generation"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {sourceType === 'withRepository' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="repository" className="font-medium mb-1 block">Repository</Label>
                      <Select
                        value={selectedRepository || ""}
                        onValueChange={selectRepository}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select repository" />
                        </SelectTrigger>
                        <SelectContent>
                          {repositories.map((repo) => (
                            <SelectItem key={repo.id} value={repo.id}>{repo.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="branch" className="font-medium mb-1 block">Branch</Label>
                      <Select
                        value={selectedBranch}
                        onValueChange={selectBranch}
                        disabled={!selectedRepository}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="file" className="font-medium mb-1 block">File</Label>
                    <Select
                      value={selectedFilePath}
                      onValueChange={handleFileSelect}
                      disabled={!selectedBranch}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select file" />
                      </SelectTrigger>
                      <SelectContent>
                        {files.map((file) => (
                          <SelectItem 
                            key={file.path} 
                            value={file.path}
                          >
                            {file.path}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {sourceType === 'local' && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Drag and drop your XML file here, or click to browse</p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setFlowImplementation(event.target.result as string);
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                    id="file-upload"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Browse
                  </Button>
                </div>
              )}

              <div className="flex-1 flex flex-col  h-full">
                <Label htmlFor="flowImplementation" className="font-medium mb-1 block">
                  Flow Implementation<span className="text-red-500">*</span>
                </Label>
                <div className="border rounded-md flex-1 h-full" style={{ minHeight: '400px' }}>
                  <MonacoEditor
                    language="xml"
                    value={flowImplementation}
                    onChange={setFlowImplementation}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                    height="90vh"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="runtime" className="font-medium mb-1 block">Runtime</Label>
                  <Select
                    value={runtime}
                    onValueChange={setRuntime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select runtime" />
                    </SelectTrigger>
                    <SelectContent>
                      {runtimeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scenarioCount" className="font-medium mb-1 block">Number of MUnit Scenarios</Label>
                  <Input
                    id="scenarioCount"
                    type="number"
                    min={1}
                    max={5}
                    value={scenarioCount}
                    onChange={(e) => setScenarioCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !description || !flowImplementation}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate</>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-6 flex-1 flex flex-col h-full">
            {generatedTests ? (
              <div className="space-y-4 flex-1 flex flex-col h-full">
                <Card className="p-4 flex-1 flex flex-col h-full">
                  <h3 className="font-semibold text-lg mb-2">Generated MUnit Tests</h3>
                  <Separator className="my-2" />
                  <div className="border rounded-md flex-1 h-full" style={{ minHeight: '400px' }}>
                    <MonacoEditor
                      language="xml"
                      value={generatedTests}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                      height="90vh"
                    />
                  </div>
                </Card>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('input')}
                  >
                    Back to Input
                  </Button>
                  <Button onClick={() => {
                    navigator.clipboard.writeText(generatedTests);
                    toast({
                      title: "Copied!",
                      description: "MUnit tests copied to clipboard",
                    });
                  }}>
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 flex-1 flex flex-col justify-center">
                <p className="text-gray-500">No test results yet. Generate tests first.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('input')}
                  className="mt-4 mx-auto"
                >
                  Back to Input
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MUnitTestGenerator;
