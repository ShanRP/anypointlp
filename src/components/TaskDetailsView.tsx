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
import MonacoEditor from './MonacoEditor';

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

  const renderRamlSpecification = (ramlContent: string) => {
    return (
      <div className="space-y-8">
        {task.api_name && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">API Information</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(task.api_name || '')}
                className="text-xs"
              >
                <Copy size={14} className="mr-1" /> Copy
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">API Name</p>
                <p>{task.api_name}</p>
              </div>
              {task.api_version && (
                <div>
                  <p className="text-sm font-medium text-gray-500">API Version</p>
                  <p>{task.api_version}</p>
                </div>
              )}
              {task.base_uri && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Base URI</p>
                  <p>{task.base_uri}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {task.description && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Description</h2>
            </div>
            <p className="whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {task.endpoints && task.endpoints.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Endpoints</h2>
            </div>
            <div className="space-y-4">
              {task.endpoints.map((endpoint: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-md p-3">
                  <p className="font-mono text-blue-600 font-medium">/{endpoint.path}</p>
                  {endpoint.description && <p className="text-sm text-gray-600 mt-1">{endpoint.description}</p>}
                  
                  {endpoint.methods && endpoint.methods.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {endpoint.methods.map((method: any, methodIndex: number) => (
                        <div key={methodIndex} className="pl-4 border-l-2 border-gray-200">
                          <p className={`uppercase font-mono font-medium ${
                            method.type === 'get' ? 'text-green-600' :
                            method.type === 'post' ? 'text-blue-600' :
                            method.type === 'put' ? 'text-orange-600' :
                            method.type === 'delete' ? 'text-red-600' : 'text-gray-600'
                          }`}>{method.type}</p>
                          {method.description && <p className="text-sm text-gray-600">{method.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">RAML Specification</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => copyToClipboard(ramlContent)}
              className="text-xs"
            >
              <Copy size={14} className="mr-1" /> Copy
            </Button>
          </div>
          <div className="relative">
            <MonacoEditor
              value={ramlContent}
              language="yaml"
              height="400px"
              readOnly={true}
              options={{
                minimap: { enabled: true }
              }}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={handleBackButton}>
            Back to Dashboard
          </Button>
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(ramlContent);
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

  const isDataWeaveTask = (task: TaskDetails) => task.category === 'dataweave';
  const isIntegrationTask = (task: TaskDetails) => task.category === 'integration' || task.task_name?.includes('Integration Flow');
  const isRAMLTask = (task: TaskDetails) => task.category === 'raml';
  const isMUnitTask = (task: TaskDetails) => task.category === 'munit';
  const isSampleDataTask = (task: TaskDetails) => task.category === 'sampledata';
  const isDiagramTask = (task: TaskDetails) => task.category === 'diagram';
  const isDocumentTask = (task: TaskDetails) => task.category === 'document';

  const renderTaskDetails = () => {
    if (task.category === 'dataweave') {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">DataWeave Script Details</h2>
            <div className="text-gray-500 text-sm">
              Created on {new Date(task.created_at).toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-md font-semibold mb-1">Description</h3>
              <p className="text-gray-700 dark:text-gray-300">{task.description || 'No description provided'}</p>
            </div>
            <div>
              <h3 className="text-md font-semibold mb-1">Input Format</h3>
              <p className="text-gray-700 dark:text-gray-300">{task.input_format || 'No input format provided'}</p>
            </div>
          </div>

          {task.notes && (
            <div>
              <h3 className="text-md font-semibold mb-1">Notes</h3>
              <p className="text-gray-700 dark:text-gray-300">{task.notes}</p>
            </div>
          )}

          <div>
            <h3 className="text-md font-semibold mb-1">DataWeave Script</h3>
            <div className="border rounded-md overflow-hidden">
              <MonacoEditor
                language="dataweave"
                value={task.dataweave_script || ''}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
                height="250px"
              />
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold mb-1">Generated Data</h3>
            <div className="border rounded-md overflow-hidden">
              <MonacoEditor
                language="json"
                value={task.generated_data || ''}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
                height="400px"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(task.generated_data || '');
                toast.success('Generated data copied to clipboard');
              }}
            >
              Copy to Clipboard
            </Button>
          </div>
        </div>
      );
    } else if (task.category === 'integration') {
      return renderIntegrationFlow(task.generated_scripts && task.generated_scripts.length > 0 ? task.generated_scripts[0].code : '');
    } else if (task.category === 'raml') {
      return renderRamlSpecification(task.raml_content || '');
    } else if (task.category === 'munit') {
      if (task.flow_implementation && task.generated_tests) {
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Flow Implementation</h3>
              <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                <MonacoEditor
                  height="300px"
                  language="xml"
                  value={task.flow_implementation}
                  readOnly={true}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Generated Tests</h3>
              <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                <MonacoEditor
                  height="400px"
                  language="xml"
                  value={task.generated_tests}
                  readOnly={true}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium">Runtime</h3>
                <p className="mt-1 text-gray-500">{task.runtime}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Scenario Count</h3>
                <p className="mt-1 text-gray-500">{task.scenario_count}</p>
              </div>
            </div>
            
            {task.notes && (
              <div>
                <h3 className="text-lg font-medium">Notes</h3>
                <p className="mt-1 text-gray-500">{task.notes}</p>
              </div>
            )}
          </div>
        );
      }
    } else if (task.category === 'sampledata') {
      if (task.dataweave_script && task.generated_data) {
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">DataWeave Script</h3>
              <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                <MonacoEditor
                  height="300px"
                  language="javascript"
                  value={task.dataweave_script}
                  readOnly={true}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Generated Sample Data</h3>
              <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                <MonacoEditor
                  height="400px"
                  language="json"
                  value={task.generated_data}
                  readOnly={true}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
            
            {task.input_schema && (
              <div>
                <h3 className="text-lg font-medium">Input Schema</h3>
                <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                  <MonacoEditor
                    height="200px"
                    language="json"
                    value={task.input_schema}
                    readOnly={true}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>
            )}
            
            {task.output_schema && (
              <div>
                <h3 className="text-lg font-medium">Output Schema</h3>
                <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                  <MonacoEditor
                    height="200px"
                    language="json"
                    value={task.output_schema}
                    readOnly={true}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium">Sample Count</h3>
              <p className="mt-1 text-gray-500">{task.sample_count || 5}</p>
            </div>
          </div>
        );
      }
    } else if (task.category === 'diagram') {
      if (task.diagram_content && task.generated_diagram) {
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Diagram Specification</h3>
              <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                <MonacoEditor
                  height="300px"
                  language="markdown"
                  value={task.diagram_content}
                  readOnly={true}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Generated Diagram</h3>
              <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <div 
                  className="overflow-auto max-h-[500px]"
                  dangerouslySetInnerHTML={{ __html: task.generated_diagram }} 
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Diagram Type</h3>
              <p className="mt-1 text-gray-500">{task.diagram_type}</p>
            </div>
          </div>
        );
      }
    } else if (task.category === 'document') {
      if (task.source_content && task.generated_document) {
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Source Content</h3>
              <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                <MonacoEditor
                  height="300px"
                  language={task.document_type === 'markdown' ? 'markdown' : 'text'}
                  value={task.source_content}
                  readOnly={true}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Generated Document</h3>
              {task.document_type === 'markdown' ? (
                <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 markdown-content">
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap">{task.generated_document}</pre>
                  </div>
                </div>
              ) : (
                <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                  <MonacoEditor
                    height="400px"
                    language="text"
                    value={task.generated_document}
                    readOnly={true}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Document Type</h3>
              <p className="mt-1 text-gray-500">{task.document_type}</p>
            </div>
          </div>
        );
      }
    }
  };

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
            <span>{task.category}</span>
          </div>
        }
      />

      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-purple-900/20 h-2 w-full rounded-full mb-8">
        <div className="bg-purple-500 h-2 rounded-full w-full"></div>
      </div>

      {task.notes && !isIntegrationTask(task) && !isRAMLTask(task) && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Notes</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{task.notes}</p>
        </div>
      )}
      
      {renderTaskDetails()}
    </motion.div>
  );
};

export default TaskDetailsView;
