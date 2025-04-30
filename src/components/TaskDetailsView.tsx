import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Tag, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import MonacoEditor from './MonacoEditor';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { TaskDetails } from '@/types';

interface TaskDetailsViewProps {
  task: TaskDetails;
  onBack: () => void;
}

const TaskDetailsView: React.FC<TaskDetailsViewProps> = ({ task, onBack }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<TaskDetails>(task);
  const { updateTask, deleteTask } = useWorkspaceTasks();

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (value: string) => {
    setEditedTask(prev => ({ ...prev, code: value }));
  };

  const handleUpdateTask = async () => {
    if (editedTask) {
      await updateTask(editedTask.id, editedTask);
      setIsEditing(false);
    }
  };

  const handleDeleteTask = async () => {
    if (editedTask) {
      await deleteTask(editedTask.id);
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">{task.task_name}</CardTitle>
              <div>
                <Badge className="mr-2">{task.category}</Badge>
                <Badge variant="secondary">{task.status}</Badge>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Task ID: {task.task_id}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="mr-2 h-4 w-4" />
              Created {formatDate(task.created_at)}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <User className="mr-2 h-4 w-4" />
              Assigned to User {task.user_id}
            </div>
            {task.description && (
              <div>
                <h4 className="text-lg font-semibold">Description</h4>
                <p className="text-gray-700">{task.description}</p>
              </div>
            )}
            {task.code && (
              <div>
                <h4 className="text-lg font-semibold">Code</h4>
                <MonacoEditor
                  value={task.code}
                  language="javascript"
                  onChange={handleEditorChange}
                  readOnly={!isEditing}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="px-6 py-4 border-t">
        {isEditing ? (
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask}>Save Changes</Button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <Button variant="destructive" onClick={handleDeleteTask}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Task
            </Button>
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailsView;
