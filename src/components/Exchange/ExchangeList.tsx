
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  FileCode, 
  ThumbsUp, 
  Download, 
  Filter, 
  MessageSquare, 
  Globe,
  RefreshCcw,
  Code
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BackButton } from '../ui/BackButton';

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

interface ExchangeListProps {
  onBack?: () => void;
}

const ExchangeList: React.FC<ExchangeListProps> = ({ onBack }) => {
  const [items, setItems] = useState<ExchangeItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ExchangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [contentTypeView, setContentTypeView] = useState<string>('all');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchExchangeItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, typeFilter, selectedTab, sortBy, contentTypeView]);

  const fetchExchangeItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apl_exchange_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems(data as ExchangeItem[] || []);
    } catch (error: any) {
      console.error('Error fetching exchange items:', error);
      toast.error('Failed to load Exchange items');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Filter by tab
    if (selectedTab === 'mine' && user) {
      filtered = filtered.filter(item => item.user_id === user.id);
    }

    // Filter by content type view
    if (contentTypeView !== 'all') {
      filtered = filtered.filter(item => item.type === contentTypeView);
    }

    // Apply sorting
    filtered = applySorting(filtered, sortBy);

    setFilteredItems(filtered);
  };

  const applySorting = (items: ExchangeItem[], sortCriteria: string) => {
    switch (sortCriteria) {
      case 'newest':
        return [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'popular':
        return [...items].sort((a, b) => b.likes - a.likes);
      case 'downloads':
        return [...items].sort((a, b) => b.downloads - a.downloads);
      default:
        return items;
    }
  };

  const handleDetails = (item: ExchangeItem) => {
    navigate(`/dashboard/exchange/item/${item.id}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'raml':
        return <FileCode className="text-purple-600" />;
      case 'dataweave':
        return <Code className="text-blue-600" />;
      default:
        return <Globe className="text-blue-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'raml':
        return 'RAML API';
      case 'dataweave':
        return 'DataWeave';
      default:
        return type.toUpperCase();
    }
  };

  return (
    <div className="w-full h-full max-w-none mx-0 p-0 bg-white">
      <div className="p-8 border-b border-purple-100">
        <BackButton onBack={onBack} />
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Exchange</h1>
        <p className="text-gray-600">Discover and share reusable components and templates</p>
      </div>

      <div className="p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search templates, components, APIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <div className="flex items-center gap-2">
                    <Filter size={16} />
                    <span>Filter</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="raml">RAML APIs</SelectItem>
                  <SelectItem value="dataweave">DataWeave</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <div className="flex items-center gap-2">
                    <span>Sort by</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="downloads">Most Downloads</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchExchangeItems}
                className="flex items-center justify-center h-10 w-10"
              >
                <RefreshCcw size={16} />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-2 w-56">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="mine">My Items</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-4 md:mt-0"
            >
              <RadioGroup 
                defaultValue="all" 
                value={contentTypeView} 
                onValueChange={setContentTypeView}
                className="flex space-x-2 items-center"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="cursor-pointer">All Content</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="raml" id="raml" />
                  <Label htmlFor="raml" className="cursor-pointer">RAML</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dataweave" id="dataweave" />
                  <Label htmlFor="dataweave" className="cursor-pointer">DataWeave</Label>
                </div>
              </RadioGroup>
            </motion.div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-lg">No items found</p>
                  <p className="text-gray-400 mt-2">Try adjusting your filters or search query</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        layout
                      >
                        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 bg-white">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <Badge variant="outline" className="flex items-center gap-1 font-normal">
                                {getTypeIcon(item.type)}
                                {getTypeLabel(item.type)}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {new Date(item.created_at).toLocaleDateString()}
                              </Badge>
                            </div>
                            <CardTitle className="mt-3 text-xl">{item.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <p className="text-gray-600 line-clamp-3">
                              {item.description || "No description provided"}
                            </p>
                          </CardContent>
                          <CardFooter className="flex justify-between items-center pt-4 border-t">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1 text-gray-500 text-sm">
                                <ThumbsUp size={14} /> {item.likes}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500 text-sm">
                                <Download size={14} /> {item.downloads}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500 text-sm">
                                <MessageSquare size={14} /> 0
                              </span>
                            </div>
                            <Button onClick={() => handleDetails(item)}>Details</Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExchangeList;
