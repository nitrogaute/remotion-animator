import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface FuiClockProps {
  baseTime?: number; // Starting timestamp
}

// Animated number display that cycles through digits
const AnimatedNumber: React.FC<{
  value: number;
  digits?: number;
  frame: number;
  speed?: number;
  prefix?: string;
  suffix?: string;
  fontSize?: number;
}> = ({ value, digits = 3, frame, speed = 1, prefix = '', suffix = '', fontSize = 48 }) => {
  const animatedValue = Math.floor(value + (frame * speed * 0.5));
  const displayValue = animatedValue.toString().padStart(digits, '0').slice(-digits);
  
  return (
    <span style={{ 
      fontFamily: 'SF Mono, Monaco, Consolas, monospace',
      fontSize,
      fontWeight: 300,
      letterSpacing: '0.05em',
    }}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// Digital readout with segmented display effect
const DigitalReadout: React.FC<{
  mainValue: number;
  subValue: number;
  frame: number;
  speed?: number;
  showDecimal?: boolean;
}> = ({ mainValue, subValue, frame, speed = 1, showDecimal = false }) => {
  const animMain = Math.floor(mainValue + (frame * speed * 0.3));
  const animSub = Math.floor(subValue + (frame * speed * 0.7));
  
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ 
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        fontSize: 56,
        fontWeight: 200,
        letterSpacing: '0.02em',
      }}>
        {animMain.toString().padStart(3, '0').slice(-3)}
      </span>
      {showDecimal && (
        <span style={{ 
          fontFamily: 'SF Mono, Monaco, Consolas, monospace',
          fontSize: 32,
          fontWeight: 200,
          opacity: 0.7,
        }}>
          .{(animSub % 10)}
        </span>
      )}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginLeft: 12,
      }}>
        <span style={{ 
          fontFamily: 'SF Mono, Monaco, Consolas, monospace',
          fontSize: 24,
          fontWeight: 300,
          opacity: 0.6,
        }}>
          {animSub.toString().padStart(3, '0').slice(-3)}
        </span>
      </div>
    </div>
  );
};

