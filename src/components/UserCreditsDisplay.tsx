import React, { useState, useEffect } from 'react';
import { useUserCredits } from '@/providers/UserCreditsProvider';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, CreditCard, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

export function UserCreditsDisplay() {
  const { credits, loading, showUpgradeDialog, setShowUpgradeDialog } = useUserCredits();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Don't make any additional network calls in this component
  // The useUserCredits hook already handles caching and fetching

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      // Create a checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          success_url: window.location.origin + '/dashboard?upgrade=success',
          cancel_url: window.location.origin + '/dashboard?upgrade=canceled'
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process. Please try again.');
    } finally {
      setIsUpgrading(false);
      setShowUpgradeDialog(false);
    }
  };

  // Check for URL params related to upgrade
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const upgradeStatus = searchParams.get('upgrade');
    
    if (upgradeStatus === 'success') {
      toast.success('Upgrade successful! You now have Pro access.');
      // Remove the query parameter
      navigate(location.pathname, { replace: true });
    } else if (upgradeStatus === 'canceled') {
      toast.info('Upgrade canceled. You can try again anytime.');
      // Remove the query parameter
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  if (loading) {
    // Don't show a loading spinner, just render nothing to avoid layout shifts
    return null;
  }

  if (!credits) {
    // If no credits data, render a minimal placeholder
    return (
      <Badge variant="outline" className="px-3 py-1">
        <Coins className="mr-1 h-3 w-3" />
        <span>-</span>
      </Badge>
    );
  }

  const proLimit = credits.is_pro ? 100 : 3;
  const creditsRemaining = proLimit - credits.credits_used;
  const resetDate = new Date(credits.reset_date);
  const formattedResetDate = resetDate.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <>
      <Badge 
        variant="outline" 
        className={`px-3 py-1 ${
          credits.is_pro 
            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/30' 
            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}
      >
        <Coins className="mr-1 h-3 w-3" />
        <span>{creditsRemaining} credits</span>
      </Badge>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upgrade to Pro</DialogTitle>
            <DialogDescription>
              Get unlimited access to all features and more credits.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg border p-4 mb-4">
              <h3 className="font-medium mb-2">Pro Plan Benefits</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="bg-green-500 rounded-full p-1 mr-2">
                    <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </span>
                  100 credits per day
                </li>
                <li className="flex items-center">
                  <span className="bg-green-500 rounded-full p-1 mr-2">
                    <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </span>
                  Priority support
                </li>
                <li className="flex items-center">
                  <span className="bg-green-500 rounded-full p-1 mr-2">
                    <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </span>
                  Advanced features
                </li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">$9.99<span className="text-sm font-normal">/month</span></div>
              <div className="text-sm text-gray-500 mb-4">Cancel anytime</div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Maybe Later
            </Button>
            <Button onClick={handleUpgrade} disabled={isUpgrading}>
              {isUpgrading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Upgrade Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
