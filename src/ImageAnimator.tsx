import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ImageAnimatorProps, ANIMATION_CONFIGS } from './types';

export const ImageAnimator: React.FC<ImageAnimatorProps> = ({ imageSrc, preset }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const config = ANIMATION_CONFIGS[preset];

  // Interpolate all animation values based on current frame
  const scale = interpolate(
    frame,
    [0, durationInFrames],
    [config.startScale, config.endScale],
    { extrapolateRight: 'clamp' }
  );

  const translateX = interpolate(
    frame,
    [0, durationInFrames],
    [config.startX, config.endX],
    { extrapolateRight: 'clamp' }
  );

  const translateY = interpolate(
    frame,
    [0, durationInFrames],
    [config.startY, config.endY],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <Img
          src={imageSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
