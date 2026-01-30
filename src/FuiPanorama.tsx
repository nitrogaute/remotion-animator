import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';

export interface FuiPanoramaProps {
  panSpeed?: number; // Pan speed multiplier
}

// Constants
const SCENE_WIDTH = 4000;
const SCENE_HEIGHT = 1080;
const ACCENT_COLOR = '#E85A3C'; // Orange-red accent
const BG_COLOR = '#F5F0E8'; // Light beige/cream
const LINE_COLOR = '#2A2A2A'; // Dark gray

// Animated number with rolling effect
const RollingNumber: React.FC<{
  value: number;
  digits?: number;
  frame: number;
  speed?: number;
  fontSize?: number;
  color?: string;
  delay?: number;
}> = ({ value, digits = 3, frame, speed = 1, fontSize = 32, color = LINE_COLOR, delay = 0 }) => {
  const effectiveFrame = Math.max(0, frame - delay);
  const cycleSpeed = speed * 2;
  
  // Create rolling effect - rapid cycling that settles
  const settling = interpolate(effectiveFrame, [0, 30], [10, 0], { extrapolateRight: 'clamp' });
  const noise = Math.sin(effectiveFrame * cycleSpeed) * settling;
  const animatedValue = Math.floor(value + (effectiveFrame * speed * 0.3) + noise);
  const displayValue = animatedValue.toString().padStart(digits, '0').slice(-digits);
  
  return (
    <span style={{ 
      fontFamily: 'SF Mono, Monaco, Consolas, monospace',
      fontSize,
      fontWeight: 300,
      letterSpacing: '0.08em',
      color,
    }}>
      {displayValue}
    </span>
  );
};

// Coordinate display
const CoordinateDisplay: React.FC<{
  label: string;
  value: number;
  frame: number;
  fontSize?: number;
}> = ({ label, value, frame, fontSize = 14 }) => {
  const animatedValue = (value + frame * 0.0002).toFixed(4);
  
  return (
    <div style={{
      fontFamily: 'SF Mono, Monaco, Consolas, monospace',
      fontSize,
      opacity: 0.6,
      color: LINE_COLOR,
    }}>
      {label}: {animatedValue}
    </div>
  );
};

