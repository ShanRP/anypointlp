
import React, { useState, useEffect } from 'react';
import { useUserCredits } from '@/hooks/useUserCredits';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

export function UserCreditsDisplay() {
  const { credits, loading, refreshCredits, showUpgradeDialog, setShowUpgradeDialog } = useUserCredits();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check for payment success or cancel URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paymentSuccess = queryParams.get('payment_success');
    const paymentCanceled = queryParams.get('payment_canceled');
    
    if (paymentSuccess === 'true') {
      toast.success('Payment successful! You are now on the Pro Plan.');
      refreshCredits();
      // Clean URL
      navigate('/dashboard', { replace: true });
    }
    
    if (paymentCanceled === 'true') {
      toast.info('Payment was canceled.');
      // Clean URL
      navigate('/dashboard', { replace: true });
    }
  }, [location.search, navigate, refreshCredits]);
  
  // Get values directly from credits object
  const getCreditsRemaining = () => {
    if (!credits) return 0;
    const limit = credits.is_pro ? 100 : 3;
    return limit - credits.credits_used;
  };
  
  const isLow = () => {
    if (!credits) return false;
    const remaining = getCreditsRemaining();
    return remaining <= 1 && !credits.is_pro;
  };
  
  const isPro = () => credits?.is_pro || false;
  
  // Calculate once for this render
  const creditsRemaining = getCreditsRemaining();

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process. Please try again.');
    } finally {
      setShowUpgradeDialog(false);
      setIsUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 font-geistSans">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading credits...</span>
      </div>
    );
  }

  if (!credits) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isLow() ? "destructive" : "secondary"} 
        className="flex items-center gap-1 px-2 py-1 font-geistSans"
      >
        <Coins className="h-3.5 w-3.5" />
        <span>{creditsRemaining} credit{creditsRemaining !== 1 ? 's' : ''} left</span>
      </Badge>

      {!isPro() && (
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs font-geistSans">
              Upgrade
            </Button>
          </DialogTrigger>
          <DialogContent className="font-geistSans">
            <DialogHeader>
              <DialogTitle className="font-geistMono">Upgrade to Pro Plan</DialogTitle>
              <DialogDescription>
                Get 100 credits per month + 3 credits daily with our Pro Plan for only ₹1000/year.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="rounded-lg border p-4 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-medium mb-2 flex items-center font-geistMono">
                  <Coins className="h-4 w-4 mr-2" />
                  Pro Plan Benefits
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>100 credits per month</li>
                  <li>3 credits daily top-up</li>
                  <li>Priority support</li>
                  <li>Access to all premium features</li>
                  <li>Email support</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                Cancel
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
                    Upgrade for ₹1000/year
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
