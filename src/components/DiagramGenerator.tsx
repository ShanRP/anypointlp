
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';

interface DiagramGeneratorProps {
  onBack: () => void;
  selectedWorkspaceId?: string;
  onSaveTask?: (taskId: string) => void;
  onTaskCreated?: (task: any) => void;
}

const DiagramGenerator: React.FC<DiagramGeneratorProps> = ({ 
  onBack, 
  selectedWorkspaceId = 'default',
  onSaveTask,
  onTaskCreated
}) => {
  const [taskName, setTaskName] = useState('');
  const [ramlContent, setRamlContent] = useState('');
  const [flowDiagram, setFlowDiagram] = useState('');
  const [connectionSteps, setConnectionSteps] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { saveDiagramTask } = useWorkspaceTasks(selectedWorkspaceId);
  
  const { useCredit } = useUserCredits();
  
  const handleGenerateDiagram = async () => {
    if (!ramlContent.trim()) {
      toast.error('Please provide RAML or API specification');
      return;
    }
    
    // Check if user has credits available
    const canUseCredit = await useCredit();
    if (!canUseCredit) {
      return;
    }
    
    setIsGenerating(true);
    
    try {
      if (!user) {
        toast.error('You must be logged in to save a task.');
        return;
      }
      
      const diagramData = {
        workspace_id: selectedWorkspaceId,
        task_name: taskName || 'Flow Diagram',
        user_id: user.id,
        raml_content: ramlContent,
        flow_diagram: flowDiagram,
        connection_steps: connectionSteps,
        result_content: `
          RAML Content: ${ramlContent}
          Flow Diagram: ${flowDiagram}
          Connection Steps: ${connectionSteps}
        `
      };
      
      const savedTask = await saveDiagramTask(diagramData);
      
      if (savedTask && Array.isArray(savedTask) && savedTask.length > 0) {
        const taskId = savedTask[0].task_id;
        toast.success(`Diagram task saved successfully with ID: ${taskId}`);
        if (onSaveTask) onSaveTask(taskId);
      } else {
        toast.error('Failed to save diagram task.');
      }
      
      if (onTaskCreated) {
        onTaskCreated({
          id: `diagram-${Date.now()}`,
          label: taskName || 'Flow Diagram',
          category: 'diagram',
          icon: React.createElement('div'),
          workspace_id: selectedWorkspaceId
        });
      }
    } catch (err: any) {
      console.error('Error saving diagram task:', err);
      setError(err.message);
      toast.error('Failed to save diagram task');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Diagram Generator</h1>
        
        <Card className="shadow-md">
          <CardHeader>
            <h2 className="text-lg font-medium">Task Details</h2>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="taskName">Task Name</Label>
              <Input
                id="taskName"
                placeholder="Name this diagram task"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="ramlContent">RAML/API Specification</Label>
              <Textarea
                id="ramlContent"
                placeholder="Paste your RAML or API specification here"
                value={ramlContent}
                onChange={(e) => setRamlContent(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="flowDiagram">Flow Diagram</Label>
              <Textarea
                id="flowDiagram"
                placeholder="Describe the flow diagram"
                value={flowDiagram}
                onChange={(e) => setFlowDiagram(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="connectionSteps">Connection Steps</Label>
              <Textarea
                id="connectionSteps"
                placeholder="Describe the connection steps"
                value={connectionSteps}
                onChange={(e) => setConnectionSteps(e.target.value)}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between items-center">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={handleGenerateDiagram} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Diagram'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {error && (
          <div className="mt-4 text-red-500">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagramGenerator;
