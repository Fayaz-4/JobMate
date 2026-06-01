import apiClient from '../api/apiClient';

export const getJobs = async () => {
  const response = await apiClient.get('/jobs');
  return response.data;
};

export const getJobDetails = async (id) => {
  const response = await apiClient.get(`/jobs/${id}`);
  return response.data;
};

export const getTodayJobs = async () => {
  const response = await apiClient.get('/jobs/today');
  return response.data;
};

export const searchJobs = async (query) => {
  const response = await apiClient.get(`/jobs/search?query=${encodeURIComponent(query)}`);
  return response.data;
};

export const filterJobs = async (params) => {
  const response = await apiClient.get('/jobs/filter', { params });
  return response.data;
};
