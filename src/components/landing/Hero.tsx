import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, Code, Database, FileCode2, Share2, TestTube2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

const FeatureCard = ({ title, description, icon, delay = 0 }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
      }}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
    >
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
        <div className="text-white">{icon}</div>
      </div>
      <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
    </motion.div>
  );
};

const Hero = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [state, setState] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const heroRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setState({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const features = [
    {
      title: t('landing.features.integration.title') || 'Integration Generator',
      description: t('landing.features.integration.description') || 'Create flow code from flow specifications and flow diagrams',
      icon: <FileCode2 size={20} />,
      delay: 0.1,
    },
    {
      title: t('landing.features.dataweave.title') || 'DataWeave Generator',
      description: t('landing.features.dataweave.description') || 'Create transformations from input output examples',
      icon: <Database size={20} />,
      delay: 0.2,
    },
    {
      title: t('landing.features.raml.title') || 'RAML Generator',
      description: t('landing.features.raml.description') || 'Create RAML specifications for your APIs',
      icon: <FileCode2 size={20} />,
      delay: 0.3,
    },
    {
      title: t('landing.features.munit.title') || 'MUnit Test Generator',
      description: t('landing.features.munit.description') || 'Generate MUnit tests for a flow',
      icon: <TestTube2 size={20} />,
      delay: 0.4,
    },
    {
      title: t('landing.features.exchange.title') || 'Exchange Marketplace',
      description: t('landing.features.exchange.description') || 'Share and discover reusable templates and components',
      icon: <Share2 size={20} />,
      delay: 0.5,
    },
    {
      title: t('landing.features.jobBoard.title') || 'Community Board',
      description: t('landing.features.jobBoard.description') || 'Connect with MuleSoft developers to solve problems together',
      icon: <Users size={20} />,
      delay: 0.6,
    },
  ];

  return (
    <div className="relative overflow-hidden" ref={heroRef}>
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-purple-100 to-transparent dark:from-purple-900/20 dark:to-transparent rounded-full blur-3xl opacity-30 transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-indigo-100 to-transparent dark:from-indigo-900/20 dark:to-transparent rounded-full blur-3xl opacity-30 transform -translate-x-1/3 translate-y-1/3"></div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-32 md:pb-32">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 mb-6"
          >
            {t('landing.hero.title') || 'Accelerate MuleSoft Development with AI'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10"
          >
            {t('landing.hero.subtitle') || 'Generate DataWeave transformations, integration flows, RAML specs, and more with our AI-powered platform.'}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-medium"
            >
              {user
                ? t('landing.hero.dashboard') || 'Go to Dashboard'
                : t('landing.hero.getStarted') || 'Get Started'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/features')}
              className="px-8 py-6 rounded-xl text-lg font-medium border-2 border-gray-300 dark:border-gray-600"
            >
              {t('landing.hero.learnMore') || 'Learn More'}
            </Button>
          </motion.div>
        </div>

        {/* Code preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 md:mt-24 max-w-4xl mx-auto"
        >
          <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center bg-gray-800 px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="ml-4 text-gray-400 text-sm font-mono">dataweave-transform.dwl</div>
            </div>
            <div className="p-4 font-mono text-sm text-green-400 overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                <code>
                  %dw 2.0{'\n'}
                  output application/json{'\n'}
                  ---{'\n'}
                  payload map ( item, index ) -> {'{'}
                  {'\n'}  id: item.id,{'\n'}  name: item.firstName ++ " " ++ item.lastName,{'\n'}  email: item.email,{'\n'}  status: if (item.active) "ACTIVE" else "INACTIVE",{'\n'}  createdDate: item.created as DateTime as String {{'{'}} format: "yyyy-MM-dd" {{'}'}}
                  {'\n'}{'}'}
                </code>
              </pre>
            </div>
          </div>
        </motion.div>

        {/* Features section */}
        <div className="mt-24 md:mt-32">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300"
          >
            {t('landing.features.title') || 'Powerful AI Tools for MuleSoft Developers'}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                delay={feature.delay}
              />
            ))}
          </div>
        </div>

        {/* CTA section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-24 md:mt-32 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {t('landing.cta.title') || 'Ready to supercharge your MuleSoft development?'}
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            {t('landing.cta.subtitle') || 'Join thousands of developers who are building faster with our AI-powered tools.'}
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-medium"
          >
            {user
              ? t('landing.cta.dashboard') || 'Go to Dashboard'
              : t('landing.cta.getStarted') || 'Get Started for Free'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      {/* Animated background elements */}
      <div className="hidden md:block">
        {[...Array(5)].map((_, i) => {
          const windowWidth = state?.width || window.innerWidth;
          const size = Math.random() * 300 + 100;
          const xPos = Math.random() * windowWidth;
          const yPos = Math.random() * 1000;
          const duration = Math.random() * 20 + 10;

          return (
            <motion.div
              key={i}
              className={cn(
                "absolute rounded-full opacity-10 bg-gradient-to-r",
                i % 2 === 0 ? "from-purple-300 to-indigo-300" : "from-indigo-300 to-purple-300",
                theme === "dark" ? "opacity-5" : "opacity-20"
              )}
              style={{
                width: size,
                height: size,
                x: xPos,
                y: yPos,
                scale: 0.8,
              }}
              animate={{
                y: [yPos, yPos - 200, yPos],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                repeat: Infinity,
                duration: duration,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Hero;
