
import React from 'react';
import { Box, Text } from '@react-three/drei';
import { ThreeDContainer, RotatingObject } from '@/utils/3dUtils';

// API Spec Scene - optimized for performance
const ApiSpecScene = ({ isAnimating = false }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} />
      
      {/* Experience API Layer */}
      <RotatingObject isAnimating={isAnimating}>
        <Box args={[2.5, 0.2, 0.4]} position={[0, 1, 0]}>
          <meshStandardMaterial color="#f59e0b" />
        </Box>
        <Text position={[0, 1.3, 0]} fontSize={0.15} color="#ffffff">
          Experience API
        </Text>
      </RotatingObject>
      
      {/* Process API Layer */}
      <RotatingObject isAnimating={isAnimating}>
        <Box args={[2.5, 0.2, 0.4]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#10b981" />
        </Box>
        <Text position={[0, 0.3, 0]} fontSize={0.15} color="#ffffff">
          Process API
        </Text>
      </RotatingObject>
      
      {/* System API Layer */}
      <RotatingObject isAnimating={isAnimating}>
        <Box args={[2.5, 0.2, 0.4]} position={[0, -1, 0]}>
          <meshStandardMaterial color="#4f46e5" />
        </Box>
        <Text position={[0, -0.7, 0]} fontSize={0.15} color="#ffffff">
          System API
        </Text>
      </RotatingObject>
      
      {/* Simplified connectors */}
      <Box args={[0.05, 0.8, 0.05]} position={[-1, 0.5, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#d1d5db" />
      </Box>
      <Box args={[0.05, 0.8, 0.05]} position={[1, 0.5, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#d1d5db" />
      </Box>
      <Box args={[0.05, 0.8, 0.05]} position={[-1, -0.5, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#d1d5db" />
      </Box>
      <Box args={[0.05, 0.8, 0.05]} position={[1, -0.5, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#d1d5db" />
      </Box>
    </>
  );
};

// Main Component
const ApiSpec3D = () => {
  return (
    <ThreeDContainer>
      <ApiSpecScene />
    </ThreeDContainer>
  );
};

export default ApiSpec3D;
