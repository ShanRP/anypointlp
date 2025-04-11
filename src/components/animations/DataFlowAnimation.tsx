import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

export const DataFlowAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Animation variables
    let frame: number;
    const dataPackets: Array<{
      x: number;
      y: number;
      radius: number;
      speed: number;
      color: string;
      progress: number;
      path: number;
      label: string;
    }> = [];

    // Define path points
    const pathPoints = [
      { x: canvas.width * 0.1, y: canvas.height * 0.5 },  // Start
      { x: canvas.width * 0.25, y: canvas.height * 0.3 }, // Point 1
      { x: canvas.width * 0.4, y: canvas.height * 0.7 },  // Point 2
      { x: canvas.width * 0.6, y: canvas.height * 0.4 },  // Point 3
      { x: canvas.width * 0.75, y: canvas.height * 0.6 }, // Point 4
      { x: canvas.width * 0.9, y: canvas.height * 0.5 },  // End
    ];

    // Define packet labels
    const packetLabels = ['API', 'Data', 'Flow', 'Transform', 'Sync'];

    // Calculate point on Bezier curve
    const calculateCurvePoint = (
      t: number,
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number }
    ) => {
      const cx = 3 * (p1.x - p0.x);
      const cy = 3 * (p1.y - p0.y);
      const bx = 3 * (p2.x - p1.x) - cx;
      const by = 3 * (p2.y - p1.y) - cy;
      const ax = p3.x - p0.x - cx - bx;
      const ay = p3.y - p0.y - cy - by;
      
      const cube = t * t * t;
      const square = t * t;
      
      const resX = ax * cube + bx * square + cx * t + p0.x;
      const resY = ay * cube + by * square + cy * t + p0.y;
      
      return { x: resX, y: resY };
    };

    // Draw the path
    const drawPath = () => {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.2)';
      ctx.lineWidth = 3;
      
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      
      for (let i = 0; i < pathPoints.length - 3; i += 3) {
        ctx.bezierCurveTo(
          pathPoints[i + 1].x, pathPoints[i + 1].y,
          pathPoints[i + 2].x, pathPoints[i + 2].y,
          pathPoints[i + 3].x, pathPoints[i + 3].y
        );
      }
      
      ctx.stroke();
    };

    // Create data packet
    const createDataPacket = () => {
      const colors = [
        'rgba(139, 92, 246, 0.8)', // Purple
        'rgba(14, 165, 233, 0.8)',  // Blue
        'rgba(16, 185, 129, 0.8)',  // Green
        'rgba(245, 158, 11, 0.8)',  // Orange
      ];
      
      const labelIndex = dataPackets.length % packetLabels.length;
      
      dataPackets.push({
        x: pathPoints[0].x,
        y: pathPoints[0].y,
        radius: 4 + Math.random() * 3,
        speed: 0.001 + Math.random() * 0.001,
        color: colors[Math.floor(Math.random() * colors.length)],
        progress: 0,
        path: 0,
        label: packetLabels[labelIndex]
      });
    };

    // Initialize with some packets
    for (let i = 0; i < 5; i++) {
      createDataPacket();
      dataPackets[i].progress = Math.random(); // Distribute initial positions
    }

    let lastPacketTime = 0;

    // Animation loop
    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the path
      drawPath();

      // Create new packet every 1 second
      if (timestamp - lastPacketTime > 1000) {
        createDataPacket();
        lastPacketTime = timestamp;
      }
      
      // Draw connection nodes
      pathPoints.forEach((point, index) => {
        if (index % 3 === 0) { // Only draw nodes at the main points
          ctx.beginPath();
          ctx.fillStyle = '#9333ea';
          ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(147, 51, 234, 0.3)';
          ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      
      // Update and draw packets
      dataPackets.forEach((packet, index) => {
        // Update progress
        packet.progress += packet.speed;
        
        // If completed one segment, move to next or reset
        if (packet.progress >= 1) {
          packet.path += 3;
          
          if (packet.path >= pathPoints.length - 3) {
            // Remove packet when it reaches the end
            dataPackets.splice(index, 1);
            return;
          }
          
          packet.progress = 0;
        }
        
        // Calculate current position on the curve
        const p0 = pathPoints[packet.path];
        const p1 = pathPoints[packet.path + 1];
        const p2 = pathPoints[packet.path + 2];
        const p3 = pathPoints[packet.path + 3];
        
        const pos = calculateCurvePoint(packet.progress, p0, p1, p2, p3);
        packet.x = pos.x;
        packet.y = pos.y;
        
        // Draw packet
        ctx.beginPath();
        ctx.fillStyle = packet.color;
        ctx.arc(packet.x, packet.y, packet.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw glow effect
        const gradient = ctx.createRadialGradient(
          packet.x, packet.y, 0,
          packet.x, packet.y, packet.radius * 3
        );
        gradient.addColorStop(0, packet.color);
        gradient.addColorStop(1, 'rgba(147, 51, 234, 0)');
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(packet.x, packet.y, packet.radius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw label with background for better visibility
        ctx.font = 'bold 10px Arial';
        const labelWidth = ctx.measureText(packet.label).width + 6;
        const labelHeight = 16;
        const labelX = packet.x - labelWidth / 2;
        const labelY = packet.y - packet.radius - labelHeight - 2;
        
        // Draw label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
        
        // Draw label text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(packet.label, packet.x, labelY + labelHeight/2);
      });
      
      frame = requestAnimationFrame(animate);
    };
    
    // Resize handler
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Recalculate path points based on new dimensions
      pathPoints[0] = { x: canvas.width * 0.1, y: canvas.height * 0.5 };
      pathPoints[1] = { x: canvas.width * 0.25, y: canvas.height * 0.3 };
      pathPoints[2] = { x: canvas.width * 0.4, y: canvas.height * 0.7 };
      pathPoints[3] = { x: canvas.width * 0.6, y: canvas.height * 0.4 };
      pathPoints[4] = { x: canvas.width * 0.75, y: canvas.height * 0.6 };
      pathPoints[5] = { x: canvas.width * 0.9, y: canvas.height * 0.5 };
    };
    
    window.addEventListener('resize', handleResize);
    
    // Start animation
    frame = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-[140%] -ml-[0%] h-80">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl"
      />
      <motion.div
        className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute -top-10 -left-10 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
    </div>
  );
};

export default DataFlowAnimation;
