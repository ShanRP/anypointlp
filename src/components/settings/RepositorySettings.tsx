import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Github, Save, Check, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast as useSonnerToast } from 'sonner';

const RepositorySettings = () => {
  const { user } = useAuth();
  const [githubToken, setGithubToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useSonnerToast();

  useEffect(() => {
    const fetchGithubToken = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('github_token')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching GitHub token:', error);
          toast({
            title: "Error",
            description: "Failed to load GitHub token.",
            variant: "destructive"
          });
        } else if (data && data.github_token) {
          setGithubToken(data.github_token);
          setIsTokenValid(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchGithubToken();
  }, [user, toast]);

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGithubToken(e.target.value);
    setIsTokenValid(false);
  };

  const handleSaveToken = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, github_token: githubToken }, { onConflict: 'id' });

      if (error) {
        console.error('Error saving GitHub token:', error);
        toast({
          title: "Error",
          description: "Failed to save GitHub token.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "GitHub token saved successfully.",
        });
        setIsTokenValid(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Github className="h-5 w-5 mr-2" />
          GitHub Settings
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to enable repository integrations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="github-token">GitHub Token</Label>
              <Input
                id="github-token"
                type="password"
                value={githubToken}
                onChange={handleTokenChange}
                placeholder="Enter your GitHub token"
              />
            </div>
            {isTokenValid && (
              <div className="text-green-500 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                Token is valid
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveToken} disabled={isSaving}>
          {isSaving ? (
            <>
              Saving...
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Token
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RepositorySettings;
