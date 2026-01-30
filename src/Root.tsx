import './index.css';
import { Composition } from 'remotion';
import { ImageAnimator } from './ImageAnimator';
import { FuiClock } from './FuiClock';
import { FuiPanorama } from './FuiPanorama';
import { AnimationPreset } from './types';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ImageAnimator"
        component={ImageAnimator}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          imageSrc: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
          preset: 'ken-burns' as AnimationPreset,
        }}
        schema={undefined}
        calculateMetadata={async ({ props }) => {
          return {
            props,
          };
        }}
      />
      <Composition
        id="FuiClock"
        component={FuiClock}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          baseTime: 1100,
        }}
      />
      <Composition
        id="FuiPanorama"
        component={FuiPanorama}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          panSpeed: 1,
        }}
      />
    </>
  );
};
