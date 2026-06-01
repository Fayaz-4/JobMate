import apiClient from '../api/apiClient';

export const getJobDetails = async (id) => {
  const response = await apiClient.get(`/jobs/${id}`);
  return response.data;
};

export const getSimilarJobs = async (id) => {
  const response = await apiClient.get(`/jobs/${id}/similar`);
  return response.data;
};

export const saveJob = async (job) => {
  const response = await apiClient.post('/jobs', job);
  return response.data;
};
