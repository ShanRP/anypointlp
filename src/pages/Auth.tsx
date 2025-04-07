
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CustomButton } from '@/components/ui/CustomButton';
import { useToast } from '@/components/ui/use-toast';
import { Github, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/assets/Logo';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isSignUp = searchParams.get('signup') === 'true';
  const [activeTab, setActiveTab] = useState(isSignUp ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, signInWithProvider, session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  useEffect(() => {
    setActiveTab(isSignUp ? 'signup' : 'login');
  }, [isSignUp]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(tab === 'signup' ? '?signup=true' : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        if (!username.trim()) {
          throw new Error('Username is required');
        }
        const { error } = await signUp(email, password, { username });
        if (error) throw error;
        
        toast({
          title: "Success!",
          description: "Check your email for the confirmation link.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: 'github' | 'google') => {
    try {
      await signInWithProvider(provider);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: `url('/lovable-uploads/d2aa835c-dd21-4902-b47b-649d32329bf0.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#000000'
      }}
    >
      <div className="absolute inset-0 backdrop-blur-[1px] bg-gradient-to-br from-black/30 to-black/30"></div>
      
      <motion.div 
        className="relative z-10 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="text-center mb-6">
          <motion.div 
            className="flex justify-center mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Logo className="text-2xl" />
          </motion.div>
          <motion.h1 
            className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {activeTab === 'login' ? 'Welcome back!' : 'Create account'}
          </motion.h1>
          <motion.p 
            className="text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {activeTab === 'login' 
              ? 'Please enter your details to sign in.' 
              : 'Get started with your free account.'}
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {activeTab === 'signup' && (
            <motion.div 
              className="space-y-1.5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-hover:text-black transition-colors duration-200">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </motion.div>
          )}
          
          <motion.div 
            className="space-y-1.5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-hover:text-black transition-colors duration-200">
                <Mail size={18} />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>
          </motion.div>
          
          <motion.div 
            className="space-y-1.5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              placeholder="Enter your password"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <CustomButton
              variant="primary"
              size="lg"
              fullWidth
              type="submit"
              disabled={loading}
              className="mt-6 py-2.5 rounded-xl bg-black hover:bg-gray-800 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? 'Processing...' 
                : activeTab === 'login' 
                  ? 'Sign in' 
                  : 'Create account'}
            </CustomButton>
          </motion.div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className=" px-2 text-sm text-gray-500">or</span>
            </div>
          </div>

          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <CustomButton
              variant="secondary"
              size="lg"
              fullWidth
              icon={<Github size={20} />}
              iconPosition="left"
              onClick={() => handleProviderSignIn('github')}
              className="rounded-xl hover:bg-gray-50 border-gray-200 hover:border-gray-300 transition-all duration-200"
            >
              Continue with GitHub
            </CustomButton>
            
            <CustomButton
              variant="secondary"
              size="lg"
              fullWidth
              icon={<Mail size={20} />}
              iconPosition="left"
              onClick={() => handleProviderSignIn('google')}
              className="rounded-xl hover:bg-gray-50 border-gray-200 hover:border-gray-300 transition-all duration-200"
            >
              Continue with Google
            </CustomButton>
          </motion.div>

          <motion.div 
            className="mt-6 text-center text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {activeTab === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange('signup')}
                  className="text-black hover:text-gray-800 font-medium transition-colors duration-200"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className="text-black hover:text-gray-800 font-medium transition-colors duration-200"
                >
                  Sign in
                </button>
              </>
            )}
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default Auth;
