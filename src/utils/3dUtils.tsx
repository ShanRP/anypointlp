
import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import { isWebGLAvailable, handleContextLoss } from '@/utils/webGLUtil';
import { Group, Object3D } from 'three';

interface ThreeDContainerProps {
  children: ReactNode;
  className?: string;
  enableHoverAnimation?: boolean;
}

interface RotatingObjectProps {
  children: ReactNode;
  isAnimating?: boolean;
}

// Create a type for components that can accept isAnimating prop
interface WithAnimationProps {
  isAnimating?: boolean;
  [key: string]: any;
}

// Optimized 3D container component to reduce boilerplate
export const ThreeDContainer: React.FC<ThreeDContainerProps> = ({
  children,
  className = "w-full h-40 rounded-lg overflow-hidden",
  enableHoverAnimation = true
}) => {
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    setWebglAvailable(isWebGLAvailable());
    
    if (canvasRef.current) {
      handleContextLoss(canvasRef.current);
    }
  }, []);
  
  if (!webglAvailable) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 rounded-lg">
        <p className="text-gray-500">3D visualization not available</p>
      </div>
    );
  }
  
  // Create a wrapper component that passes isAnimating to children properly
  const SceneWithAnimationProp = () => {
    // Clone children and pass the isAnimating prop
    return (
      <>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            // Pass isAnimating prop only to components that accept it
            return React.cloneElement(child, { 
              ...child.props,
              isAnimating 
            });
          }
          return child;
        })}
      </>
    );
  };
  
  const container = (
    <Canvas ref={canvasRef}>
      <SceneWithAnimationProp />
      <OrbitControls
        /* Remove unsupported props, keep only supported ones */
        autoRotate={isAnimating}
        autoRotateSpeed={1}
      />
    </Canvas>
  );
  
  if (enableHoverAnimation) {
    return (
      <motion.div
        className={className}
        whileHover={{ scale: 1.05 }}
        onHoverStart={() => setIsAnimating(true)}
        onHoverEnd={() => setIsAnimating(false)}
      >
        {container}
      </motion.div>
    );
  }
  
  return <div className={className}>{container}</div>;
};

// Optimized rotating 3D object
export const RotatingObject: React.FC<RotatingObjectProps> = ({ 
  children, 
  isAnimating = false 
}) => {
  const ref = useRef<Group>(null!);
  
  useFrame(() => {
    if (isAnimating && ref.current) {
      ref.current.rotation.y += 0.01;
    }
  });
  
  return <group ref={ref}>{children}</group>;
};
