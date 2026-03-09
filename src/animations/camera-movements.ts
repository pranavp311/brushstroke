export interface CameraPreset {
  name: string;
  sections: Array<{
    id: string;
    duration: number;
    animation: {
      cameraPosition?: { x?: number; y?: number; z?: number };
      rotation?: { x?: number; y?: number; z?: number };
    };
  }>;
}

export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  orbit: {
    name: "Orbit",
    sections: [
      { id: "orbit-1", duration: 3, animation: { cameraPosition: { x: 8, z: -8 } } },
      { id: "orbit-2", duration: 3, animation: { cameraPosition: { x: -8, z: -8 } } },
      { id: "orbit-3", duration: 3, animation: { cameraPosition: { x: -8, z: 8 } } },
    ],
  },
  zoom_in: {
    name: "Zoom In",
    sections: [
      { id: "approach", duration: 4, animation: { cameraPosition: { z: -6 } } },
      { id: "inspect", duration: 3, animation: { cameraPosition: { y: 2, z: -1 } } },
    ],
  },
  flyover: {
    name: "Flyover",
    sections: [
      { id: "rise", duration: 2, animation: { cameraPosition: { y: 10 } } },
      { id: "sweep", duration: 4, animation: { cameraPosition: { x: 10, z: -5 } } },
      { id: "descend", duration: 2, animation: { cameraPosition: { y: -8 } } },
    ],
  },
  reveal: {
    name: "Reveal",
    sections: [
      { id: "hidden", duration: 1, animation: { cameraPosition: { y: -5, z: 15 } } },
      { id: "peek", duration: 3, animation: { cameraPosition: { y: 5, z: -10 } } },
      { id: "full", duration: 2, animation: { rotation: { y: Math.PI * 2 } } },
    ],
  },
};
