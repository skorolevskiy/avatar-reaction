import type { Avatar, Background, Montage, Motion, Reference } from '../types';

const API_BASE = 'https://reaction.powercodeai.space/avatar';

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

  uploadAvatar: async (file: File): Promise<Avatar> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_BASE}${ENDPOINTS.AVATARS}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) throw new Error('Failed to upload avatar');
    return res.json();
  },

  getReferences: async (): Promise<Reference[]> => {
    const res = await fetch(`${API_BASE}${ENDPOINTS.REFERENCES}`);
    if (!res.ok) throw new Error('Failed to fetch references');
    return res.json();
  },

  uploadReference: async (file: File, label: string): Promise<Reference> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', label);
    
    const res = await fetch(`${API_BASE}${ENDPOINTS.REFERENCES}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) throw new Error('Failed to upload reference');
    return res.json();
  },

  getBackgrounds: async (): Promise<Background[]> => {
    const res = await fetch(`${API_BASE}${ENDPOINTS.BACKGROUNDS}`);
    if (!res.ok) throw new Error('Failed to fetch backgrounds');
    return res.json();
  },

  uploadBackground: async (file: File, title: string): Promise<Background> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    
    const res = await fetch(`${API_BASE}${ENDPOINTS.BACKGROUNDS}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) throw new Error('Failed to upload background');
    return res.json();
  },

  getMotions: async (): Promise<Motion[]> => {
    const res = await fetch(`${API_BASE}${ENDPOINTS.MOTIONS}`);
    if (!res.ok) throw new Error('Failed to fetch motions');
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

  getMontages: async (): Promise<Montage[]> => {
    const res = await fetch(`${API_BASE}${ENDPOINTS.MONTAGES}`);
    if (!res.ok) throw new Error('Failed to fetch montages');
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
