
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MonacoEditor from './MonacoEditor';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { processRAMLRequest } from '@/utils/supabaseHelpers';

interface RAMLGeneratorProps {
  onBack: () => void;
  selectedWorkspaceId: string;
}

const RAMLGenerator: React.FC<RAMLGeneratorProps> = ({ onBack, selectedWorkspaceId }) => {
  const [description, setDescription] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [apiName, setApiName] = useState<string>('');
  const [apiVersion, setApiVersion] = useState<string>('v1');

  const { toast } = useToast();

  const handleGenerateClick = async () => {
    if (!description) {
      toast({
        title: "Description Required",
        description: "Please provide a description for the RAML specification.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setGeneratedCode('');

    try {
      const { data, error } = await supabase.functions.invoke('APL_generate-raml', {
        body: {
          description,
          apiName: apiName || 'My API',
          apiVersion
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: `Failed to generate RAML: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data?.raml) {
        setGeneratedCode(data.raml);
        
        // Only save to history if we have a workspaceId
        if (selectedWorkspaceId) {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          
          if (userId) {
            const ramlData = {
              workspace_id: selectedWorkspaceId,
              task_id: crypto.randomUUID().substring(0, 8),
              task_name: apiName || 'RAML Specification',
              user_id: userId,
              description: description,
              api_name: apiName || 'My API',
              api_version: apiVersion,
              result: data.raml
            };
            
            // Use the utility function to process RAML request
            const result = await processRAMLRequest(supabase, userId, selectedWorkspaceId, ramlData);
            
            if (!result.success) {
              console.error('Error saving RAML task:', result.error);
              toast({
                title: "Warning",
                description: "RAML was generated but could not be saved to your workspace.",
                variant: "destructive",
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating RAML:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating the RAML specification.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <h2 className="text-2xl font-semibold">RAML API Specification Generator</h2>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>API Specification Request</CardTitle>
            <CardDescription>Describe the API you want to generate a RAML specification for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="apiName" className="text-sm font-medium">API Name</label>
              <Input
                id="apiName"
                placeholder="My API"
                value={apiName}
                onChange={(e) => setApiName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="apiVersion" className="text-sm font-medium">API Version</label>
              <Input
                id="apiVersion"
                placeholder="v1"
                value={apiVersion}
                onChange={(e) => setApiVersion(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                placeholder="Describe the API you need..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[200px]"
              />
            </div>

            <Button 
              onClick={handleGenerateClick} 
              disabled={loading || !description}
              className="w-full"
            >
              {loading ? "Generating..." : "Generate RAML Specification"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Practices for API Description</CardTitle>
            <CardDescription>Tips to get the best RAML specification</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Clearly describe the purpose of your API</li>
              <li>Specify the resources (endpoints) you need</li>
              <li>Mention the HTTP methods required (GET, POST, etc.)</li>
              <li>Describe the request and response data structures</li>
              <li>Include any authentication requirements</li>
              <li>Specify any query parameters or headers</li>
              <li>Mention rate limiting or other constraints</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {generatedCode && (
        <div className="bg-background border rounded-lg p-4">
          <h3 className="text-xl font-semibold mb-4">Generated RAML Specification</h3>
          <Tabs defaultValue="raml" className="w-full">
            <TabsList className="mb-2">
              <TabsTrigger value="raml">RAML</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <div className="border rounded-md p-4">
              <TabsContent value="raml" className="mt-0">
                <MonacoEditor
                  language="yaml"
                  value={generatedCode}
                  height="600px"
                  readOnly={true}
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-0">
                <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700">
                  <pre className="whitespace-pre-wrap text-sm">{generatedCode}</pre>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default RAMLGenerator;
