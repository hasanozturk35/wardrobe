import { api } from '../lib/api';

export const avatarApi = {
  getStatus: async () => {
    const response = await api.get('/avatar/status');
    return response.data;
  },

  uploadSelfie: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/avatar/upload-selfie', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadBodyPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/avatar/upload-body', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  triggerSynthesis: async () => {
    const response = await api.post('/avatar/trigger-synthesis');
    return response.data;
  },
};
