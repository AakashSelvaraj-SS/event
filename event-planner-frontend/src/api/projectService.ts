import { mockProjects } from '../mock/mockData';

// Mock service for Project Data
export const projectService = {
  getProjects: async () => {
    return new Promise((resolve) => setTimeout(() => resolve(mockProjects), 800));
  },
  
  saveProject: async (projectData: any) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
  }
};
