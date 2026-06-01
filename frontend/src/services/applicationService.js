import apiClient from '../api/apiClient';

export const getApplications = async () => {
  const response = await apiClient.get('/applications');
  return response.data;
};

export const getApplication = async (id) => {
  const response = await apiClient.get(`/applications/${id}`);
  return response.data;
};

export const createApplication = async (data) => {
  const response = await apiClient.post('/applications/apply', data);
  return response.data;
};

export const updateApplication = async (id, data) => {
  const response = await apiClient.put('/applications/status', {
    id: id,
    status: data.status,
    currentRound: data.currentRound
  });
  return response.data;
};

export const deleteApplication = async (id) => {
  const response = await apiClient.delete(`/applications/${id}`);
  return response.data;
};
