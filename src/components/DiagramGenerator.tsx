
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useWorkspaceTasks, DiagramPayload } from '@/hooks/useWorkspaceTasks';

interface DiagramGeneratorProps {
  selectedWorkspaceId?: string;
  onBack?: () => void;
}

const DiagramGenerator: React.FC<DiagramGeneratorProps> = ({
  selectedWorkspaceId,
  onBack
}) => {
  const { user } = useAuth();
  const { saveDiagramTask } = useWorkspaceTasks(selectedWorkspaceId || '');
  
  const [diagramType, setDiagramType] = useState('sequence');
  const [diagramContent, setDiagramContent] = useState(
`title Sequence Diagram Example
participant User
participant API
participant Database

User->API: Request Data
API->Database: Query Data
Database-->API: Return Results
API-->User: Response with Data`
  );
  
  const [generatedDiagram, setGeneratedDiagram] = useState('');
  const [generating, setGenerating] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      taskName: '',
      description: ''
    }
  });
  
  const handleGenerateDiagram = async () => {
    if (!diagramContent.trim()) {
      toast.error('Please provide diagram content');
      return;
    }
    
    setGenerating(true);
    
    try {
      // For demo/mock purposes, we'll generate a simple SVG
      // In a real app, this would call an API to render the diagram
      setTimeout(() => {
        try {
          // Generate a mock SVG diagram
          const mockSvg = generateMockDiagram(diagramType, diagramContent);
          setGeneratedDiagram(mockSvg);
          toast.success('Diagram generated successfully!');
        } catch (error) {
          console.error('Error generating diagram:', error);
          toast.error('Failed to generate diagram');
        } finally {
          setGenerating(false);
        }
      }, 1500);
    } catch (error) {
      console.error('Error generating diagram:', error);
      toast.error('Failed to generate diagram');
      setGenerating(false);
    }
  };
  
  const generateMockDiagram = (type: string, content: string) => {
    // This is a very simplified mock diagram generation
    // In a real app, you would use a proper diagram rendering library or service
    
    // Generate a simple SVG based on the diagram type
    if (type === 'sequence') {
      return `
<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: Arial; font-size: 12px; }
    .title { font-size: 16px; font-weight: bold; }
    .actor { font-weight: bold; }
    .lifeline { stroke: #aaa; stroke-dasharray: 5,5; }
    .message { stroke: #000; marker-end: url(#arrowhead); }
    .return-message { stroke: #000; stroke-dasharray: 2,2; marker-end: url(#arrowhead); }
  </style>
  
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" />
    </marker>
  </defs>
  
  <text x="300" y="30" text-anchor="middle" class="title">Sequence Diagram</text>
  
  <!-- Actors -->
  <rect x="50" y="50" width="80" height="30" fill="#eee" stroke="#000" />
  <text x="90" y="70" text-anchor="middle" class="actor">User</text>
  <line x1="90" y1="80" x2="90" y2="350" class="lifeline" />
  
  <rect x="250" y="50" width="80" height="30" fill="#eee" stroke="#000" />
  <text x="290" y="70" text-anchor="middle" class="actor">API</text>
  <line x1="290" y1="80" x2="290" y2="350" class="lifeline" />
  
  <rect x="450" y="50" width="80" height="30" fill="#eee" stroke="#000" />
  <text x="490" y="70" text-anchor="middle" class="actor">Database</text>
  <line x1="490" y1="80" x2="490" y2="350" class="lifeline" />
  
  <!-- Messages -->
  <line x1="90" y1="120" x2="290" y2="120" class="message" />
  <text x="190" y="115" text-anchor="middle">Request Data</text>
  
  <line x1="290" y1="180" x2="490" y2="180" class="message" />
  <text x="390" y="175" text-anchor="middle">Query Data</text>
  
  <line x1="490" y1="240" x2="290" y2="240" class="return-message" />
  <text x="390" y="235" text-anchor="middle">Return Results</text>
  
  <line x1="290" y1="300" x2="90" y2="300" class="return-message" />
  <text x="190" y="295" text-anchor="middle">Response with Data</text>
</svg>`;
    } else if (type === 'flowchart') {
      return `
<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: Arial; font-size: 12px; }
    .title { font-size: 16px; font-weight: bold; }
    .node { fill: #eee; stroke: #000; }
    .arrow { stroke: #000; marker-end: url(#arrowhead); }
  </style>
  
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" />
    </marker>
  </defs>
  
  <text x="300" y="30" text-anchor="middle" class="title">Flow Chart</text>
  
  <!-- Nodes -->
  <rect x="250" y="50" width="100" height="50" rx="5" class="node" />
  <text x="300" y="80" text-anchor="middle">Start</text>
  
  <rect x="250" y="150" width="100" height="50" rx="5" class="node" />
  <text x="300" y="180" text-anchor="middle">Process</text>
  
  <rect x="100" y="250" width="100" height="50" rx="5" class="node" />
  <text x="150" y="280" text-anchor="middle">Decision A</text>
  
  <rect x="400" y="250" width="100" height="50" rx="5" class="node" />
  <text x="450" y="280" text-anchor="middle">Decision B</text>
  
  <rect x="250" y="350" width="100" height="50" rx="5" class="node" />
  <text x="300" y="380" text-anchor="middle">End</text>
  
  <!-- Arrows -->
  <line x1="300" y1="100" x2="300" y2="150" class="arrow" />
  <line x1="300" y1="200" x2="300" y2="225" class="arrow" />
  <line x1="300" y1="225" x2="150" y2="250" class="arrow" />
  <line x1="300" y1="225" x2="450" y2="250" class="arrow" />
  <line x1="150" y1="300" x2="150" y2="325" class="arrow" />
  <line x1="450" y1="300" x2="450" y2="325" class="arrow" />
  <line x1="150" y1="325" x2="300" y2="350" class="arrow" />
  <line x1="450" y1="325" x2="300" y2="350" class="arrow" />
</svg>`;
    } else {
      return `
<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <text x="300" y="200" text-anchor="middle" font-family="Arial" font-size="16">
    Generated ${type} diagram would appear here
  </text>
</svg>`;
    }
  };
  
  const handleCopyToClipboard = () => {
    if (generatedDiagram) {
      navigator.clipboard.writeText(generatedDiagram);
      toast.success('Diagram SVG copied to clipboard!');
    }
  };
  
  const handleDownload = () => {
    if (generatedDiagram) {
      const blob = new Blob([generatedDiagram], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${diagramType}-diagram.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Diagram downloaded!');
    }
  };
  
  const handleSaveTask = handleSubmit(async (data) => {
    if (!user || !selectedWorkspaceId) {
      toast.error('You must be logged in to save a task');
      return;
    }
    
    if (!generatedDiagram) {
      toast.error('Please generate a diagram first');
      return;
    }
    
    try {
      const uniqueId = uuidv4().substring(0, 8);
      
      const payload: DiagramPayload = {
        task_id: uniqueId,
        task_name: data.taskName || `${diagramType.charAt(0).toUpperCase() + diagramType.slice(1)} Diagram`,
        user_id: user.id,
        workspace_id: selectedWorkspaceId,
        description: data.description || '',
        diagram_type: diagramType,
        diagram_content: diagramContent,
        generated_diagram: generatedDiagram,
        category: 'diagram'
      };
      
      const result = await saveDiagramTask(payload);
      
      if (result) {
        toast.success('Diagram task saved successfully!');
        if (onBack) {
          onBack();
        }
      }
    } catch (error) {
      console.error('Error saving diagram task:', error);
      toast.error('Failed to save diagram task');
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
        <h1 className="text-2xl font-bold">Diagram Generator</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Diagram Specification</h2>
            
            <div className="mb-4">
              <Label htmlFor="diagramType">Diagram Type</Label>
              <Select
                value={diagramType}
                onValueChange={setDiagramType}
              >
                <SelectTrigger id="diagramType">
                  <SelectValue placeholder="Select diagram type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequence">Sequence Diagram</SelectItem>
                  <SelectItem value="flowchart">Flow Chart</SelectItem>
                  <SelectItem value="class">Class Diagram</SelectItem>
                  <SelectItem value="entity">Entity Relationship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="h-72 border rounded-md overflow-hidden">
              <Editor
                language="markdown"
                value={diagramContent}
                onChange={(value) => setDiagramContent(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14
                }}
              />
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={handleGenerateDiagram}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Diagram'}
            </Button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <Label htmlFor="taskName">Task Name</Label>
                <Input
                  id="taskName"
                  placeholder="Enter a name for this diagram"
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
                  placeholder="Enter a description for this diagram"
                  {...register('description')}
                  className="h-24"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={!generatedDiagram}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Diagram
              </Button>
            </form>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Generated Diagram</h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyToClipboard}
                disabled={!generatedDiagram}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy SVG
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
                disabled={!generatedDiagram}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md p-4 bg-white h-[600px] overflow-auto">
            {generatedDiagram ? (
              <div dangerouslySetInnerHTML={{ __html: generatedDiagram }} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Generated diagram will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagramGenerator;
