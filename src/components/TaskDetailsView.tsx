import React, { useState } from 'react';
import { ArrowLeft, Copy, Download, Code, Database, FileText, FileCode } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BackButton } from './ui/BackButton';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import MonacoEditor from './MonacoEditor';
import { useTheme } from '@/providers/ThemeProvider';
import { toast } from 'sonner';
import { TaskDetails } from '@/hooks/useWorkspaceTasks';

interface TaskDetailsViewProps {
  task: TaskDetails;
  onBack: () => void;
}

const TaskDetailsView: React.FC<TaskDetailsViewProps> = ({ task, onBack }) => {
  const [activeTab, setActiveTab] = useState('output');
  const { theme } = useTheme();
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'vs';

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const getLanguageForEditor = () => {
    if (task.category === 'integration') {
      return 'xml';
    } else if (task.category === 'raml') {
      return 'yaml';
    } else if (task.category === 'munit') {
      return 'xml';
    } else if (task.category === 'sampledata') {
      return task.source_format?.toLowerCase() === 'yaml' ? 'yaml' : task.source_format?.toLowerCase() || 'json';
    } else if (task.category === 'document') {
      return 'markdown';
    } else if (task.category === 'diagram') {
      return 'markdown';
    }
    return 'dataweave';
  };

  const renderTaskDetails = () => {
    if (task.category === 'dataweave') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Input Samples</CardTitle>
              </CardHeader>
              <CardContent>
                {task.input_samples && task.input_samples.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <MonacoEditor
                      value={task.input_samples[0].value || ''}
                      language="json"
                      height="300px"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        wordWrap: 'on'
                      }}
                      theme={editorTheme}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500">No input samples available</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Output Samples</CardTitle>
              </CardHeader>
              <CardContent>
                {task.output_samples && task.output_samples.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <MonacoEditor
                      value={task.output_samples[0].value || ''}
                      language="json"
                      height="300px"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        wordWrap: 'on'
                      }}
                      theme={editorTheme}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500">No output samples available</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">DataWeave Script</CardTitle>
            </CardHeader>
            <CardContent>
              {task.generated_scripts && task.generated_scripts.length > 0 ? (
                <div className="space-y-4">
                  <div className="border rounded-md overflow-hidden">
                    <MonacoEditor
                      value={task.generated_scripts[0].code || ''}
                      language="dataweave"
                      height="400px"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        wordWrap: 'on'
                      }}
                      theme={editorTheme}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => handleCopyToClipboard(task.generated_scripts[0].code || '')}
                    >
                      <Copy size={16} />
                      Copy to Clipboard
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No generated scripts available</p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    } else if (task.category === 'integration') {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p>{task.description || 'No description available'}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Integration Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <MonacoEditor
                    value={task.generated_scripts?.[0]?.code || task.flow_implementation || ''}
                    language="xml"
                    height="400px"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      wordWrap: 'on'
                    }}
                    theme={editorTheme}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => handleCopyToClipboard(task.generated_scripts?.[0]?.code || task.flow_implementation || '')}
                  >
                    <Copy size={16} />
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else if (task.category === 'raml') {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-md font-medium mb-2">API Name</h3>
                  <p>{task.api_name || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2">Version</h3>
                  <p>{task.api_version || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2">Base URI</h3>
                  <p>{task.base_uri || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">RAML Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <MonacoEditor
                    value={task.raml_content || ''}
                    language="yaml"
                    height="400px"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      wordWrap: 'on'
                    }}
                    theme={editorTheme}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => handleCopyToClipboard(task.raml_content || '')}
                  >
                    <Copy size={16} />
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else if (task.category === 'munit') {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">MUnit Test Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-md font-medium mb-2">Description</h3>
                  <p>{task.flow_description || task.description || 'No description available'}</p>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2">Runtime</h3>
                  <p>{task.runtime || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2">Number of Scenarios</h3>
                  <p>{task.number_of_scenarios || '1'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flow Implementation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <MonacoEditor
                    value={task.flow_implementation || 'No flow implementation available'}
                    language="xml"
                    height="300px"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      wordWrap: 'on'
                    }}
                    theme={editorTheme}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">MUnit Test Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <MonacoEditor
                    value={task.munit_content || 'No MUnit content available'}
                    language="xml"
                    height="400px"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      wordWrap: 'on'
                    }}
                    theme={editorTheme}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => handleCopyToClipboard(task.munit_content || '')}
                  >
                    <Copy size={16} />
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else if (task.category === 'sampledata') {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sample Data Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-md font-medium mb-2">Format</h3>
                  <p>{task.source_format || 'JSON'}</p>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2">Description</h3>
                  <p>{task.description || 'No description available'}</p>
                </div>
                {task.notes && (
                  <div className="col-span-2">
                    <h3 className="text-md font-medium mb-2">Notes</h3>
                    <p>{task.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="schema" className="w-full">
            <TabsList>
              <TabsTrigger value="schema">Schema</TabsTrigger>
              <TabsTrigger value="result">Generated Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="schema" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Schema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-md overflow-hidden">
                      <MonacoEditor
                        value={task.schema_content || 'No schema available'}
                        language={getLanguageForEditor()}
                        height="400px"
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          wordWrap: 'on'
                        }}
                        theme={editorTheme}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => handleCopyToClipboard(task.schema_content || '')}
                      >
                        <Copy size={16} />
                        Copy Schema
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="result" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Sample Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-md overflow-hidden">
                      <MonacoEditor
                        value={task.result_content || task.generated_scripts?.[0]?.code || 'No generated data available'}
                        language={getLanguageForEditor()}
                        height="400px"
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          wordWrap: 'on'
                        }}
                        theme={editorTheme}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => handleCopyToClipboard(task.result_content || task.generated_scripts?.[0]?.code || '')}
                      >
                        <Copy size={16} />
                        Copy Generated Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      );
    } else if (task.category === 'document') {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-md font-medium mb-2">Document Type</h3>
                  <p>{task.document_type || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2">Source Type</h3>
                  <p>{task.source_type || 'Not specified'}</p>
                </div>
                <div className="col-span-2">
                  <h3 className="text-md font-medium mb-2">Description</h3>
                  <p>{task.description || 'No description available'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <MonacoEditor
                    value={task.result_content || 'No document content available'}
                    language="markdown"
                    height="400px"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      wordWrap: 'on'
                    }}
                    theme={editorTheme}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => handleCopyToClipboard(task.result_content || '')}
                  >
                    <Copy size={16} />
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {task.code && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Source Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-hidden">
                  <MonacoEditor
                    value={task.code || ''}
                    language="xml"
                    height="300px"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      wordWrap: 'on'
                    }}
                    theme={editorTheme}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    } else if (task.category === 'diagram') {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flow Diagram</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-auto bg-white p-4" style={{ minHeight: "250px" }}>
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {task.flow_diagram || 'No flow diagram available'}
                </pre>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md bg-white p-4" style={{ minHeight: "250px" }}>
                <div className="whitespace-pre-wrap">
                  {task.connection_steps ? 
                    task.connection_steps.split('\n').map((line, index) => (
                      <div key={index} className="py-1">{line}</div>
                    )) : 'No connection steps available'}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {task.raml_content && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">RAML Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-hidden">
                  <MonacoEditor
                    value={task.raml_content}
                    language="yaml"
                    height="300px"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      wordWrap: 'on'
                    }}
                    theme={editorTheme}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => handleCopyToClipboard(task.result_content || '')}
            >
              <Copy size={16} />
              Copy All Content
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">No details available for this task type.</p>
      </div>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dataweave':
        return <Code className="h-4 w-4" />;
      case 'integration':
        return <Code className="h-4 w-4" />;
      case 'raml':
        return <Code className="h-4 w-4" />;
      case 'munit':
        return <Code className="h-4 w-4" />;
      case 'sampledata':
        return <Database className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'diagram':
        return <FileCode className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BackButton onBack={onBack} label="Back to Dashboard" />
      
      <Card className="mt-4 border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                {task.task_name}
              </CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                {getCategoryIcon(task.category)}
                {task.category === 'dataweave' ? 'DataWeave' : 
                 task.category === 'integration' ? 'Integration' : 
                 task.category === 'raml' ? 'RAML' : 
                 task.category === 'munit' ? 'MUnit' :
                 task.category === 'sampledata' ? 'Sample Data' : 
                 task.category === 'document' ? 'Document' :
                 task.category === 'diagram' ? 'Diagram' : task.category}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-medium">Task ID: </span>
              {task.task_id} | <span className="font-medium">Created: </span>
              {new Date(task.created_at).toLocaleString()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {renderTaskDetails()}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDetailsView;
