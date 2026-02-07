export interface BodyRegion {
  id: string;
  label: string;
  view: 'front' | 'back';
}

export const BODY_REGIONS: BodyRegion[] = [
  // Head & Neck — Front
  { id: 'head', label: 'Head', view: 'front' },
  { id: 'face', label: 'Face', view: 'front' },
  { id: 'neck', label: 'Neck', view: 'front' },

  // Upper Body — Front
  { id: 'left_shoulder', label: 'Left Shoulder', view: 'front' },
  { id: 'right_shoulder', label: 'Right Shoulder', view: 'front' },
  { id: 'chest', label: 'Chest', view: 'front' },
  { id: 'left_upper_arm', label: 'Left Upper Arm', view: 'front' },
  { id: 'right_upper_arm', label: 'Right Upper Arm', view: 'front' },
  { id: 'left_elbow', label: 'Left Elbow', view: 'front' },
  { id: 'right_elbow', label: 'Right Elbow', view: 'front' },
  { id: 'left_forearm', label: 'Left Forearm', view: 'front' },
  { id: 'right_forearm', label: 'Right Forearm', view: 'front' },
  { id: 'left_hand', label: 'Left Hand', view: 'front' },
  { id: 'right_hand', label: 'Right Hand', view: 'front' },
  { id: 'abdomen', label: 'Abdomen', view: 'front' },
  { id: 'hip', label: 'Hip', view: 'front' },

  // Lower Body — Front
  { id: 'left_thigh', label: 'Left Thigh', view: 'front' },
  { id: 'right_thigh', label: 'Right Thigh', view: 'front' },
  { id: 'left_knee', label: 'Left Knee', view: 'front' },
  { id: 'right_knee', label: 'Right Knee', view: 'front' },
  { id: 'left_shin', label: 'Left Shin', view: 'front' },
  { id: 'right_shin', label: 'Right Shin', view: 'front' },
  { id: 'left_ankle', label: 'Left Ankle', view: 'front' },
  { id: 'right_ankle', label: 'Right Ankle', view: 'front' },
  { id: 'left_foot', label: 'Left Foot', view: 'front' },
  { id: 'right_foot', label: 'Right Foot', view: 'front' },

  // Back regions
  { id: 'upper_back', label: 'Upper Back', view: 'back' },
  { id: 'lower_back', label: 'Lower Back', view: 'back' },
];

export const BODY_REGION_MAP = Object.fromEntries(
  BODY_REGIONS.map((r) => [r.id, r])
) as Record<string, BodyRegion>;
