import http from './http';

export interface HeadAdminUser {
  id: string;
  displayName: string;
  email: string;
  roles: string[];
  department?: string;
  year?: number;
  collegeMemberId?: string;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface HeadAdminUsersResponse {
  users: HeadAdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateUserRequest {
  displayName: string;
  email: string;
  roles: string[];
  department?: string;
  year?: number;
  collegeMemberId?: string;
  status?: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';
  password?: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  email?: string;
  roles?: string[];
  department?: string;
  year?: number;
  collegeMemberId?: string;
  status?: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

export interface BulkCreateRequest {
  users: CreateUserRequest[];
  defaultPassword?: string;
}

export interface BulkCreateResponse {
  created: HeadAdminUser[];
  failed: Array<{ email: string; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface CollegeStats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  usersByStatus: Record<string, number>;
  usersByDepartment: Record<string, number>;
  recentRegistrations: number;
}

export interface College {
  id: string;
  name: string;
  code: string;
  location?: string;
  website?: string;
  departments: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  forceChange?: boolean;
}

export interface ResetPasswordResponse {
  message: string;
  temporaryPassword?: string;
}

export const headAdminApi = {
  // Get all users in HEAD_ADMIN's college
  async getUsers(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    role?: string;
    department?: string;
    status?: string;
    year?: number;
  }): Promise<HeadAdminUsersResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.department) searchParams.append('department', params.department);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.year) searchParams.append('year', params.year.toString());

    const response = await http.get(`/v1/head-admin/users?${searchParams.toString()}`);
    return response.data;
  },

  // Create a new user
  async createUser(userData: CreateUserRequest): Promise<HeadAdminUser> {
    const response = await http.post('/v1/head-admin/users', userData);
    return response.data;
  },

  // Bulk create users
  async bulkCreateUsers(bulkData: BulkCreateRequest): Promise<BulkCreateResponse> {
    const response = await http.post('/v1/head-admin/users/bulk', bulkData);
    return response.data;
  },

  // Update a user
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<HeadAdminUser> {
    const response = await http.put(`/v1/head-admin/users/${userId}`, userData);
    return response.data;
  },

  // Reset user password
  async resetPassword(userId: string, resetData: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await http.post(`/v1/head-admin/users/${userId}/reset-password`, resetData);
    return response.data;
  },

  // Get college information
  async getCollege(): Promise<College> {
    const response = await http.get('/v1/head-admin/college');
    return response.data;
  },

  // Get college statistics
  async getStats(): Promise<CollegeStats> {
    const response = await http.get('/v1/head-admin/stats');
    return response.data;
  },
};
