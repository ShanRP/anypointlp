
import React, { useRef } from 'react';
import { Sphere, Line, Text } from '@react-three/drei';
import { ThreeDContainer, RotatingObject } from '@/utils/3dUtils';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

// Simplified Integration Flow Scene - optimized for performance
const IntegrationFlowScene = ({ isAnimating = false }) => {
  const sourceRef = useRef<Group>(null!);
  const processorRef = useRef<Group>(null!);
  const targetRef = useRef<Group>(null!);
  
  // Define positions as fixed-length tuples to satisfy TypeScript
  const source: [number, number, number] = [-1.5, 0, 0];
  const processor: [number, number, number] = [0, 0, 0];
  const target: [number, number, number] = [1.5, 0, 0];
  
  useFrame(() => {
    if (isAnimating) {
      if (sourceRef.current) sourceRef.current.rotation.y += 0.01;
      if (processorRef.current) processorRef.current.rotation.y += 0.01;
      if (targetRef.current) targetRef.current.rotation.y += 0.01;
    }
  });
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} />
      
      {/* Source System */}
      <group ref={sourceRef} position={source}>
        <Sphere args={[0.25, 12, 12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#4f46e5" />
        </Sphere>
        <Text position={[0, 0.5, 0]} fontSize={0.15} color="#ffffff">
          Source
        </Text>
      </group>
      
      {/* Processor/MuleSoft */}
      <group ref={processorRef} position={processor}>
        <Sphere args={[0.25, 12, 12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#10b981" />
        </Sphere>
        <Text position={[0, 0.5, 0]} fontSize={0.15} color="#ffffff">
          MuleSoft
        </Text>
      </group>
      
      {/* Target System */}
      <group ref={targetRef} position={target}>
        <Sphere args={[0.25, 12, 12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#f59e0b" />
        </Sphere>
        <Text position={[0, 0.5, 0]} fontSize={0.15} color="#ffffff">
          Target
        </Text>
      </group>
      
      {/* Connections - simplified */}
      <Line points={[source, processor]} color="#4f46e5" lineWidth={2} />
      <Line points={[processor, target]} color="#10b981" lineWidth={2} />
    </>
  );
};

// Main Component
const IntegrationFlow3D = () => {
  return (
    <ThreeDContainer>
      <IntegrationFlowScene />
    </ThreeDContainer>
  );
};

export default IntegrationFlow3D;
