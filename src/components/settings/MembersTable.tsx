
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreVertical, UserPlus } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { paginatedQuery } from '@/utils/supabaseOptimizer';

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const MembersTable: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: 'hari', email: 'haridhanamjothi@gmail.com', role: 'Admin' }
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  // Example function to fetch members with pagination
  const fetchMembers = async (page: number) => {
    setLoading(true);
    try {
      // This is a placeholder. In a real app, you'd replace this with your actual data source
      // using the paginatedQuery utility to reduce egress
      const { data, count, pageCount } = await paginatedQuery(
        'apl_workspace_members',
        'id, user_id, role, created_at',
        page,
        pageSize
      );
      
      // Simulate data transformation - in a real app you would process the actual data
      const mappedData = data ? data.map((item: any) => ({
        id: item.id,
        name: 'User ' + item.id.substring(0, 4),
        email: `user${item.id.substring(0, 4)}@example.com`,
        role: item.role || 'Member'
      })) : members;
      
      setMembers(mappedData);
      setTotalPages(pageCount || 1);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load members on initial render and page change
  useEffect(() => {
    // fetchMembers(currentPage);
    // Commented out to avoid actual API calls in this example
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10">
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
                  <TableCell>{member.role}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 p-0 flex items-center justify-center text-gray-500 hover:text-gray-700">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Change Role</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
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
