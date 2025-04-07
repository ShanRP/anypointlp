
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MonacoEditor from './MonacoEditor';
import { Copy, ThumbsUp, ThumbsDown, Share2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

interface InputSample {
  id: string;
  value: string;
}

interface OutputSample {
  id: string;
  value: string;
}

interface DataWeaveResultProps {
  script?: string;
  code?: string; // Add this to support both naming conventions
  onSave?: (script: string) => void;
  onBack?: () => void;
  onNewTask?: () => void;
  showNewTaskButton?: boolean;
  pairId?: string;
  inputSample?: InputSample;
  outputSample?: OutputSample;
  originalNotes?: string;
}

const DataWeaveResult: React.FC<DataWeaveResultProps> = ({ 
  script, 
  code, // Support both naming conventions
  onSave, 
  onBack,
  onNewTask,
  showNewTaskButton = true,
  inputSample,
  outputSample,
  originalNotes = ''
}) => {
  // Clean up script content to only include valid DataWeave code
  const cleanScript = (scriptContent: string) => {
    // If script already starts with %dw, just return it
    if (scriptContent.trim().startsWith('%dw')) {
      return scriptContent;
    }
    
    // Extract only the dataweave script from the content
    const dwPattern = /(%dw 2\.0[\s\S]*?)(?=```|$)/;
    const match = scriptContent.match(dwPattern);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Fallback to original script if no pattern match
    return scriptContent;
  };
  
  // Use script or code, preferring script if available, and clean it
  const scriptContent = cleanScript(script || code || '');
  const [activeTab, setActiveTab] = useState('script');
  const navigate = useNavigate();
  const [notes, setNotes] = useState(originalNotes);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    toast.success('Script copied to clipboard!');
  };

  const handleFeedback = (positive: boolean) => {
    toast.success(`Thank you for your ${positive ? 'positive' : 'negative'} feedback!`);
  };

  const handleSaveToExchange = () => {
    navigate('/dashboard/exchange/publish', {
      state: {
        item: {
          title: 'DataWeave Script',
          description: 'Generated DataWeave transformation script.',
          content: scriptContent,
          type: 'dataweave'
        }
      }
    });
  };

  const handleRegenerate = async () => {
    if (!inputSample || !outputSample) {
      toast.error('Input and output samples are required for regeneration');
      return;
    }

    setIsRegenerating(true);
    try {
      const requestBody = {
        inputFormat: 'JSON', // Default to JSON if format isn't provided
        inputSamples: [inputSample],
        outputSamples: [outputSample],
        notes: notes
      };

      const { data, error } = await supabase.functions.invoke('generate-dataweave', {
        body: requestBody
      });

      if (error) {
        throw new Error(`Error from edge function: ${error.message}`);
      }

      if (data && data.script && onSave) {
        // Clean up script before saving
        onSave(cleanScript(data.script));
        toast.success('DataWeave script regenerated successfully!');
      }
    } catch (error: any) {
      console.error("Error regenerating DataWeave script:", error);
      toast.error(`Failed to regenerate script: ${error.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>Generated DataWeave Script</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="script" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="px-6">
              <TabsTrigger value="script">Script</TabsTrigger>
              {inputSample && outputSample && <TabsTrigger value="regenerate">Regenerate</TabsTrigger>}
            </TabsList>
            <TabsContent value="script" className="mt-0">
              <div className="bg-gray-50 rounded-md p-0">
                <MonacoEditor
                  value={scriptContent}
                  language="dataweave"
                  height="400px"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    padding: { top: 16 }
                  }}
                />
              </div>
            </TabsContent>
            {inputSample && outputSample && (
              <TabsContent value="regenerate" className="mt-0">
                <div className="px-6 py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="font-medium">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional requirements or context for regeneration..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                    <p className="text-sm text-gray-500">
                      Provide any specific requirements or instructions for refining the DataWeave script.
                    </p>
                  </div>
                  <Button 
                    onClick={handleRegenerate} 
                    className="w-full"
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate Script
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleFeedback(true)}>
              <ThumbsUp className="h-4 w-4 mr-2" />
              Helpful
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFeedback(false)}>
              <ThumbsDown className="h-4 w-4 mr-2" />
              Not Helpful
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveToExchange}>
              <Share2 className="h-4 w-4 mr-2" />
              Save to Exchange
            </Button>
            {onSave && (
              <Button size="sm" onClick={() => onSave(scriptContent)}>
                Save
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default DataWeaveResult;
