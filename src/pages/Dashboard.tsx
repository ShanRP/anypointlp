import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, RefreshCw, FileCode2, Code, Share2, TestTube2, Database, Users, FileText, FileQuestion, MessageSquare, X } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import SettingsPage from '@/components/SettingsPage';
import DataWeaveGenerator from '@/components/DataWeaveGenerator';
import IntegrationGenerator from '@/components/IntegrationGenerator';
import RAMLGenerator from '@/components/RAMLGenerator';
import ExchangeList from '@/components/Exchange/ExchangeList';
import ExchangeItemDetails from '@/components/Exchange/ExchangeItemDetails';
import ExchangePublish from '@/components/Exchange/ExchangePublish';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import TaskDetailsView from '@/components/TaskDetailsView';
import { WorkspaceOption, useWorkspaces } from '@/hooks/useWorkspaces';
import JobBoard from '@/components/JobBoard/JobBoard';
import MUnitTestGenerator from '@/components/MUnitTestGenerator';
import SampleDataGenerator from '@/components/SampleDataGenerator';
import DocumentGenerator from '@/components/DocumentGenerator';
import DiagramGenerator from '@/components/DiagramGenerator';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import GeneratorCard from '@/components/GeneratorCard';
import CodingAssistantDialog, { openCodingAssistantDialog } from '@/components/ai/CodingAssistantDialog';

interface SidebarTask {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  workspace_id: string;
}

type DashboardAgentCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
};

const DashboardAgentCard: React.FC<DashboardAgentCardProps> = ({
  title,
  description,
  icon,
  selected = false,
  onClick
}) => {
  return (
    <motion.div 
      onClick={onClick} 
      className={`p-6 rounded-xl flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-lg ${
        selected 
          ? 'bg-black text-white dark:bg-gray-800' 
          : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
      }`} 
      whileHover={{
        y: -5
      }} 
      transition={{
        duration: 0.2
      }}
    >
      <div className="flex items-center mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
          selected 
            ? 'bg-gray-800 dark:bg-gray-700' 
            : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          {icon}
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <p className={`text-sm ${
        selected 
          ? 'text-gray-300' 
          : 'text-gray-600 dark:text-gray-300'
      }`}>{description}</p>
    </motion.div>
  );
};

type AgentCategoryProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

const AgentCategory: React.FC<AgentCategoryProps> = ({
  title,
  description,
  children
}) => {
  return <div className="mb-12 animate-fade-up">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>;
};

type PageType = 'dashboard' | 'settings' | 'dataweave' | 'integration' | 'raml' | 'taskView' | 'exchange' | 'exchangeItem' | 'exchangePublish' | 'jobBoard' | 'munit' | 'sampleData' | 'document' | 'diagram';

