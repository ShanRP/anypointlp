
import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { isWebGLAvailable, handleContextLoss } from "@/utils/webGLUtil";
import ErrorBoundary from "../ErrorBoundary";
import { Group } from "three";
import AnimatedNumber from "../ui/AnimatedNumber";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FloatingLogo = ({ isAnimating }) => {
  const groupRef = useRef<Group>(null!);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = 0.2;
    }
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      
      if (isAnimating) {
        groupRef.current.rotation.y += delta * 0.2;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Mulesoft-inspired API Connection Representation */}
      <group>
        {/* Central Node */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>

        {/* Connecting Lines/Connections */}
        <group rotation={[0, 0, 0]}>
          <mesh position={[1, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
            <meshStandardMaterial color="#4f46e5" />
          </mesh>
          <mesh position={[-1, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
            <meshStandardMaterial color="#4f46e5" />
          </mesh>
          <mesh position={[0, 1, 0]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
            <meshStandardMaterial color="#34d399" />
          </mesh>
          <mesh position={[0, -1, 0]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
            <meshStandardMaterial color="#34d399" />
          </mesh>
        </group>
      </group>
    </group>
  );
};

const HeroScene = ({ isAnimating = false }) => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Stars radius={50} depth={50} count={500} factor={4} fade />
      <FloatingLogo isAnimating={isAnimating} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={isAnimating}
        autoRotateSpeed={0.5}
      />
    </>
  );
};

export const Hero = () => {
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    setWebglAvailable(isWebGLAvailable());
    
    if (canvasRef.current) {
      handleContextLoss(canvasRef.current);
    }
    
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * i,
        duration: 0.6,
        ease: "easeOut"
      }
    })
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center relative overflow-hidden pt-16">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 z-0"></div>
      
      {/* Animated Background Shapes */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-purple-600/10 rounded-full filter blur-3xl animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-600/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-blue-600/10 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center md:text-left"
          >
            <motion.h1 
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeInVariants}
              className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 text-white leading-tight"
            >
              Revolutionize Your <span className="bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">MuleSoft</span> Development
            </motion.h1>
            
            <motion.p 
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeInVariants}
              className="text-xl text-gray-200 mb-8 max-w-lg mx-auto md:mx-0"
            >
              Harness the power of AI to streamline your integration workflows, automate DataWeave transformations, and accelerate API development by up to 10x.
            </motion.p>
            
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeInVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/auth?signup=true">
                  <Button size="lg" className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-600/20">
                    Start Building for Free
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/dashboard">
                  <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-semibold border-white text-white hover:bg-white/10 shadow-lg">
                    Explore Features
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid gap-8"
          >
            <div className="h-64 w-full rounded-xl overflow-hidden shadow-2xl border border-gray-700/50">
              <ErrorBoundary fallback={
                <div className="h-64 w-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                  <div className="text-white text-center">
                    <p className="text-lg font-semibold">Interactive 3D Experience</p>
                    <p className="text-sm opacity-70">Visualize your integrations</p>
                  </div>
                </div>
              }>
                {webglAvailable ? (
                  <Canvas ref={canvasRef}>
                    <HeroScene isAnimating={isAnimating} />
                  </Canvas>
                ) : (
                  <div className="h-64 w-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                    <div className="text-white text-center">
                      <p className="text-lg font-semibold">Interactive Experience</p>
                      <p className="text-sm opacity-70">Visualize your integrations</p>
                    </div>
                  </div>
                )}
              </ErrorBoundary>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <motion.div 
                className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <AnimatedNumber
                  value={10}
                  suffix="x"
                  className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mb-4"
                />
                <p className="text-gray-200">
                  Faster development cycles with AI assistance
                </p>
              </motion.div>
              <motion.div 
                className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <AnimatedNumber
                  value={85}
                  suffix="%"
                  className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mb-4"
                />
                <p className="text-gray-200">
                  Reduced errors in integration projects
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
