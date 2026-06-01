import apiClient from '../api/apiClient';

export const startSession = async (applicationId, type) => {
  const response = await apiClient.post(`/realtime-interview/start/${applicationId}?type=${type}`);
  return response.data;
};

export const startResumeMockSession = async (type) => {
  const response = await apiClient.post(`/realtime-interview/start-resume-mock?type=${type}`);
  return response.data;
};

export const submitAnswer = async (sessionId, question, userAnswer) => {
  const response = await apiClient.post(`/realtime-interview/submit-answer/${sessionId}`, {
    question,
    userAnswer
  });
  return response.data;
};

export const endSession = async (sessionId, vapiCallId) => {
  const url = vapiCallId 
    ? `/realtime-interview/end/${sessionId}?vapiCallId=${vapiCallId}`
    : `/realtime-interview/end/${sessionId}`;
  const response = await apiClient.post(url);
  return response.data;
};

export const getConnectivityStatus = async () => {
  const response = await apiClient.get('/connectivity-status');
  return response.data;
};

export const getHistory = async () => {
  const response = await apiClient.get('/realtime-interview/history');
  return response.data;
};

export const getSessionReport = async (sessionId) => {
  const response = await apiClient.get(`/realtime-interview/report/${sessionId}`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await apiClient.get('/realtime-interview/dashboard');
  return response.data;
};
