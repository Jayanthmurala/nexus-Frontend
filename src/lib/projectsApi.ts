import { ReactNode } from 'react';
import httpProjects from './httpProjects';

// Types matching backend Prisma models and Zod schemas
export type ProjectType = "PROJECT" | "RESEARCH" | "PAPER_PUBLISH" | "OTHER";
export type ModerationStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type ProgressStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED";
export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Project {
  id: string;
  collegeId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  authorDepartment?: string; // Faculty's actual department
  title: string;
  description: string;
  projectDuration: string | null;
  skills: string[];
  departments: string[]; // Departments that can apply to this project
  visibleToAllDepts: boolean;
  projectType: ProjectType;
  maxStudents: number;
  acceptedStudentsCount?: number; // Count of students actually accepted/enrolled
  totalApplicantsCount?: number; // Total number of students who applied
  deadline: string | null;
  tags: string[];
  requirements: string[];
  outcomes: string[];
  moderationStatus: ModerationStatus;
  progressStatus: ProgressStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  // Student-specific annotations (present when requester is a student)
  hasApplied?: boolean;
  myApplicationStatus?: ApplicationStatus | null;
}

export interface Application {
  id: string;
  projectId: string;
  studentId: string;
  studentName: string;
  studentDepartment: string;
  status: ApplicationStatus;
  message: string | null;
  appliedAt: string;
  project?: Project;
}

export interface Comment {
  id: string;
  projectId: string;
  taskId: string | null;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  assignedToId: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAttachment {
  uploaderName: ReactNode;
  id: string;
  projectId: string;
  uploaderId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

// Request/Response types
export interface CreateProjectRequest {
  title: string;
  description: string;
  projectDuration?: string;
  skills?: string[];
  projectType: ProjectType;
  visibleToAllDepts?: boolean;
  departments?: string[];
  maxStudents: number;
  deadline?: string;
  tags?: string[];
  requirements?: string[];
  outcomes?: string[];
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  projectDuration?: string;
  skills?: string[];
  projectType?: ProjectType;
  visibleToAllDepts?: boolean;
  departments?: string[];
  maxStudents?: number;
  deadline?: string;
  tags?: string[];
  requirements?: string[];
  outcomes?: string[];
  progressStatus?: ProgressStatus;
}

export interface ProjectsListParams {
  q?: string;
  projectType?: string;
  progressStatus?: string;
  page?: number;
  limit?: number;
}

export interface ProjectsListResponse {
  projects: Project[];
  page: number;
  total: number;
}

export interface ApplyProjectRequest {
  message?: string;
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
}

export interface CreateTaskRequest {
  title: string;
  assignedToId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  assignedToId?: string | null;
  status?: TaskStatus;
}

export interface CreateAttachmentRequest {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export interface UpdateAttachmentRequest {
  fileName?: string;
}

// API functions
export const projectsApi = {
  // Projects
  async listProjects(params?: ProjectsListParams): Promise<ProjectsListResponse> {
    const response = await httpProjects.get('/v1/projects', { params });
    return response.data;
  },

  async getMyProjects(): Promise<{ projects: Project[] }> {
    const response = await httpProjects.get('/v1/projects/mine');
    return response.data;
  },

  async createProject(data: CreateProjectRequest): Promise<{ project: Project }> {
    const response = await httpProjects.post('/v1/projects', data);
    return response.data;
  },

  async updateProject(id: string, data: UpdateProjectRequest): Promise<{ project: Project }> {
    const response = await httpProjects.put(`/v1/projects/${id}`, data);
    return response.data;
  },

  async deleteProject(id: string): Promise<{ success: boolean }> {
    const response = await httpProjects.delete(`/v1/projects/${id}`);
    return response.data;
  },

  // Applications
  async applyToProject(projectId: string, data: ApplyProjectRequest): Promise<{ application: Application }> {
    const response = await httpProjects.post(`/v1/projects/${projectId}/applications`, data);
    return response.data;
  },

  async getProjectApplications(projectId: string, status?: string): Promise<{ applications: Application[] }> {
    const params = status ? { status } : {};
    const response = await httpProjects.get(`/v1/projects/${projectId}/applications`, { params });
    return response.data;
  },

  async updateApplicationStatus(applicationId: string, data: UpdateApplicationStatusRequest): Promise<{ application: Application }> {
    const response = await httpProjects.put(`/v1/applications/${applicationId}/status`, data);
    return response.data;
  },

  // Student: list my applications
  async getMyApplications(status?: string): Promise<{ applications: Application[] }> {
    const params = status ? { status } : {};
    const response = await httpProjects.get('/v1/applications/mine', { params });
    return response.data;
  },

  // Comments
  async getProjectComments(projectId: string, taskId?: string): Promise<{ comments: Comment[] }> {
    const params = taskId ? { taskId } : {};
    const response = await httpProjects.get(`/v1/projects/${projectId}/comments`, { params });
    return response.data;
  },

  async createComment(projectId: string, body: string, taskId?: string): Promise<{ comment: Comment }> {
    const data = { body, taskId };
    const response = await httpProjects.post(`/v1/projects/${projectId}/comments`, data);
    return response.data;
  },

  // Tasks
  async getProjectTasks(projectId: string): Promise<{ tasks: ProjectTask[] }> {
    const response = await httpProjects.get(`/v1/projects/${projectId}/tasks`);
    return response.data;
  },

  async createTask(projectId: string, data: CreateTaskRequest): Promise<{ task: ProjectTask }> {
    const response = await httpProjects.post(`/v1/projects/${projectId}/tasks`, data);
    return response.data;
  },

  async updateTask(taskId: string, data: UpdateTaskRequest): Promise<{ task: ProjectTask }> {
    const response = await httpProjects.put(`/v1/tasks/${taskId}`, data);
    return response.data;
  },

  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    const response = await httpProjects.delete(`/v1/tasks/${taskId}`);
    return response.data;
  },

  // Attachments
  async getProjectAttachments(projectId: string): Promise<{ attachments: ProjectAttachment[] }> {
    const response = await httpProjects.get(`/v1/projects/${projectId}/attachments`);
    return response.data;
  },

  async createAttachment(projectId: string, data: CreateAttachmentRequest): Promise<{ attachment: ProjectAttachment }> {
    const response = await httpProjects.post(`/v1/projects/${projectId}/attachments`, data);
    return response.data;
  },

  async updateAttachment(attachmentId: string, data: UpdateAttachmentRequest): Promise<{ attachment: ProjectAttachment }> {
    const response = await httpProjects.put(`/v1/attachments/${attachmentId}`, data);
    return response.data;
  },

  async deleteAttachment(attachmentId: string): Promise<{ success: boolean }> {
    const response = await httpProjects.delete(`/v1/attachments/${attachmentId}`);
    return response.data;
  },
};

export default projectsApi;
