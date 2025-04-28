import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Download, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import MonacoEditor from '@/components/MonacoEditor';

interface Params {
  id?: string;
}

const RAMLGenerator = ({ selectedWorkspaceId, onBack }) => {
  const { user } = useAuth();
  const { id: taskId } = useParams<Params>();
  const [ramlContent, setRamlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taskIdState, setTaskIdState] = useState(taskId || uuidv4());
  const [isCopied, setIsCopied] = useState(false);
  const { fetchTaskDetails, selectedTask, updateTask, createTask } = useWorkspaceTasks(selectedWorkspaceId);

  useEffect(() => {
    if (taskIdState && !selectedTask) {
      fetchTaskDetails(taskIdState);
    }
  }, [taskIdState, fetchTaskDetails, selectedTask]);

  useEffect(() => {
    if (selectedTask) {
      setRamlContent(selectedTask.content || '');
    }
  }, [selectedTask]);

  const handleGenerateRaml = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-raml', {
        body: {
          prompt: 'Generate a RAML specification for a simple API.',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setRamlContent(data.raml);
    } catch (err: any) {
      console.error('Error generating RAML:', err);
      toast.error('Failed to generate RAML. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRaml = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const taskData = {
        id: taskIdState,
        user_id: user.id,
        workspace_id: selectedWorkspaceId,
        category: 'raml',
        label: 'Generated RAML',
        content: ramlContent,
      };

      if (selectedTask) {
        await updateTask(taskIdState, taskData);
        toast.success('RAML updated successfully!');
      } else {
        await createTask(taskData);
        toast.success('RAML saved successfully!');
      }
    } catch (error) {
      console.error('Error saving RAML:', error);
      toast.error('Failed to save RAML. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyRaml = () => {
    navigator.clipboard.writeText(ramlContent);
    setIsCopied(true);
    toast.success('RAML copied to clipboard!');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleDownloadRaml = () => {
    const blob = new Blob([ramlContent], { type: 'text/raml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'raml_specification.raml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={handleGenerateRaml}
              disabled={loading}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : (
                'Generate RAML'
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={handleSaveRaml}
              disabled={saving}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                'Save RAML'
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <MonacoEditor
          value={ramlContent}
          onChange={setRamlContent}
          language="yaml"
        />
      </div>

      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleCopyRaml}
            disabled={isCopied}
          >
            {isCopied ? (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadRaml}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RAMLGenerator;
