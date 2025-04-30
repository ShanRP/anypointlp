import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Copy, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import MonacoEditor from './MonacoEditor';
import { generateTaskId } from '@/utils/taskUtils';
import { useCredits } from '@/hooks/useCredits';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface DocumentGeneratorProps {
  onBack: () => void;
  selectedWorkspaceId?: string;
  onSaveTask: (id: string) => void;
}

const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  onBack,
  selectedWorkspaceId,
  onSaveTask
}) => {
  const [documentType, setDocumentType] = useState<string>('api');
  const [sourceType, setSourceType] = useState<string>('raml');
  const [inputCode, setInputCode] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [documentResult, setDocumentResult] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('input');
  const [language, setLanguage] = useState<string>('xml');
  const [resultLanguage, setResultLanguage] = useState<string>('markdown');
  const workspaceTasks = useWorkspaceTasks(selectedWorkspaceId);
  const { t } = useLanguage();
  const { checkCredits, deductCredits } = useCredits();
  const { generateDocument } = useAIAssistant();
  const taskIdRef = useRef<string>(generateTaskId());

  useEffect(() => {
    // Set the appropriate language based on source type
    switch (sourceType) {
      case 'raml':
        setLanguage('yaml');
        break;
      case 'xml':
        setLanguage('xml');
        break;
      case 'java':
        setLanguage('java');
        break;
      case 'json':
        setLanguage('json');
        break;
      default:
        setLanguage('plaintext');
    }
  }, [sourceType]);

  useEffect(() => {
    // Set the appropriate result language based on document type
    switch (documentType) {
      case 'api':
      case 'flow':
      case 'component':
        setResultLanguage('markdown');
        break;
      case 'html':
        setResultLanguage('html');
        break;
      default:
        setResultLanguage('markdown');
    }
  }, [documentType]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(documentResult);
    toast.success('Document copied to clipboard');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    let filename = `${documentTitle || 'document'}.`;
    
    if (resultLanguage === 'markdown') {
      filename += 'md';
    } else if (resultLanguage === 'html') {
      filename += 'html';
    } else {
      filename += 'txt';
    }
    
    const file = new Blob([documentResult], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Document downloaded as ${filename}`);
  };

  const handleSubmit = async () => {
    if (!inputCode.trim()) {
      toast.error('Please provide source code to document');
      return;
    }

    if (!documentTitle.trim()) {
      toast.error('Please provide a title for the document');
      return;
    }

    // Check if user has enough credits
    const hasCredits = await checkCredits(1);
    if (!hasCredits) {
      toast.error('Not enough credits to generate document');
      return;
    }

    setIsGenerating(true);
    setActiveTab('result');

    try {
      const result = await generateDocument({
        documentType,
        sourceType,
        code: inputCode,
        title: documentTitle,
        description
      });

      if (result) {
        setDocumentResult(result);
        await deductCredits(1);
        toast.success('Document generated successfully');
        
        // Save task to workspace
        if (selectedWorkspaceId) {
          const taskId = await workspaceTasks.saveDocumentTask({
            task_id: taskIdRef.current || generateTaskId(),
            task_name: documentTitle,
            description: description,
            document_type: documentType,
            source_type: sourceType,
            code: inputCode,
            result_content: documentResult
          });
          
          if (taskId && typeof taskId === 'string') {
            onSaveTask(taskId);
          }
        }
      } else {
        toast.error('Failed to generate document');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error('An error occurred while generating the document');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDocumentTypeOptions = () => {
    return [
      { value: 'api', label: 'API Documentation' },
      { value: 'flow', label: 'Flow Documentation' },
      { value: 'component', label: 'Component Documentation' },
      { value: 'html', label: 'HTML Documentation' },
    ];
  };

  const getSourceTypeOptions = () => {
    switch (documentType) {
      case 'api':
        return [
          { value: 'raml', label: 'RAML' },
          { value: 'json', label: 'JSON Schema' },
          { value: 'openapi', label: 'OpenAPI' },
        ];
      case 'flow':
        return [
          { value: 'xml', label: 'XML Flow' },
          { value: 'json', label: 'JSON Flow' },
        ];
      case 'component':
        return [
          { value: 'java', label: 'Java' },
          { value: 'xml', label: 'XML Component' },
        ];
      default:
        return [
          { value: 'raml', label: 'RAML' },
          { value: 'xml', label: 'XML' },
          { value: 'java', label: 'Java' },
          { value: 'json', label: 'JSON' },
        ];
    }
  };

  const getPlaceholderText = () => {
    switch (sourceType) {
      case 'raml':
        return '#%RAML 1.0\ntitle: Example API\nversion: v1\n/users:\n  get:\n    description: Get all users\n    responses:\n      200:\n        body:\n          application/json:\n            example: |\n              [\n                { "id": 1, "name": "User 1" },\n                { "id": 2, "name": "User 2" }\n              ]';
      case 'xml':
        return '<flow name="example-flow">\n  <http:listener path="/api" />\n  <logger message="Request received" />\n  <transform>\n    <dw:transform-message>\n      <dw:set-payload><![CDATA[%dw 2.0\noutput application/json\n---\n{\n  "message": "Hello World"\n}]]></dw:set-payload>\n    </dw:transform-message>\n  </transform>\n</flow>';
      case 'java':
        return 'public class ExampleComponent {\n  /**\n   * Process the incoming message\n   * @param payload The input payload\n   * @return The processed result\n   */\n  public Object process(Object payload) {\n    // Process the payload\n    return payload;\n  }\n}';
      case 'json':
        return '{\n  "openapi": "3.0.0",\n  "info": {\n    "title": "Example API",\n    "version": "1.0.0"\n  },\n  "paths": {\n    "/users": {\n      "get": {\n        "summary": "Get all users",\n        "responses": {\n          "200": {\n            "description": "Successful response",\n            "content": {\n              "application/json": {\n                "example": [\n                  { "id": 1, "name": "User 1" },\n                  { "id": 2, "name": "User 2" }\n                ]\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Document Generator</h1>
            <p className="text-sm text-muted-foreground">
              Generate comprehensive documentation from your code
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <FileText className="h-3.5 w-3.5 mr-1" />
          Documentation
        </Badge>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Document Configuration</CardTitle>
              <CardDescription>
                Configure the type of documentation you want to generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  placeholder="Enter document title"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter a brief description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDocumentTypeOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceType">Source Type</Label>
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSourceTypeOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full mt-4" 
                onClick={handleSubmit}
                disabled={isGenerating || !inputCode.trim() || !documentTitle.trim()}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Documentation'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="input">Source Code</TabsTrigger>
                  <TabsTrigger value="result">Generated Document</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-6">
              <TabsContent value="input" className="mt-0">
                <div className="border rounded-md h-[500px] overflow-hidden">
                  <MonacoEditor
                    language={language}
                    value={inputCode}
                    onChange={setInputCode}
                    placeholder={getPlaceholderText()}
                  />
                </div>
              </TabsContent>
              <TabsContent value="result" className="mt-0">
                <div className="border rounded-md h-[500px] overflow-hidden">
                  {isGenerating ? (
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <MonacoEditor
                      language={resultLanguage}
                      value={documentResult}
                      onChange={setDocumentResult}
                      readOnly={false}
                    />
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    disabled={!documentResult}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    disabled={!documentResult}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentGenerator;
