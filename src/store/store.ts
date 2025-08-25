import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import bannerReducer from './slices/bannerSlice';
import studentProjectsReducer from './slices/studentProjectsSlice';
import publicationsReducer from './slices/publicationsSlice';
import profileReducer from './slices/profileSlice';
import badgesReducer from './slices/badgesSlice';
import collegesReducer from './slices/collegesSlice';
import projectsReducer from './slices/projectsSlice';
import studentProfilesReducer from './slices/studentProfilesSlice';
import applicationsReducer from './slices/applicationsSlice';
import commentsReducer from './slices/commentsSlice';
import tasksReducer from './slices/tasksSlice';
import attachmentsReducer from './slices/attachmentsSlice';
import eventsReducer from './slices/eventsSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    banner: bannerReducer,
    studentProjects: studentProjectsReducer,
    publications: publicationsReducer,
    profile: profileReducer,
    badges: badgesReducer,
    colleges: collegesReducer,
    projects: projectsReducer,
    studentProfiles: studentProfilesReducer,
    applications: applicationsReducer,
    comments: commentsReducer,
    tasks: tasksReducer,
    attachments: attachmentsReducer,
    events: eventsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
