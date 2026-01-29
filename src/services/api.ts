import type { Avatar, Background, Montage, Motion, Reference } from '../types';

const API_BASE = 'https://uniq.powercodeai.space/avatar';

const ENDPOINTS = {
  AVATARS: '/avatars',
  REFERENCES: '/references',
  MOTIONS: '/motions',
  BACKGROUNDS: '/backgrounds',
  MONTAGES: '/montages',
};

export const api = {
  getAvatars: async (): Promise<Avatar[]> => {
    const res = await fetch(`${API_BASE}${ENDPOINTS.AVATARS}`);
    if (!res.ok) throw new Error('Failed to fetch avatars');
    return res.json();
  },

  getReferences: async (): Promise<Reference[]> => {
    const res = await fetch(`${API_BASE}${ENDPOINTS.REFERENCES}`);
    if (!res.ok) throw new Error('Failed to fetch references');
    return res.json();
  },

  getBackgrounds: async (): Promise<Background[]> => {
    const res = await fetch(`${API_BASE}${ENDPOINTS.BACKGROUNDS}`);
    if (!res.ok) throw new Error('Failed to fetch backgrounds');
    return res.json();
  },

  createMotion: async (avatarId: string, referenceId: string): Promise<Motion> => {
    const res = await fetch(`${API_BASE}${ENDPOINTS.MOTIONS}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_id: avatarId, reference_id: referenceId }),
    });
    if (!res.ok) throw new Error('Failed to create motion task');
    return res.json();
  },

  getMotionStatus: async (id: string): Promise<Motion> => {
    const res = await fetch(`${API_BASE}${ENDPOINTS.MOTIONS}/${id}`);
    if (!res.ok) throw new Error('Failed to get motion status');
    return res.json();
  },

  createMontage: async (motionId: string, bgVideoId: string): Promise<Montage> => {
    const res = await fetch(`${API_BASE}${ENDPOINTS.MONTAGES}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motion_id: motionId, bg_video_id: bgVideoId }),
    });
    if (!res.ok) throw new Error('Failed to create montage task');
    return res.json();
  },

  getMontageStatus: async (id: string): Promise<Montage> => {
    const res = await fetch(`${API_BASE}${ENDPOINTS.MONTAGES}/${id}`);
    if (!res.ok) throw new Error('Failed to get montage status');
    return res.json();
  },
};
