import { apiFetch, apiJson } from '../api';

export interface AdminProject {
  id: string;
  title: string;
  description: string;
  projectType: string;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  progressStatus: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  faculty: { name: string; email: string };
  college: { name: string };
  department: { name: string };
  teamSize: number;
  duration: number;
  tags: string[];
  skillsRequired: string[];
  createdAt: string;
  updatedAt: string;
  _count: {
    applications: number;
    tasks: number;
    comments: number;
  };
}

export interface AdminApplication {
  id: string;
  projectTitle: string;
  studentName: string;
  studentEmail: string;
  studentId: string;
  studentDepartment: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  coverLetter: string;
  appliedAt: string;
  updatedAt: string;
}

export interface AdminFilters {
  search?: string;
  status?: string;
  progressStatus?: string;
  projectType?: string;
  facultyId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  skills?: string[];
  page?: number;
  limit?: number;
}

export interface AdminAnalytics {
  overview: {
    totalProjects: number;
    pendingProjects: number;
    approvedProjects: number;
    rejectedProjects: number;
    totalApplications: number;
    pendingApplications: number;
    acceptedApplications: number;
    rejectedApplications: number;
  };
  trends: {
    projectsOverTime: Array<{ date: string; count: number }>;
    applicationsOverTime: Array<{ date: string; count: number }>;
  };
  distributions: {
    projectsByType: Array<{ type: string; count: number }>;
    projectsByDepartment: Array<{ department: string; count: number }>;
    projectsByStatus: Array<{ status: string; count: number }>;
  };
}

class ProjectsAdminAPI {
  // Get all projects with filters
  async getProjects(filters: AdminFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await apiJson(`/projects/v1/admin/projects?${params.toString()}`);
    return response.data;
  }

  // Get single project details
  async getProject(projectId: string) {
    const response = await apiJson(`/projects/v1/admin/projects/${projectId}`);
    return response.data;
  }

  // Moderate a project
  async moderateProject(projectId: string, action: 'approve' | 'reject' | 'archive', reason?: string) {
    const response = await apiJson(`/projects/v1/admin/projects/${projectId}/moderate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason })
    });
    return response.data;
  }

  // Bulk moderate projects
  async bulkModerateProjects(projectIds: string[], action: 'approve' | 'reject' | 'archive', reason?: string) {
    const response = await apiJson('/projects/v1/admin/projects/bulk-moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectIds, action, reason })
    });
    return response.data;
  }

  // Update project status
  async updateProjectStatus(projectId: string, status: string, reason?: string) {
    const response = await apiJson(`/projects/v1/admin/projects/${projectId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason })
    });
    return response.data;
  }

  // Hard delete project (SUPER_ADMIN only)
  async deleteProject(projectId: string, reason: string) {
    const response = await apiJson(`/projects/v1/admin/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return response.data;
  }

  // Get analytics data
  async getAnalytics(filters: { startDate?: string; endDate?: string; departmentId?: string } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await apiJson(`/projects/v1/admin/projects/analytics?${params.toString()}`);
    return response.data;
  }

  // Get applications with filters
  async getApplications(filters: {
    status?: string;
    projectId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiJson(`/projects/v1/admin/applications?${params.toString()}`);
    return response.data;
  }

  // Update application status
  async updateApplicationStatus(applicationId: string, status: 'PENDING' | 'ACCEPTED' | 'REJECTED', reason?: string) {
    const response = await apiJson(`/projects/v1/admin/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason })
    });
    return response.data;
  }

  // Bulk update application status
  async bulkUpdateApplications(applicationIds: string[], status: 'PENDING' | 'ACCEPTED' | 'REJECTED', reason?: string) {
    const response = await apiJson('/projects/v1/admin/applications/bulk-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationIds, status, reason })
    });
    return response.data;
  }

  // Export projects data
  async exportProjects(format: 'csv' | 'excel', filters: AdminFilters = {}) {
    const params = new URLSearchParams();
    params.append('format', format);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await apiFetch(`/projects/v1/admin/projects/export?${params.toString()}`);
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `projects-export-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
    
    return response;
  }

  // Export applications data
  async exportApplications(format: 'csv' | 'excel', filters: {
    status?: string;
    projectId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    const params = new URLSearchParams();
    params.append('format', format);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await apiFetch(`/projects/v1/admin/applications/export?${params.toString()}`);
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applications-export-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
    
    return response;
  }

  // Get audit logs
  async getAuditLogs(filters: {
    adminId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiJson(`/projects/v1/admin/audit-logs?${params.toString()}`);
    return response.data;
  }
}

export const projectsAdminAPI = new ProjectsAdminAPI();
