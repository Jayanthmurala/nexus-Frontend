import httpProjects from './httpProjects';
import httpProfile from './httpProfile';
import { projectsApi, Project } from './projectsApi';

export interface SearchResult {
  id: string;
  title: string;
  type: 'project' | 'faculty' | 'student';
  subtitle: string;
  department: string;
  avatar?: string;
  url?: string;
}

export interface GlobalSearchResponse {
  projects: SearchResult[];
  faculty: SearchResult[];
  students: SearchResult[];
  total: number;
}

export const searchApi = {
  async globalSearch(query: string): Promise<GlobalSearchResponse> {
    if (!query.trim()) {
      return { projects: [], faculty: [], students: [], total: 0 };
    }

    try {
      // Search projects
      const projectsResponse = await projectsApi.listProjects({
        q: query,
        limit: 5
      });

      const projects: SearchResult[] = projectsResponse.projects.map(project => ({
        id: project.id,
        title: project.title,
        type: 'project' as const,
        subtitle: `${project.authorName} • ${project.departments.join(', ')}`,
        department: project.departments[0] || '',
        avatar: project.authorAvatar || undefined,
        url: `/projects/${project.id}`
      }));

      // Search faculty and students via profile service
      const profilesResponse = await httpProfile.get('/v1/profiles', {
        params: {
          search: query,
          limit: 10
        }
      });

      const faculty: SearchResult[] = [];
      const students: SearchResult[] = [];

      profilesResponse.data.profiles?.forEach((profile: any) => {
        const searchResult: SearchResult = {
          id: profile.userId,
          title: profile.displayName || profile.name || 'Unknown User',
          type: profile.roles?.includes('FACULTY') ? 'faculty' : 'student',
          subtitle: `${profile.department || 'Unknown Department'}${profile.year ? ` • Year ${profile.year}` : ''}`,
          department: profile.department || '',
          avatar: profile.avatarUrl || undefined,
          url: `/profile/${profile.userId}`
        };

        if (profile.roles?.includes('FACULTY')) {
          faculty.push(searchResult);
        } else {
          students.push(searchResult);
        }
      });

      return {
        projects,
        faculty: faculty.slice(0, 3),
        students: students.slice(0, 3),
        total: projects.length + faculty.length + students.length
      };
    } catch (error) {
      console.error('Global search error:', error);
      return { projects: [], faculty: [], students: [], total: 0 };
    }
  },

  async searchProjects(query: string, filters?: {
    department?: string;
    skills?: string[];
    projectType?: string;
  }): Promise<Project[]> {
    try {
      const response = await projectsApi.listProjects({
        q: query,
        projectType: filters?.projectType,
        limit: 20
      });
      return response.projects;
    } catch (error) {
      console.error('Project search error:', error);
      return [];
    }
  }
};

export default searchApi;
