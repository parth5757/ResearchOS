import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProjects, getDashboard } from '../api';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (activeProject) {
      loadDashboard(activeProject.id);
      localStorage.setItem('activeProjectId', activeProject.id);
    }
  }, [activeProject]);

  const loadProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
      const savedId = localStorage.getItem('activeProjectId');
      if (savedId && res.data.length > 0) {
        const found = res.data.find(p => p.id === parseInt(savedId));
        setActiveProject(found || res.data[0]);
      } else if (res.data.length > 0) {
        setActiveProject(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadDashboard = async (id) => {
    try {
      const res = await getDashboard(id);
      setDashboard(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshDashboard = () => {
    if (activeProject) loadDashboard(activeProject.id);
  };

  return (
    <ProjectContext.Provider value={{
      projects, setProjects,
      activeProject, setActiveProject,
      dashboard, refreshDashboard,
      loading, loadProjects,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
