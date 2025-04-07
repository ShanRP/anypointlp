
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ThumbsUp, 
  Download, 
  MessageSquare, 
  ArrowLeft, 
  Copy, 
  Send, 
  FileCode,
  Users,
  Calendar,
  Edit,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BackButton } from '../ui/BackButton';
import { motion } from 'framer-motion';
import MonacoEditor from '../MonacoEditor';

interface ExchangeItem {
  id: string;
  title: string;
  description: string;
  content: any;
  type: string;
  user_id: string;
  username: string;
  created_at: string;
  likes: number;
  downloads: number;
}

interface Comment {
  id: string;
  item_id: string;
  user_id: string;
  username: string;
  comment: string;
  created_at: string;
}

const ExchangeItemDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<ExchangeItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchItemDetails();
      fetchComments();
    }
  }, [id]);

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apl_exchange_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setItem(data as ExchangeItem);
    } catch (error: any) {
      console.error('Error fetching item details:', error);
      toast.error('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('apl_exchange_comments')
        .select('*')
        .eq('item_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setComments(data as Comment[] || []);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like this item');
      return;
    }

    try {
      const { error } = await supabase.rpc('apl_increment_exchange_counter', {
        item_id_param: id,
        counter_name: 'likes'
      });

      if (error) throw error;
      
      setItem(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
      toast.success('You liked this item');
    } catch (error: any) {
      console.error('Error liking item:', error);
      toast.error('Failed to like this item');
    }
  };

  const handleDownload = async () => {
    if (!item) return;

    try {
      const { error } = await supabase.rpc('apl_increment_exchange_counter', {
        item_id_param: id,
        counter_name: 'downloads'
      });

      if (error) throw error;

      // Create download content based on item type
      let content = '';
      let filename = '';
      
      if (item.type === 'raml') {
        content = item.content.raml;
        filename = `${item.title.replace(/\s+/g, '_')}.raml`;
      } else {
        content = JSON.stringify(item.content, null, 2);
        filename = `${item.title.replace(/\s+/g, '_')}.json`;
      }

      // Create blob and trigger download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setItem(prev => prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : null);
      toast.success('Download started');
    } catch (error: any) {
      console.error('Error downloading item:', error);
      toast.error('Failed to download this item');
    }
  };

  const handleCopyToClipboard = () => {
    if (!item) return;
    
    let content = '';
    
    if (item.type === 'raml') {
      content = item.content.raml;
    } else {
      content = JSON.stringify(item.content, null, 2);
    }

    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.warning('Comment cannot be empty');
      return;
    }

    setCommentLoading(true);
    try {
      const username = user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous';
      
      const { data, error } = await supabase
        .from('apl_exchange_comments')
        .insert([
          {
            item_id: id,
            user_id: user.id,
            username: username,
            comment: newComment.trim()
          }
        ])
        .select();

      if (error) throw error;
      
      setComments([...comments, data[0] as Comment]);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!user || !item || user.id !== item.user_id) {
      toast.error('You do not have permission to delete this item');
      return;
    }

    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('apl_exchange_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Item deleted successfully');
      navigate('/dashboard/exchange');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleMoveToFlow = () => {
    if (!item) return;
    
    // We only want to move RAML items to the Integration Generator
    if (item.type !== 'raml') {
      toast.warning('Only RAML items can be moved to the Integration Generator');
      return;
    }
    
    // Store the selected RAML in session storage to pass to the Integration Generator
    const ramlData = {
      id: item.id,
      title: item.title,
      description: item.description,
      content: item.content.raml,
      type: 'raml'
    };
    
    sessionStorage.setItem('selectedRamlForIntegration', JSON.stringify(ramlData));
    
    // Navigate to the correct Integration Generator path
    toast.success('RAML selected for Integration Generator');
    navigate('/dashboard'); // Changed from '/dashboard/integration' to '/dashboard'
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Item Not Found</h2>
        <p className="text-gray-600 mb-6">The requested item could not be found or has been removed.</p>
        <Button onClick={() => navigate('/dashboard/exchange')}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Exchange
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full max-w-none mx-0 p-0 bg-white">
      <div className="p-8 border-b border-purple-100">
        <BackButton onBack={() => navigate('/dashboard/exchange')} />
        
        <div className="flex justify-between items-start mt-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{item?.title}</h1>
            <p className="text-gray-600 mt-1">{item?.description || "No description provided"}</p>
          </div>
          
          {user && item && user.id === item.user_id && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteItem}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-6 mt-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback>{item ? getInitials(item.username) : 'U'}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">{item?.username}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>{item ? formatDate(item.created_at) : ''}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileCode size={16} />
            <span>{item ? item.type.toUpperCase() : ''}</span>
          </div>
          
          <div className="flex items-center gap-6 ml-auto">
            {item && item.type === 'raml' && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleMoveToFlow}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <ArrowRight size={16} />
                Move to Flow
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLike}
              className="flex items-center gap-2"
            >
              <ThumbsUp size={16} />
              <span>{item?.likes || 0}</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              <span>{item?.downloads || 0}</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy size={16} />
              Copy
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="comments">
              Comments ({comments.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Content Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full border rounded-md overflow-hidden">
                  {item && (
                    <MonacoEditor
                      value={item.type === 'raml' ? item.content.raml : JSON.stringify(item.content, null, 2)}
                      language={item.type === 'raml' ? 'yaml' : 'json'}
                      height="500px"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 mb-8">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-gray-500">No comments yet</p>
                      <p className="text-gray-400 text-sm mt-1">Be the first to leave a comment</p>
                    </div>
                  ) : (
                    comments.map(comment => (
                      <motion.div 
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(comment.username)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{comment.username}</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.comment}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                
                {user ? (
                  <div className="mt-6">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px] mb-2"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSubmitComment}
                        disabled={commentLoading || !newComment.trim()}
                        className="flex items-center gap-2"
                      >
                        {commentLoading ? 'Posting...' : (
                          <>
                            <Send size={16} />
                            Post Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed rounded-lg">
                    <p className="text-gray-600">Please sign in to leave a comment</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExchangeItemDetails;
