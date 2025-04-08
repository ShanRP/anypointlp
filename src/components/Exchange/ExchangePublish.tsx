
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '../ui/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { motion } from 'framer-motion';
import { Loader2, Send, Globe, Lock } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface ExchangePublishProps {}

const ExchangePublish: React.FC<ExchangePublishProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedWorkspace, workspaces } = useWorkspaces();
  
  const [title, setTitle] = useState(location.state?.item?.title || '');
  const [description, setDescription] = useState(location.state?.item?.description || '');
  const [visibility, setVisibility] = useState('public'); // Default to public
  const [publishing, setPublishing] = useState(false);
  const [showDialog, setShowDialog] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('Current selected workspace:', selectedWorkspace);
    console.log('Available workspaces:', workspaces);
  }, [selectedWorkspace, workspaces]);

  if (!location.state?.item) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Content to Publish</h2>
        <p className="text-gray-600 mb-6">You need to generate content first before publishing to Exchange.</p>
        <Button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const { item } = location.state;
  const contentType = item.type.toLowerCase();
  const contentTypeDisplay = contentType === 'raml' ? 'RAML API Specification' : 
                            contentType === 'dataweave' ? 'DataWeave Script' :
                            contentType.toUpperCase();

  const getValidWorkspaceId = (): string => {
    // First priority: use selected workspace if available
    if (selectedWorkspace && selectedWorkspace.id) {
      return selectedWorkspace.id;
    }
    
    // Second priority: use first workspace from list if available
    if (workspaces && workspaces.length > 0) {
      console.log('Using first available workspace:', workspaces[0].id);
      return workspaces[0].id;
    }
    
    // Last resort: use user id
    console.log('No workspaces available, using user ID as fallback');
    return user.id;
  };

  const handlePublish = async () => {
    setError(null);
    
    if (!user) {
      toast.error('You must be signed in to publish to Exchange');
      return;
    }

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setPublishing(true);
    try {
      const username = user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous';
      
      // Set workspace_id to null for public items, or get a valid ID for private items
      const workspaceId = visibility === 'private' ? getValidWorkspaceId() : null;
      
      console.log('Using workspace ID:', workspaceId);
      
      const exchangeItem = {
        title: title.trim(),
        description: description.trim(),
        content: item.content,
        type: item.type,
        user_id: user.id,
        username: username,
        visibility: visibility,
        workspace_id: workspaceId
      };

      console.log('Publishing item:', exchangeItem);

      const { data, error } = await supabase
        .from('apl_exchange_items')
        .insert([exchangeItem])
        .select();

      if (error) throw error;

      toast.success('Successfully published to Exchange!');
      navigate(`/dashboard/exchange/item/${data[0].id}`);
    } catch (error: any) {
      console.error('Error publishing to Exchange:', error);
      setError(error.message);
      toast.error(`Failed to publish to Exchange: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Publish to Exchange</DialogTitle>
          <DialogDescription>
            Share your {contentTypeDisplay} with the community
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium mb-2 text-gray-700 block">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title"
              required
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="text-sm font-medium mb-2 text-gray-700 block">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of your content"
              rows={4}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Visibility</h3>
            <RadioGroup value={visibility} onValueChange={setVisibility} className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="public" id="visibility-public" />
                <Label htmlFor="visibility-public" className="flex items-center cursor-pointer">
                  <Globe size={18} className="mr-2 text-blue-500" />
                  <div>
                    <span className="font-medium">Public</span>
                    <p className="text-sm text-gray-500">Visible to everyone in the Exchange</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="private" id="visibility-private" />
                <Label htmlFor="visibility-private" className="flex items-center cursor-pointer">
                  <Lock size={18} className="mr-2 text-gray-500" />
                  <div>
                    <span className="font-medium">Private</span>
                    <p className="text-sm text-gray-500">Only visible to members of your workspace</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {visibility === 'private' && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                {selectedWorkspace 
                  ? `This item will be private to the "${selectedWorkspace.name}" workspace` 
                  : workspaces && workspaces.length > 0 
                    ? `This item will be private to the "${workspaces[0].name}" workspace`
                    : "This item will be private to your personal workspace"}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowDialog(false);
              navigate(-1);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={publishing || !title.trim()}
            className="flex items-center gap-2"
          >
            {publishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Publish
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExchangePublish;
