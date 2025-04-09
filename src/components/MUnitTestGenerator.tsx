import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from 'sonner';
import { RefreshCw, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { IntegrationGeneratorProps } from '@/hooks/useWorkspaceTasks';
import { useUserCredits } from '@/hooks/useUserCredits';

interface MUnitGeneratorProps extends IntegrationGeneratorProps {
  onSaveTask?: (taskId: string) => void;
}

const MUnitTestGenerator: React.FC<MUnitGeneratorProps> = ({ 
  onTaskCreated, 
  selectedWorkspaceId = 'default',
  onBack,
  onSaveTask 
}) => {
  const [flowImplementation, setFlowImplementation] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [munitContent, setMunitContent] = useState('');
  const [runtime, setRuntime] = useState('4.4.0');
  const [numberOfScenarios, setNumberOfScenarios] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { user } = useAuth();
  
  const { useCredit } = useUserCredits();
  const { saveMunitTask } = useWorkspaceTasks(selectedWorkspaceId);
  
  const handleCopyClick = () => {
    navigator.clipboard.writeText(munitContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleGenerateMUnit = async () => {
    if (!flowImplementation.trim()) {
      toast.error('Please provide a flow implementation');
      return;
    }
    
    // Check if user has credits available
    const canUseCredit = await useCredit();
    if (!canUseCredit) {
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const task_id = `MUNIT-${Date.now().toString(36).toUpperCase()}`;
      
      const munitData = {
        workspace_id: selectedWorkspaceId,
        task_id: task_id,
        task_name: `MUnit Test for ${flowDescription || 'Flow'}`,
        user_id: user?.id || 'anonymous',
        description: flowDescription || '',
        flow_description: flowDescription || '',
        flow_implementation: flowImplementation,
        munit_content: munitContent,
        runtime: runtime,
        number_of_scenarios: numberOfScenarios || 1
      };
      
      const savedTask = await saveMunitTask(munitData);
      
      if (savedTask) {
        toast.success(`MUnit test saved with ID: ${task_id}`);
        
        if (onSaveTask) {
          onSaveTask(task_id);
        }
        
        if (onTaskCreated) {
          onTaskCreated({
            id: task_id,
            label: `MUnit Test for ${flowDescription || 'Flow'}`,
            category: 'munit',
            icon: <RefreshCw className="h-4 w-4 mr-2" />,
            workspace_id: selectedWorkspaceId
          });
        }
      } else {
        toast.error('Failed to save MUnit test');
      }
    } catch (err: any) {
      console.error('Error saving MUnit task:', err);
      toast.error('Failed to save MUnit test');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">MUnit Test Generator</h1>
          <div>
            <Button variant="secondary" onClick={onBack}>Back to Dashboard</Button>
          </div>
        </div>
        
        <Card className="shadow-md">
          <CardHeader>
            <h2 className="text-lg font-semibold">MUnit Test Configuration</h2>
            <p className="text-sm text-gray-500">Configure the settings for generating your MUnit test</p>
          </CardHeader>
          
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="flowDescription">Flow Description</Label>
              <Input 
                id="flowDescription" 
                placeholder="Description of the flow" 
                value={flowDescription}
                onChange={(e) => setFlowDescription(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="flowImplementation">Flow Implementation</Label>
              <Textarea 
                id="flowImplementation" 
                placeholder="Paste your flow implementation here" 
                className="min-h-[100px]"
                value={flowImplementation}
                onChange={(e) => setFlowImplementation(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="runtime">Runtime Version</Label>
              <Input 
                id="runtime" 
                placeholder="Runtime Version" 
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="numberOfScenarios">Number of Scenarios</Label>
              <Input 
                type="number"
                id="numberOfScenarios" 
                placeholder="Number of Scenarios" 
                value={numberOfScenarios}
                onChange={(e) => setNumberOfScenarios(parseInt(e.target.value))}
              />
            </div>
            
            {error && (
              <div className="flex items-center text-sm text-red-500">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {error}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between items-center">
            <Button onClick={handleGenerateMUnit} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate MUnit Test"
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {munitContent ? (
          <Card className="mt-8 shadow-md">
            <CardHeader>
              <h2 className="text-lg font-semibold">Generated MUnit Test</h2>
              <p className="text-sm text-gray-500">Here is the generated MUnit test based on your flow</p>
            </CardHeader>
            
            <CardContent className="relative">
              <Textarea 
                value={munitContent} 
                className="min-h-[200px] font-mono text-sm"
                readOnly
              />
              <Button 
                variant="secondary" 
                className="absolute top-2 right-2"
                onClick={handleCopyClick}
                disabled={isCopied}
              >
                {isCopied ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default MUnitTestGenerator;
