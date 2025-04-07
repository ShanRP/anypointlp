
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, UserPlus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkspaceActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onInvite: () => void;
}

const WorkspaceActionMenu: React.FC<WorkspaceActionMenuProps> = ({
  onEdit,
  onDelete,
  onInvite
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Workspace actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onInvite} className="cursor-pointer">
          <UserPlus className="mr-2 h-4 w-4" />
          <span>Invite Users</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onDelete} 
          className="cursor-pointer text-red-500 focus:text-red-500"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkspaceActionMenu;
