import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { projectsApi, type ProjectTask, type CreateTaskRequest, type UpdateTaskRequest } from '@/lib/projectsApi';

interface TasksState {
  byProjectId: Record<string, ProjectTask[]>;
  loadingByProjectId: Record<string, boolean>;
  errorByProjectId: Record<string, string | undefined>;
}

const initialState: TasksState = {
  byProjectId: {},
  loadingByProjectId: {},
  errorByProjectId: {},
};

// Thunks
export const fetchProjectTasks = createAsyncThunk<
  { projectId: string; tasks: ProjectTask[] },
  { projectId: string },
  { state: RootState }
>(
  'tasks/fetchProjectTasks',
  async ({ projectId }) => {
    const { tasks } = await projectsApi.getProjectTasks(projectId);
    return { projectId, tasks };
  },
  {
    condition: ({ projectId }, { getState }) => {
      const { loadingByProjectId } = (getState() as RootState).tasks;
      // Prevent duplicate in-flight requests for the same project
      return !loadingByProjectId[projectId];
    },
  }
);

export const createTaskThunk = createAsyncThunk<ProjectTask, { projectId: string; data: CreateTaskRequest }>(
  'tasks/createTask',
  async ({ projectId, data }) => {
    const { task } = await projectsApi.createTask(projectId, data);
    return task;
  }
);

export const updateTaskThunk = createAsyncThunk<ProjectTask, { taskId: string; changes: UpdateTaskRequest }>(
  'tasks/updateTask',
  async ({ taskId, changes }) => {
    const { task } = await projectsApi.updateTask(taskId, changes);
    return task;
  }
);

export const deleteTaskThunk = createAsyncThunk<
  { taskId: string; projectId: string },
  { taskId: string; projectId: string }
>(
  'tasks/deleteTask',
  async ({ taskId, projectId }) => {
    await projectsApi.deleteTask(taskId);
    return { taskId, projectId };
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasksError(state, action: PayloadAction<{ projectId: string }>) {
      const { projectId } = action.payload;
      state.errorByProjectId[projectId] = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchProjectTasks.pending, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = true;
        state.errorByProjectId[projectId] = undefined;
        try { console.debug('[tasksSlice] fetchProjectTasks pending', { projectId }); } catch {}
      })
      .addCase(fetchProjectTasks.fulfilled, (state, action) => {
        const { projectId, tasks } = action.payload;
        state.loadingByProjectId[projectId] = false;
        state.byProjectId[projectId] = tasks;
        try { console.debug('[tasksSlice] fetchProjectTasks fulfilled', { projectId, count: tasks.length }); } catch {}
      })
      .addCase(fetchProjectTasks.rejected, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = false;
        state.errorByProjectId[projectId] = action.error.message || 'Failed to load tasks';
        try { console.error('[tasksSlice] fetchProjectTasks rejected', { projectId, error: action.error }); } catch {}
      })

      // Create
      .addCase(createTaskThunk.pending, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = true;
      })
      .addCase(createTaskThunk.fulfilled, (state, action: PayloadAction<ProjectTask>) => {
        const task = action.payload;
        state.loadingByProjectId[task.projectId] = false;
        const list = state.byProjectId[task.projectId] || [];
        state.byProjectId[task.projectId] = [task, ...list];
      })
      .addCase(createTaskThunk.rejected, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = false;
        state.errorByProjectId[projectId] = action.error.message || 'Failed to create task';
      })

      // Update
      .addCase(updateTaskThunk.fulfilled, (state, action: PayloadAction<ProjectTask>) => {
        const task = action.payload;
        const list = state.byProjectId[task.projectId] || [];
        state.byProjectId[task.projectId] = list.map((t) => (t.id === task.id ? task : t));
      })
      .addCase(updateTaskThunk.rejected, (_state, action) => {
        try { console.error('[tasksSlice] updateTask rejected', action.error); } catch {}
      })

      // Delete
      .addCase(deleteTaskThunk.fulfilled, (state, action) => {
        const { taskId, projectId } = action.payload;
        const list = state.byProjectId[projectId] || [];
        state.byProjectId[projectId] = list.filter((t) => t.id !== taskId);
      })
      .addCase(deleteTaskThunk.rejected, (_state, action) => {
        try { console.error('[tasksSlice] deleteTask rejected', action.error); } catch {}
      });
  },
});

// Selectors
export const selectTasksForProject = (state: RootState, projectId: string) => state.tasks.byProjectId[projectId] || [];
export const selectTasksLoadingForProject = (state: RootState, projectId: string) => !!state.tasks.loadingByProjectId[projectId];
export const selectTasksErrorForProject = (state: RootState, projectId: string) => state.tasks.errorByProjectId[projectId];

export const { clearTasksError } = tasksSlice.actions;
export default tasksSlice.reducer;