// Arc gauge component
const ArcGauge: React.FC<{
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  progress?: number;
}> = ({ cx, cy, radius, startAngle, endAngle, progress = 0.7 }) => {
  const polarToCartesian = (angle: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const progressEnd = polarToCartesian(startAngle + (endAngle - startAngle) * progress);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const progressLargeArc = (endAngle - startAngle) * progress > 180 ? 1 : 0;

  const bgPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  const progressPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${progressLargeArc} 1 ${progressEnd.x} ${progressEnd.y}`;

  // Generate tick marks
  const ticks = [];
  const tickCount = 12;
  for (let i = 0; i <= tickCount; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / tickCount);
    const innerPoint = polarToCartesian(angle);
    const outerRadius = radius + (i % 3 === 0 ? 15 : 8);
    const outerPoint = {
      x: cx + outerRadius * Math.cos((angle - 90) * Math.PI / 180),
      y: cy + outerRadius * Math.sin((angle - 90) * Math.PI / 180),
    };
    ticks.push(
      <line
        key={i}
        x1={innerPoint.x}
        y1={innerPoint.y}
        x2={outerPoint.x}
        y2={outerPoint.y}
        stroke="#1a1a1a"
        strokeWidth={i % 3 === 0 ? 2 : 1}
        opacity={i % 3 === 0 ? 0.8 : 0.4}
      />
    );
  }

  return (
    <g>
      <path d={bgPath} fill="none" stroke="#1a1a1a" strokeWidth={2} opacity={0.2} />
      <path d={progressPath} fill="none" stroke="#1a1a1a" strokeWidth={3} opacity={0.8} />
      {ticks}
    </g>
  );
};

// Status indicator row
const StatusRow: React.FC<{ items: string[] }> = ({ items }) => (
  <div style={{
    display: 'flex',
    gap: 24,
    fontFamily: 'SF Mono, Monaco, Consolas, monospace',
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: '0.1em',
    opacity: 0.7,
  }}>
    {items.map((item, i) => (
      <span key={i}>{item}</span>
    ))}
  </div>
);

// Grid pattern component
const GridPattern: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="1" fill="#1a1a1a" />
      </pattern>
    </defs>
    <rect width={width} height={height} fill="url(#grid)" />
  </svg>
);

export const FuiClock: React.FC<FuiClockProps> = ({ baseTime = 1100 }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Subtle pulsing opacity for some elements
  const pulse = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.7, 1, 0.7],
    { extrapolateRight: 'clamp' }
  );

  // Progress through the animation
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#E8E4DF' }}>
      {/* Subtle grid pattern */}
      <GridPattern width={width} height={height} />
      
      {/* Main container */}
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 80,
        color: '#1a1a1a',
        position: 'relative',
      }}>
        
        {/* Top Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
          {/* Top Left - Arc Gauge */}
          <div style={{ position: 'relative', width: 280, height: 200 }}>
            <svg width={280} height={200}>
              <ArcGauge cx={140} cy={160} radius={120} startAngle={-150} endAngle={-30} progress={0.3 + progress * 0.4} />
            </svg>
            <div style={{ 
              position: 'absolute', 
              top: 60, 
              left: 20,
              fontFamily: 'SF Mono, Monaco, Consolas, monospace',
              fontSize: 12,
              opacity: 0.6,
            }}>
              <div>RF</div>
              <div style={{ fontSize: 18, marginTop: 4 }}>32.5</div>
              <div style={{ marginTop: 8 }}>STL3</div>
            </div>
          </div>

          {/* Top Right - ICO Display */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontFamily: 'SF Mono, Monaco, Consolas, monospace',
              fontSize: 14,
              letterSpacing: '0.2em',
              opacity: 0.6,
              marginBottom: 8,
            }}>
              ICO
            </div>
            <div style={{ 
              fontFamily: 'SF Mono, Monaco, Consolas, monospace',
              fontSize: 48,
              fontWeight: 200,
            }}>
              <AnimatedNumber value={100} digits={3} frame={frame} speed={0.1} suffix=".0" fontSize={48} />
            </div>
            <div style={{ 
              fontFamily: 'SF Mono, Monaco, Consolas, monospace',
              fontSize: 12,
              letterSpacing: '0.15em',
              opacity: 0.5,
              marginTop: 8,
            }}>
              RATE
            </div>
            {/* Circular ring */}
            <svg width={120} height={120} style={{ marginTop: 20, opacity: pulse }}>
              <circle cx={60} cy={60} r={50} fill="none" stroke="#1a1a1a" strokeWidth={1} opacity={0.3} />
              <circle cx={60} cy={60} r={45} fill="none" stroke="#1a1a1a" strokeWidth={2} opacity={0.6} 
                strokeDasharray={`${progress * 283} 283`} />
            </svg>
          </div>
        </div>

        {/* Status Row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 40,
          padding: '20px 0',
          borderTop: '1px solid rgba(26,26,26,0.1)',
          borderBottom: '1px solid rgba(26,26,26,0.1)',
        }}>
          <StatusRow items={['PRS 33w', 'PRS 12v', 'PRS 12v']} />
          <div style={{ width: 1, backgroundColor: 'rgba(26,26,26,0.2)', height: 20 }} />
          <StatusRow items={['PRS 55V', 'PRS 22w', 'PRS 12V']} />
          <div style={{ 
            fontFamily: 'SF Mono, Monaco, Consolas, monospace',
            fontSize: 14,
            letterSpacing: '0.1em',
            marginLeft: 40,
          }}>
            ADR 019
          </div>
        </div>

        {/* Main Data Section */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          gap: 120,
          marginTop: 40,
        }}>
          {/* Left Data Block */}
          <div>
            <div style={{ 
              fontFamily: 'SF Mono, Monaco, Consolas, monospace',
              fontSize: 12,
              letterSpacing: '0.15em',
              opacity: 0.6,
              marginBottom: 20,
            }}>
              <span>DIAG CNT: +{baseTime}</span>
              <span style={{ marginLeft: 40 }}>PRO CNT: +100</span>
            </div>
            
            <div style={{ marginBottom: 30 }}>
              <DigitalReadout mainValue={10} subValue={885} frame={frame} speed={2} />
            </div>
            
            <div>
              <DigitalReadout mainValue={27} subValue={453} frame={frame} speed={1.5} />
            </div>
          </div>

          {/* Center divider */}
          <div style={{ 
            width: 1, 
            height: 200, 
            backgroundColor: 'rgba(26,26,26,0.15)' 
          }} />

          {/* Right Data Block */}
          <div>
            <div style={{ 
              fontFamily: 'SF Mono, Monaco, Consolas, monospace',
              fontSize: 12,
              letterSpacing: '0.15em',
              opacity: 0.6,
              marginBottom: 20,
            }}>
              DIAG CNT: +100
            </div>
            
            <div style={{ marginBottom: 30 }}>
              <DigitalReadout mainValue={329} subValue={31} frame={frame} speed={1.8} showDecimal />
            </div>
            
            <div>
              <DigitalReadout mainValue={206} subValue={912} frame={frame} speed={2.2} />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* Bottom Left - EMG */}
          <div style={{ position: 'relative' }}>
            <svg width={200} height={150}>
              <ArcGauge cx={100} cy={120} radius={80} startAngle={-180} endAngle={-90} progress={0.6 + progress * 0.2} />
            </svg>
            <div style={{ 
              fontFamily: 'SF Mono, Monaco, Consolas, monospace',
              fontSize: 48,
              fontWeight: 200,
              letterSpacing: '0.1em',
              marginTop: -40,
            }}>
              EMG
            </div>
            <div style={{ 
              fontFamily: 'SF Mono, Monaco, Consolas, monospace',
              fontSize: 24,
              fontWeight: 300,
              opacity: 0.7,
              marginTop: 8,
            }}>
              <AnimatedNumber value={1} digits={4} frame={frame} speed={0.5} fontSize={24} />
            </div>
          </div>

          {/* Bottom Center - Coordinates */}
          <div style={{ 
            fontFamily: 'SF Mono, Monaco, Consolas, monospace',
            fontSize: 14,
            opacity: 0.5,
            textAlign: 'center',
          }}>
            <div style={{ marginBottom: 8 }}>
              LAT {(51.5074 + (frame * 0.0001)).toFixed(4)}°N
            </div>
            <div>
              LON {(-0.1278 - (frame * 0.0001)).toFixed(4)}°W
            </div>
          </div>

          {/* Bottom Right - Additional gauge */}
          <div style={{ position: 'relative' }}>
            <svg width={150} height={150}>
              <circle cx={75} cy={75} r={60} fill="none" stroke="#1a1a1a" strokeWidth={1} opacity={0.2} />
              <circle cx={75} cy={75} r={55} fill="none" stroke="#1a1a1a" strokeWidth={2} opacity={0.5}
                strokeDasharray={`${(0.3 + progress * 0.5) * 345} 345`} 
                transform="rotate(-90 75 75)" />
              {/* Center dot */}
              <circle cx={75} cy={75} r={3} fill="#1a1a1a" opacity={pulse} />
            </svg>
            <div style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: 'SF Mono, Monaco, Consolas, monospace',
              fontSize: 18,
              fontWeight: 300,
            }}>
              <AnimatedNumber value={88} digits={2} frame={frame} speed={0.3} fontSize={18} />
            </div>
          </div>
        </div>

        {/* Decorative corner lines */}
        <svg style={{ position: 'absolute', top: 40, left: 40 }} width={60} height={60}>
          <line x1={0} y1={0} x2={40} y2={0} stroke="#1a1a1a" strokeWidth={1} opacity={0.3} />
          <line x1={0} y1={0} x2={0} y2={40} stroke="#1a1a1a" strokeWidth={1} opacity={0.3} />
        </svg>
        <svg style={{ position: 'absolute', top: 40, right: 40 }} width={60} height={60}>
          <line x1={20} y1={0} x2={60} y2={0} stroke="#1a1a1a" strokeWidth={1} opacity={0.3} />
          <line x1={60} y1={0} x2={60} y2={40} stroke="#1a1a1a" strokeWidth={1} opacity={0.3} />
        </svg>
        <svg style={{ position: 'absolute', bottom: 40, left: 40 }} width={60} height={60}>
          <line x1={0} y1={60} x2={40} y2={60} stroke="#1a1a1a" strokeWidth={1} opacity={0.3} />
          <line x1={0} y1={20} x2={0} y2={60} stroke="#1a1a1a" strokeWidth={1} opacity={0.3} />
        </svg>
        <svg style={{ position: 'absolute', bottom: 40, right: 40 }} width={60} height={60}>
          <line x1={20} y1={60} x2={60} y2={60} stroke="#1a1a1a" strokeWidth={1} opacity={0.3} />
          <line x1={60} y1={20} x2={60} y2={60} stroke="#1a1a1a" strokeWidth={1} opacity={0.3} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
