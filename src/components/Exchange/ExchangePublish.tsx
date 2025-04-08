
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '../ui/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Loader2, Send, Globe, Lock } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ExchangePublishProps {}

const ExchangePublish: React.FC<ExchangePublishProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState(location.state?.item?.title || '');
  const [description, setDescription] = useState(location.state?.item?.description || '');
  const [visibility, setVisibility] = useState('public'); // Default to public
  const [publishing, setPublishing] = useState(false);

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

  const handlePublish = async () => {
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
      const workspaceId = localStorage.getItem('currentWorkspaceId') || '';
      
      const exchangeItem = {
        title: title.trim(),
        description: description.trim(),
        content: item.content,
        type: item.type,
        user_id: user.id,
        username: username,
        visibility: visibility, // Add visibility field
        workspace_id: visibility === 'private' ? workspaceId : null // Store workspace_id for private items only
      };

      const { data, error } = await supabase
        .from('apl_exchange_items')
        .insert([exchangeItem])
        .select();

      if (error) throw error;

      toast.success('Successfully published to Exchange!');
      navigate(`/dashboard/exchange/item/${data[0].id}`);
    } catch (error: any) {
      console.error('Error publishing to Exchange:', error);
      toast.error('Failed to publish to Exchange');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="w-full h-full max-w-none mx-0 p-0 bg-white">
      <div className="p-8 border-b border-purple-100">
        <BackButton onBack={() => navigate(-1)} />
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Publish to Exchange</h1>
        <p className="text-gray-600">Share your {contentTypeDisplay} with the community</p>
      </div>

      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Publish Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-700">
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
                <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-700">
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
              
              <div>
                <p className="text-sm font-medium mb-2 text-gray-700">Content Type</p>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                  {contentTypeDisplay}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2 text-gray-700">Author</p>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                  {user ? (user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous') : 'Anonymous'}
                </p>
              </div>
              
              <div className="flex justify-end pt-4">
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
                      Publish to Exchange
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ExchangePublish;
