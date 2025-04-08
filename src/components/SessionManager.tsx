
import React, { useState, useEffect } from 'react';
import { UAParser } from 'ua-parser-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface Session {
  id: string;
  created_at: string;
  user_agent?: string;
  ip_address?: string;
  last_active_at?: string;
  isCurrentDevice?: boolean;
}

export const SessionManager = ({ currentSession }: { currentSession: string }) => {
  const { toast } = useToast();
  const { getUserSessions, signOutSession, session } = useAuth();
  const parser = new UAParser();
  const [currentDevice, setCurrentDevice] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  // Get device information from user agent string
  const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Device';
    parser.setUA(userAgent);
    const result = parser.getResult();
    
    const deviceType = result.device.type || (result.os.name === 'iOS' ? 'Mobile' : 'Desktop');
    const osName = result.os.name || 'Unknown OS';
    const browserName = result.browser.name || 'Unknown Browser';
    const browserVersion = result.browser.version?.split('.')[0] || '';
    
    return `${osName} / ${browserName} ${browserVersion}`;
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return `${date.toISOString().slice(0, 10)} ${date.toTimeString().slice(0, 5)}`;
    } catch (e) {
      return 'Invalid date';
    }
  };

  const fetchCurrentSession = async (isManualRefresh = false) => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Create a fallback session that represents the current device
      const fallbackSession = {
        id: currentSession || session.access_token.split('.')[0],
        created_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip_address: "Current device",
        last_active_at: new Date().toISOString(),
        isCurrentDevice: true
      };
      
      try {
        // We only want to display the current session
        const fetchedSession = {
          id: session.access_token.split('.')[0],
          created_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_address: "Current device",
          last_active_at: new Date().toISOString(),
          isCurrentDevice: true
        };
        
        setCurrentDevice(fetchedSession);
      } catch (error) {
        console.error('Error fetching session:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load session information."
        });
        setCurrentDevice(fallbackSession);
      }
    } catch (error) {
      console.error('Unexpected error in session fetching:', error);
      // Fallback for any unexpected error
      const fallbackSession = {
        id: currentSession || (session?.access_token?.split('.')?.[0] || 'current'),
        created_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip_address: "Currently used device",
        last_active_at: new Date().toISOString(),
        isCurrentDevice: true
      };
      setCurrentDevice(fallbackSession);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (session) {
      fetchCurrentSession();
    }
  }, [session]);

  const handleLogout = async () => {
    if (!currentDevice) return;
    
    try {
      setIsSigningOut(true);
      
      await signOutSession(currentDevice.id);
      
      toast({
        title: "Success",
        description: "You have been logged out successfully",
      });
      // Auth state change will handle redirect
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fetchCurrentSession(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-1"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Refresh
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !currentDevice ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6 text-gray-500 dark:text-gray-400"
        >
          No active session found
        </motion.div>
      ) : (
        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Current Device</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <motion.tr 
                className="border-b last:border-b-0"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={cardVariants}
                transition={{ duration: 0.3 }}
              >
                <TableCell>
                  <div className="font-medium">{getDeviceInfo(currentDevice.user_agent)}</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Current Device
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {currentDevice.ip_address}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(currentDevice.last_active_at || currentDevice.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    disabled={isSigningOut}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {isSigningOut && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Logout
                  </Button>
                </TableCell>
              </motion.tr>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
