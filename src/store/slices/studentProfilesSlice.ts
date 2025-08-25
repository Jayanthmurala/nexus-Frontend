import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getProfileByUserId, type Profile } from '@/lib/profileApi';

interface StudentProfilesState {
  byId: Record<string, Profile | null | undefined>;
  loading: Record<string, boolean>;
  error: Record<string, string | undefined>;
}

const initialState: StudentProfilesState = {
  byId: {},
  loading: {},
  error: {},
};

export const fetchStudentProfileById = createAsyncThunk<
  { userId: string; profile: Profile | null },
  string
>('studentProfiles/fetchById', async (userId) => {
  const profile = await getProfileByUserId(userId);
  return { userId, profile };
});

const studentProfilesSlice = createSlice({
  name: 'studentProfiles',
  initialState,
  reducers: {
    clearStudentProfileError: (state, action: PayloadAction<string>) => {
      delete state.error[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentProfileById.pending, (state, action) => {
        const userId = action.meta.arg;
        state.loading[userId] = true;
        state.error[userId] = undefined;
      })
      .addCase(
        fetchStudentProfileById.fulfilled,
        (state, action: PayloadAction<{ userId: string; profile: Profile | null }>) => {
          const { userId, profile } = action.payload;
          state.loading[userId] = false;
          state.byId[userId] = profile;
        }
      )
      .addCase(fetchStudentProfileById.rejected, (state, action) => {
        const userId = action.meta.arg as string;
        state.loading[userId] = false;
        state.error[userId] = action.error.message || 'Failed to load profile';
      });
  },
});

export const selectStudentProfileById = (state: RootState, userId: string) =>
  state.studentProfiles.byId[userId] ?? null;
export const selectStudentProfileLoadingById = (state: RootState, userId: string) =>
  Boolean(state.studentProfiles.loading[userId]);
export const selectStudentProfileErrorById = (state: RootState, userId: string) =>
  state.studentProfiles.error[userId];

export const { clearStudentProfileError } = studentProfilesSlice.actions;

export default studentProfilesSlice.reducer;
