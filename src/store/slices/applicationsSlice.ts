import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { projectsApi, type Application } from '@/lib/projectsApi';

interface ApplicationsState {
  byProjectId: Record<string, Application[]>;
  mine: Application[];
  loadingByProjectId: Record<string, boolean>;
  loadingMine: boolean;
  errorByProjectId: Record<string, string | undefined>;
  errorMine?: string;
}

const initialState: ApplicationsState = {
  byProjectId: {},
  mine: [],
  loadingByProjectId: {},
  loadingMine: false,
  errorByProjectId: {},
  errorMine: undefined,
};

// Thunks
export const fetchProjectApplications = createAsyncThunk<
  { projectId: string; applications: Application[] },
  { projectId: string; status?: string }
>(
  'applications/fetchProjectApplications',
  async ({ projectId, status }) => {
    const { applications } = await projectsApi.getProjectApplications(projectId, status);
    return { projectId, applications };
  }
);

export const fetchMyApplications = createAsyncThunk<Application[], string | undefined>(
  'applications/fetchMyApplications',
  async (status) => {
    const { applications } = await projectsApi.getMyApplications(status);
    return applications ?? [];
  }
);

export const applyToProject = createAsyncThunk<Application, { projectId: string; message?: string }>(
  'applications/applyToProject',
  async ({ projectId, message }) => {
    const { application } = await projectsApi.applyToProject(projectId, { message });
    return application;
  }
);

export const updateApplicationStatusThunk = createAsyncThunk<
  Application,
  { applicationId: string; status: 'ACCEPTED' | 'REJECTED' | 'PENDING' }
>(
  'applications/updateStatus',
  async ({ applicationId, status }) => {
    const { application } = await projectsApi.updateApplicationStatus(applicationId, { status });
    return application;
  }
);

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearApplicationsError(state, action: PayloadAction<{ projectId?: string } | undefined>) {
      const projectId = action.payload?.projectId;
      if (projectId) delete state.errorByProjectId[projectId];
      else state.errorMine = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch project applications
      .addCase(fetchProjectApplications.pending, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = true;
        state.errorByProjectId[projectId] = undefined;
        try { console.debug('[applicationsSlice] fetchProjectApplications pending', { projectId }); } catch {}
      })
      .addCase(fetchProjectApplications.fulfilled, (state, action) => {
        const { projectId, applications } = action.payload;
        state.loadingByProjectId[projectId] = false;
        state.byProjectId[projectId] = applications;
        try { console.debug('[applicationsSlice] fetchProjectApplications fulfilled', { projectId, count: applications.length }); } catch {}
      })
      .addCase(fetchProjectApplications.rejected, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = false;
        state.errorByProjectId[projectId] = action.error.message || 'Failed to load applications';
        try { console.error('[applicationsSlice] fetchProjectApplications rejected', { projectId, error: action.error }); } catch {}
      })

      // Fetch my applications
      .addCase(fetchMyApplications.pending, (state) => {
        state.loadingMine = true;
        state.errorMine = undefined;
        try { console.debug('[applicationsSlice] fetchMyApplications pending'); } catch {}
      })
      .addCase(fetchMyApplications.fulfilled, (state, action: PayloadAction<Application[]>) => {
        state.loadingMine = false;
        state.mine = action.payload;
        try { console.debug('[applicationsSlice] fetchMyApplications fulfilled', { count: action.payload.length }); } catch {}
      })
      .addCase(fetchMyApplications.rejected, (state, action) => {
        state.loadingMine = false;
        state.errorMine = action.error.message || 'Failed to load my applications';
        try { console.error('[applicationsSlice] fetchMyApplications rejected', action.error); } catch {}
      })

      // Apply to project
      .addCase(applyToProject.pending, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = true;
      })
      .addCase(applyToProject.fulfilled, (state, action: PayloadAction<Application>) => {
        const app = action.payload;
        state.loadingByProjectId[app.projectId] = false;
        // Update mine
        state.mine = [...state.mine, app];
        // Update per-project list
        const list = state.byProjectId[app.projectId] || [];
        state.byProjectId[app.projectId] = [app, ...list];
      })
      .addCase(applyToProject.rejected, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = false;
        state.errorByProjectId[projectId] = action.error.message || 'Failed to apply to project';
      })

      // Update application status
      .addCase(updateApplicationStatusThunk.fulfilled, (state, action: PayloadAction<Application>) => {
        const updated = action.payload;
        // Update mine
        state.mine = state.mine.map((a) => (a.id === updated.id ? updated : a));
        // Update by project
        const list = state.byProjectId[updated.projectId] || [];
        state.byProjectId[updated.projectId] = list.map((a) => (a.id === updated.id ? updated : a));
      })
      .addCase(updateApplicationStatusThunk.rejected, (_state, action) => {
        try { console.error('[applicationsSlice] updateApplicationStatus rejected', action.error); } catch {}
      });
  },
});

// Selectors
export const selectApplicationsForProject = (state: RootState, projectId: string) =>
  state.applications.byProjectId[projectId] || [];

export const selectApplicationsLoadingForProject = (state: RootState, projectId: string) =>
  !!state.applications.loadingByProjectId[projectId];

export const selectMyApplications = (state: RootState) => state.applications.mine;
export const selectMyApplicationsLoading = (state: RootState) => state.applications.loadingMine;
export const selectMyApplicationsError = (state: RootState) => state.applications.errorMine;

// Actions
export const { clearApplicationsError } = applicationsSlice.actions;

export default applicationsSlice.reducer;
