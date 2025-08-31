import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { projectsApi, Project, CreateProjectRequest, UpdateProjectRequest, ProjectsListParams, ProjectsListResponse } from '@/lib/projectsApi';
import type { PersonalProject } from '@/lib/profileApi';

interface ProjectsState {
  items: Project[];
  personalProjects: PersonalProject[]; // Personal projects from profile service
  loading: boolean;
  error?: string;
  pagination: {
    page: number;
    total: number;
  };
}

const initialState: ProjectsState = {
  items: [],
  personalProjects: [],
  loading: false,
  pagination: {
    page: 1,
    total: 0,
  },
};

// Async thunks
export const fetchMyProjects = createAsyncThunk<Project[]>(
  'projects/fetchMyProjects',
  async () => {
    const response = await projectsApi.getMyProjects();
    return response.projects;
  }
);

// Personal projects for profile pages
export const fetchMyPersonalProjects = createAsyncThunk<PersonalProject[]>(
  'projects/fetchMyPersonalProjects',
  async () => {
    const { profileApi } = await import('@/lib/profileApi');
    return await profileApi.getMyPersonalProjects();
  }
);

// Alias for profile components
export const fetchPersonalProjects = fetchMyProjects;

export const fetchProjects = createAsyncThunk<ProjectsListResponse, ProjectsListParams | undefined>(
  'projects/fetchProjects',
  async (params) => {
    return await projectsApi.listProjects(params);
  }
);

export const createProject = createAsyncThunk<Project, CreateProjectRequest>(
  'projects/create',
  async (payload) => {
    const response = await projectsApi.createProject(payload);
    return response.project;
  }
);

export const updateProject = createAsyncThunk<Project, { id: string; changes: UpdateProjectRequest }>(
  'projects/update',
  async ({ id, changes }) => {
    const response = await projectsApi.updateProject(id, changes);
    return response.project;
  }
);

export const deleteProject = createAsyncThunk<string, string>(
  'projects/delete',
  async (id) => {
    await projectsApi.deleteProject(id);
    return id;
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = undefined;
    },
    resetPagination: (state) => {
      state.pagination = { page: 1, total: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my projects
      .addCase(fetchMyProjects.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchMyProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMyProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load projects';
      })
      
      // Fetch personal projects for profile pages
      .addCase(fetchMyPersonalProjects.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchMyPersonalProjects.fulfilled, (state, action: PayloadAction<PersonalProject[]>) => {
        state.loading = false;
        state.personalProjects = action.payload;
      })
      .addCase(fetchMyPersonalProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load personal projects';
      })
      
      // Fetch projects with pagination
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = undefined;
        try { console.debug('[projectsSlice] fetchProjects pending'); } catch {}
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<ProjectsListResponse>) => {
        state.loading = false;
        state.items = action.payload.projects;
        state.pagination = {
          page: action.payload.page,
          total: action.payload.total,
        };
        try {
          console.debug('[projectsSlice] fetchProjects fulfilled', {
            page: action.payload.page,
            total: action.payload.total,
            count: action.payload.projects.length,
            sample: action.payload.projects[0]
              ? {
                  id: action.payload.projects[0].id,
                  authorId: action.payload.projects[0].authorId,
                  progressStatus: action.payload.projects[0].progressStatus,
                }
              : null,
          });
        } catch {}
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load projects';
        try { console.error('[projectsSlice] fetchProjects rejected', action.error); } catch {}
      })
      
      // Create project
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(createProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.loading = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create project';
      })
      
      // Update project
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(updateProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.loading = false;
        state.items = state.items.map((p) => 
          p.id === action.payload.id ? action.payload : p
        );
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update project';
      })
      
      // Delete project
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.items = state.items.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete project';
      });
  },
});

// Selectors
export const selectProjects = (state: RootState) => state.projects.items;
export const selectProjectsLoading = (state: RootState) => state.projects.loading;
export const selectProjectsError = (state: RootState) => state.projects.error;
export const selectProjectsPagination = (state: RootState) => state.projects.pagination;

// Actions
export const { clearError, resetPagination } = projectsSlice.actions;

export default projectsSlice.reducer;
