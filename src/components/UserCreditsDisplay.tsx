
import React, { useEffect, useState } from 'react';
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

export function UserCreditsDisplay() {
  const { credits, loading, upgradeToProPlan } = useUserCredits();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [isLow, setIsLow] = useState(false);
  const [isPro, setIsPro] = useState(false);

  // Combined all state updates in a single effect to prevent cascading updates
  useEffect(() => {
    if (credits) {
      // Calculate values once from credits data
      const limit = credits.is_pro ? 100 : 3;
      const remaining = limit - credits.credits_used;
      
      // Update all states at once to prevent re-renders
      setCreditsRemaining(remaining);
      setIsLow(remaining <= 1 && !credits.is_pro);
      setIsPro(credits.is_pro);
    }
  }, [credits]); // Only depend on credits object, not on derived states

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await upgradeToProPlan();
    } finally {
      setIsUpgradeDialogOpen(false);
      setIsUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading credits...</span>
      </div>
    );
  }

  if (!credits) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isLow ? "destructive" : "secondary"} 
        className="flex items-center gap-1 px-2 py-1"
      >
        <Coins className="h-3.5 w-3.5" />
        <span>{creditsRemaining} credit{creditsRemaining !== 1 ? 's' : ''} left</span>
      </Badge>

      {!isPro && (
        <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              Upgrade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade to Pro Plan</DialogTitle>
              <DialogDescription>
                Get 100 credits per month with our Pro Plan for only $1000/year.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="rounded-lg border p-4 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-medium mb-2 flex items-center">
                  <Coins className="h-4 w-4 mr-2" />
                  Pro Plan Benefits
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>100 credits per month</li>
                  <li>Priority support</li>
                  <li>Access to all premium features</li>
                  <li>Email support</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>
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
                    Upgrade for $1000/year
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
