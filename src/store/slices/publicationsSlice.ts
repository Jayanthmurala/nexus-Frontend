import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { Publication } from '../../lib/profileApi';
import { profileApi } from '../../lib/profileApi';

interface PublicationsState {
  items: Publication[];
  publications: Publication[]; // Alias for profile components
  loading: boolean;
  error?: string;
}

const initialState: PublicationsState = {
  items: [],
  publications: [],
  loading: false,
};

export const fetchMyPublications = createAsyncThunk<Publication[]>(
  'publications/fetchMyPublications',
  async () => {
    return await profileApi.getMyPublications();
  }
);

// Fetch publications for any user (for profile viewing)
export const fetchPublications = createAsyncThunk<Publication[], string>(
  'publications/fetchPublications',
  async (userId) => {
    return await profileApi.getPublications(userId);
  }
);

export const createPublicationRecord = createAsyncThunk<Publication, Omit<Publication, 'id'>>(
  'publications/create',
  async (payload) => {
    const created = await profileApi.createPublication(payload);
    return created;
  }
);

export const updatePublicationRecord = createAsyncThunk<Publication, { id: string; changes: Partial<Publication> }>(
  'publications/update',
  async ({ id, changes }) => {
    const updated = await profileApi.updatePublication(id, changes);
    return updated;
  }
);

export const deletePublicationRecord = createAsyncThunk<string, string>(
  'publications/delete',
  async (id) => {
    await profileApi.deletePublication(id);
    return id;
  }
);

const publicationsSlice = createSlice({
  name: 'publications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPublications.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchMyPublications.fulfilled, (state, action: PayloadAction<Publication[]>) => {
        state.loading = false;
        state.items = [...action.payload].sort((a, b) => (b.year || 0) - (a.year || 0));
        state.publications = state.items;
      })
      .addCase(fetchMyPublications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load publications';
      })
      .addCase(fetchPublications.fulfilled, (state, action: PayloadAction<Publication[]>) => {
        state.loading = false;
        state.items = [...action.payload].sort((a, b) => (b.year || 0) - (a.year || 0));
        state.publications = state.items;
      })
      .addCase(createPublicationRecord.fulfilled, (state, action: PayloadAction<Publication>) => {
        state.items = [action.payload, ...state.items];
        state.publications = state.items;
      })
      .addCase(updatePublicationRecord.fulfilled, (state, action: PayloadAction<Publication>) => {
        state.items = state.items.map((p: Publication) => (p.id === action.payload.id ? { ...p, ...action.payload } : p));
        state.publications = state.items;
      })
      .addCase(deletePublicationRecord.fulfilled, (state, action: PayloadAction<string>) => {
        const index = state.items.findIndex((p: Publication) => p.id === action.payload);
        if (index !== -1) {
          state.items.splice(index, 1);
          state.publications = state.items;
        }
      });
  },
});

export const selectPublications = (state: RootState) => state.publications.items;
export const selectPublicationsLoading = (state: RootState) => state.publications.loading;
export const selectPublicationsError = (state: RootState) => state.publications.error;

export default publicationsSlice.reducer;
