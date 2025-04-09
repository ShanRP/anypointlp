import React, { useState } from 'react';
import { ArrowLeft, Save, TestTube2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspaceTasks, MUnitGeneratorPayload } from '@/hooks/useWorkspaceTasks';

interface MUnitTestGeneratorProps {
  selectedWorkspaceId?: string;
  onBack?: () => void;
  onTaskCreated?: (task: any) => void;
  onSaveTask?: () => void;
}

const MUnitTestGenerator: React.FC<MUnitTestGeneratorProps> = ({
  selectedWorkspaceId,
  onBack,
  onTaskCreated,
  onSaveTask
}) => {
  const { user } = useAuth();
  const { saveMUnitTask } = useWorkspaceTasks(selectedWorkspaceId || '');
  
  const [flowImplementation, setFlowImplementation] = useState('');
  const [generatedTests, setGeneratedTests] = useState('');
  const [generating, setGenerating] = useState(false);
  const [runtime, setRuntime] = useState('4.4.0');
  const [scenarios, setScenarios] = useState<any[]>([]);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      taskName: '',
      description: '',
      notes: ''
    }
  });

  const handleGenerateTests = async () => {
    if (!flowImplementation.trim()) {
      toast.error('Please provide a flow implementation');
      return;
    }
    
    setGenerating(true);
    
    try {
      // For demo/mock purposes, we'll generate some XML tests
      // In a real application, this would call an API to generate the tests
      setTimeout(() => {
        try {
          // This is a simplified mock of what the MUnit generator would do
          // In a real app, this would be handled by a proper MUnit engine
          const mockTests = generateMockTests(flowImplementation);
          setGeneratedTests(mockTests);
          setScenarios([{ id: 1, name: 'Scenario 1' }]);
          toast.success('MUnit tests generated successfully!');
        } catch (error) {
          console.error('Error parsing mock tests:', error);
          toast.error('Failed to generate MUnit tests');
        } finally {
          setGenerating(false);
        }
      }, 1500);
    } catch (error) {
      console.error('Error generating MUnit tests:', error);
      toast.error('Failed to generate MUnit tests');
      setGenerating(false);
    }
  };
  
  const generateMockTests = (flowCode: string) => {
    // Very simplified mock test generator
    // In a real app, this would be the result of executing the MUnit engine
    return `<?xml version="1.0" encoding="UTF-8"?>
<mule xmlns:munit="http://www.mulesoft.org/schema/mule/munit" 
       xmlns="http://www.mulesoft.org/schema/mule/core"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
         http://www.mulesoft.org/schema/mule/munit http://www.mulesoft.org/schema/mule/munit/current/mule-munit.xsd
         http://www.mulesoft.org/schema/mule/core http://www.mulesoft.org/schema/mule/core/current/mule.xsd">

    <munit:config name="munitSuite" />

    <flow name="testFlow">
        <munit:execution>
            <munit:set-event doc:name="Set Input">
                <!-- Define input payload and attributes here -->
            </munit:set-event>
        </munit:execution>
        <munit:validation>
            <munit:assert-equals doc:name="Assert Payload">
                <munit:actual><![CDATA[#[payload]]]></munit:actual>
                <munit:expected><![CDATA[#[%dw 2.0
output application/json
---
{
  "message": "Hello, MUnit!"
}]]]></munit:expected>
            </munit:assert-equals>
        </munit:validation>
    </flow>
</mule>`;
  };
  
  const handleSaveTask = handleSubmit(async (data) => {
    if (!user || !selectedWorkspaceId) {
      toast.error('You must be logged in to save a task');
      return;
    }
    
    if (!generatedTests) {
      toast.error('Please generate some MUnit tests first');
      return;
    }
    
    try {
      const uniqueId = uuidv4().substring(0, 8);

      // Save the task
      if (selectedWorkspaceId && user) {
        try {
          const munitData: MUnitGeneratorPayload = {
            workspace_id: selectedWorkspaceId,
            task_id: uniqueId,
            task_name: data.taskName || 'MUnit Test',
            user_id: user.id,
            description: data.description || '',
            notes: data.notes || '',
            flow_implementation: flowImplementation,
            runtime: runtime,
            scenario_count: scenarios.length,
            generated_tests: generatedTests,
            category: 'munit' // Add this line
          };

          const savedTask = await saveMUnitTask(munitData);
          if (savedTask) {
            toast.success('MUnit tests saved successfully!');
            
            if (onTaskCreated) {
              onTaskCreated({
                id: savedTask[0].id,
                label: data.taskName || 'MUnit Test',
                category: 'munit',
                icon: <TestTube2 size={16} />,
                workspace_id: selectedWorkspaceId
              });
            }
            
            if (onBack) {
              onBack();
            }
          }
        } catch (saveError) {
          console.error('Error saving MUnit task:', saveError);
          toast.error('Failed to save MUnit tests!');
        }
      }
    } catch (error) {
      console.error('Error saving MUnit task:', error);
      toast.error('Failed to save MUnit task');
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
        <h1 className="text-2xl font-bold">MUnit Test Generator</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Flow Implementation</h2>
            <div className="h-72 border rounded-md overflow-hidden">
              <Editor
                language="xml"
                value={flowImplementation}
                onChange={(value) => setFlowImplementation(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14
                }}
              />
            </div>
            
            <div className="mt-4">
              <Label htmlFor="runtime">Runtime</Label>
              <Input
                id="runtime"
                type="text"
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
              />
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={handleGenerateTests}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Tests'}
            </Button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
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
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any notes for this task"
                  {...register('notes')}
                  className="h-24"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={!generatedTests}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Task
              </Button>
            </form>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Tests</h2>
          <div className="h-[600px] border rounded-md overflow-hidden">
            <Editor
              language="xml"
              value={generatedTests}
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

export default MUnitTestGenerator;
