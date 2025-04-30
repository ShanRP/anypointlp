"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, OrbitControls, Float, Html } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { isWebGLAvailable, handleContextLoss } from "@/utils/webGLUtil";
import ErrorBoundary from "../ErrorBoundary";
import type { Mesh } from "three";
import AnimatedNumber from "../ui/AnimatedNumber";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Zap,
  Code,
  Workflow,
  CheckCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import * as THREE from "three";

// Interactive Node component
const InteractiveNode = ({ position, color, label, onClick, isActive }) => {
  const meshRef = useRef<Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.2) * 0.1;

      // Pulse effect when active
      if (isActive) {
        meshRef.current.scale.x =
          1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        meshRef.current.scale.y =
          1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        meshRef.current.scale.z =
          1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "default")}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.8 : 0.3}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      <Html position={[0, 0.8, 0]} center distanceFactor={10}>
        <div
          className={`px-2 py-1 rounded-md text-xs font-medium ${isActive ? "bg-white text-black" : "bg-black/50 text-white"} transition-all duration-300`}
        >
          {label}
        </div>
      </Html>
    </group>
  );
};

// Connection line between nodes
const ConnectionLine = ({
  start,
  end,
  color,
  thickness = 0.03,
  animated = false,
}) => {
  const lineRef = useRef<Mesh>(null!);

  useEffect(() => {
    if (lineRef.current) {
      // Calculate direction vector
      const direction = end.clone().sub(start);
      // Position at midpoint
      lineRef.current.position.copy(
        start.clone().add(direction.clone().multiplyScalar(0.5)),
      );
      // Orient towards end point
      lineRef.current.lookAt(end);
      // Scale to match distance
      lineRef.current.scale.set(thickness, thickness, direction.length());
    }
  }, [start, end, thickness]);

  useFrame((state) => {
    if (animated && lineRef.current && lineRef.current.material) {
      // Type assertion to access material properties safely
      const material = lineRef.current.material as THREE.MeshStandardMaterial;
      
      // Pulse effect for animated lines
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5;
      material.opacity = 0.5 + pulse * 0.5;
      material.emissiveIntensity = 0.3 + pulse * 0.7;
    }
  });

  return (
    <mesh ref={lineRef}>
      <cylinderGeometry args={[1, 1, 1, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
};

// API Network visualization
const APINetwork = ({ activeNode, setActiveNode }) => {
  // Define node positions
  const nodes = [
    { id: "central", position: [0, 0, 0], color: "#10b981", label: "API Hub" },
    {
      id: "database",
      position: [-3, 1, -1],
      color: "#4f46e5",
      label: "Database",
    },
    {
      id: "auth",
      position: [3, 0.5, -2],
      color: "#f59e0b",
      label: "Auth Service",
    },
    {
      id: "analytics",
      position: [0, -2, -1],
      color: "#ec4899",
      label: "Analytics",
    },
    {
      id: "integration",
      position: [2, 2, 1],
      color: "#06b6d4",
      label: "Integration",
    },
  ];

  // Define connections between nodes
  const connections = [
    {
      from: "central",
      to: "database",
      color: "#4f46e5",
      animated: activeNode === "database",
    },
    {
      from: "central",
      to: "auth",
      color: "#f59e0b",
      animated: activeNode === "auth",
    },
    {
      from: "central",
      to: "analytics",
      color: "#ec4899",
      animated: activeNode === "analytics",
    },
    {
      from: "central",
      to: "integration",
      color: "#06b6d4",
      animated: activeNode === "integration",
    },
  ];

  // Get node by id
  const getNodeById = (id) => nodes.find((node) => node.id === id);

  // Handle node click
  const handleNodeClick = (id) => {
    setActiveNode(id);
  };

  return (
    <group>
      {/* Render nodes */}
      {nodes.map((node) => (
        <InteractiveNode
          key={node.id}
          position={node.position}
          color={node.color}
          label={node.label}
          onClick={() => handleNodeClick(node.id)}
          isActive={activeNode === node.id}
        />
      ))}

      {/* Render connections */}
      {connections.map((connection, index) => {
        const fromNode = getNodeById(connection.from);
        const toNode = getNodeById(connection.to);
        if (fromNode && toNode) {
          return (
            <ConnectionLine
              key={index}
              start={new THREE.Vector3(...fromNode.position)}
              end={new THREE.Vector3(...toNode.position)}
              color={connection.color}
              animated={connection.animated}
            />
          );
        }
        return null;
      })}
    </group>
  );
};

// Information panel that displays based on active node
const InfoPanel = ({ activeNode }) => {
  const { width } = useThree((state) => state.viewport);
  const isMobile = width < 4;

  const nodeInfo = {
    central: {
      title: "API Hub",
      description: "Central management for all your APIs",
      icon: <Workflow className="w-4 h-4" />,
    },
    database: {
      title: "Database Connectors",
      description: "Connect to any database seamlessly",
      icon: <Code className="w-4 h-4" />,
    },
    auth: {
      title: "Auth Service",
      description: "Secure authentication & authorization",
      icon: <Zap className="w-4 h-4" />,
    },
    analytics: {
      title: "Analytics Engine",
      description: "Real-time insights and monitoring",
      icon: <ArrowRight className="w-4 h-4" />,
    },
    integration: {
      title: "Integration Platform",
      description: "Connect with third-party services",
      icon: <Code className="w-4 h-4" />,
    },
  };

  if (!activeNode || !nodeInfo[activeNode]) return null;

  const info = nodeInfo[activeNode];

  return (
    <Html position={isMobile ? [0, -3, 0] : [4, 0, 0]} center={isMobile}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/80 backdrop-blur-md p-4 rounded-lg border border-white/10 text-white w-64"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500">
            {info.icon}
          </div>
          <h3 className="font-bold">{info.title}</h3>
        </div>
        <p className="text-sm text-gray-300">{info.description}</p>
        <div className="mt-3 flex justify-end">
          <button className="text-xs flex items-center gap-1 text-indigo-300 hover:text-indigo-200 transition-colors">
            Learn more <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </Html>
  );
};

// Main 3D scene component
const HeroScene = () => {
  const [activeNode, setActiveNode] = useState("central");

  return (
    <>
      {/* Environment lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} color="#ffa726" />
      <pointLight position={[-5, 2, -3]} intensity={0.5} color="#ff9e80" />

      {/* Atmospheric effects */}
      <fog attach="fog" args={["#000", 5, 20]} />
      <Stars
        radius={100}
        depth={50}
        count={2000}
        factor={4}
        fade
        saturation={0.5}
      />

      {/* Sun glow effect */}
      <mesh position={[8, 3, -10]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial color="#ff9800" transparent opacity={0.15} />
      </mesh>

      {/* Lens flare effect */}
      <mesh position={[7, 3, -9]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial
          color="#ff9800"
          transparent
          opacity={0.05}
          blending={2}
          side={2}
        />
      </mesh>

      {/* Main 3D content */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <APINetwork activeNode={activeNode} setActiveNode={setActiveNode} />
      </Float>

      {/* Information panel */}
      <InfoPanel activeNode={activeNode} />

      {/* Controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
};

// Loading component
const LoadingIndicator = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-t-indigo-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
  </div>
);

// Feature item component
const FeatureItem = ({ icon, title, description }) => (
  <motion.div
    className="flex items-start gap-3"
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    viewport={{ once: true }}
  >
    <div className="mt-1 p-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex-shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  </motion.div>
);

// Badge component
const Badge = ({ children }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
    {children}
  </span>
);

export const Hero = () => {
  const [webglAvailable, setWebglAvailable] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState("developers");

  useEffect(() => {
    setWebglAvailable(isWebGLAvailable());

    if (canvasRef.current) {
      handleContextLoss(canvasRef.current);
    }
  }, []);

  const tabs = [
    { id: "developers", label: "For Developers" },
    { id: "architects", label: "For Architects" },
    { id: "managers", label: "For Managers" },
  ];

  const tabContent = {
    developers: {
      title: "Accelerate Your Development",
      description:
        "Write less code, build more integrations. Our AI-powered platform helps you focus on solving business problems, not wrestling with DataWeave syntax.",
      features: [
        {
          icon: <Code className="w-4 h-4 text-white" />,
          title: "AI-Generated DataWeave Transformations",
          description:
            "Convert between JSON, XML, CSV and more with simple natural language prompts.",
        },
        {
          icon: <Zap className="w-4 h-4 text-white" />,
          title: "Automated Error Resolution",
          description:
            "Identify and fix integration errors with AI-powered suggestions.",
        },
        {
          icon: <Sparkles className="w-4 h-4 text-white" />,
          title: "Code Completion & Refactoring",
          description:
            "Write better code faster with context-aware suggestions.",
        },
      ],
    },
    architects: {
      title: "Design Better Integrations",
      description:
        "Create robust, scalable integration architectures that connect your enterprise systems seamlessly.",
      features: [
        {
          icon: <Workflow className="w-4 h-4 text-white" />,
          title: "Visual API Design",
          description:
            "Design APIs visually and generate RAML/OAS specifications automatically.",
        },
        {
          icon: <CheckCircle className="w-4 h-4 text-white" />,
          title: "Best Practice Validation",
          description:
            "Ensure your integrations follow MuleSoft best practices and patterns.",
        },
        {
          icon: <ArrowRight className="w-4 h-4 text-white" />,
          title: "Integration Templates",
          description:
            "Start with pre-built templates for common integration scenarios.",
        },
      ],
    },
    managers: {
      title: "Deliver Projects Faster",
      description:
        "Meet deadlines and reduce costs with tools that accelerate development and improve quality.",
      features: [
        {
          icon: <ChevronRight className="w-4 h-4 text-white" />,
          title: "Project Acceleration",
          description:
            "Reduce development time by up to 70% with AI-assisted integration.",
        },
        {
          icon: <Zap className="w-4 h-4 text-white" />,
          title: "Quality Improvement",
          description:
            "Reduce defects by 85% with automated testing and validation.",
        },
        {
          icon: <Sparkles className="w-4 h-4 text-white" />,
          title: "Cost Reduction",
          description:
            "Lower total cost of ownership for your integration projects.",
        },
      ],
    },
  };

  return (
    <section className="min-h-screen relative bg-black overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-transparent z-0"></div>
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-radial from-amber-500/20 via-amber-700/5 to-transparent opacity-70 blur-3xl z-0"></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMmgxdjFoLTF2LTF6bS0yLTJoMXYxaC0xdi0xem0yLTJoMXYxaC0xdi0xem0tMiAyaDF2MWgtMXYtMXptLTItMmgxdjFoLTF2LTF6bTggMGgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxem0tMiAwaDFWMWgtMXYxeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 z-0"></div>

      {/* Hero content */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Top section with badge and headline */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <Badge>
              <Sparkles className="w-3 h-3 mr-1" />
              New AI-Powered Features
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 max-w-5xl mx-auto leading-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Transform Your MuleSoft Development with
            </span>{" "}
            <span className="relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
                AI-Powered Intelligence
              </span>
              <span className="absolute -inset-1 bg-purple-400/10 blur-xl rounded-lg -z-10"></span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto mb-8"
          >
            Harness the power of AI to streamline your integration workflows,
            automate DataWeave transformations, and accelerate API development
            by up to 10x.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            <Link to="/auth?signup=true">
              <Button
                size="lg"
                className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-purple-500/20"
              >
                Start Building for Free
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-semibold bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Explore Features
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Main content grid */}
        <div className="">
          {/* Left column - 3D visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="h-[500px] w-full rounded-xl overflow-hidden relative">
              {/* Glow effect around the canvas */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-indigo-500/20 to-amber-500/30 blur-md rounded-xl"></div>

              <ErrorBoundary
                fallback={
                  <div className="h-[500px] w-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                    <div className="text-white text-center font-montserrat">
                      <p className="text-lg font-semibold">
                        Interactive 3D Experience
                      </p>
                      <p className="text-sm opacity-70">
                        Visualize your integrations
                      </p>
                    </div>
                  </div>
                }
              >
                {webglAvailable ? (
                  <div className="relative h-full w-full rounded-xl overflow-hidden">
                    <Canvas
                      ref={canvasRef}
                      dpr={[1, 2]}
                      camera={{ position: [0, 0, 8], fov: 50 }}
                    >
                      <Suspense
                        fallback={
                          <Html center>
                            <LoadingIndicator />
                          </Html>
                        }
                      >
                        <HeroScene />
                      </Suspense>
                    </Canvas>

                    {/* Interactive instructions overlay */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs p-2 rounded-md flex items-center justify-center">
                      <span className="mr-2">Click on nodes to explore</span>
                      <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-ping mr-1"></span>
                      <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-ping mr-1 animation-delay-300"></span>
                      <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-ping animation-delay-700"></span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[500px] w-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                    <div className="text-white text-center font-montserrat">
                      <p className="text-lg font-semibold">
                        Interactive Experience
                      </p>
                      <p className="text-sm opacity-70">
                        Visualize your integrations
                      </p>
                    </div>
                  </div>
                )}
              </ErrorBoundary>
            </div>
          </motion.div>

          {/* Right column - Content tabs */}
          {/* <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2"
          > */}
          {/* Tabs */}
          {/* <div className="flex space-x-1 rounded-lg bg-white/5 p-1 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div> */}

          {/* Tab content */}
          {/* <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-3">{tabContent[activeTab].title}</h2>
              <p className="text-gray-300 mb-6">{tabContent[activeTab].description}</p>

              <div className="space-y-6">
                {tabContent[activeTab].features.map((feature, index) => (
                  <FeatureItem
                    key={index}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                ))}
              </div>
            </motion.div> */}

          {/* Stats cards */}
          {/* <div className="grid grid-cols-2 gap-6 mt-8">
              <motion.div
                className="stats-card text-center p-6 bg-gradient-to-br from-purple-900/40 to-purple-700/10 backdrop-blur-sm rounded-lg border border-purple-500/20 relative overflow-hidden group"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5)" }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
                <AnimatedNumber value={10} suffix="x" className="text-5xl font-bold text-white mb-2 relative z-10" />
                <p className="text-purple-200 text-sm relative z-10">Faster development cycles with AI assistance</p>
                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-purple-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </motion.div>

              <motion.div
                className="stats-card text-center p-6 bg-gradient-to-br from-indigo-900/40 to-indigo-700/10 backdrop-blur-sm rounded-lg border border-indigo-500/20 relative overflow-hidden group"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.5)" }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-600"></div>
                <AnimatedNumber value={85} suffix="%" className="text-5xl font-bold text-white mb-2 relative z-10" />
                <p className="text-indigo-200 text-sm relative z-10">Reduced errors in integration projects</p>
                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-indigo-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </motion.div>
            </div> */}

          {/* Testimonial */}
          {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 relative"
            >
              <div className="absolute -top-3 -left-3 text-4xl text-purple-500 opacity-50">"</div>
              <p className="text-gray-300 italic mb-4">
                This platform has completely transformed how our team builds integrations. What used to take days now
                takes hours, and the quality of our solutions has improved dramatically.
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold mr-3">
                  JD
                </div>
                <div>
                  <p className="text-white font-medium">Jane Doe</p>
                  <p className="text-gray-400 text-sm">Lead Integration Developer, Enterprise Co.</p>
                </div>
              </div>
            </motion.div> */}
          {/* </motion.div> */}
        </div>

        {/* Bottom CTA section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to transform your MuleSoft development?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are building better integrations
            faster with our AI-powered platform.
          </p>
          <Link to="/auth?signup=true">
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-purple-500/20"
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Add subtle particle effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-1 h-1 rounded-full bg-white animate-pulse opacity-70"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-white animate-pulse opacity-50 animation-delay-300"></div>
        <div className="absolute top-1/2 right-1/5 w-1 h-1 rounded-full bg-white animate-pulse opacity-60 animation-delay-700"></div>
      </div>
    </section>
  );
};

export default Hero;
