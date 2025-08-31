# Faculty Profile Bio Saving Fix Documentation

## Overview
This document details the comprehensive fix implemented for the Faculty Profile bio saving functionality, including backend schema corrections and data flow improvements.

## Problem Summary
The bio saving feature was failing due to:
1. **Schema Mismatch**: `year` and `department` fields were incorrectly included in the Profile model instead of the User model
2. **Incorrect Data Routing**: All profile update data was being sent to profile service only
3. **Missing Error Handling**: Limited debugging capabilities across the data flow

## Solution Architecture

### Data Model Separation
**User Model Fields** (Auth Service):
- `displayName`: User's display name
- `avatarUrl`: Profile picture URL  
- `year`: Academic year (1-6 for students)
- `department`: Department name

**Profile Model Fields** (Profile Service):
- `bio`: User biography
- `skills`: Skills array (for students)
- `expertise`: Expertise array (for faculty)
- `linkedIn`, `github`, `twitter`: Social media URLs
- `resumeUrl`: Resume/CV URL
- `contactInfo`: Contact information
- `phoneNumber`: Phone number
- `alternateEmail`: Alternative email

### Backend Changes

#### 1. Profile Service Schema Fix
**File**: `nexusbackend/profile-service/prisma/schema.prisma`
- Removed `year` and `department` fields from Profile model
- Added `expertise` field for faculty members

#### 2. Profile Route Update
**File**: `nexusbackend/profile-service/src/routes/profile.routes.ts`
- Modified `PUT /v1/profile/me` endpoint to separate user and profile fields
- User fields (`displayName`, `avatarUrl`, `year`, `department`) are sent to auth service
- Profile fields are updated in profile service via Prisma upsert

```typescript
// Separate user model fields from profile fields
const { displayName, avatarUrl, year, department, ...profileData } = data;

// Update user fields via auth service
if (displayName || avatarUrl || year !== undefined || department) {
  await axios.put(`${authServiceUrl}/v1/users/${userId}`, updateData, { headers });
}

// Update profile fields in profile service
const profile = await prisma.profile.upsert({
  where: { userId },
  update: profileData,
  create: { userId, ...profileData }
});
```

### Frontend Improvements

#### 1. Enhanced Error Handling
**Files**: 
- `nexus/src/components/Profile/AboutTab.tsx`
- `nexus/src/components/Profile/FacultyProfile.tsx`

- Removed duplicate toast notifications
- Added proper loading state management
- Memoized update handlers to prevent unnecessary re-renders

#### 2. Debug Logging
**Files**:
- `nexus/src/lib/profileApi.ts`
- `nexus/src/lib/httpProfile.ts`

- Added comprehensive debug logging for API requests/responses
- Enhanced token management debugging
- Request/response tracing for bio saving operations

#### 3. Network Integration
**File**: `nexus/src/components/Profile/FacultyProfile.tsx`
- Integrated with network service API for real follower/following counts
- Added graceful fallback for network API failures
- Updated ProfileStats component with live data

## Data Flow

### Bio Saving Process
1. **Frontend**: User edits bio in AboutTab component
2. **Redux**: `handleProfileUpdate` dispatches `updateProfile` thunk
3. **API Client**: `profileApi.updateProfile()` sends PUT request to profile service
4. **Profile Service**: Separates user vs profile fields
5. **Auth Service**: Updates user model fields (`year`, `department`, etc.)
6. **Profile Service**: Updates profile model fields (`bio`, `skills`, etc.)
7. **Response**: Updated profile data returned to frontend
8. **UI Update**: Profile state updated, success toast shown

### Error Handling Flow
- **Validation Errors**: Field-level validation in backend with detailed error messages
- **Authentication Errors**: Automatic token refresh via Axios interceptors
- **Network Errors**: Graceful degradation with user-friendly error messages
- **Debug Logging**: End-to-end request tracing for troubleshooting

## API Documentation Updates

### Auth Service
Added `PUT /v1/users/:userId` endpoint documentation with:
- Request/response schemas
- Validation rules for user model fields
- Authorization requirements

### Profile Service  
Updated `PUT /v1/profile/me` endpoint documentation with:
- Clear separation of user vs profile model fields
- Field descriptions and validation rules
- Cross-service integration details

## Testing Recommendations

### Manual Testing
1. **Bio Editing**: Verify bio changes persist after page refresh
2. **Field Validation**: Test year (1-6) and department validation
3. **Error Scenarios**: Test with invalid data, network failures
4. **Role-Based Access**: Test with different user roles (student/faculty)

### Monitoring
1. **Debug Logs**: Monitor console logs for API request/response flow
2. **Network Tab**: Verify correct API endpoints are called
3. **Database**: Confirm data is saved in correct tables (User vs Profile)

## Performance Improvements
- **Memoized Callbacks**: Prevented unnecessary component re-renders
- **Optimized API Calls**: Reduced redundant profile fetches
- **Efficient State Updates**: Streamlined Redux state management

## Security Considerations
- **Authorization**: Proper ownership validation for profile updates
- **Input Validation**: Server-side validation for all user inputs
- **Token Management**: Secure JWT handling with automatic refresh

## Future Enhancements
1. **Real-time Updates**: Consider WebSocket integration for live profile updates
2. **Caching Strategy**: Implement profile data caching for better performance
3. **Audit Trail**: Add change tracking for profile modifications
4. **Bulk Operations**: Support for batch profile updates (admin feature)
