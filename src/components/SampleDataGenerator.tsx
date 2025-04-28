import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import MonacoEditor from '@/components/MonacoEditor';
import { ArrowLeft, Copy, DownloadCloud, FileCode, RefreshCcw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { useUserCredits } from '@/hooks/useUserCredits';

interface SampleDataTask {
  id: string;
  name: string;
  description: string;
  dataweave_code: string;
  sample_data: string;
  workspace_id: string;
}

const SampleDataGenerator = ({ selectedWorkspaceId, onBack, onSaveTask }: { selectedWorkspaceId: string | undefined, onBack: () => void, onSaveTask: (id: string) => void }) => {
  const [dataWeaveCode, setDataWeaveCode] = useState<string>('');
  const [sampleData, setSampleData] = useState<string>('');
  const [taskName, setTaskName] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'xml' | 'csv'>('json');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editorMounted, setEditorMounted] = useState(false);
  const { user } = useAuth();
  const { useCredit } = useUserCredits();
  const { createTask } = useWorkspaceTasks(selectedWorkspaceId || '');

  const handleDataWeaveCodeChange = (value: string) => {
    setDataWeaveCode(value);
  };

  const handleSampleDataChange = (value: string) => {
    setSampleData(value);
  };

  const handleFormatChange = (format: 'json' | 'xml' | 'csv') => {
    setSelectedFormat(format);
  };

  const generateSampleData = async () => {
    if (!dataWeaveCode) {
      toast.error('Please enter DataWeave code.');
      return;
    }

    setIsGenerating(true);
    try {
      const canUseCredit = await useCredit();
      if (!canUseCredit) {
        setIsGenerating(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-sample-data', {
        body: {
          dataweave_code: dataWeaveCode,
          format: selectedFormat,
        },
      });

      if (error) {
        console.error('Error generating sample data:', error);
        toast.error('Failed to generate sample data.');
      } else {
        setSampleData(data.result);
        toast.success('Sample data generated successfully!');
      }
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast.error('Failed to generate sample data.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTask = async () => {
    if (!taskName) {
      toast.error('Please enter a task name.');
      return;
    }

    setIsSaving(true);
    try {
      const taskId = uuidv4();
      const newTask: SampleDataTask = {
        id: taskId,
        name: taskName,
        description: taskDescription,
        dataweave_code: dataWeaveCode,
        sample_data: sampleData,
        workspace_id: selectedWorkspaceId || '',
      };

      await createTask(newTask);

      // Save the task to the database
      const { error } = await supabase
        .from('apl_sample_data_tasks')
        .insert([newTask]);

      if (error) {
        console.error('Error saving task:', error);
        toast.error('Failed to save task.');
      } else {
        toast.success('Task saved successfully!');
        onSaveTask(taskId);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="shadow-md rounded-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Sample Data Generator</CardTitle>
          <CardDescription>Generate sample data from DataWeave code.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                placeholder="Task Name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="task-description">Task Description</Label>
              <Input
                id="task-description"
                placeholder="Task Description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dataweave-code">DataWeave Code</Label>
            <MonacoEditor
              value={dataWeaveCode}
              language="dataweave"
              onChange={handleDataWeaveCodeChange}
              height="200px"
              onMount={() => setEditorMounted(true)}
            />
          </div>

          <div>
            <Label>Output Format</Label>
            <Select value={selectedFormat} onValueChange={handleFormatChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Button onClick={generateSampleData} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileCode className="mr-2 h-4 w-4" />
                  Generate Sample Data
                </>
              )}
            </Button>
          </div>

          <div>
            <Label htmlFor="sample-data">Sample Data</Label>
            <MonacoEditor
              value={sampleData}
              language={selectedFormat === 'json' ? 'json' : selectedFormat === 'xml' ? 'xml' : 'text'}
              onChange={handleSampleDataChange}
              height="200px"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveTask} disabled={isSaving} className="ml-auto">
            {isSaving ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <DownloadCloud className="mr-2 h-4 w-4" />
                Save Task
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SampleDataGenerator;
