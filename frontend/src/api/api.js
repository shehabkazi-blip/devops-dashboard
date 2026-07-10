import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

export const getRepos = () => api.get('/repos').then((r) => r.data);
export const createRepo = (payload) => api.post('/repos', payload).then((r) => r.data);
export const deleteRepo = (id) => api.delete(`/repos/${id}`).then((r) => r.data);
export const pingRepoNow = (id) => api.post(`/repos/${id}/ping`).then((r) => r.data);

export const getHealthHistory = (repoId, limit = 100) =>
  api.get(`/health/${repoId}`, { params: { limit } }).then((r) => r.data);

export const triggerDeployment = (repoId) => api.post(`/deployments/${repoId}/trigger`).then((r) => r.data);
export const getDeployments = (repoId) => api.get(`/deployments/${repoId}`).then((r) => r.data);
export const getLatestRunStatus = (repoId) => api.get(`/deployments/${repoId}/status/latest`).then((r) => r.data);

export const getAlerts = (repoId) =>
  api.get('/alerts', { params: repoId ? { repoId } : {} }).then((r) => r.data);

export default api;
