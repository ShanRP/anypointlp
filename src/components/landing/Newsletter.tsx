
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAnimations } from '@/utils/animationUtils';
import { Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Define the Resend API URL and key
const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_API_KEY = 're_123YourResendAPIKey'; // Replace with your actual Resend API key

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fadeIn } = useAnimations();

  const sendWelcomeEmail = async (recipientEmail: string) => {
    try {
      const emailHtml = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              h1 { color: #5a67d8; }
              h2 { color: #4c51bf; margin-top: 24px; }
              .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <h1>Welcome to the Anypoint Learning Platform!</h1>
            <p>Thank you for subscribing to our newsletter! We're excited to have you join our community of MuleSoft enthusiasts and API developers.</p>
            
            <h2>Here's what you can expect:</h2>
            <ul>
              <li>Latest updates on MuleSoft and API development best practices</li>
              <li>Exclusive tutorials and guides for building better integrations</li>
              <li>Early access to new features and tools we're developing</li>
              <li>Invitations to webinars and online events</li>
              <li>Tips and tricks from industry experts</li>
            </ul>
            
            <h2>Coming soon to our platform:</h2>
            <ul>
              <li>Advanced AI-powered MuleSoft flow generation</li>
              <li>Interactive DataWeave transformation tools</li>
              <li>Comprehensive API documentation generators</li>
              <li>Integration with popular CI/CD pipelines</li>
              <li>Enhanced visualization tools for your API ecosystem</li>
            </ul>
            
            <p>You'll be the first to know when these exciting features are released!</p>
            
            <p>If you have any questions or feedback, feel free to reply to this email or contact our support team.</p>
            
            <div class="footer">
              <p>Thank you again for subscribing, and welcome to the Anypoint Learning Platform community!</p>
              <p>Best regards,<br>The Anypoint Learning Platform Team</p>
            </div>
          </body>
        </html>`;

      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Anypoint Learning Platform <noreply@anypointlearningplatform.com>',
          to: recipientEmail,
          subject: 'Welcome to the Anypoint Learning Platform Newsletter!',
          html: emailHtml
        })
      });

      const result = await response.json();
      console.log('Resend API response:', result);
      
      // Update the last_email_sent timestamp in database
      const { error: updateError } = await supabase
        .from('apl_newsletter_subscribers')
        .update({ last_email_sent: new Date().toISOString() })
        .eq('email', recipientEmail);
        
      if (updateError) {
        console.warn('Error updating last_email_sent timestamp:', updateError);
      }
      
      return result;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { error };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Improved email validation
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
        .select('id, email')
        .eq('email', email)
        .maybeSingle();
      
      if (lookupError) {
        console.error('Error checking existing subscriber:', lookupError);
        throw new Error('Error checking subscription status');
      }
      
      if (existingSubscriber) {
        toast.info(`${email} is already subscribed to our newsletter. Thank you for your continued interest!`, {
          duration: 5000
        });
      } else {
        // Insert the new subscriber
        const { error: insertError } = await supabase
          .from('apl_newsletter_subscribers')
          .insert([{ email, status: 'active' }]);
          
        if (insertError) {
          console.error('Error saving subscriber:', insertError);
          throw new Error('Error saving your subscription');
        }
        
        // Send welcome email directly
        const emailResult = await sendWelcomeEmail(email);
        
        if (emailResult.error) {
          console.error('Error sending welcome email:', emailResult.error);
          // Still consider subscription successful even if email fails
          toast.success(`Thank you for subscribing to our newsletter! ${email} has been added to our mailing list.`, {
            duration: 5000
          });
        } else {
          toast.success(`Thank you for subscribing to our newsletter! We've sent a welcome email to ${email} with details about our platform.`, {
            duration: 5000
          });
        }
      }
      
      // Reset form
      setEmail('');
    } catch (error) {
      console.error('Newsletter submission error:', error);
      toast.error('Something went wrong with your subscription. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-24 bg-gradient-to-b from-gray-900/95 to-gray-800/95 text-white relative z-10" id="subscribe">
      <div className="container mx-auto px-4">
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
            className="bg-gray-800/50 p-8 rounded-2xl shadow-xl backdrop-blur-sm border border-gray-700"
          >
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 h-12 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="h-12 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
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
    </div>
  );
};

export default Newsletter;
