import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { PersonalProject } from '../../lib/profileApi';
import { profileApi } from '../../lib/profileApi';

export interface UIProject {
  id: string;
  title: string;
  description: string;
  tech?: string[];
  link?: string; // derived from demoLink/github for title href
  repo?: string; // maps to github
  demo?: string; // maps to demoLink
  image?: string;
  createdAt: string;
}

interface ProjectsState {
  items: UIProject[];
  loading: boolean;
  error?: string;
}

const initialState: ProjectsState = {
  items: [],
  loading: false,
};

function toUIProject(p: PersonalProject): UIProject {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    tech: p.technologies, // map technologies to tech for UI
    link: p.demoLink || p.github, // prefer demo as primary link
    repo: p.github,
    demo: p.demoLink,
    image: p.image,
    createdAt: p.createdAt,
  };
}

// Thunks
export const fetchMyProjects = createAsyncThunk<UIProject[], string>(
  'studentProjects/fetchMyProjects',
  async (userId) => {
    const list = await profileApi.getPersonalProjects(userId);
    return list.map(toUIProject);
  }
);

export const createStudentProject = createAsyncThunk<UIProject, { title: string; description: string; repo?: string; demo?: string; image?: string; tech?: string[] }>(
  'studentProjects/create',
  async (payload) => {
    const apiPayload = {
      title: payload.title,
      description: payload.description,
      github: payload.repo,
      demoLink: payload.demo,
      image: payload.image,
      technologies: payload.tech || [],
    };
    const created = await profileApi.createPersonalProject(apiPayload);
    return toUIProject(created);
  }
);

export const updateStudentProject = createAsyncThunk<UIProject, { id: string; changes: { title?: string; description?: string; repo?: string; demo?: string; image?: string; tech?: string[] } }>(
  'studentProjects/update',
  async ({ id, changes }) => {
    const apiChanges = {
      title: changes.title,
      description: changes.description,
      github: changes.repo,
      demoLink: changes.demo,
      image: changes.image,
      technologies: changes.tech,
    };
    const updated = await profileApi.updatePersonalProject(id, apiChanges);
    return toUIProject(updated);
  }
);

export const deleteStudentProject = createAsyncThunk<string, string>(
  'studentProjects/delete',
  async (id) => {
    await profileApi.deletePersonalProject(id);
    return id;
  }
);

const studentProjectsSlice = createSlice({
  name: 'studentProjects',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyProjects.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchMyProjects.fulfilled, (state, action: PayloadAction<UIProject[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMyProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load projects';
      })
      .addCase(createStudentProject.fulfilled, (state, action: PayloadAction<UIProject>) => {
        state.items = [action.payload, ...state.items];
      })
      .addCase(updateStudentProject.fulfilled, (state, action: PayloadAction<UIProject>) => {
        state.items = state.items.map((p) => (p.id === action.payload.id ? { ...p, ...action.payload } : p));
      })
      .addCase(deleteStudentProject.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export const selectStudentProjects = (state: RootState) => state.studentProjects.items;
export const selectStudentProjectsLoading = (state: RootState) => state.studentProjects.loading;

export default studentProjectsSlice.reducer;
