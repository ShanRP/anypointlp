
import { motion } from "framer-motion";
import { Hero } from "@/components/landing/Hero"; // Use named import
import { Features } from "@/components/landing/Features";
import { Security } from "@/components/landing/Security";
import Newsletter from "@/components/landing/Newsletter";
import { Footer } from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import { Logo } from "@/components/assets/Logo";
import { VideoBackground } from "@/components/VideoBackground";
import { Testimonials } from "@/components/Testimonials";
import { DataFlowAnimation } from "@/components/animations/DataFlowAnimation";
import { DataWeaveAnimation } from "@/components/animations/DataWeaveAnimation";
import { ApiAnimation } from "@/components/animations/ApiAnimation";
import { AnimatedCodeBlock } from "@/components/animations/AnimatedCodeBlock";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Suspense, useEffect, useState } from "react";
import { isWebGLAvailable } from "@/utils/webGLUtil";
import { toast } from "sonner";
import { useAnimations } from "@/utils/animationUtils";
import CodingAssistantDemo from "@/components/animations/CodingAssistantDemo";
import MUnitAnimation from "@/components/animations/MUnitAnimation";

// Sample MuleSoft code for the animated code block
const muleSoftSampleCode = `<mule xmlns="http://www.mulesoft.org/schema/mule/core"
      xmlns:http="http://www.mulesoft.org/schema/mule/http"
      xmlns:ee="http://www.mulesoft.org/schema/mule/ee/core">

  <http:listener-config name="HTTP_Listener_config">
    <http:listener-connection host="0.0.0.0" port="8081" />
  </http:listener-config>

  <flow name="api-main-flow">
    <http:listener config-ref="HTTP_Listener_config" path="/api/*"/>
    <ee:transform>
      <ee:message>
        <ee:set-payload><![CDATA[
          %dw 2.0
          output application/json
          ---
          {
            "message": "Welcome to AnypointLP API",
            "timestamp": now()
          }
        ]]></ee:set-payload>
      </ee:message>
    </ee:transform>
    <logger level="INFO" message="Request received: #[payload]"/>
    <flow-ref name="process-request-flow"/>
    <error-handler>
      <on-error-propagate>
        <set-payload value="An error occurred"/>
      </on-error-propagate>
    </error-handler>
  </flow>
</mule>`;

export default function Index() {
  const [webGLSupported, setWebGLSupported] = useState(true);
  const { fadeIn } = useAnimations();
  
  // Check for WebGL support on component mount
  useEffect(() => {
    const supported = isWebGLAvailable();
    setWebGLSupported(supported);
    
    if (!supported) {
      // Only show this message if WebGL is unavailable
      toast.warning("3D visualizations are disabled due to limited browser support. The application will still function normally.", {
        duration: 5000,
      });
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative">
      <VideoBackground />
      
      <nav className="fixed top-0 w-full backdrop-blur-md z-50 border-b border-white/10 bg-black/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo className="text-2xl text-white" />
          </Link>
          <div className="hidden md:flex gap-6">
            <a href="#features" className="text-white/80 hover:text-white transition-colors font-montserrat">Features</a>
            <a href="#security" className="text-white/80 hover:text-white transition-colors font-montserrat">Security</a>
            <a href="#contact" className="text-white/80 hover:text-white transition-colors font-montserrat">Contact</a>
          </div>
          <div className="flex gap-4 items-center">
            <Link 
              to="/auth" 
              className="text-white/80 hover:text-white transition-colors font-montserrat"
            >
              Login
            </Link>
            <Link 
              to="/auth?signup=true" 
              className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-montserrat"
            >
              Sign up for Free
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-grow">
        <ErrorBoundary suppressToast={true}>
          <Hero />
        </ErrorBoundary>
        
        {/* Animation Section */}
        <section className="py-20 bg-black/60 backdrop-blur-sm relative overflow-hidden">
          <motion.div
            className="absolute -top-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />
          
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="inline-block px-4 py-1 rounded-full bg-purple-900/30 text-purple-300 text-sm font-medium mb-4 font-montserrat">
                Interactive Visualizations
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-display">See Your Integrations in Action</h2>
              <p className="text-gray-300 max-w-2xl mx-auto font-montserrat">
                Watch how data flows through your MuleSoft integrations with our real-time visualizations
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <ErrorBoundary suppressToast={true}>
                <Suspense fallback={<div className="h-40 w-full bg-gray-800/50 rounded-xl animate-pulse" />}>
                  <DataFlowAnimation />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <ErrorBoundary suppressToast={true}>
                  <AnimatedCodeBlock 
                    code={muleSoftSampleCode} 
                    language="xml"
                    delay={500}
                    typingSpeed={10}
                  />
                </ErrorBoundary>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex flex-col justify-center"
              >
                <h3 className="text-2xl font-bold text-white mb-4 font-display">Intelligent Flow Generation</h3>
                <p className="text-gray-300 mb-6 font-montserrat">
                  Our AI-powered platform automatically generates MuleSoft flows based on your specifications, saving you hours of development time. Watch as your integrations come to life with just a few clicks.
                </p>
                <ul className="space-y-3">
                  {['API-led connectivity', 'Error handling', 'Data transformation', 'Logging and monitoring'].map((item, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 * i }}
                      className="flex items-center"
                    >
                      <motion.span 
                        className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center mr-3"
                        whileInView={{ scale: [0, 1.2, 1] }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 * i }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.span>
                      <span className="text-white font-montserrat">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <ErrorBoundary suppressToast={true}>
                <Suspense fallback={<div className="h-40 w-full bg-gray-800/50 rounded-xl animate-pulse" />}>
                  <DataWeaveAnimation />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <ErrorBoundary suppressToast={true}>
                <Suspense fallback={<div className="h-40 w-full bg-gray-800/50 rounded-xl animate-pulse" />}>
                  <ApiAnimation />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
            
            {/* Coding Assistant Demo Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <ErrorBoundary suppressToast={true}>
                <Suspense fallback={<div className="h-40 w-full bg-gray-800/50 rounded-xl animate-pulse" />}>
                  <CodingAssistantDemo />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
            
            {/* MUnit Animation Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <ErrorBoundary suppressToast={true}>
                <Suspense fallback={<div className="h-40 w-full bg-gray-800/50 rounded-xl animate-pulse" />}>
                  <MUnitAnimation />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </div>
        </section>
        
        <ErrorBoundary suppressToast={true}>
          <Features />
        </ErrorBoundary>
        
        <ErrorBoundary suppressToast={true}>
          <Testimonials />
        </ErrorBoundary>
        
        <ErrorBoundary suppressToast={true}>
          <Security />
        </ErrorBoundary>
        
        <ErrorBoundary suppressToast={true}>
          <Newsletter />
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
}
