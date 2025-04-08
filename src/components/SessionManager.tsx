import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReloadIcon } from '@radix-ui/react-icons';

const SessionManager: React.FC = () => {
  const { session, signOut } = useAuth();
  const { updateUsername, isUpdating } = useProfile();
  const [username, setUsername] = useState(session?.user?.user_metadata?.username as string || '');
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
    if (session?.user?.user_metadata?.username) {
        setUsername(session.user.user_metadata.username as string);
    }
  }, [session]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleUsernameUpdate = async () => {
    if (username.trim() === '') {
      toast({
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    await updateUsername(username);
  };

  if (!isMounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Session Management</h1>
          <p className="text-muted-foreground">Manage your session and profile settings</p>
        </div>
        <Avatar>
          <AvatarImage src={`https://avatar.vercel.sh/${session?.user?.email}.png`} />
          <AvatarFallback>{session?.user?.email?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={session?.user?.email || ''} readOnly />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isUpdating}
            />
            <Button onClick={handleUsernameUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Username"
              )}
            </Button>
          </div>
        </div>

        <div>
          <Button variant="destructive" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;
