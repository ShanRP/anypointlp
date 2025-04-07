
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Loader2, Send, X } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  code: z.string().optional(),
});

type CreateJobPostFormProps = {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
};

export default function CreateJobPostForm({ onSubmit, onCancel }: CreateJobPostFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      code: '',
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 max-w-3xl mx-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Create New Post</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCancel}
          className="rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Mulesoft DataWeave Transformation Help" 
                    className="border-gray-200 focus:border-purple-300"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your problem or question in detail" 
                    className="min-h-[120px] border-gray-200 focus:border-purple-300"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Code (optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Paste any relevant code here" 
                    className="min-h-[150px] font-mono text-sm border-gray-200 focus:border-purple-300"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="border-gray-200"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isSubmitting ? 'Posting...' : 'Post Problem'}
              </Button>
            </motion.div>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
