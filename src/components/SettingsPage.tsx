
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Upload, ChevronDown, Sun, Moon, Monitor, Globe, Lock, UserCircle, Building, Server, Database, ShieldCheck } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { SessionManager } from './SessionManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast"; // Corrected import path
import { Badge } from "@/components/ui/badge";
import { WorkspaceSettings } from './settings/WorkspaceSettings';
import RepositorySettings from './settings/RepositorySettings';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { ChangePasswordDialog } from './settings/ChangePasswordDialog';

type AuthLog = {
  id: string;
  action: string;
  device: string | null;
  ip_address: string | null;
  created_at: string;
};

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, session } = useAuth();
  const { updateUsername, isUpdating } = useProfile();
  const { workspaces, selectedWorkspace, selectWorkspace, refreshWorkspaces } = useWorkspaces();
  const { toast } = useToast();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.user_metadata?.username || '');
  const [authLogs, setAuthLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [workspacesInitialized, setWorkspacesInitialized] = useState(false);
  const logsPerPage = 5;

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const handleUsernameUpdate = async () => {
    await updateUsername(newUsername);
    setIsEditingUsername(false);
  };

  const fetchAuthLogs = useCallback(async () => {
    if (!user || isDataFetched) return;
    
    setLoading(true);
    try {
      const { count, error: countError } = await supabase
        .from('apl_auth_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (countError) {
        throw countError;
      }
      
      setTotalPages(Math.ceil((count || 0) / logsPerPage));
      
      const { data, error } = await supabase
        .from('apl_auth_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * logsPerPage, page * logsPerPage - 1);
      
      if (error) {
        throw error;
      }
      
      setAuthLogs(data || []);
      setIsDataFetched(true);
    } catch (error) {
      console.error('Error fetching auth logs:', error);
      toast({
        variant: "destructive",
        title: "Error fetching logs",
        description: "Could not load authentication logs. Please try again later."
      });
    } finally {
      setLoading(false);
    }
  }, [user, page, isDataFetched, toast]);

  useEffect(() => {
    if (user && !isDataFetched) {
      fetchAuthLogs();
    }
  }, [user, fetchAuthLogs, isDataFetched]);

  useEffect(() => {
    setIsDataFetched(false);
  }, [page]);

  // Initialize workspaces only once when component mounts
  useEffect(() => {
    if (!workspacesInitialized && user) {
      refreshWorkspaces().then(() => {
        setWorkspacesInitialized(true);
      });
    }
  }, [user, workspacesInitialized, refreshWorkspaces]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="p-6 max-w-5xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold text-gray-900 dark:text-white"
        >
          {t('settings.pageTitle')}
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* <Badge variant="outline" className="text-sm px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/30">
            {selectedWorkspace?.name || 'Personal Workspace'}
          </Badge> */}
        </motion.div>
      </div>
      
      <Tabs defaultValue="general" className="mb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <TabsList className="border-b border-gray-200 dark:border-gray-700 w-full justify-start mb-6 rounded-none p-0 h-auto bg-transparent">
            <TabsTrigger 
              value="general" 
              className="px-5 py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 dark:data-[state=active]:border-purple-400 data-[state=active]:shadow-none text-base"
            >
              {t('settings.general')}
            </TabsTrigger>
            <TabsTrigger 
              value="user" 
              className="px-5 py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 dark:data-[state=active]:border-purple-400 data-[state=active]:shadow-none text-base"
            >
              {t('settings.user')}
            </TabsTrigger>
            {/* <TabsTrigger 
              value="workspace" 
              className="px-5 py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 dark:data-[state=active]:border-purple-400 data-[state=active]:shadow-none text-base"
            >
              {t('settings.workspace')}
            </TabsTrigger> */}
            <TabsTrigger 
              value="repositories" 
              className="px-5 py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 dark:data-[state=active]:border-purple-400 data-[state=active]:shadow-none text-base"
            >
              {t('settings.repositories')}
            </TabsTrigger>
          </TabsList>
        </motion.div>
        
        <TabsContent value="general" className="space-y-8 pt-4">
          <AnimatePresence mode="wait">
            <motion.div 
              key="general-settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid gap-8 md:grid-cols-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sun className="mr-2 h-5 w-5 text-purple-500" />
                    {t('settings.theme')}
                  </CardTitle>
                  <CardDescription>
                    Choose your preferred display theme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup defaultValue={theme} value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')} className="space-y-3">
                    <div className="flex items-center space-x-3 rounded-md border p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="flex items-center cursor-pointer">
                        <Sun className="mr-2 h-4 w-4" />
                        {t('theme.light')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 rounded-md border p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="flex items-center cursor-pointer">
                        <Moon className="mr-2 h-4 w-4" />
                        {t('theme.dark')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 rounded-md border p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className="flex items-center cursor-pointer">
                        <Monitor className="mr-2 h-4 w-4" />
                        {t('theme.system')}
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="mr-2 h-5 w-5 text-purple-500" />
                    {t('settings.languages')}
                  </CardTitle>
                  <CardDescription>
                    Select your preferred language
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={language} onValueChange={(value) => setLanguage(value as 'english' | 'spanish' | 'french' | 'german')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Español</SelectItem>
                      <SelectItem value="french">Français</SelectItem>
                      <SelectItem value="german">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
        
        <TabsContent value="user" className="space-y-8 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="user-settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid gap-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCircle className="mr-2 h-5 w-5 text-purple-500" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Manage your account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium">
                        {t('username')}
                      </Label>
                      <div>
                        {isEditingUsername ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              id="username"
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              className="w-full"
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleUsernameUpdate}
                              disabled={isUpdating}
                            >
                              {t('save')}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setIsEditingUsername(false)}
                            >
                              {t('cancel')}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {user?.user_metadata?.username || t('settings.noUsername')}
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setIsEditingUsername(true)}
                            >
                              {t('settings.edit')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t('settings.email')}
                      </Label>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{user?.email}</span>
                        <Badge className="text-xs">Verified</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9"
                      onClick={() => setIsPasswordDialogOpen(true)}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      {t('settings.changePassword')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShieldCheck className="mr-2 h-5 w-5 text-purple-500" />
                    {t('settings.sessions')}
                  </CardTitle>
                  <CardDescription>
                    Manage your active sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SessionManager 
                    currentSession={session?.access_token || ''} 
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="mr-2 h-5 w-5 text-purple-500" />
                    {t('settings.accessLogs')}
                  </CardTitle>
                  <CardDescription>
                    View recent account activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('settings.device')}</TableHead>
                        <TableHead>{t('settings.ipAddress')}</TableHead>
                        <TableHead>{t('settings.action')}</TableHead>
                        <TableHead>{t('settings.time')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            <div className="flex justify-center items-center space-x-2">
                              <div className="animate-spin h-5 w-5 border-2 border-purple-500 rounded-full border-t-transparent"></div>
                              <span>Loading logs...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : authLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">No activity logs found</TableCell>
                        </TableRow>
                      ) : (
                        authLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">{log.device || 'Unknown'}</TableCell>
                            <TableCell>{log.ip_address || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100">
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(log.created_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  
                  {totalPages > 1 && (
                    <div className="p-4 flex justify-center">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-9 p-0"
                          onClick={handlePrevPage}
                          disabled={page === 1 || loading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">{page} / {totalPages}</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-9 p-0"
                          onClick={handleNextPage}
                          disabled={page === totalPages || loading}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card> */}
              
              {/* <Card className="border-red-200 dark:border-red-900/30">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                  <CardDescription>
                    Permanently delete your account and all associated data
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="destructive" className="w-full md:w-auto">
                    {t('settings.deleteAccount')}
                  </Button>
                </CardFooter>
              </Card> */}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
        
        {/* <TabsContent value="workspace" className="pt-4">
          <AnimatePresence mode="wait">
            {selectedWorkspace ? (
              <WorkspaceSettings key={selectedWorkspace.id} />
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-500 dark:text-gray-400">No workspace selected</p>
              </div>
            )}
          </AnimatePresence>
        </TabsContent> */}
        
        <TabsContent value="repositories" className="pt-4">
          <RepositorySettings />
        </TabsContent>
      </Tabs>
      
      {/* Add the password change dialog */}
      <ChangePasswordDialog 
        open={isPasswordDialogOpen} 
        onOpenChange={setIsPasswordDialogOpen} 
      />
    </motion.div>
  );
};

export default SettingsPage;
