import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CustomButton } from '@/components/ui/CustomButton';
import { useToast } from '@/components/ui/use-toast';
import { Github, Mail, User, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/assets/Logo';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isSignUp = searchParams.get('signup') === 'true';
  const redirect = searchParams.get('redirect');
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
      if (redirect) {
        navigate(redirect);
      } else {
        navigate('/dashboard');
      }
    }
  }, [session, navigate, redirect]);

  useEffect(() => {
    setActiveTab(isSignUp ? 'signup' : 'login');
  }, [isSignUp]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (redirect) {
      navigate(`?${tab === 'signup' ? 'signup=true&' : ''}redirect=${encodeURIComponent(redirect)}`);
    } else {
      navigate(tab === 'signup' ? '?signup=true' : '');
    }
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
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm"></div>
      
      <motion.div 
        className="relative z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-b from-purple-500/20 to-indigo-500/20 rounded-full filter blur-3xl transform translate-x-20 -translate-y-20 z-0"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-t from-indigo-500/20 to-purple-500/20 rounded-full filter blur-3xl transform -translate-x-20 translate-y-20 z-0"></div>
        
        <div className="relative z-10 p-8">
          <div className="text-center mb-8">
            <motion.div 
              className="flex justify-center mb-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Logo className="text-3xl" />
            </motion.div>
            <motion.h1 
              className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {activeTab === 'login' ? 'Welcome back!' : 'Join AnypointLP'}
            </motion.h1>
            <motion.p 
              className="text-sm text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              {activeTab === 'login' 
                ? 'Sign in to continue your MuleSoft development journey' 
                : 'Create an account to start building smarter integrations'}
            </motion.p>
          </div>

          <div className="flex mb-6 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => handleTabChange('login')}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'signup'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => handleTabChange('signup')}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {activeTab === 'signup' && (
              <motion.div 
                className="space-y-1.5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200">
                    <User size={18} />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
              </div>
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
                className="mt-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                icon={<ArrowRight className="ml-2 h-5 w-5" />}
                iconPosition="right"
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
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">or continue with</span>
              </div>
            </div>

            <motion.div 
              className="grid grid-cols-2 gap-3"
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
                className="py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 font-medium"
              >
                GitHub
              </CustomButton>
              
              <CustomButton
                variant="secondary"
                size="lg"
                fullWidth
                icon={<Mail size={20} />}
                iconPosition="left"
                onClick={() => handleProviderSignIn('google')}
                className="py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 font-medium"
              >
                Google
              </CustomButton>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
