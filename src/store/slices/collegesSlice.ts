import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getColleges, type College } from '@/lib/profileApi';

interface CollegesState {
  items: College[];
  loading: boolean;
  error?: string;
}

const initialState: CollegesState = {
  items: [],
  loading: false,
};

export const fetchColleges = createAsyncThunk<College[]>(
  'colleges/fetchColleges',
  async () => {
    return await getColleges();
  }
);

const collegesSlice = createSlice({
  name: 'colleges',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchColleges.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchColleges.fulfilled, (state, action: PayloadAction<College[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchColleges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load colleges';
      });
  },
});

export const selectColleges = (state: RootState) => state.colleges.items;
export const selectCollegesLoading = (state: RootState) => state.colleges.loading;

export default collegesSlice.reducer;
