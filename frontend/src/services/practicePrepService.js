import apiClient from '../api/apiClient';

export const getPrepStatus = async () => {
  const response = await apiClient.get('/practice-prep/status');
  return response.data;
};

export const getLeetCodeRoadmap = async () => {
  const response = await apiClient.get('/practice-prep/leetcode');
  return response.data;
};

export const getMockInterviewPrep = async () => {
  const response = await apiClient.get('/practice-prep/ai-studio');
  return response.data;
};
