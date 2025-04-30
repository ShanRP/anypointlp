
import React from 'react';
import { JobPost } from '@/hooks/useJobBoard';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Code, AlertCircle } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export interface JobPostCardProps {
  post: JobPost;
  onSelect: (post: JobPost) => void;
  isSelected?: boolean;
  onClick?: () => void;
}

const JobPostCard: React.FC<JobPostCardProps> = ({
  post,
  onSelect,
  isSelected = false,
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      onSelect(post);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900';
      case 'closed':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900';
      case 'solved':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  // Add comment_count property if it doesn't exist
  const commentCount = post.comment_count !== undefined ? post.comment_count : 0;

  return (
    <Card 
      className={`mb-4 transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer ${
        isSelected ? 'border-primary shadow-md' : ''
      }`}
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {post.username ? getInitials(post.username) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">
              {post.username || 'Anonymous'} • {formatDate(post.created_at)}
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`${getStatusColor(post.status)} capitalize`}
          >
            {post.status}
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold line-clamp-2">
          {post.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 mt-1">
          {post.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {post.code && (
          <div className="mb-3 bg-muted rounded-md p-3 text-xs font-mono line-clamp-3 overflow-hidden">
            <Code className="inline-block h-4 w-4 mr-2 text-muted-foreground opacity-70" />
            {post.code}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4 mr-1" />
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </div>
          <Button variant="ghost" size="sm" onClick={handleClick}>
            {isSelected ? 'Viewing' : 'View Details'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default JobPostCard;
