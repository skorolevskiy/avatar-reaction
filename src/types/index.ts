export interface Avatar {
  id: string;
  name: string;
  image_url: string;
  preview_url?: string;
}

export interface Reference {
  id: string;
  name: string;
  preview_url: string; // Video or image preview of the motion
}

export interface Motion {
  id: string;
  status: 'queued' | 'processing' | 'success' | 'failed';
  motion_video_url?: string;
  avatar_id: string;
  reference_id: string;
}

export interface Background {
  id: string;
  name: string;
  video_url: string;
  preview_url?: string;
}

export interface Montage {
  id: string;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  video_url?: string;
  final_video_url?: string;
  motion_id: string;
  bg_video_id: string;
}

export type Step = 'avatar' | 'reference' | 'motion_generation' | 'background' | 'montage_generation' | 'result';

export interface AppState {
  currentStep: Step;
  expandedStep: Step;
  selectedAvatar: Avatar | null;
  selectedReference: Reference | null;
  motionTask: Motion | null;
  selectedBackground: Background | null;
  montageTask: Montage | null;
  error: string | null;
  isLoading: boolean;
}
