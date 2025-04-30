
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
// import { useWorkspaces } from '@/hooks/useWorkspaces';
import { ChangePasswordDialog } from './settings/ChangePasswordDialog';
import { UserCreditsDisplay } from './UserCreditsDisplay';


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

  const { toast } = useToast();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.user_metadata?.username || '');

 
 
  
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

 

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const handleUsernameUpdate = async () => {
    await updateUsername(newUsername);
    setIsEditingUsername(false);
  };

  

  

  // Initialize workspaces only once when component mounts
  

  
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
           {/* ADD THE UserCreditsDisplay COMPONENT HERE */}
    <UserCreditsDisplay />
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
              
              
            </motion.div>
          </AnimatePresence>
        </TabsContent>
        
        
        
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
