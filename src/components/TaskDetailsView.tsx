
import React from 'react';
import { Calendar, Tag, Code, Copy } from 'lucide-react';
import { TaskDetails } from '@/hooks/useWorkspaceTasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataWeaveResult from './DataWeaveResult';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { BackButton } from './ui/BackButton';

interface TaskDetailsViewProps {
  task: TaskDetails;
  onBack: () => void;
}

const TaskDetailsView: React.FC<TaskDetailsViewProps> = ({ task, onBack }) => {
  const navigate = useNavigate();

  const findSampleForScript = (scriptId: string, index: number) => {
    if (task.input_samples && task.input_samples.length > index) {
      return {
        inputSample: task.input_samples[index],
        outputSample: task.output_samples && task.output_samples.length > index 
          ? task.output_samples[index] 
          : null
      };
    }
    return null;
  };

  const handleBackButton = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const parseIntegrationCode = (code: string) => {
    const flowSummaryPattern = /# Flow Summary\s*\n([\s\S]*?)(?=\n# Flow Implementation|\n#{1,3}\s*Flow Implementation|$)/i;
    const flowImplementationPattern = /# Flow Implementation\s*\n([\s\S]*?)(?=\n# Flow Constants|\n#{1,3}\s*Flow Constants|$)/i;
    const flowConstantsPattern = /# Flow Constants\s*\n([\s\S]*?)(?=\n# POM Dependencies|\n#{1,3}\s*POM Dependencies|$)/i;
    const pomDependenciesPattern = /# POM Dependencies\s*\n([\s\S]*?)(?=\n# Compilation Check|\n#{1,3}\s*Compilation Check|$)/i;
    const compilationCheckPattern = /# Compilation Check\s*\n([\s\S]*?)(?=$)/i;
    
    const altFlowSummaryPattern = /(?:^|\n)(?:#{1,3}\s*)?Flow Summary\s*(?:#{1,3}\s*)?\n([\s\S]*?)(?=\n(?:#{1,3}\s*)?Flow Implementation|$)/i;
    const altFlowImplementationPattern = /(?:^|\n)(?:#{1,3}\s*)?Flow Implementation\s*(?:#{1,3}\s*)?\n([\s\S]*?)(?=\n(?:#{1,3}\s*)?Flow Constants|$)/i;
    const altFlowConstantsPattern = /(?:^|\n)(?:#{1,3}\s*)?Flow Constants\s*(?:#{1,3}\s*)?\n([\s\S]*?)(?=\n(?:#{1,3}\s*)?POM Dependencies|$)/i;
    const altPomDependenciesPattern = /(?:^|\n)(?:#{1,3}\s*)?POM Dependencies\s*(?:#{1,3}\s*)?\n([\s\S]*?)(?=\n(?:#{1,3}\s*)?Compilation Check|$)/i;
    const altCompilationCheckPattern = /(?:^|\n)(?:#{1,3}\s*)?Compilation Check\s*(?:#{1,3}\s*)?\n([\s\S]*?)(?=$)/i;
    
    let flowSummaryMatch = code.match(flowSummaryPattern);
    if (!flowSummaryMatch || !flowSummaryMatch[1].trim()) {
      flowSummaryMatch = code.match(altFlowSummaryPattern);
    }
    
    let flowImplementationMatch = code.match(flowImplementationPattern);
    if (!flowImplementationMatch || !flowImplementationMatch[1].trim()) {
      flowImplementationMatch = code.match(altFlowImplementationPattern);
    }
    
    let flowConstantsMatch = code.match(flowConstantsPattern);
    if (!flowConstantsMatch || !flowConstantsMatch[1].trim()) {
      flowConstantsMatch = code.match(altFlowConstantsPattern);
    }
    
    let pomDependenciesMatch = code.match(pomDependenciesPattern);
    if (!pomDependenciesMatch || !pomDependenciesMatch[1].trim()) {
      pomDependenciesMatch = code.match(altPomDependenciesPattern);
    }
    
    let compilationCheckMatch = code.match(compilationCheckPattern);
    if (!compilationCheckMatch || !compilationCheckMatch[1].trim()) {
      compilationCheckMatch = code.match(altCompilationCheckPattern);
    }
    
    const defaultSummary = "This integration implements the requested functionality.";
    const defaultConstants = "host: 0.0.0.0\nport: 8081\napi_path: /api";
    const defaultPomDeps = "<dependency>\n  <groupId>org.mule.connectors</groupId>\n  <artifactId>mule-http-connector</artifactId>\n  <version>1.5.25</version>\n  <classifier>mule-plugin</classifier>\n</dependency>";
    const defaultCompCheck = "Ensure all property placeholders are defined in your properties file.";
    
    const noSectionsFound = !flowSummaryMatch && !flowImplementationMatch && 
                           !flowConstantsMatch && !pomDependenciesMatch && 
                           !compilationCheckMatch;
    
    return {
      flowSummary: flowSummaryMatch ? flowSummaryMatch[1].trim() : 
                  (noSectionsFound ? defaultSummary : defaultSummary),
      flowImplementation: flowImplementationMatch ? flowImplementationMatch[1].trim() : 
                         (noSectionsFound ? code.trim() : "<!-- XML implementation not provided -->"),
      flowConstants: flowConstantsMatch ? flowConstantsMatch[1].trim() : 
                   (noSectionsFound ? defaultConstants : defaultConstants),
      pomDependencies: pomDependenciesMatch ? pomDependenciesMatch[1].trim() : 
                     (noSectionsFound ? defaultPomDeps : defaultPomDeps),
      compilationCheck: compilationCheckMatch ? compilationCheckMatch[1].trim() : 
                      (noSectionsFound ? defaultCompCheck : defaultCompCheck)
    };
  };

  const renderIntegrationFlow = (code: string) => {
    const sections = parseIntegrationCode(code);
    
    console.log('Parsed Sections:', sections);
    
    return (
      <div className="space-y-8">
        {sections.flowSummary && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Flow Summary</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(sections.flowSummary)}
                className="text-xs"
              >
                <Copy size={14} className="mr-1" /> Copy
              </Button>
            </div>
            <p className="whitespace-pre-wrap">{sections.flowSummary}</p>
          </div>
        )}

        {sections.flowImplementation && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Flow Implementation</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(sections.flowImplementation)}
                className="text-xs"
              >
                <Copy size={14} className="mr-1" /> Copy
              </Button>
            </div>
            <div className="relative">
              <pre className="bg-black text-green-400 p-4 rounded-md overflow-x-auto text-sm font-mono">
                {sections.flowImplementation}
              </pre>
            </div>
          </div>
        )}

        {sections.flowConstants && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Flow Constants</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(sections.flowConstants)}
                className="text-xs"
              >
                <Copy size={14} className="mr-1" /> Copy
              </Button>
            </div>
            <pre className="bg-black text-green-400 p-4 rounded-md overflow-x-auto text-sm font-mono">
              {sections.flowConstants}
            </pre>
          </div>
        )}

        {sections.pomDependencies && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">POM Dependencies</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(sections.pomDependencies)}
                className="text-xs"
              >
                <Copy size={14} className="mr-1" /> Copy
              </Button>
            </div>
            <pre className="bg-black text-green-400 p-4 rounded-md overflow-x-auto text-sm font-mono">
              {sections.pomDependencies}
            </pre>
          </div>
        )}

        {sections.compilationCheck && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Compilation Check</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(sections.compilationCheck)}
                className="text-xs"
              >
                <Copy size={14} className="mr-1" /> Copy
              </Button>
            </div>
            <pre className="bg-black text-green-400 p-4 rounded-md overflow-x-auto text-sm font-mono">
              {sections.compilationCheck}
            </pre>
          </div>
        )}
        
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={handleBackButton}>
            Back to Dashboard
          </Button>
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(code);
              toast.success('All content copied to clipboard!');
            }}
            className="bg-black hover:bg-gray-800 text-white"
          >
            Copy All
          </Button>
        </div>
      </div>
    );
  };

  const renderRamlSpec = (code: string) => {
    return (
      <div className="space-y-8">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">RAML Specification</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => copyToClipboard(code)}
              className="text-xs"
            >
              <Copy size={14} className="mr-1" /> Copy
            </Button>
          </div>
          <div className="relative">
            <pre className="bg-black text-yellow-400 p-4 rounded-md overflow-x-auto text-sm font-mono">
              {code}
            </pre>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={handleBackButton}>
            Back to Dashboard
          </Button>
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(code);
              toast.success('RAML specification copied to clipboard!');
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Copy All
          </Button>
        </div>
      </div>
    );
  };

  // Check task category to determine rendering style
  const isIntegrationTask = task.category === 'integration' || task.task_name?.includes('Integration Flow');
  const isRamlTask = task.category === 'raml' || task.task_name?.includes('API Specification');

  return (
    <motion.div 
      className="p-8 max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <BackButton 
        onBack={handleBackButton}
        label={`${task.task_id} - ${task.task_name}`}
        description={
          <div className="flex items-center text-sm text-gray-500">
            <Calendar size={14} className="mr-2" />
            <span>{new Date(task.created_at).toLocaleString()}</span>
            <span className="mx-2">•</span>
            <Tag size={14} className="mr-2" />
            <span>{task.input_format}</span>
          </div>
        }
      />

      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-purple-900/20 h-2 w-full rounded-full mb-8">
        <div className="bg-purple-500 h-2 rounded-full w-full"></div>
      </div>

      {task.notes && !isIntegrationTask && !isRamlTask && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Notes</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{task.notes}</p>
        </div>
      )}
      
      {isRamlTask && task.generated_scripts && task.generated_scripts.length > 0 ? (
        renderRamlSpec(task.generated_scripts[0].code)
      ) : isIntegrationTask && task.generated_scripts && task.generated_scripts.length > 0 ? (
        renderIntegrationFlow(task.generated_scripts[0].code)
      ) : task.generated_scripts && task.generated_scripts.length > 0 ? (
        <Tabs defaultValue={task.generated_scripts[0].id} className="w-full">
          <TabsList className="mb-4 flex flex-wrap">
            {task.generated_scripts.map((script: any, index: number) => (
              <TabsTrigger key={script.id} value={script.id}>
                <Code size={14} className="mr-2" />
                Script {index + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {task.generated_scripts.map((script: any, index: number) => {
            const samples = findSampleForScript(script.id, index);
            
            return (
              <TabsContent key={script.id} value={script.id}>
                <DataWeaveResult 
                  script={script.code} 
                  onNewTask={handleBackButton} 
                  showNewTaskButton={false}
                  inputSample={samples?.inputSample}
                  outputSample={samples?.outputSample}
                  originalNotes={task.notes || ""}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">No scripts found for this task</p>
        </div>
      )}
    </motion.div>
  );
};

export default TaskDetailsView;
