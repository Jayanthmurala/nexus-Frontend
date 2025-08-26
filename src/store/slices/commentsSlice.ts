import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { projectsApi, type Comment } from '@/lib/projectsApi';

interface CommentsState {
  byProjectId: Record<string, Comment[]>;
  byTaskId: Record<string, Comment[]>;
  loadingByProjectId: Record<string, boolean>;
  loadingByTaskId: Record<string, boolean>;
  errorByProjectId: Record<string, string | undefined>;
  errorByTaskId: Record<string, string | undefined>;
}

const initialState: CommentsState = {
  byProjectId: {},
  byTaskId: {},
  loadingByProjectId: {},
  loadingByTaskId: {},
  errorByProjectId: {},
  errorByTaskId: {},
};

// Thunks
export const fetchComments = createAsyncThunk<
  { projectId: string; taskId?: string; comments: Comment[] },
  { projectId: string; taskId?: string },
  { state: RootState }
>(
  'comments/fetch',
  async ({ projectId, taskId }) => {
    const { comments } = await projectsApi.getProjectComments(projectId, taskId);
    return { projectId, taskId, comments };
  },
  {
    condition: ({ projectId, taskId }, { getState }) => {
      const state = (getState() as RootState).comments;
      // Prevent duplicate in-flight requests per project or task
      return taskId ? !state.loadingByTaskId[taskId] : !state.loadingByProjectId[projectId];
    },
  }
);

export const createCommentThunk = createAsyncThunk<
  { comment: Comment; projectId: string; taskId?: string },
  { projectId: string; body: string; taskId?: string }
>(
  'comments/create',
  async ({ projectId, body, taskId }) => {
    const { comment } = await projectsApi.createComment(projectId, body, taskId);
    return { comment, projectId, taskId };
  }
);

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearCommentsError(state, action: PayloadAction<{ projectId?: string; taskId?: string }>) {
      const { projectId, taskId } = action.payload || {};
      if (taskId) delete state.errorByTaskId[taskId];
      if (projectId) delete state.errorByProjectId[projectId];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchComments.pending, (state, action) => {
        const { projectId, taskId } = action.meta.arg;
        if (taskId) state.loadingByTaskId[taskId] = true; else state.loadingByProjectId[projectId] = true;
        if (taskId) state.errorByTaskId[taskId] = undefined; else state.errorByProjectId[projectId] = undefined;
        try { console.debug('[commentsSlice] fetch pending', { projectId, taskId }); } catch {}
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { projectId, taskId, comments } = action.payload;
        if (taskId) {
          state.loadingByTaskId[taskId] = false;
          state.byTaskId[taskId] = comments;
        } else {
          state.loadingByProjectId[projectId] = false;
          state.byProjectId[projectId] = comments;
        }
        try { console.debug('[commentsSlice] fetch fulfilled', { projectId, taskId, count: comments.length }); } catch {}
      })
      .addCase(fetchComments.rejected, (state, action) => {
        const { projectId, taskId } = action.meta.arg;
        if (taskId) {
          state.loadingByTaskId[taskId] = false;
          state.errorByTaskId[taskId] = action.error.message || 'Failed to load comments';
        } else {
          state.loadingByProjectId[projectId] = false;
          state.errorByProjectId[projectId] = action.error.message || 'Failed to load comments';
        }
        try { console.error('[commentsSlice] fetch rejected', { projectId, taskId, error: action.error }); } catch {}
      })

      // Create
      .addCase(createCommentThunk.pending, (state, action) => {
        const { projectId, taskId } = action.meta.arg;
        if (taskId) state.loadingByTaskId[taskId] = true; else state.loadingByProjectId[projectId] = true;
      })
      .addCase(createCommentThunk.fulfilled, (state, action) => {
        const { comment, projectId, taskId } = action.payload;
        if (taskId) {
          state.loadingByTaskId[taskId] = false;
          const list = state.byTaskId[taskId] || [];
          state.byTaskId[taskId] = [comment, ...list];
        } else {
          state.loadingByProjectId[projectId] = false;
          const list = state.byProjectId[projectId] || [];
          state.byProjectId[projectId] = [comment, ...list];
        }
      })
      .addCase(createCommentThunk.rejected, (state, action) => {
        const { projectId, taskId } = action.meta.arg;
        const msg = action.error.message || 'Failed to create comment';
        if (taskId) {
          state.loadingByTaskId[taskId] = false;
          state.errorByTaskId[taskId] = msg;
        } else {
          state.loadingByProjectId[projectId] = false;
          state.errorByProjectId[projectId] = msg;
        }
      });
  },
});

// Selectors
export const selectCommentsForProject = (state: RootState, projectId: string) => state.comments.byProjectId[projectId] || [];
export const selectCommentsForTask = (state: RootState, taskId: string) => state.comments.byTaskId[taskId] || [];
export const selectCommentsLoadingForProject = (state: RootState, projectId: string) => !!state.comments.loadingByProjectId[projectId];
export const selectCommentsLoadingForTask = (state: RootState, taskId: string) => !!state.comments.loadingByTaskId[taskId];

export const { clearCommentsError } = commentsSlice.actions;
export default commentsSlice.reducer;
