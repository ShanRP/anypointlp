
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Text, OrbitControls, Plane } from '@react-three/drei';
import { motion } from 'framer-motion';
import { isWebGLAvailable, handleContextLoss } from '@/utils/webGLUtil';
import { Group, Mesh, Vector3 } from 'three';
import * as THREE from 'three';

// Data Block Component
const DataBlock = ({ position, color, scale, rotationSpeed = 0.01, isAnimating = false }) => {
  const ref = useRef<Mesh>(null!);
  
  useFrame(() => {
    if (isAnimating && ref.current) {
      ref.current.rotation.y += rotationSpeed;
    }
  });
  
  return (
    <Box 
      ref={ref} 
      position={position} 
      scale={scale}
    >
      <meshStandardMaterial color={color} />
    </Box>
  );
};

// Dataweave Symbol Component
const DataWeaveSymbol = ({ position, isAnimating = false }) => {
  const ref = useRef<Group>(null!);
  
  useFrame(() => {
    if (isAnimating && ref.current) {
      ref.current.rotation.y += 0.02;
    }
  });
  
  return (
    <group ref={ref} position={position}>
      <Text
        position={[0, 0, 0]}
        fontSize={0.6}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        %dw
      </Text>
    </group>
  );
};

// Custom Mulesoft Logo that follows camera
const MulesoftLogo = ({ isAnimating }) => {
  const { camera } = useThree();
  const logoRef = useRef<Group>(null!);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  
  useEffect(() => {
    // Load texture dynamically
    new THREE.TextureLoader().load(
      '/images/mulesoft-logo.png',
      (loadedTexture) => {
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
      }
    );
  }, []);
  
  useFrame(() => {
    if (logoRef.current) {
      // Position the logo at the bottom right of the scene
      const distance = 2;
      const vector = new Vector3();
      
      // Get the direction the camera is looking
      vector.set(1, -1, 0);
      vector.unproject(camera);
      vector.sub(camera.position).normalize();
      
      // Position the logo relative to the camera
      logoRef.current.position.copy(camera.position);
      logoRef.current.position.add(vector.multiplyScalar(distance));
      
      // Make the logo always face the camera
      logoRef.current.lookAt(camera.position);
      
      // Optional: add some animation when hovering
      if (isAnimating) {
        logoRef.current.rotation.z += 0.01;
      }
    }
  });
  
  if (!texture) {
    return null;
  }
  
  return (
    <group ref={logoRef}>
      <Plane args={[0.5, 0.5]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          map={texture} 
          transparent={true} 
          opacity={0.8}
        />
      </Plane>
    </group>
  );
};

// DataWeave Transform Scene
const DataWeaveTransformScene = ({ isAnimating = false }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* Input Data */}
      <DataBlock 
        position={[-2.5, 0, 0]} 
        color="#4f46e5" 
        scale={[1.5, 1, 0.2]} 
        isAnimating={isAnimating} 
      />
      
      {/* DataWeave Transform */}
      <DataWeaveSymbol position={[0, 0, 0]} isAnimating={isAnimating} />
      
      {/* Output Data */}
      <DataBlock 
        position={[2.5, 0, 0]} 
        color="#10b981" 
        scale={[1.5, 1, 0.2]} 
        rotationSpeed={0.015}
        isAnimating={isAnimating} 
      />
      
      {/* Flying Data Particles */}
      {isAnimating && (
        <>
          <DataBlock position={[-1.5, 0.5, 0.2]} color="#818cf8" scale={[0.1, 0.1, 0.1]} rotationSpeed={0.04} isAnimating />
          <DataBlock position={[-1.2, -0.3, 0.3]} color="#818cf8" scale={[0.1, 0.1, 0.1]} rotationSpeed={0.03} isAnimating />
          <DataBlock position={[-0.8, 0.2, -0.1]} color="#818cf8" scale={[0.1, 0.1, 0.1]} rotationSpeed={0.05} isAnimating />
          <DataBlock position={[0.8, 0.4, 0.2]} color="#34d399" scale={[0.1, 0.1, 0.1]} rotationSpeed={0.03} isAnimating />
          <DataBlock position={[1.2, -0.2, -0.1]} color="#34d399" scale={[0.1, 0.1, 0.1]} rotationSpeed={0.04} isAnimating />
          <DataBlock position={[1.5, 0.1, 0.3]} color="#34d399" scale={[0.1, 0.1, 0.1]} rotationSpeed={0.05} isAnimating />
        </>
      )}
      
      {/* Logo is conditionally rendered only when texture is loaded */}
      <MulesoftLogo isAnimating={isAnimating} />
    </>
  );
};

// Main Component
const DataWeaveTransform3D = () => {
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Check WebGL availability
    setWebglAvailable(isWebGLAvailable());
    
    // Setup context loss handler
    if (canvasRef.current) {
      handleContextLoss(canvasRef.current);
    }
    
    // Start with animation enabled briefly to show movement
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!webglAvailable) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 rounded-lg">
        <p className="text-gray-500">3D visualization not available</p>
      </div>
    );
  }
  
  return (
    <motion.div
      className="w-full h-40 rounded-lg overflow-hidden"
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsAnimating(true)}
      onHoverEnd={() => setIsAnimating(false)}
    >
      <Canvas ref={canvasRef}>
        <DataWeaveTransformScene isAnimating={isAnimating} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.5}
          autoRotate={isAnimating}
          autoRotateSpeed={1}
          makeDefault
          enableDamping
        />
      </Canvas>
    </motion.div>
  );
};

export default DataWeaveTransform3D;
