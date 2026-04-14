/**
 * Standard interfaces for high-fidelity Virtual Try-On pipelines.
 * These act as placeholders for future AI service integrations.
 */

export interface PoseLandmarks {
  landmarks: { x: number; y: number; z: number; visibility: number }[];
  pose_world_landmarks: any;
}

export interface HumanParsingMap {
  mask_url: string;
  labels: Record<number, string>; // e.g., 5: 'upper-clothes'
}

export interface AvatarGenerationStatus {
  taskId: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  resultUrl?: string;
  error?: string;
  progress: number;
}