// Arc gauge with fill and tick marks
const ArcGauge: React.FC<{
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  progress: number;
  strokeWidth?: number;
  showTicks?: boolean;
  tickCount?: number;
  fillColor?: string;
  pulsePhase?: number;
}> = ({ 
  cx, cy, radius, startAngle, endAngle, progress, 
  strokeWidth = 3, showTicks = true, tickCount = 12, 
  fillColor = ACCENT_COLOR, pulsePhase = 0 
}) => {
  const polarToCartesian = (angle: number, r: number = radius) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const progressAngle = startAngle + (endAngle - startAngle) * progress;
  const progressEnd = polarToCartesian(progressAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const progressLargeArc = (endAngle - startAngle) * progress > 180 ? 1 : 0;

  const bgPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  const progressPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${progressLargeArc} 1 ${progressEnd.x} ${progressEnd.y}`;

  // Generate tick marks
  const ticks = [];
  if (showTicks) {
    for (let i = 0; i <= tickCount; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / tickCount);
      const isMajor = i % 3 === 0;
      const innerPoint = polarToCartesian(angle, radius - (isMajor ? 12 : 6));
      const outerPoint = polarToCartesian(angle, radius + 2);
      
      // Pulse effect for ticks in the active range
      const isActive = (i / tickCount) <= progress;
      const pulseOpacity = isActive ? 
        0.8 + 0.2 * Math.sin((pulsePhase + i * 0.5) * 0.1) : 
        (isMajor ? 0.4 : 0.2);
      
      ticks.push(
        <line
          key={i}
          x1={innerPoint.x}
          y1={innerPoint.y}
          x2={outerPoint.x}
          y2={outerPoint.y}
          stroke={isActive ? fillColor : LINE_COLOR}
          strokeWidth={isMajor ? 2 : 1}
          opacity={pulseOpacity}
        />
      );
    }
  }

  return (
    <g>
      <path d={bgPath} fill="none" stroke={LINE_COLOR} strokeWidth={strokeWidth} opacity={0.15} />
      <path d={progressPath} fill="none" stroke={fillColor} strokeWidth={strokeWidth} opacity={0.9} 
        strokeLinecap="round" />
      {ticks}
    </g>
  );
};

// Full circle gauge
const CircleGauge: React.FC<{
  cx: number;
  cy: number;
  radius: number;
  progress: number;
  strokeWidth?: number;
  fillColor?: string;
  showInner?: boolean;
}> = ({ cx, cy, radius, progress, strokeWidth = 2, fillColor = ACCENT_COLOR, showInner = true }) => {
  const circumference = 2 * Math.PI * radius;
  
  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={LINE_COLOR} strokeWidth={1} opacity={0.15} />
      <circle 
        cx={cx} cy={cy} r={radius} 
        fill="none" 
        stroke={fillColor} 
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference * progress} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        opacity={0.85}
      />
      {showInner && (
        <circle cx={cx} cy={cy} r={radius - 8} fill="none" stroke={LINE_COLOR} strokeWidth={1} opacity={0.1} />
      )}
    </g>
  );
};

// Connecting line with optional curve
const ConnectingLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  curved?: boolean;
  dashed?: boolean;
  accent?: boolean;
}> = ({ x1, y1, x2, y2, curved = false, dashed = false, accent = false }) => {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const curveOffset = 30;
  
  const path = curved 
    ? `M ${x1} ${y1} Q ${midX} ${midY - curveOffset} ${x2} ${y2}`
    : `M ${x1} ${y1} L ${x2} ${y2}`;
    
  return (
    <path 
      d={path} 
      fill="none" 
      stroke={accent ? ACCENT_COLOR : LINE_COLOR} 
      strokeWidth={accent ? 2 : 1}
      strokeDasharray={dashed ? "8 4" : undefined}
      opacity={accent ? 0.7 : 0.25}
    />
  );
};

// Data block with label and value
const DataBlock: React.FC<{
  label: string;
  value: number;
  subValue?: number;
  frame: number;
  speed?: number;
  x: number;
  y: number;
  accent?: boolean;
}> = ({ label, value, subValue, frame, speed = 1, x, y, accent = false }) => (
  <div style={{
    position: 'absolute',
    left: x,
    top: y,
    color: LINE_COLOR,
  }}>
    <div style={{
      fontFamily: 'SF Mono, Monaco, Consolas, monospace',
      fontSize: 11,
      letterSpacing: '0.15em',
      opacity: 0.5,
      marginBottom: 4,
    }}>
      {label}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <RollingNumber 
        value={value} 
        digits={3} 
        frame={frame} 
        speed={speed} 
        fontSize={36}
        color={accent ? ACCENT_COLOR : LINE_COLOR}
      />
      {subValue !== undefined && (
        <span style={{
          fontFamily: 'SF Mono, Monaco, Consolas, monospace',
          fontSize: 20,
          opacity: 0.6,
          color: LINE_COLOR,
        }}>
          .<RollingNumber value={subValue} digits={2} frame={frame} speed={speed * 1.5} fontSize={20} />
        </span>
      )}
    </div>
  </div>
);

// Small label with optional blinking
const TechLabel: React.FC<{
  text: string;
  x: number;
  y: number;
  opacity?: number;
  blink?: boolean;
  frame?: number;
}> = ({ text, x, y, opacity = 0.5, blink = false, frame = 0 }) => {
  const blinkOpacity = blink ? 0.3 + 0.5 * Math.abs(Math.sin(frame * 0.15)) : opacity;
  
  return (
    <text
      x={x}
      y={y}
      fill={LINE_COLOR}
      fontFamily="SF Mono, Monaco, Consolas, monospace"
      fontSize={10}
      letterSpacing="0.1em"
      opacity={blinkOpacity}
    >
      {text}
    </text>
  );
};

// Horizontal bar indicator
const BarIndicator: React.FC<{
  x: number;
  y: number;
  width: number;
  progress: number;
  label?: string;
}> = ({ x, y, width, progress, label }) => (
  <g>
    <rect x={x} y={y} width={width} height={4} fill={LINE_COLOR} opacity={0.1} rx={2} />
    <rect x={x} y={y} width={width * progress} height={4} fill={ACCENT_COLOR} opacity={0.8} rx={2} />
    {label && (
      <text x={x} y={y - 8} fill={LINE_COLOR} fontFamily="SF Mono, Monaco, Consolas" fontSize={9} opacity={0.5}>
        {label}
      </text>
    )}
  </g>
);

// Grid pattern background
const GridPattern: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
    <defs>
      <pattern id="panoramaGrid" width="50" height="50" patternUnits="userSpaceOnUse">
        <circle cx="25" cy="25" r="1" fill={LINE_COLOR} />
      </pattern>
    </defs>
    <rect width={width} height={height} fill="url(#panoramaGrid)" />
  </svg>
);

export const FuiPanorama: React.FC<FuiPanoramaProps> = ({ panSpeed = 1 }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Calculate pan offset - moves from left to right across the wide scene
  const maxPan = SCENE_WIDTH - width;
  const panOffset = interpolate(
    frame,
    [0, durationInFrames],
    [0, maxPan],
    { 
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease)
    }
  ) * panSpeed;

  // Progress through animation (0 to 1)
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp' });
  
  // Various animated progress values for gauges
  const gauge1Progress = interpolate(frame, [0, durationInFrames * 0.7], [0.2, 0.85], { extrapolateRight: 'clamp' });
  const gauge2Progress = interpolate(frame, [durationInFrames * 0.1, durationInFrames * 0.6], [0.1, 0.7], { 
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp' 
  });
  const gauge3Progress = interpolate(frame, [durationInFrames * 0.2, durationInFrames * 0.8], [0.3, 0.95], { 
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp' 
  });
  const gauge4Progress = interpolate(frame, [0, durationInFrames * 0.5], [0.4, 0.65], { extrapolateRight: 'clamp' });
  const gauge5Progress = 0.5 + 0.3 * Math.sin(frame * 0.05);
  
  // Pulse for subtle animations
  const pulse = 0.8 + 0.2 * Math.sin(frame * 0.1);

  return (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR, overflow: 'hidden' }}>
      {/* Panning container */}
      <div style={{
        position: 'absolute',
        width: SCENE_WIDTH,
        height: SCENE_HEIGHT,
        left: -panOffset,
        transition: 'none',
      }}>
        {/* Grid pattern */}
        <GridPattern width={SCENE_WIDTH} height={SCENE_HEIGHT} />
        
        {/* Main SVG layer for all vector graphics */}
        <svg 
          width={SCENE_WIDTH} 
          height={SCENE_HEIGHT} 
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* ========== SECTION 1: LEFT AREA (0-1000px) ========== */}
          
          {/* Large arc gauge - top left */}
          <ArcGauge 
            cx={200} cy={300} radius={150} 
            startAngle={-150} endAngle={30} 
            progress={gauge1Progress}
            strokeWidth={4}
            tickCount={18}
            pulsePhase={frame}
          />
          
          {/* Inner circle in the arc */}
          <circle cx={200} cy={300} r={80} fill="none" stroke={LINE_COLOR} strokeWidth={1} opacity={0.1} />
          <circle cx={200} cy={300} r={60} fill="none" stroke={ACCENT_COLOR} strokeWidth={2} opacity={0.3} 
            strokeDasharray="4 8" />
          
          {/* Technical labels around gauge */}
          <TechLabel text="SECTOR A" x={120} y={130} />
          <TechLabel text="RF-001" x={280} y={180} blink frame={frame} />
          <TechLabel text="32.5 MHz" x={100} y={420} />
          
          {/* Small circle gauge - bottom left */}
          <CircleGauge cx={120} cy={650} radius={50} progress={gauge4Progress} />
          <CircleGauge cx={120} cy={650} radius={35} progress={1 - gauge4Progress} fillColor={LINE_COLOR} />
          
          {/* Connecting line from left gauges */}
          <ConnectingLine x1={350} y1={300} x2={500} y2={400} curved />
          <ConnectingLine x1={170} y1={650} x2={350} y2={500} curved />
          
          {/* Vertical bar indicators */}
          <BarIndicator x={50} y={800} width={80} progress={gauge1Progress} label="SYS-A" />
          <BarIndicator x={50} y={850} width={80} progress={gauge2Progress} label="SYS-B" />
          <BarIndicator x={50} y={900} width={80} progress={0.45} label="SYS-C" />
          
          {/* ========== SECTION 2: LEFT-CENTER (1000-2000px) ========== */}
          
          {/* Semi-circular gauge */}
          <ArcGauge 
            cx={700} cy={200} radius={120} 
            startAngle={-180} endAngle={0} 
            progress={gauge2Progress}
            strokeWidth={3}
            tickCount={15}
            pulsePhase={frame * 0.8}
          />
          
          {/* Horizontal connecting lines */}
          <ConnectingLine x1={500} y1={400} x2={850} y2={400} dashed />
          <ConnectingLine x1={850} y1={400} x2={1100} y2={300} />
          
          {/* Circle cluster */}
          <CircleGauge cx={900} cy={550} radius={70} progress={gauge3Progress} strokeWidth={3} />
          <CircleGauge cx={900} cy={550} radius={50} progress={gauge5Progress} fillColor="#4A90A4" />
          <circle cx={900} cy={550} r={25} fill="none" stroke={LINE_COLOR} strokeWidth={1} opacity={0.2} />
          <circle cx={900} cy={550} r={5} fill={ACCENT_COLOR} opacity={pulse} />
          
          {/* Small accent circles */}
          <circle cx={780} cy={480} r={8} fill="none" stroke={ACCENT_COLOR} strokeWidth={2} opacity={0.6} />
          <circle cx={1020} cy={480} r={8} fill="none" stroke={ACCENT_COLOR} strokeWidth={2} opacity={0.6} />
          
          <TechLabel text="NODE-07" x={860} y={660} />
          <TechLabel text="LINK ACTIVE" x={830} y={680} blink frame={frame} />
          
          {/* Connecting to center */}
          <ConnectingLine x1={970} y1={550} x2={1200} y2={450} accent />
          
          {/* ========== SECTION 3: CENTER (1500-2500px) ========== */}
          
          {/* Main central gauge - largest element */}
          <g transform="translate(1400, 540)">
            <circle r={200} fill="none" stroke={LINE_COLOR} strokeWidth={1} opacity={0.1} />
            <ArcGauge 
              cx={0} cy={0} radius={180} 
              startAngle={-135} endAngle={135} 
              progress={gauge1Progress}
              strokeWidth={5}
              tickCount={24}
              pulsePhase={frame}
            />
            <circle r={140} fill="none" stroke={LINE_COLOR} strokeWidth={1} opacity={0.15} />
            <CircleGauge cx={0} cy={0} radius={100} progress={gauge2Progress} strokeWidth={2} />
            <circle r={60} fill="none" stroke={LINE_COLOR} strokeWidth={1} opacity={0.2} />
            <circle r={8} fill={ACCENT_COLOR} opacity={pulse} />
          </g>
          
          {/* Radiating lines from center */}
          {[...Array(8)].map((_, i) => {
            const angle = (i * 45 - 90) * Math.PI / 180;
            const innerR = 220;
            const outerR = 280 + (i % 2) * 30;
            return (
              <line
                key={i}
                x1={1400 + Math.cos(angle) * innerR}
                y1={540 + Math.sin(angle) * innerR}
                x2={1400 + Math.cos(angle) * outerR}
                y2={540 + Math.sin(angle) * outerR}
                stroke={i % 2 === 0 ? ACCENT_COLOR : LINE_COLOR}
                strokeWidth={i % 2 === 0 ? 2 : 1}
                opacity={i % 2 === 0 ? 0.6 : 0.3}
              />
            );
          })}
          
          <TechLabel text="CENTRAL HUB" x={1340} y={280} />
          <TechLabel text="STATUS: ONLINE" x={1330} y={820} blink frame={frame} />
          
          {/* ========== SECTION 4: RIGHT-CENTER (2000-3000px) ========== */}
          
          {/* Arc gauge - right side */}
          <ArcGauge 
            cx={2100} cy={350} radius={130} 
            startAngle={0} endAngle={180} 
            progress={gauge3Progress}
            strokeWidth={4}
            tickCount={16}
            pulsePhase={frame * 1.2}
          />
          
          {/* Connecting lines from center */}
          <ConnectingLine x1={1600} y1={450} x2={1900} y2={350} />
          <ConnectingLine x1={1600} y1={630} x2={1950} y2={700} curved />
          
          {/* Dual circle gauges */}
          <CircleGauge cx={2000} cy={700} radius={60} progress={gauge4Progress} />
          <CircleGauge cx={2150} cy={750} radius={45} progress={gauge5Progress} />
          
          {/* Connection between them */}
          <line x1={2060} y1={700} x2={2105} y2={750} stroke={LINE_COLOR} strokeWidth={1} opacity={0.4} />
          
          <TechLabel text="RELAY-04" x={2060} y={200} />
          <TechLabel text="PRO CNT: +100" x={1950} y={820} />
          
          {/* Horizontal bar cluster */}
          <BarIndicator x={2200} y={500} width={120} progress={gauge1Progress} label="LOAD A" />
          <BarIndicator x={2200} y={540} width={120} progress={gauge2Progress} label="LOAD B" />
          <BarIndicator x={2200} y={580} width={120} progress={gauge3Progress} label="LOAD C" />
          <BarIndicator x={2200} y={620} width={120} progress={0.55} label="LOAD D" />
          
          {/* ========== SECTION 5: FAR RIGHT (3000-4000px) ========== */}
          
          {/* Large arc gauge - right */}
          <ArcGauge 
            cx={2700} cy={400} radius={160} 
            startAngle={-120} endAngle={60} 
            progress={gauge2Progress}
            strokeWidth={4}
            tickCount={20}
            pulsePhase={frame * 0.9}
          />
          
          {/* Inner details */}
          <circle cx={2700} cy={400} r={100} fill="none" stroke={LINE_COLOR} strokeWidth={1} opacity={0.15} />
          <circle cx={2700} cy={400} r={70} fill="none" stroke={ACCENT_COLOR} strokeWidth={2} opacity={0.4}
            strokeDasharray="10 5" />
          
          {/* Connecting line */}
          <ConnectingLine x1={2400} y1={550} x2={2600} y2={450} accent />
          
          {/* Small satellite gauges */}
          <CircleGauge cx={2900} cy={250} radius={40} progress={gauge4Progress} />
          <CircleGauge cx={2950} cy={600} radius={55} progress={gauge1Progress} />
          
          {/* Final large gauge */}
          <g transform="translate(3400, 500)">
            <ArcGauge 
              cx={0} cy={0} radius={140} 
              startAngle={-160} endAngle={160} 
              progress={gauge3Progress}
              strokeWidth={4}
              tickCount={20}
              pulsePhase={frame}
            />
            <circle r={100} fill="none" stroke={LINE_COLOR} strokeWidth={1} opacity={0.1} />
            <CircleGauge cx={0} cy={0} radius={80} progress={1 - gauge2Progress} fillColor="#4A90A4" />
            <circle r={50} fill="none" stroke={LINE_COLOR} strokeWidth={1} opacity={0.2} />
            <circle r={6} fill={ACCENT_COLOR} opacity={pulse} />
          </g>
          
          <TechLabel text="OUTPUT NODE" x={3340} y={320} />
          <TechLabel text="EMG" x={3700} y={600} />
          
          {/* Corner decorations at far right */}
          <line x1={3850} y1={100} x2={3950} y2={100} stroke={LINE_COLOR} strokeWidth={1} opacity={0.3} />
          <line x1={3950} y1={100} x2={3950} y2={200} stroke={LINE_COLOR} strokeWidth={1} opacity={0.3} />
          <line x1={3850} y1={980} x2={3950} y2={980} stroke={LINE_COLOR} strokeWidth={1} opacity={0.3} />
          <line x1={3950} y1={880} x2={3950} y2={980} stroke={LINE_COLOR} strokeWidth={1} opacity={0.3} />
          
          {/* Long horizontal connecting lines across scene */}
          <line x1={400} y1={500} x2={3600} y2={500} stroke={LINE_COLOR} strokeWidth={1} opacity={0.08} />
          <line x1={200} y1={850} x2={3800} y2={850} stroke={LINE_COLOR} strokeWidth={1} opacity={0.06} />
          
          {/* Vertical reference lines */}
          <line x1={1000} y1={150} x2={1000} y2={950} stroke={LINE_COLOR} strokeWidth={1} opacity={0.05} 
            strokeDasharray="4 8" />
          <line x1={2000} y1={150} x2={2000} y2={950} stroke={LINE_COLOR} strokeWidth={1} opacity={0.05} 
            strokeDasharray="4 8" />
          <line x1={3000} y1={150} x2={3000} y2={950} stroke={LINE_COLOR} strokeWidth={1} opacity={0.05} 
            strokeDasharray="4 8" />
        </svg>
        
        {/* Data blocks with animated numbers */}
        <DataBlock label="PWR OUTPUT" value={127} subValue={45} frame={frame} speed={1.2} x={50} y={200} accent />
        <DataBlock label="FREQ" value={432} subValue={88} frame={frame} speed={0.8} x={50} y={500} />
        
        <DataBlock label="DIAG CNT" value={100} frame={frame} speed={0.5} x={580} y={300} />
        <DataBlock label="NODE STATUS" value={255} subValue={12} frame={frame} speed={1.5} x={750} y={750} accent />
        
        <DataBlock label="CORE TEMP" value={72} subValue={3} frame={frame} speed={0.3} x={1320} y={150} accent />
        <DataBlock label="LOAD" value={456} frame={frame} speed={2} x={1500} y={850} />
        
        <DataBlock label="THROUGHPUT" value={891} subValue={67} frame={frame} speed={1.8} x={1950} y={150} />
        <DataBlock label="SYNC RATE" value={99} subValue={98} frame={frame} speed={0.4} x={2350} y={750} accent />
        
        <DataBlock label="RF LEVEL" value={32} subValue={5} frame={frame} speed={0.6} x={2600} y={600} />
        <DataBlock label="AMPLITUDE" value={789} frame={frame} speed={1.1} x={2850} y={150} />
        
        <DataBlock label="SIGNAL" value={645} subValue={21} frame={frame} speed={1.4} x={3300} y={150} accent />
        <DataBlock label="EMG CNT" value={1001} frame={frame} speed={0.9} x={3600} y={700} />
        
        {/* Coordinate displays */}
        <div style={{ position: 'absolute', left: 350, top: 950 }}>
          <CoordinateDisplay label="LAT" value={51.5074} frame={frame} />
          <CoordinateDisplay label="LON" value={-0.1278} frame={frame} />
        </div>
        
        <div style={{ position: 'absolute', left: 1350, top: 950 }}>
          <CoordinateDisplay label="LAT" value={40.7128} frame={frame} />
          <CoordinateDisplay label="LON" value={-74.0060} frame={frame} />
        </div>
        
        <div style={{ position: 'absolute', left: 2500, top: 950 }}>
          <CoordinateDisplay label="LAT" value={35.6762} frame={frame} />
          <CoordinateDisplay label="LON" value={139.6503} frame={frame} />
        </div>
        
        <div style={{ position: 'absolute', left: 3500, top: 950 }}>
          <CoordinateDisplay label="LAT" value={-33.8688} frame={frame} />
          <CoordinateDisplay label="LON" value={151.2093} frame={frame} />
        </div>
        
        {/* Corner decorations - left side */}
        <svg style={{ position: 'absolute', top: 40, left: 40 }} width={60} height={60}>
          <line x1={0} y1={0} x2={40} y2={0} stroke={LINE_COLOR} strokeWidth={1} opacity={0.3} />
          <line x1={0} y1={0} x2={0} y2={40} stroke={LINE_COLOR} strokeWidth={1} opacity={0.3} />
        </svg>
        <svg style={{ position: 'absolute', bottom: 40, left: 40 }} width={60} height={60}>
          <line x1={0} y1={60} x2={40} y2={60} stroke={LINE_COLOR} strokeWidth={1} opacity={0.3} />
          <line x1={0} y1={20} x2={0} y2={60} stroke={LINE_COLOR} strokeWidth={1} opacity={0.3} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
