import apiClient from '../api/apiClient';

export const getDashboardStats = async () => {
  const response = await apiClient.get('/dashboard/stats');
  return response.data;
};

export const getRecommendedJobs = async () => {
  const response = await apiClient.get('/dashboard/recommended-jobs');
  return response.data;
};

export const getTodaysJobs = async () => {
  const response = await apiClient.get('/dashboard/todays-jobs');
  return response.data;
};

export const getDashboard = async () => {
  const response = await apiClient.get('/dashboard');
  return response.data;
};
