export interface ModelAnimationPreset {
  name: string;
  sections: Array<{
    id: string;
    duration: number;
    animation: {
      rotation?: { x?: number; y?: number; z?: number };
      position?: { x?: number; y?: number; z?: number };
      scale?: number;
    };
  }>;
}

export const MODEL_ANIMATION_PRESETS: Record<string, ModelAnimationPreset> = {
  spin_and_scale: {
    name: "Spin & Scale",
    sections: [
      { id: "spin", duration: 3, animation: { rotation: { y: Math.PI * 2 } } },
      { id: "grow", duration: 2, animation: { scale: 1.5 } },
      { id: "shrink-spin", duration: 3, animation: { rotation: { y: -Math.PI * 2 }, scale: 0.5 } },
    ],
  },
  float_up: {
    name: "Float Up",
    sections: [
      { id: "rise", duration: 4, animation: { position: { y: 5 }, rotation: { y: Math.PI } } },
      { id: "hover", duration: 2, animation: { rotation: { z: 0.3 } } },
      { id: "descend", duration: 3, animation: { position: { y: -5 }, rotation: { y: -Math.PI } } },
    ],
  },
  explode: {
    name: "Explode",
    sections: [
      { id: "calm", duration: 2, animation: { rotation: { y: 0.5 } } },
      { id: "burst", duration: 1, animation: { scale: 3 } },
      { id: "reform", duration: 3, animation: { scale: 1, rotation: { y: Math.PI * 4 } } },
    ],
  },
};
