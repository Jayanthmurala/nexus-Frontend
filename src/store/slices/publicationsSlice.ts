import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { PublicationRecord, CreatePublicationPayload, UpdatePublicationPayload } from '@/lib/profileApi';
import { getMyPublications, createPublication, updatePublication, deletePublication } from '@/lib/profileApi';

interface PublicationsState {
  items: PublicationRecord[];
  loading: boolean;
  error?: string;
}

const initialState: PublicationsState = {
  items: [],
  loading: false,
};

export const fetchMyPublications = createAsyncThunk<PublicationRecord[]>(
  'publications/fetchMyPublications',
  async () => {
    const list = await getMyPublications();
    return list;
  }
);

export const createPublicationRecord = createAsyncThunk<PublicationRecord, CreatePublicationPayload>(
  'publications/create',
  async (payload) => {
    const created = await createPublication(payload);
    return created;
  }
);

export const updatePublicationRecord = createAsyncThunk<PublicationRecord, { id: string; changes: UpdatePublicationPayload }>(
  'publications/update',
  async ({ id, changes }) => {
    const updated = await updatePublication(id, changes);
    return updated;
  }
);

export const deletePublicationRecord = createAsyncThunk<string, string>(
  'publications/delete',
  async (id) => {
    await deletePublication(id);
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
      .addCase(fetchMyPublications.fulfilled, (state, action: PayloadAction<PublicationRecord[]>) => {
        state.loading = false;
        // backend already returns sorted by year desc, but ensure deterministic order
        state.items = [...action.payload].sort((a, b) => (b.year || 0) - (a.year || 0));
      })
      .addCase(fetchMyPublications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load publications';
      })
      .addCase(createPublicationRecord.fulfilled, (state, action: PayloadAction<PublicationRecord>) => {
        state.items = [action.payload, ...state.items];
      })
      .addCase(updatePublicationRecord.fulfilled, (state, action: PayloadAction<PublicationRecord>) => {
        state.items = state.items.map((p) => (p.id === action.payload.id ? { ...p, ...action.payload } : p));
      })
      .addCase(deletePublicationRecord.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export const selectPublications = (state: RootState) => state.publications.items;
export const selectPublicationsLoading = (state: RootState) => state.publications.loading;
export const selectPublicationsError = (state: RootState) => state.publications.error;

export default publicationsSlice.reducer;
