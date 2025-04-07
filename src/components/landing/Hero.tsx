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

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center relative pt-16">
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-6xl font-medium font-geist mb-6 text-white">
              Revolutionize Your MuleSoft Development
            </h1>
            <p className="text-xl text-gray-200 mb-8 font-geist">
              Harness the power of AI to streamline your integration workflows, automate DataWeave transformations, and accelerate API development by up to 10x.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/auth?signup=true">
                  <Button size="lg" className="px-8 py-6 text-lg font-semibold font-geist bg-white text-black hover:bg-gray-200">
                    Start Building for Free
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/dashboard">
                  <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-semibold font-geist bg-white text-black hover:bg-gray-200">
                    Explore Features
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid gap-8"
          >
            <div className="h-64 w-full rounded-xl overflow-hidden">
              <ErrorBoundary fallback={
                <div className="h-64 w-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                  <div className="text-white text-center font-geist">
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
                    <div className="text-white text-center font-geist">
                      <p className="text-lg font-semibold">Interactive Experience</p>
                      <p className="text-sm opacity-70">Visualize your integrations</p>
                    </div>
                  </div>
                )}
              </ErrorBoundary>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                <AnimatedNumber
                  value={10}
                  suffix="x"
                  className="text-5xl font-bold text-white mb-4 font-geist"
                />
                <p className="text-gray-200 font-geist">
                  Faster development cycles with AI assistance
                </p>
              </div>
              <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                <AnimatedNumber
                  value={85}
                  suffix="%"
                  className="text-5xl font-bold text-white mb-4 font-geist"
                />
                <p className="text-gray-200 font-geist">
                  Reduced errors in integration projects
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
