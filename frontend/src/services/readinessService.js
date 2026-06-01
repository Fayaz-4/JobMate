import apiClient from '../api/apiClient';

export const getAppliedCompanies = async () => {
  const response = await apiClient.get('/readiness/applied-companies');
  return response.data;
};

export const getCompanyGuide = async (id) => {
  const response = await apiClient.get(`/readiness/company/${id}`);
  return response.data;
};

export const getHiringProcess = async (id) => {
  const response = await apiClient.get(`/readiness/hiring-process/${id}`);
  return response.data;
};

export const getQuestions = async (id) => {
  const response = await apiClient.get(`/readiness/questions/${id}`);
  return response.data;
};

export const getResources = async (id) => {
  const response = await apiClient.get(`/readiness/resources/${id}`);
  return response.data;
};

export const getRoadmap = async (id) => {
  const response = await apiClient.get(`/readiness/roadmap/${id}`);
  return response.data;
};

export const refreshReadinessPlan = async (id) => {
  const response = await apiClient.post(`/readiness/refresh/${id}`);
  return response.data;
};
