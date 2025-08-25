import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getMyProfile, upsertMyProfile, type Profile, type ProfilePayload } from '@/lib/profileApi';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error?: string;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
};

export const fetchMyProfile = createAsyncThunk<Profile | null>(
  'profile/fetchMyProfile',
  async () => {
    return await getMyProfile();
  }
);

// Save partial fields by merging with existing profile to satisfy required fields
export const saveMyProfile = createAsyncThunk<
  Profile,
  Partial<Pick<ProfilePayload, 'skills' | 'expertise' | 'linkedIn' | 'github' | 'twitter' | 'resumeUrl' | 'bio' | 'avatar' | 'contactInfo' | 'collegeMemberId' | 'year'>>
>(
  'profile/saveMyProfile',
  async (changes, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const existing = state.profile.profile;
    if (!existing?.collegeId || !existing?.department) {
      return rejectWithValue('Cannot upsert profile without existing collegeId and department');
    }
    // Sanitize incoming changes: convert nulls to undefined to satisfy backend zod schema
    // and avoid sending fields like avatar: null which trigger 400 errors.
    const sanitized = { ...changes } as any;
    const nullables = [
      'skills',
      'expertise',
      'linkedIn',
      'github',
      'twitter',
      'resumeUrl',
      'bio',
      'avatar',
      'contactInfo',
      'collegeMemberId',
      'year',
    ];
    for (const k of nullables) {
      if (sanitized[k] === null) sanitized[k] = undefined;
    }
    const payload: ProfilePayload = {
      collegeId: existing.collegeId,
      department: existing.department,
      year: typeof sanitized.year !== 'undefined' ? sanitized.year : (typeof existing.year === 'number' ? existing.year : undefined),
      skills: typeof sanitized.skills !== 'undefined' ? sanitized.skills : (Array.isArray(existing.skills) ? existing.skills : undefined),
      expertise: typeof sanitized.expertise !== 'undefined' ? sanitized.expertise : (Array.isArray((existing as any).expertise) ? (existing as any).expertise : undefined),
      linkedIn: typeof sanitized.linkedIn !== 'undefined' ? sanitized.linkedIn : (typeof existing.linkedIn === 'string' ? existing.linkedIn : undefined),
      github: typeof sanitized.github !== 'undefined' ? sanitized.github : (typeof existing.github === 'string' ? existing.github : undefined),
      twitter: typeof sanitized.twitter !== 'undefined' ? sanitized.twitter : (typeof (existing as any).twitter === 'string' ? (existing as any).twitter : undefined),
      resumeUrl: typeof sanitized.resumeUrl !== 'undefined' ? sanitized.resumeUrl : (typeof existing.resumeUrl === 'string' ? existing.resumeUrl : undefined),
      bio: typeof sanitized.bio !== 'undefined' ? sanitized.bio : (typeof existing.bio === 'string' ? existing.bio : undefined),
      avatar: typeof sanitized.avatar !== 'undefined' ? sanitized.avatar : (typeof (existing as any).avatar === 'string' ? (existing as any).avatar : undefined),
      contactInfo: typeof sanitized.contactInfo !== 'undefined' ? sanitized.contactInfo : (typeof (existing as any).contactInfo === 'string' ? (existing as any).contactInfo : undefined),
      collegeMemberId: typeof sanitized.collegeMemberId !== 'undefined' ? sanitized.collegeMemberId : (typeof (existing as any).collegeMemberId === 'string' ? (existing as any).collegeMemberId : undefined),
    };
    const updated = await upsertMyProfile(payload);
    return updated;
  }
);

// Initialize profile for first-time users: requires collegeId and department
export const initializeMyProfile = createAsyncThunk<
  Profile,
  Pick<ProfilePayload, 'collegeId' | 'department'> & Partial<Pick<ProfilePayload, 'year' | 'skills' | 'expertise' | 'linkedIn' | 'github' | 'twitter' | 'resumeUrl' | 'bio' | 'avatar' | 'contactInfo' | 'collegeMemberId'>>
>(
  'profile/initializeMyProfile',
  async (payload) => {
    const created = await upsertMyProfile(payload);
    return created;
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyProfile.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchMyProfile.fulfilled, (state, action: PayloadAction<Profile | null>) => {
        state.loading = false;
        state.profile = action.payload ?? null;
      })
      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load profile';
      })
      .addCase(saveMyProfile.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.profile = action.payload;
      })
      .addCase(saveMyProfile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || 'Failed to save profile';
      })
      .addCase(initializeMyProfile.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(initializeMyProfile.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(initializeMyProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to initialize profile';
      });
  },
});

export const selectProfile = (state: RootState) => state.profile.profile;
export const selectProfileLoading = (state: RootState) => state.profile.loading;

export default profileSlice.reducer;
