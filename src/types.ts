export type AnimationPreset = 
  | 'zoom-in' 
  | 'zoom-out' 
  | 'pan-left' 
  | 'pan-right' 
  | 'pan-up'
  | 'pan-down'
  | 'ken-burns';

export interface ImageAnimatorProps {
  imageSrc: string;
  preset: AnimationPreset;
}

export interface AnimationConfig {
  startScale: number;
  endScale: number;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
}

export const ANIMATION_CONFIGS: Record<AnimationPreset, AnimationConfig> = {
  'zoom-in': {
    startScale: 1,
    endScale: 1.3,
    startX: 0,
    endX: 0,
    startY: 0,
    endY: 0,
  },
  'zoom-out': {
    startScale: 1.3,
    endScale: 1,
    startX: 0,
    endX: 0,
    startY: 0,
    endY: 0,
  },
  'pan-left': {
    startScale: 1.2,
    endScale: 1.2,
    startX: 10,
    endX: -10,
    startY: 0,
    endY: 0,
  },
  'pan-right': {
    startScale: 1.2,
    endScale: 1.2,
    startX: -10,
    endX: 10,
    startY: 0,
    endY: 0,
  },
  'pan-up': {
    startScale: 1.2,
    endScale: 1.2,
    startX: 0,
    endX: 0,
    startY: 10,
    endY: -10,
  },
  'pan-down': {
    startScale: 1.2,
    endScale: 1.2,
    startX: 0,
    endX: 0,
    startY: -10,
    endY: 10,
  },
  'ken-burns': {
    startScale: 1,
    endScale: 1.25,
    startX: -5,
    endX: 5,
    startY: -3,
    endY: 3,
  },
};
