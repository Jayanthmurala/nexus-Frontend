import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { projectsApi, type ProjectAttachment, type CreateAttachmentRequest, type UpdateAttachmentRequest } from '@/lib/projectsApi';

interface AttachmentsState {
  byProjectId: Record<string, ProjectAttachment[]>;
  loadingByProjectId: Record<string, boolean>;
  errorByProjectId: Record<string, string | undefined>;
}

const initialState: AttachmentsState = {
  byProjectId: {},
  loadingByProjectId: {},
  errorByProjectId: {},
};

// Thunks
export const fetchProjectAttachments = createAsyncThunk<
  { projectId: string; attachments: ProjectAttachment[] },
  { projectId: string },
  { state: RootState }
>(
  'attachments/fetchProjectAttachments',
  async ({ projectId }) => {
    const { attachments } = await projectsApi.getProjectAttachments(projectId);
    return { projectId, attachments };
  },
  {
    condition: ({ projectId }, { getState }) => {
      const { loadingByProjectId } = (getState() as RootState).attachments;
      // Prevent duplicate in-flight requests for the same project
      return !loadingByProjectId[projectId];
    },
  }
);

export const createAttachmentThunk = createAsyncThunk<
  ProjectAttachment,
  { projectId: string; data: CreateAttachmentRequest }
>(
  'attachments/createAttachment',
  async ({ projectId, data }) => {
    const { attachment } = await projectsApi.createAttachment(projectId, data);
    return attachment;
  }
);

export const updateAttachmentThunk = createAsyncThunk<
  ProjectAttachment,
  { attachmentId: string; data: UpdateAttachmentRequest }
>(
  'attachments/updateAttachment',
  async ({ attachmentId, data }) => {
    const { attachment } = await projectsApi.updateAttachment(attachmentId, data);
    return attachment;
  }
);

export const deleteAttachmentThunk = createAsyncThunk<
  { projectId: string; attachmentId: string },
  { projectId: string; attachmentId: string }
>(
  'attachments/deleteAttachment',
  async ({ projectId, attachmentId }) => {
    await projectsApi.deleteAttachment(attachmentId);
    return { projectId, attachmentId };
  }
);

const attachmentsSlice = createSlice({
  name: 'attachments',
  initialState,
  reducers: {
    clearAttachmentsError(state, action: PayloadAction<{ projectId: string }>) {
      const { projectId } = action.payload;
      state.errorByProjectId[projectId] = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchProjectAttachments.pending, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = true;
        state.errorByProjectId[projectId] = undefined;
        try { console.debug('[attachmentsSlice] fetchProjectAttachments pending', { projectId }); } catch {}
      })
      .addCase(fetchProjectAttachments.fulfilled, (state, action) => {
        const { projectId, attachments } = action.payload;
        state.loadingByProjectId[projectId] = false;
        state.byProjectId[projectId] = attachments;
        try { console.debug('[attachmentsSlice] fetchProjectAttachments fulfilled', { projectId, count: attachments.length }); } catch {}
      })
      .addCase(fetchProjectAttachments.rejected, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = false;
        state.errorByProjectId[projectId] = action.error.message || 'Failed to load attachments';
        try { console.error('[attachmentsSlice] fetchProjectAttachments rejected', { projectId, error: action.error }); } catch {}
      })

      // Create
      .addCase(createAttachmentThunk.pending, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = true;
      })
      .addCase(createAttachmentThunk.fulfilled, (state, action: PayloadAction<ProjectAttachment>) => {
        const attachment = action.payload;
        state.loadingByProjectId[attachment.projectId] = false;
        const list = state.byProjectId[attachment.projectId] || [];
        state.byProjectId[attachment.projectId] = [attachment, ...list];
      })
      .addCase(createAttachmentThunk.rejected, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = false;
        state.errorByProjectId[projectId] = action.error.message || 'Failed to upload attachment';
      })

      // Update
      .addCase(updateAttachmentThunk.pending, (state) => {
        // no-op global loading; could add per-item if needed
      })
      .addCase(updateAttachmentThunk.fulfilled, (state, action: PayloadAction<ProjectAttachment>) => {
        const updated = action.payload;
        const list = state.byProjectId[updated.projectId] || [];
        const idx = list.findIndex((a) => a.id === updated.id);
        if (idx >= 0) {
          list[idx] = updated;
          state.byProjectId[updated.projectId] = [...list];
        }
      })
      .addCase(updateAttachmentThunk.rejected, (state, action) => {
        // optionally attach to errorByProjectId if we had projectId; skipping for now
      })

      // Delete
      .addCase(deleteAttachmentThunk.pending, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = true;
      })
      .addCase(deleteAttachmentThunk.fulfilled, (state, action) => {
        const { projectId, attachmentId } = action.payload;
        state.loadingByProjectId[projectId] = false;
        const list = state.byProjectId[projectId] || [];
        state.byProjectId[projectId] = list.filter((a) => a.id !== attachmentId);
      })
      .addCase(deleteAttachmentThunk.rejected, (state, action) => {
        const { projectId } = action.meta.arg;
        state.loadingByProjectId[projectId] = false;
        state.errorByProjectId[projectId] = action.error.message || 'Failed to delete attachment';
      });
  },
});

// Selectors
export const selectAttachmentsForProject = (state: RootState, projectId: string) => state.attachments.byProjectId[projectId] || [];
export const selectAttachmentsLoadingForProject = (state: RootState, projectId: string) => !!state.attachments.loadingByProjectId[projectId];
export const selectAttachmentsErrorForProject = (state: RootState, projectId: string) => state.attachments.errorByProjectId[projectId];

export const { clearAttachmentsError } = attachmentsSlice.actions;
export default attachmentsSlice.reducer;
