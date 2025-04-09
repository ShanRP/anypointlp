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
import { Card, CopyIcon } from '@/components/ui';

type TaskDetailsViewProps = {
  task: TaskDetails;
  onBack?: () => void;
};

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

  const renderTaskContent = () => {
    switch (task.category) {
      case 'integration':
        return renderIntegrationFlow(task.generated_scripts[0].code);
      
      case 'raml':
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
                  onClick={() => copyToClipboard(task.raml_content)}
                  className="text-xs"
                >
                  <Copy size={14} className="mr-1" /> Copy
                </Button>
              </div>
              <div className="relative">
                <MonacoEditor
                  value={task.raml_content}
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
                  navigator.clipboard.writeText(task.raml_content);
                  toast.success('All content copied to clipboard!');
                }}
                className="bg-black hover:bg-gray-800 text-white"
              >
                Copy All
              </Button>
            </div>
          </div>
        );
      
      case 'munit':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Test Description</h3>
                <p className="text-gray-700 dark:text-gray-300">{task.description || 'No description provided'}</p>
                {task.flow_description && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Additional Notes</h3>
                    <p className="text-gray-700 dark:text-gray-300">{task.flow_description}</p>
                  </div>
                )}
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Test Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Runtime:</span>
                    <span className="font-medium">{task.runtime || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Number of Scenarios:</span>
                    <span className="font-medium">{task.number_of_scenarios || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Created:</span>
                    <span className="font-medium">{new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Task ID:</span>
                    <span className="font-mono text-sm">{task.task_id}</span>
                  </div>
                </div>
              </Card>
            </div>
            
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">Flow Implementation</h3>
              <div className="border rounded-md overflow-hidden">
                <MonacoEditor
                  language="xml"
                  value={task.flow_implementation || '<!-- No flow implementation provided -->'}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                  height="300px"
                />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Generated MUnit Tests</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(task.munit_content || '');
                    toast.success("MUnit test content has been copied to clipboard");
                  }}
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="border rounded-md overflow-hidden">
                <MonacoEditor
                  language="xml"
                  value={task.munit_content || '<!-- No MUnit tests generated -->'}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                  height="400px"
                />
              </div>
            </Card>
          </div>
        );
      
      default:
        return (
          <div className="text-center p-10">
            <div className="text-gray-500 dark:text-gray-400">Unknown task type</div>
          </div>
        );
    }
  };

  const isIntegrationTask = task.category === 'integration' || task.task_name?.includes('Integration Flow');
  const isRamlTask = task.category === 'raml';

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
      
      {isRamlTask && task.raml_content ? (
        renderRamlSpecification(task.raml_content)
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