const DashboardContent = ({
  selectedCategory,
  setSelectedCategory,
  onAgentSelect,
  filteredAgents,
}) => {
  const { t } = useLanguage();

  const dashboardCards = [
    {
      id: 'integration',
      title: 'Integration Generator',
      description: 'Create flow code from flow specifications and flow diagrams',
      icon: <FileCode2 className="h-5 w-5" />,
      bgColor: 'from-purple-500 to-indigo-600',
      badge: 'Popular',
      badgeColor: 'bg-purple-500',
    },
    {
      id: 'dataweave',
      title: 'DataWeave Generator',
      description: 'Create transformations from input output examples',
      icon: <Database className="h-5 w-5" />,
      bgColor: 'from-blue-500 to-cyan-500',
      badge: 'Featured',
      badgeColor: 'bg-blue-500',
    },
    {
      id: 'raml',
      title: 'RAML Generator',
      description: 'Create RAML specifications for your APIs',
      icon: <FileCode2 className="h-5 w-5" />,
      bgColor: 'from-green-500 to-emerald-500',
      badge: 'New',
      badgeColor: 'bg-green-500',
    },
    {
      id: 'munit',
      title: 'MUnit Test Generator',
      description: 'Generate MUnit tests for a flow',
      icon: <TestTube2 className="h-5 w-5" />,
      bgColor: 'from-amber-500 to-yellow-500',
    },
    {
      id: 'sampleData',
      title: 'Sample Data Generator',
      description: 'Generate sample data from DataWeave transformations',
      icon: <Database className="h-5 w-5" />,
      bgColor: 'from-indigo-500 to-blue-500',
    },
    {
      id: 'document',
      title: 'Document Generator',
      description: 'Generate documentation for flows, endpoints',
      icon: <FileText className="h-5 w-5" />,
      bgColor: 'from-red-500 to-pink-500',
    },
    {
      id: 'diagram',
      title: 'Diagram Generator',
      description: 'Generate sequence & flow diagrams',
      icon: <FileQuestion className="h-5 w-5" />,
      bgColor: 'from-cyan-500 to-teal-500',
    },
    {
      id: 'exchange',
      title: 'Exchange Marketplace',
      description: 'Share and discover reusable templates and components',
      icon: <Share2 className="h-5 w-5" />,
      bgColor: 'from-violet-500 to-purple-600',
    },
    {
      id: 'jobBoard',
      title: 'Job Board',
      description: 'Connect with MuleSoft developers to solve problems together',
      icon: <Users className="h-5 w-5" />,
      bgColor: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'codingAssistant',
      title: 'Coding Assistant',
      description: 'Get help with MuleSoft, DataWeave, and API development questions',
      icon: <Code className="h-5 w-5" />,
      bgColor: 'from-emerald-500 to-green-600',
    },
  ];

  const displayedCards = filteredAgents?.length > 0 ? filteredAgents : dashboardCards;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 mb-2">
        How can I help you today?
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
        Access powerful AI-powered tools to accelerate your development workflow
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {displayedCards.map((card) => (
          <GeneratorCard
            key={card.id || card.title}
            title={card.title}
            description={card.description}
            icon={card.icon || <Code className="h-5 w-5" />}
            type={card.id || card.category}
            onClick={() => (card.id !== 'codingAssistant' && card.type !== 'codingAssistant') && onAgentSelect(card.id || card.category)}
            badge={card.badge}
            bgColor={card.bgColor}
            badgeColor={card.badgeColor}
          />
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [tasks, setTasks] = useState<SidebarTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedExchangeItemId, setSelectedExchangeItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAgents, setFilteredAgents] = useState<any[]>([]);
  const [isCodingAssistantOpen, setIsCodingAssistantOpen] = useState(false);
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    workspaces,
    selectedWorkspace,
    selectWorkspace
  } = useWorkspaces();
  const {
    fetchTaskDetails,
    selectedTask,
    tasks: workspaceTasks
  } = useWorkspaceTasks(selectedWorkspace?.id || '');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard/exchange/item/')) {
      const itemId = path.split('/').pop();
      if (itemId) {
        setCurrentPage('exchangeItem');
        setSelectedExchangeItemId(itemId);
      }
    } else if (path.includes('/dashboard/exchange/publish')) {
      setCurrentPage('exchangePublish');
    } else if (path.includes('/dashboard/exchange')) {
      setCurrentPage('exchange');
    }
  }, [location.pathname]);

  const handleAgentSelect = (agent: string) => {
    setSelectedAgent(agent);
    if (agent === 'dataweave') {
      setCurrentPage('dataweave');
    } else if (agent === 'integration') {
      setCurrentPage('integration');
    } else if (agent === 'raml') {
      setCurrentPage('raml');
    } else if (agent === 'exchange') {
      setCurrentPage('exchange');
      navigate('/dashboard/exchange');
    } else if (agent === 'jobBoard') {
      setCurrentPage('jobBoard');
    } else if (agent === 'munit') {
      setCurrentPage('munit');
      navigate('/dashboard/munit');
    } else if (agent === 'sampleData') {
      setCurrentPage('sampleData');
      navigate('/dashboard/sample-data');
    } else if (agent === 'document') {
      setCurrentPage('document');
      navigate('/dashboard/document');
    } else if (agent === 'diagram') {
      setCurrentPage('diagram');
      navigate('/dashboard/diagram');
    }
  };

  const handleTaskCreated = (task: SidebarTask) => {
    const taskWithWorkspace = {
      ...task,
      workspace_id: selectedWorkspace?.id || ''
    };
    setTasks(prevTasks => [...prevTasks, taskWithWorkspace]);
    
    if (selectedWorkspace?.id) {
      fetchWorkspaceTasks();
    }
    
    toast.success(`Task ${task.id} created successfully!`);
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    fetchTaskDetails(taskId);
    setCurrentPage('taskView');
  };

  const handleWorkspaceChange = (workspace: WorkspaceOption) => {
    selectWorkspace(workspace);
    setSelectedTaskId(null);
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedAgent(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    const allAgents = [
      { id: 'integration', title: 'Integration Generator', description: 'Create flow code from flow specifications and flow diagrams', category: 'coding', icon: <FileCode2 size={16} /> },
      { id: 'dataweave', title: 'DataWeave Generator', description: 'Create transformations from input output examples', category: 'coding', icon: <Database size={16} /> },
      { id: 'raml', title: 'RAML Generator', description: 'Create RAML specifications for your APIs', category: 'coding', icon: <FileCode2 size={16} /> },
      { id: 'exchange', title: 'Exchange Marketplace', description: 'Share and discover reusable templates and components', category: 'marketplace', icon: <Share2 size={16} /> },
      { id: 'munit', title: 'MUnit Test Generator', description: 'Generate MUnit tests for a flow', category: 'testing', icon: <TestTube2 size={16} /> },
      { id: 'sampleData', title: 'Sample Data Generator', description: 'Generate sample data from dataweave transformations', category: 'data', icon: <Database size={16} /> },
      { id: 'jobBoard', title: 'Job Board', description: 'Connect with MuleSoft developers to solve problems together', category: 'community', icon: <Users size={16} /> },
      { id: 'document', title: 'Document Generator', description: 'Generate documentation for flows, endpoints', category: 'documentation', icon: <FileText size={16} /> },
      { id: 'diagram', title: 'Diagram Generator', description: 'Generate sequence & flow diagrams', category: 'visualization', icon: <FileQuestion size={16} /> },
      { id: 'codingAssistant', title: 'Coding Assistant', description: 'Get help with MuleSoft, DataWeave, and API development questions', category: 'assistance', icon: <MessageSquare size={16} /> },
    ];

    if (query.trim() === '') {
      setFilteredAgents([]);
      return;
    }

    const filtered = allAgents.filter(agent => 
      agent.title.toLowerCase().includes(query.toLowerCase()) || 
      agent.description.toLowerCase().includes(query.toLowerCase()) ||
      agent.category.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredAgents(filtered);
  };

  const fetchWorkspaceTasks = () => {
    if (selectedWorkspace?.id) {
      const { fetchWorkspaceTasks } = useWorkspaceTasks(selectedWorkspace.id);
      fetchWorkspaceTasks();
    }
  };

  if (loading) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-light dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your workspace...</p>
      </div>;
  }

  return <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 overflow-hidden">
      <DashboardSidebar 
        onNavigate={page => {
          if (page === 'dashboard') {
            setCurrentPage('dashboard');
            setSelectedAgent(null);
            setSelectedTaskId(null);
          } else if (page === 'settings') {
            setCurrentPage('settings');
            setSelectedAgent(null);
            setSelectedTaskId(null);
          } else if (page === 'chat') {
            openCodingAssistantDialog();
          } else {
            setCurrentPage(page as PageType);
            setSelectedAgent(page);
            setSelectedTaskId(null);
          }
        }} 
        currentPage={currentPage} 
        onTaskSelect={handleTaskSelect} 
        selectedWorkspaceId={selectedWorkspace?.id} 
        onWorkspaceChange={handleWorkspaceChange} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-purple-100 to-transparent dark:from-purple-900/20 dark:to-transparent rounded-full blur-3xl opacity-30 transform translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-indigo-100 to-transparent dark:from-indigo-900/20 dark:to-transparent rounded-full blur-3xl opacity-30 transform -translate-x-1/3 translate-y-1/3"></div>
        </div>

        <header className="relative z-10 h-16 flex items-center px-8 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
  <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
    <div className="relative w-[400px]"> {/* Added relative positioning container */}
      <input
        type="text"
        placeholder="Search or type a command..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full bg-gray-50/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 pl-10 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
      />
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <Search className="h-4 w-4" />
      </div>
      {searchQuery.length > 0 && (
        <div 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" 
          onClick={() => {
            setSearchQuery('');
            setFilteredAgents([]);
          }}
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </div>
      )}
    </div>
  </div>
  <div className="ml-auto flex items-center gap-3">
    {/* Other header content */}
  </div>
</header>

        
        <div className="relative z-10 flex-1 overflow-auto">
          {currentPage === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.3 }}
            >
              <DashboardContent 
                selectedCategory={selectedCategory} 
                setSelectedCategory={setSelectedCategory} 
                onAgentSelect={handleAgentSelect} 
                filteredAgents={filteredAgents}
              />
            </motion.div>
          )}
          
          {currentPage === 'settings' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }}>
              <SettingsPage />
            </motion.div>}
          
          {currentPage === 'dataweave' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }}>
              <DataWeaveGenerator onTaskCreated={handleTaskCreated} selectedWorkspaceId={selectedWorkspace?.id} onSaveTask={() => {}} onBack={handleBackToDashboard} />
            </motion.div>}
          
          {currentPage === 'integration' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }}>
              <IntegrationGenerator onTaskCreated={handleTaskCreated} selectedWorkspaceId={selectedWorkspace?.id} onBack={handleBackToDashboard} onSaveTask={() => {}} />
            </motion.div>}
          
          {currentPage === 'raml' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }}>
              <RAMLGenerator selectedWorkspaceId={selectedWorkspace?.id || ''} onBack={handleBackToDashboard} />
            </motion.div>}
          
          {currentPage === 'taskView' && selectedTask && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }}>
              <TaskDetailsView task={selectedTask} onBack={() => setCurrentPage('dashboard')} />
            </motion.div>}
          
          {currentPage === 'exchange' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }}>
              <ExchangeList onBack={handleBackToDashboard} />
            </motion.div>}

          {currentPage === 'exchangeItem' && selectedExchangeItemId && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }}>
              <ExchangeItemDetails />
            </motion.div>}

          {currentPage === 'exchangePublish' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }}>
              <ExchangePublish />
            </motion.div>}

          {currentPage === 'jobBoard' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }}>
              <JobBoard />
            </motion.div>}

          {currentPage === 'munit' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }} className="p-0">
              <MUnitTestGenerator onTaskCreated={handleTaskCreated} selectedWorkspaceId={selectedWorkspace?.id} onBack={handleBackToDashboard} onSaveTask={() => {}} />
            </motion.div>}

          {currentPage === 'sampleData' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }} className="p-0">
              <SampleDataGenerator onBack={handleBackToDashboard} />
            </motion.div>}

          {currentPage === 'document' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }} className="p-0">
              <DocumentGenerator onBack={handleBackToDashboard} />
            </motion.div>}

          {currentPage === 'diagram' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3
        }} className="p-0">
              <DiagramGenerator onBack={handleBackToDashboard} />
            </motion.div>}
        </div>
        <CodingAssistantDialog 
          isOpen={isCodingAssistantOpen} 
          onOpenChange={setIsCodingAssistantOpen} 
        />
      </div>
    </div>;
};

export default Dashboard;
