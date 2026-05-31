import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Projects
export const getProjects = () => API.get('/projects/');
export const createProject = (data) => API.post('/projects/', data);
export const updateProject = (id, data) => API.patch(`/projects/${id}/`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}/`);
export const getDashboard = (id) => API.get(`/projects/${id}/dashboard/`);

// Domain
export const getDomain = (pid) => API.get(`/projects/${pid}/domain/current/`);
export const saveDomain = (pid, data) => API.post(`/projects/${pid}/domain/current/`, data);

// Papers
export const getPapers = (pid, params) => API.get(`/projects/${pid}/papers/`, { params });
export const createPaper = (pid, data) => API.post(`/projects/${pid}/papers/`, data);
export const updatePaper = (pid, id, data) => API.patch(`/projects/${pid}/papers/${id}/`, data);
export const deletePaper = (pid, id) => API.delete(`/projects/${pid}/papers/${id}/`);

// Problems
export const getProblems = (pid, params) => API.get(`/projects/${pid}/problems/`, { params });
export const createProblem = (pid, data) => API.post(`/projects/${pid}/problems/`, data);
export const updateProblem = (pid, id, data) => API.patch(`/projects/${pid}/problems/${id}/`, data);
export const deleteProblem = (pid, id) => API.delete(`/projects/${pid}/problems/${id}/`);

// Hypotheses
export const getHypotheses = (pid) => API.get(`/projects/${pid}/hypotheses/`);
export const createHypothesis = (pid, data) => API.post(`/projects/${pid}/hypotheses/`, data);
export const updateHypothesis = (pid, id, data) => API.patch(`/projects/${pid}/hypotheses/${id}/`, data);
export const deleteHypothesis = (pid, id) => API.delete(`/projects/${pid}/hypotheses/${id}/`);
export const selectHypothesis = (pid, id) => API.post(`/projects/${pid}/hypotheses/${id}/select/`);
export const updateElo = (pid, data) => API.post(`/projects/${pid}/hypotheses/update_elo/`, data);

// Feasibility
export const getFeasibility = (pid) => API.get(`/projects/${pid}/feasibility/current/`);
export const saveFeasibility = (pid, data) => API.post(`/projects/${pid}/feasibility/current/`, data);

// Proposal
export const getProposal = (pid) => API.get(`/projects/${pid}/proposal/current/`);
export const saveProposal = (pid, data) => API.post(`/projects/${pid}/proposal/current/`, data);

// Logs
export const getLogs = (pid, params) => API.get(`/projects/${pid}/logs/`, { params });
export const createLog = (pid, data) => API.post(`/projects/${pid}/logs/`, data);
export const updateLog = (pid, id, data) => API.patch(`/projects/${pid}/logs/${id}/`, data);
export const deleteLog = (pid, id) => API.delete(`/projects/${pid}/logs/${id}/`);

// Thesis
export const getThesisChapters = (pid) => API.get(`/projects/${pid}/thesis/`);
export const saveThesisChapter = (pid, data) => API.post(`/projects/${pid}/thesis/by_key/`, data);

export default API;
