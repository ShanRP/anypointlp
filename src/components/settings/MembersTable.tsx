import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreVertical, UserPlus, AlertTriangle, Shield } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { logAuditEvent } from '@/utils/supabaseOptimizer';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  lastActive?: string;
}

export const MembersTable: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: 'hari', email: 'haridhanamjothi@gmail.com', role: 'Admin' }
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const pageSize = 10;

  // Memoized fetch members function to reduce re-renders
  const fetchMembers = useCallback(async (page: number) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Query workspace members directly
      const { data, count, error } = await supabase
        .from('apl_workspace_members')
        .select('id, user_id, role, created_at', { count: 'exact' })
        .range((page - 1) * pageSize, page * pageSize - 1);
      
      if (error) {
        throw error;
      }
      
      // Log audit event for sensitive data access
      await logAuditEvent(user.id, 'VIEW_MEMBERS', {
        page,
        pageSize,
        timestamp: new Date().toISOString()
      });
      
      // Simulate data transformation - in a real app you would process the actual data
      const mappedData = data ? data.map((item: any) => ({
        id: item.id,
        name: 'User ' + (item.user_id?.substring(0, 4) || 'unknown'),
        email: `user${item.user_id?.substring(0, 4) || 'unknown'}@example.com`,
        role: item.role || 'Member',
        lastActive: new Date(item.created_at).toLocaleString()
      })) : members;
      
      setMembers(mappedData);
      setTotalPages(Math.ceil((count || 0) / pageSize) || 1);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load members. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, members, toast, pageSize]);
  
  // Load members on initial render and page change
  useEffect(() => {
    if (user) {
      fetchMembers(currentPage);
    }
  }, [currentPage, fetchMembers, user]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRoleChange = async (memberId: number, newRole: string) => {
    if (!user) return;
    
    // In a real implementation, this would call an API to update the role
    try {
      // Log the role change attempt for audit purposes
      await logAuditEvent(user.id, 'CHANGE_MEMBER_ROLE', {
        memberId,
        newRole,
        timestamp: new Date().toISOString()
      });
      
      // Simulate success and update local state
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );
      
      toast({
        title: 'Role Updated',
        description: `Member role has been updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!user) return;
    
    // In a real implementation, this would call an API to remove the member
    try {
      // Log the member removal attempt for audit purposes
      await logAuditEvent(user.id, 'REMOVE_MEMBER', {
        memberId,
        timestamp: new Date().toISOString()
      });
      
      // Simulate success and update local state
      setMembers(prevMembers => prevMembers.filter(member => member.id !== memberId));
      
      toast({
        title: 'Member Removed',
        description: 'The member has been removed from this workspace',
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Members</h2>
        <Button size="sm" className="flex items-center gap-1">
          <UserPlus className="h-4 w-4" />
          <span>Invite</span>
        </Button>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">NAME</TableHead>
              <TableHead className="w-[200px]">ROLE</TableHead>
              <TableHead className="w-[200px]">LAST ACTIVE</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  No members found
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {member.role}
                      {member.role === 'Admin' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Shield className="h-4 w-4 text-blue-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Has administrative privileges</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.lastActive ? (
                      <Badge variant="outline" className="text-xs">
                        {member.lastActive}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-yellow-50">
                        <AlertTriangle className="h-3 w-3 mr-1 text-yellow-500" />
                        Never
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 p-0 flex items-center justify-center text-gray-500 hover:text-gray-700">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'Admin')}>
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'Member')}>
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink 
                  isActive={currentPage === page}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default MembersTable;
