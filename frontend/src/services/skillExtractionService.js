import apiClient from '../api/apiClient';

export const processResume = async (resumeId) => {
  const response = await apiClient.post(`/extraction/process/${resumeId}`);
  return response.data;
};

export const getExtractedProfile = async () => {
  const response = await apiClient.get('/extraction/profile');
  return response.data;
};

export const getExtractedSkills = async () => {
  const response = await apiClient.get('/extraction/skills');
  return response.data;
};
