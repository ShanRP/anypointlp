'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAnimations } from '@/utils/animationUtils';
import { Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fadeIn } = useAnimations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if the email already exists
      const { data: existingSubscriber, error: lookupError } = await supabase
        .from('apl_newsletter_subscribers')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (lookupError) {
        console.error('Error checking existing subscriber:', lookupError);
        throw new Error('Error checking subscription status');
      }

      if (existingSubscriber) {
        toast.info(`${email} is already subscribed. Thank you!`);
      } else {
        // Save to subscriber table
        const { error: insertError } = await supabase
          .from('apl_newsletter_subscribers')
          .insert([{ email, status: 'active' }]);

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error('Failed to save subscriber');
        }

        // Send a magic link email using Supabase Auth (SMTP must be configured)
        const { error: emailError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false, // Avoid creating user accounts
            emailRedirectTo: `${window.location.origin}/thank-you`
          }
        });

        if (emailError) {
          console.error('Email send error:', emailError);
          toast.warning(`Subscription saved, but email failed to send.`);
        } else {
          toast.success(`🎉 Subscription successful! A confirmation email has been sent to ${email}`);
        }
      }

      setEmail('');
    } catch (err) {
      console.error('Newsletter error:', err);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-24 bg-gradient-to-b from-black to-gray-900 text-white relative z-10" id="subscribe">
      {/* Background elements to match Hero */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-transparent z-0"></div>
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-radial from-amber-500/20 via-amber-700/5 to-transparent opacity-70 blur-3xl z-0"></div>
      
      {/* Grid pattern overlay to match Hero */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMmgxdjFoLTF2LTF6bS0yLTJoMXYxaC0xdi0xem0yLTJoMXYxaC0xdi0xem0tMiAyaDF2MWgtMXYtMXptLTItMmgxdjFoLTF2LTF6bTggMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0tMi0yaDF2MWgtMXYtMXptLTIgMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0xMC00aDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0xNi0xMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0xNi0xMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 z-0"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"
          >
            Stay Updated
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto"
          >
            Subscribe to our newsletter for the latest updates, best practices, and tips for your MuleSoft and API development journey.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-black/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-800 relative overflow-hidden"
          >
            {/* Glow effect around the form */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-indigo-500/20 to-amber-500/30 blur-md rounded-xl"></div>
            
            <form onSubmit={handleSubmit} className="max-w-md mx-auto relative z-10">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 h-12 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 pl-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="h-12 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-purple-500/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                      Subscribing...
                    </span>
                  ) : 'Subscribe'}
                </Button>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
      
      {/* Add subtle particle effect to match Hero */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-1 h-1 rounded-full bg-white animate-pulse opacity-70"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-white animate-pulse opacity-50 animation-delay-300"></div>
        <div className="absolute top-1/2 right-1/5 w-1 h-1 rounded-full bg-white animate-pulse opacity-60 animation-delay-700"></div>
      </div>
    </div>
  );
};

export default Newsletter;
