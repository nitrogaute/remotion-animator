import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export interface KnowledgeGraphProps {
  nodeCount?: number;
  connectionDistance?: number;
  nodeSize?: number;
  accentColor?: string;
  secondaryColor?: string;
}

interface NodeData {
  id: number;
  baseX: number;
  baseY: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
  secondaryRadius: number;
  secondarySpeed: number;
  secondaryPhase: number;
  size: number;
  color: string;
}

// Attempt connection: get position at a specific frame
const getNodePosition = (node: NodeData, frame: number, duration: number) => {
  // Use normalized time for perfect looping (0 to 1 over duration)
  const t = (frame / duration) * Math.PI * 2;

  // Primary orbital motion
  const primaryX = Math.cos(t * node.orbitSpeed + node.orbitPhase) * node.orbitRadius;
  const primaryY = Math.sin(t * node.orbitSpeed + node.orbitPhase) * node.orbitRadius;

  // Secondary wobble motion (faster, smaller)
  const secondaryX = Math.cos(t * node.secondarySpeed + node.secondaryPhase) * node.secondaryRadius;
  const secondaryY = Math.sin(t * node.secondarySpeed * 1.3 + node.secondaryPhase) * node.secondaryRadius;

  return {
    x: node.baseX + primaryX + secondaryX,
    y: node.baseY + primaryY + secondaryY,
  };
};

const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

// Seeded random for consistent node generation
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const GraphNode: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  pulse: number;
}> = ({ x, y, size, color, pulse }) => {
  const glowSize = size * 2 * pulse;

  return (
    <g>
      {/* Outer glow */}
      <circle
        cx={x}
        cy={y}
        r={glowSize}
        fill={`${color}15`}
      />
      {/* Middle glow */}
      <circle
        cx={x}
        cy={y}
        r={size * 1.5 * pulse}
        fill={`${color}30`}
      />
      {/* Core */}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={color}
        style={{
          filter: `drop-shadow(0 0 ${size}px ${color})`,
        }}
      />
      {/* Inner bright spot */}
      <circle
        cx={x - size * 0.25}
        cy={y - size * 0.25}
        r={size * 0.35}
        fill="white"
        opacity={0.6}
      />
    </g>
  );
};

const GraphConnection: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
  color: string;
}> = ({ x1, y1, x2, y2, opacity, color }) => {
  if (opacity <= 0) return null;

  // Calculate midpoint for slight curve
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Add slight perpendicular offset for curve
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const curveOffset = len * 0.05;
  const curveMidX = midX + (-dy / len) * curveOffset;
  const curveMidY = midY + (dx / len) * curveOffset;

  return (
    <g opacity={opacity}>
      {/* Glow line */}
      <path
        d={`M ${x1} ${y1} Q ${curveMidX} ${curveMidY} ${x2} ${y2}`}
        stroke={color}
        strokeWidth={4}
        fill="none"
        opacity={0.3}
        style={{
          filter: `blur(3px)`,
        }}
      />
      {/* Main line */}
      <path
        d={`M ${x1} ${y1} Q ${curveMidX} ${curveMidY} ${x2} ${y2}`}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      {/* Energy pulse effect - small moving dot */}
      <circle
        r={2}
        fill="white"
        opacity={0.8}
      >
        <animateMotion
          dur="0.5s"
          repeatCount="indefinite"
          path={`M ${x1 - curveMidX} ${y1 - curveMidY} Q 0 0 ${x2 - curveMidX} ${y2 - curveMidY}`}
        />
      </circle>
    </g>
  );
};

const GridBackground: React.FC<{
  width: number;
  height: number;
  color: string;
}> = ({ width, height, color }) => {
  const gridSize = 60;
  const lines = [];

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke={color}
        strokeWidth={0.5}
        opacity={0.15}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke={color}
        strokeWidth={0.5}
        opacity={0.15}
      />
    );
  }

  return <g>{lines}</g>;
};

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  nodeCount = 12,
  connectionDistance = 300,
  nodeSize = 8,
  accentColor = '#00BFFF',
  secondaryColor = '#FF6B6B',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Generate nodes with consistent properties
  const nodes: NodeData[] = React.useMemo(() => {
    const result: NodeData[] = [];
    const colors = [accentColor, secondaryColor, '#0047AB', '#6495ED', '#00308F'];

    for (let i = 0; i < nodeCount; i++) {
      const seed = i * 1000;

      // Distribute base positions across the canvas with padding
      const padding = 200;
      const baseX = padding + seededRandom(seed + 1) * (width - padding * 2);
      const baseY = padding + seededRandom(seed + 2) * (height - padding * 2);

      result.push({
        id: i,
        baseX,
        baseY,
        // Orbit parameters - varying speeds ensure interesting patterns
        orbitRadius: 30 + seededRandom(seed + 3) * 100,
        orbitSpeed: 0.5 + seededRandom(seed + 4) * 1.5, // 0.5 to 2 cycles per loop
        orbitPhase: seededRandom(seed + 5) * Math.PI * 2,
        // Secondary motion
        secondaryRadius: 10 + seededRandom(seed + 6) * 30,
        secondarySpeed: 2 + seededRandom(seed + 7) * 3, // Faster wobble
        secondaryPhase: seededRandom(seed + 8) * Math.PI * 2,
        // Appearance
        size: nodeSize * (0.6 + seededRandom(seed + 9) * 0.8),
        color: colors[Math.floor(seededRandom(seed + 10) * colors.length)],
      });
    }

    return result;
  }, [nodeCount, width, height, nodeSize, accentColor, secondaryColor]);

  // Calculate current positions
  const positions = nodes.map(node => getNodePosition(node, frame, durationInFrames));

  // Calculate connections based on distance
  const connections: Array<{
    from: number;
    to: number;
    opacity: number;
  }> = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = getDistance(
        positions[i].x,
        positions[i].y,
        positions[j].x,
        positions[j].y
      );

      if (dist < connectionDistance) {
        // Smooth opacity falloff based on distance
        const normalizedDist = dist / connectionDistance;
        const opacity = Math.pow(1 - normalizedDist, 2); // Quadratic falloff

        connections.push({
          from: i,
          to: j,
          opacity: opacity * 0.8, // Max 80% opacity
        });
      }
    }
  }

  // Global pulse effect
  const globalPulse = 0.95 + 0.05 * Math.sin(frame * 0.15);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a12',
      }}
    >
      {/* Radial gradient background */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse at center, #0d1520 0%, #0a0a12 70%)`,
        }}
      />

      <svg
        width={width}
        height={height}
        style={{
          position: 'absolute',
        }}
      >
        {/* Grid background */}
        <GridBackground width={width} height={height} color={accentColor} />

        {/* Draw connections first (behind nodes) */}
        <g>
          {connections.map(({ from, to, opacity }, idx) => {
            const avgColor = nodes[from].color; // Use first node's color
            return (
              <GraphConnection
                key={`conn-${from}-${to}`}
                x1={positions[from].x}
                y1={positions[from].y}
                x2={positions[to].x}
                y2={positions[to].y}
                opacity={opacity}
                color={avgColor}
              />
            );
          })}
        </g>

        {/* Draw nodes */}
        <g>
          {nodes.map((node, idx) => (
            <GraphNode
              key={node.id}
              x={positions[idx].x}
              y={positions[idx].y}
              size={node.size}
              color={node.color}
              pulse={globalPulse}
            />
          ))}
        </g>
      </svg>

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)`,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
