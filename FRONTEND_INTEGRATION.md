# Frontend Integration with New Backend Services

This document outlines the frontend changes made to integrate with the new auth-service and profile-service backends.

## ✅ **Completed Updates**

### **1. API Client Updates**

#### **New Auth API Client** (`src/lib/authApi.ts`)
- **Registration**: `registerUser()` with college validation
- **Authentication**: `loginUser()`, `logoutUser()`, `refreshAccessToken()`
- **Password Management**: `forgotPassword()`, `resetPassword()`
- **Email Verification**: `verifyEmail()`, `resendVerification()`
- **OAuth Integration**: `exchangeOAuthToken()` for Google/GitHub

#### **New College API Client** (`src/lib/collegeApi.ts`)
- **Public Endpoints**: `getColleges()`, `getCollegeById()`, `getCollegeDepartments()`
- **Admin Endpoints**: `createCollege()`, `updateCollege()`, `deleteCollege()`
- **Full CRUD operations with proper typing**

#### **Updated Profile API** (`src/lib/profileApi.ts`)
- **Fixed college fetching** to use auth-service instead of profile-service
- **Enhanced College interface** with all backend fields (code, location, website, departments, etc.)
- **Maintained existing profile, projects, publications, and badges APIs**

### **2. Authentication Context Updates** (`src/contexts/AuthContext.tsx`)

#### **Enhanced User Interface**
- Added `collegeId`, `department`, `year`, `collegeMemberId` fields
- Updated `getMe()` response handling to include new backend fields
- Improved user state hydration from auth-service `/v1/auth/me`

#### **Backend Integration**
- **Auth endpoint**: Uses `/v1/auth/me` for user details
- **Profile sync**: Integrates with Redux profile slice
- **Field mapping**: Maps backend `displayName` to frontend `name`

### **3. Registration Flow** (`src/app/register/page.tsx`)

#### **Complete Registration Form**
- **College Selection**: Dropdown with active colleges from auth-service
- **Department Validation**: Dynamic department list based on selected college
- **Role-based Fields**: Year field required for students
- **College ID**: Optional collegeMemberId field
- **Real-time Validation**: Form validation with error handling

#### **Backend Integration**
- **Uses new auth-service** `/v1/auth/register` endpoint
- **College validation**: Ensures college exists and is active
- **Department validation**: Ensures department exists in selected college
- **Automatic sign-in**: After successful registration using NextAuth

### **4. Environment Configuration** (`.env.example`)

```bash
# Backend Service URLs
NEXT_PUBLIC_API_BASE_URL=http://localhost:4001          # Auth Service
NEXT_PUBLIC_PROFILE_API_BASE_URL=http://localhost:4002  # Profile Service
NEXT_PUBLIC_PROJECTS_API_BASE_URL=http://localhost:4003 # Projects Service
NEXT_PUBLIC_EVENTS_API_BASE_URL=http://localhost:4004   # Events Service
NEXT_PUBLIC_NETWORK_API_BASE_URL=http://localhost:4005  # Network Service
```

### **5. Enhanced Type Definitions**

#### **MeResponse Interface** (`src/lib/me.ts`)
```typescript
export type MeResponse = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  avatarUrl?: string | null;
  collegeId?: string;
  department?: string;
  year?: number;
  collegeMemberId?: string;
};
```

#### **College Interface** (`src/lib/profileApi.ts`)
```typescript
export interface College {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  website?: string | null;
  departments: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## **🔄 Service Integration Flow**

### **Authentication Flow**
1. **Registration**: Frontend → Auth-Service → College validation → User creation
2. **Login**: Frontend → Auth-Service → JWT tokens → NextAuth session
3. **Profile**: Auth-Service `/me` → Profile-Service for extended data

### **Data Flow**
```
Frontend AuthContext → Auth-Service (/v1/auth/me)
                    ↓
Frontend Redux → Profile-Service (/v1/profile/me)
                    ↓
UI Components → Combined user + profile data
```

## **🚀 Next Steps**

### **Testing Required**
1. **Registration Flow**: Test with different roles and colleges
2. **Login Integration**: Verify JWT token handling
3. **Profile Sync**: Test Redux profile slice integration
4. **College Management**: Test college CRUD operations (HEAD_ADMIN)

### **Environment Setup**
1. Copy `.env.example` to `.env.local`
2. Update service URLs if running on different ports
3. Configure OAuth credentials for Google/GitHub

### **Backend Services Required**
- **Auth-Service**: Port 4001 (authentication, colleges)
- **Profile-Service**: Port 4002 (user profiles, projects, publications)
- **Other Services**: Ports 4003-4005 (projects, events, network)

## **🔧 Key Features**

### **Registration**
- ✅ College selection with real-time department loading
- ✅ Role-based form fields (year for students)
- ✅ Backend validation (college exists, department valid)
- ✅ Automatic sign-in after registration

### **Authentication**
- ✅ JWT-based auth with auto-refresh
- ✅ OAuth integration (Google/GitHub)
- ✅ Password reset and email verification
- ✅ Secure cookie-based refresh tokens

### **Profile Management**
- ✅ Redux-based profile state management
- ✅ Backend sync for profile updates
- ✅ College and department information
- ✅ Skills, projects, and publications management

### **Error Handling**
- ✅ Form validation with user-friendly messages
- ✅ API error handling with toast notifications
- ✅ Loading states and disabled buttons
- ✅ Fallback for missing data

## **📋 API Endpoints Used**

### **Auth-Service (Port 4001)**
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `GET /v1/auth/me` - Current user details
- `POST /v1/auth/refresh` - Token refresh
- `POST /v1/auth/logout` - User logout
- `GET /v1/colleges` - List colleges
- `GET /v1/colleges/:id` - Get college details

### **Profile-Service (Port 4002)**
- `GET /v1/profile/me` - User profile
- `PUT /v1/profile/me` - Update profile
- `GET /v1/profile/me/projects` - Personal projects
- `GET /v1/profile/me/publications` - Publications (faculty)

## **🔒 Security Features**

- **JWT Authentication**: RS256 signed tokens
- **Refresh Tokens**: HttpOnly cookies with rotation
- **CORS Configuration**: Proper cross-origin setup
- **Input Validation**: Frontend and backend validation
- **Role-based Access**: Different UI based on user roles

The frontend is now fully integrated with the new backend architecture and ready for testing and deployment.
