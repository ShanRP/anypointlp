
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import MonacoEditor from './MonacoEditor';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RuntimeSettings } from './settings/RuntimeSettings';

interface IntegrationGeneratorProps {
  onBack: () => void;
  selectedWorkspaceId: string;
  onSaveTask: (taskId: string) => void;
}

const IntegrationGenerator: React.FC<IntegrationGeneratorProps> = ({ onBack, selectedWorkspaceId, onSaveTask }) => {
  const [description, setDescription] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [raml, setRaml] = useState<string>('');
  const [diagrams, setDiagrams] = useState<string>('');
  const [regenerateNotes, setRegenerateNotes] = useState<string>('');
  const [runtimeVersion, setRuntimeVersion] = useState<string>('4.4.0');

  const { toast } = useToast();

  const handleGenerateClick = async () => {
    if (!description) {
      toast({
        title: "Description Required",
        description: "Please provide a description for the integration flow.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setGeneratedCode('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-integration', {
        body: {
          description,
          raml,
          diagrams,
          runtime: runtimeVersion
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: `Failed to generate integration: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data.code) {
        setGeneratedCode(data.code);
        
        // Only save to history if we have a workspaceId
        if (selectedWorkspaceId) {
          const taskId = crypto.randomUUID().substring(0, 8);
          await supabase.from('apl_integration_tasks').insert({
            workspace_id: selectedWorkspaceId,
            task_id: taskId,
            task_name: description.substring(0, 50),
            user_id: (await supabase.auth.getUser()).data.user?.id,
            description: description,
            result: data.code,
            raml: raml || null,
            diagrams: diagrams || null,
            runtime_version: runtimeVersion,
            generated_code: data.code,
            flow_summary: extractSection(data.code, "Flow Summary"),
            flow_implementation: extractSection(data.code, "Flow Implementation"),
            flow_constants: extractSection(data.code, "Flow Constants"),
            pom_dependencies: extractSection(data.code, "POM Dependencies"),
            compilation_check: extractSection(data.code, "Compilation Check")
          });
          
          if (onSaveTask) {
            onSaveTask(taskId);
          }
        }
      }
    } catch (error) {
      console.error('Error generating integration:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating the integration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateClick = async () => {
    if (!description) {
      toast({
        title: "Description Required",
        description: "Please provide a description for the integration flow.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setGeneratedCode('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-integration', {
        body: {
          description,
          raml,
          diagrams,
          notes: regenerateNotes, // Pass the notes for regeneration
          runtime: runtimeVersion
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: `Failed to regenerate integration: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data.code) {
        setGeneratedCode(data.code);
        
        // Only save to history if we have a workspaceId
        if (selectedWorkspaceId) {
          const taskId = crypto.randomUUID().substring(0, 8);
          await supabase.from('apl_integration_tasks').insert({
            workspace_id: selectedWorkspaceId,
            task_id: taskId,
            task_name: description.substring(0, 50),
            user_id: (await supabase.auth.getUser()).data.user?.id,
            description: description,
            notes: regenerateNotes || null,
            raml: raml || null,
            diagrams: diagrams || null,
            runtime_version: runtimeVersion,
            generated_code: data.code,
            flow_summary: extractSection(data.code, "Flow Summary"),
            flow_implementation: extractSection(data.code, "Flow Implementation"),
            flow_constants: extractSection(data.code, "Flow Constants"),
            pom_dependencies: extractSection(data.code, "POM Dependencies"),
            compilation_check: extractSection(data.code, "Compilation Check")
          });
          
          if (onSaveTask) {
            onSaveTask(taskId);
          }
        }
      }
    } catch (error) {
      console.error('Error regenerating integration:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while regenerating the integration.",
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
        <h2 className="text-2xl font-semibold">MuleSoft Integration Generator</h2>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Integration Request</CardTitle>
            <CardDescription>Describe the MuleSoft integration you want to generate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the integration flow you need..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[150px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="raml">RAML (Optional)</Label>
              <Textarea
                id="raml"
                placeholder="Paste your RAML API definition here..."
                value={raml}
                onChange={(e) => setRaml(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagrams">Diagrams (Optional)</Label>
              <Textarea
                id="diagrams"
                placeholder="Paste any diagram descriptions or URLs..."
                value={diagrams}
                onChange={(e) => setDiagrams(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="runtime">Runtime Version</Label>
              <Select 
                value={runtimeVersion} 
                onValueChange={setRuntimeVersion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select runtime version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4.3.0">4.3.0</SelectItem>
                  <SelectItem value="4.4.0">4.4.0</SelectItem>
                  <SelectItem value="4.5.0">4.5.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerateClick} 
              disabled={loading || !description}
              className="w-full"
            >
              {loading ? "Generating..." : "Generate Integration Flow"}
            </Button>
          </CardContent>
        </Card>

        <RuntimeSettings />
      </div>

      <div className="space-y-4">
        {generatedCode && (
          <>
            <div className="bg-background border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Generated Integration</h3>
                <div className="flex space-x-2">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add notes for regeneration..."
                      value={regenerateNotes}
                      onChange={(e) => setRegenerateNotes(e.target.value)}
                      className="text-sm min-h-[60px] w-[300px]"
                    />
                    <Button 
                      onClick={handleRegenerateClick}
                      disabled={loading}
                      size="sm"
                      className="w-full"
                    >
                      {loading ? "Regenerating..." : "Regenerate with Notes"}
                    </Button>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="flowImplementation" className="w-full">
                <TabsList className="mb-2">
                  <TabsTrigger value="flowSummary">Flow Summary</TabsTrigger>
                  <TabsTrigger value="flowImplementation">Implementation</TabsTrigger>
                  <TabsTrigger value="flowConstants">Constants</TabsTrigger>
                  <TabsTrigger value="pomDependencies">POM</TabsTrigger>
                  <TabsTrigger value="compilationCheck">Compilation Check</TabsTrigger>
                </TabsList>

                <div className="border rounded-md p-4">
                  <TabsContent value="flowSummary">
                    <pre className="whitespace-pre-wrap text-sm">{extractSection(generatedCode, "Flow Summary")}</pre>
                  </TabsContent>
                  <TabsContent value="flowImplementation">
                    <MonacoEditor
                      language="xml"
                      value={extractSection(generatedCode, "Flow Implementation")}
                      readOnly={true}
                      height="600px"
                    />
                  </TabsContent>
                  <TabsContent value="flowConstants">
                    <pre className="whitespace-pre-wrap text-sm">{extractSection(generatedCode, "Flow Constants")}</pre>
                  </TabsContent>
                  <TabsContent value="pomDependencies">
                    <MonacoEditor
                      language="xml"
                      value={extractSection(generatedCode, "POM Dependencies")}
                      readOnly={true}
                      height="400px"
                    />
                  </TabsContent>
                  <TabsContent value="compilationCheck">
                    <pre className="whitespace-pre-wrap text-sm">{extractSection(generatedCode, "Compilation Check")}</pre>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const extractSection = (generatedCode: string, sectionName: string): string => {
  const sections = generatedCode.split(/^# /m);
  
  const section = sections.find(s => s.startsWith(sectionName));
  if (!section) return `${sectionName} section not found`;
  
  return section.substring(sectionName.length).trim();
};

export default IntegrationGenerator;
