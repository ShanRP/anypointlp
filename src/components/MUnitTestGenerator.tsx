
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuid } from 'uuid';
import { MUnitGeneratorPayload, useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import TaskDetailsView from './TaskDetailsView';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from './ui/BackButton';

interface MUnitTestGeneratorProps {
  onTaskCreated?: (task: any) => void;
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onSaveTask?: (taskId: string) => void;
}

const MUnitTestGenerator: React.FC<MUnitTestGeneratorProps> = ({
  onTaskCreated,
  selectedWorkspaceId,
  onBack,
  onSaveTask
}) => {
  const [description, setDescription] = useState('');
  const [flowImplementation, setFlowImplementation] = useState('');
  const [runtime, setRuntime] = useState('Mule 4.4, Java 8');
  const [numberOfScenarios, setNumberOfScenarios] = useState(3);
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedTests, setGeneratedTests] = useState('');
  const [testName, setTestName] = useState('');
  const [currentTab, setCurrentTab] = useState('input');
  const [savedTaskId, setSavedTaskId] = useState<string | null>(null);
  const { user } = useAuth();
  const { saveMUnitTask } = useWorkspaceTasks(selectedWorkspaceId || '');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!flowImplementation.trim()) {
      toast.error('Please provide the flow implementation');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Please provide a description');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('https://xrdzfyxesrcbkatygoij.functions.supabase.co/generate-munit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          notes,
          flowImplementation,
          runtime,
          numberOfScenarios
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate MUnit tests');
      }
      
      const data = await response.json();
      
      if (data.success && data.code) {
        setGeneratedTests(data.code);
        
        // Auto-generate a name if not provided
        const generatedName = testName.trim() || `MUnit Test for ${description.slice(0, 30)}${description.length > 30 ? '...' : ''}`;
        setTestName(generatedName);
        
        // Auto-save if workspace is selected
        if (selectedWorkspaceId && user) {
          await saveToWorkspace(data.code, generatedName);
        }
        
        // Switch to output tab
        setCurrentTab('output');
      } else {
        throw new Error(data.error || 'Failed to generate tests');
      }
    } catch (error: any) {
      console.error('Error generating MUnit tests:', error);
      // Suppress error toast since it's handled by the edge function
    } finally {
      setIsGenerating(false);
    }
  };
  
  const saveToWorkspace = async (testsCode: string, name: string) => {
    if (!selectedWorkspaceId || !user) {
      toast.error('You must be logged in and have a workspace selected to save the tests');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const taskId = `M-${uuid().substring(0, 8).toUpperCase()}`;
      
      const taskData: MUnitGeneratorPayload = {
        task_id: taskId,
        task_name: name,
        user_id: user.id,
        workspace_id: selectedWorkspaceId,
        description,
        notes,
        flow_implementation: flowImplementation,
        runtime,
        scenario_count: numberOfScenarios,
        generated_tests: testsCode,
        category: "munit" // Using literal string "munit"
      };
      
      const result = await saveMUnitTask(taskData);
      
      if (result && result.length > 0 && result[0]) {
        toast.success('MUnit tests saved to workspace!');
        setSavedTaskId(result[0].id);
        
        if (onTaskCreated) {
          onTaskCreated(result[0]);
        }
        
        if (onSaveTask && result[0].id) {
          onSaveTask(result[0].id);
        }
      } else {
        throw new Error('Failed to save MUnit tests');
      }
    } catch (error) {
      console.error('Error saving MUnit tests:', error);
      toast.error('Failed to save MUnit tests');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (savedTaskId) {
    return <TaskDetailsView task={{
      id: savedTaskId,
      task_id: savedTaskId,
      task_name: testName,
      category: 'munit',
      created_at: new Date().toISOString(),
      workspace_id: selectedWorkspaceId || '',
      description,
      notes,
      flow_implementation: flowImplementation,
      runtime,
      scenario_count: numberOfScenarios,
      generated_tests: generatedTests
    }} onBack={onBack || (() => setSavedTaskId(null))} />;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          MUnit Test Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate MUnit tests for your Mule flows. Provide your flow implementation and we'll generate comprehensive tests.
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="output" disabled={!generatedTests}>Output</TabsTrigger>
        </TabsList>
        
        <TabsContent value="input">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="testName">Test Suite Name</Label>
                <Input
                  id="testName"
                  placeholder="MUnit Test Suite Name"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your flow does..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="flowImplementation">Flow Implementation (XML)</Label>
                <Textarea
                  id="flowImplementation"
                  placeholder="Paste your Mule flow XML here..."
                  rows={12}
                  value={flowImplementation}
                  onChange={(e) => setFlowImplementation(e.target.value)}
                  required
                  className="font-mono"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="runtime">Mule Runtime</Label>
                  <Input
                    id="runtime"
                    placeholder="Mule 4.4, Java 8"
                    value={runtime}
                    onChange={(e) => setRuntime(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="numberOfScenarios">Number of Test Scenarios</Label>
                  <Input
                    id="numberOfScenarios"
                    type="number"
                    min={1}
                    max={10}
                    value={numberOfScenarios}
                    onChange={(e) => setNumberOfScenarios(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information for test generation..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              {onBack && (
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
              )}
              
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate MUnit Tests'
                )}
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="output">
          <div className="space-y-6">
            <div>
              <Label htmlFor="generatedTests">Generated MUnit Tests</Label>
              <div className="relative mt-2">
                <Textarea
                  id="generatedTests"
                  value={generatedTests}
                  readOnly
                  rows={20}
                  className="font-mono bg-gray-50 dark:bg-gray-800"
                />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedTests);
                    toast.success('Copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between space-x-4">
              <Button type="button" variant="outline" onClick={() => setCurrentTab('input')}>
                Back to Input
              </Button>
              
              {selectedWorkspaceId && (
                <Button 
                  type="button" 
                  disabled={isSaving}
                  onClick={() => saveToWorkspace(generatedTests, testName)}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save to Workspace'
                  )}
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MUnitTestGenerator;
