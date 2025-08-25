'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  MessageSquare,
  Calendar,
  CheckSquare,
  FolderOpen,
  Plus,
  Send,
  Paperclip,
  MoreVertical,
} from 'lucide-react';
import axios from 'axios';
import type { AxiosProgressEvent } from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import AwardBadge from '@/components/Dashboard/Faculty/AwardBadge';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchComments,
  createCommentThunk,
  selectCommentsForProject,
  selectCommentsLoadingForProject,
} from '@/store/slices/commentsSlice';
import {
  fetchProjectTasks,
  createTaskThunk,
  selectTasksForProject,
  selectTasksLoadingForProject,
} from '@/store/slices/tasksSlice';
import {
  fetchProjectAttachments,
  createAttachmentThunk,
  updateAttachmentThunk,
  deleteAttachmentThunk,
  selectAttachmentsForProject,
  selectAttachmentsLoadingForProject,
} from '@/store/slices/attachmentsSlice';

interface SelectedStudent {
  id: string;
  name: string;
}

export default function CollaborationHub() {
  const { user } = useAuth();
  const { projects } = useData();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks' | 'files'>('chat');
  const [newMessage, setNewMessage] = useState('');
  const [newTask, setNewTask] = useState('');
  const [showAwardBadge, setShowAwardBadge] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  type UploadItem = {
    id: string;
    name: string;
    progress: number; // 0-100
    status: 'uploading' | 'done' | 'error' | 'canceled';
    error?: string;
    controller: AbortController;
    mime?: string;
  };

  const renameAttachment = async (attachment: { id: string; fileName: string; projectId: string }) => {
    const current = attachment.fileName || '';
    const input = window.prompt('Rename file', current);
    const next = (input || '').trim();
    if (!next || next === current) return;
    // preserve extension if user omitted
    const lastDot = current.lastIndexOf('.');
    const ext = lastDot > 0 ? current.slice(lastDot) : '';
    const hasDot = next.includes('.');
    const finalName = hasDot ? next : (ext ? `${next}${ext}` : next);
    try {
      await dispatch(updateAttachmentThunk({ attachmentId: attachment.id, data: { fileName: finalName } })).unwrap();
      toast.success('Attachment renamed');
    } catch {
      toast.error('Failed to rename');
    }
  };

  const deleteAttachment = async (attachment: { id: string; projectId: string; fileName: string }) => {
    const ok = window.confirm(`Delete "${attachment.fileName}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await dispatch(deleteAttachmentThunk({ projectId: attachment.projectId, attachmentId: attachment.id })).unwrap();
      toast.success('Attachment deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const DOC_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (!currentProjectId) {
      toast.error('Select a project first');
      return;
    }
    try {
      setIsUploading(true);
      const files = Array.from(fileList);
      for (const f of files) {
        const mime = (f as any).type as string | undefined;
        let folder: 'project_files' = 'project_files';
        let resourceType: 'auto' | 'raw' = 'auto';
        if (mime && DOC_TYPES.has(mime)) {
          resourceType = 'raw';
        } else if (mime && IMAGE_TYPES.has(mime)) {
          resourceType = 'auto';
        } else {
          toast.error(`Unsupported file type: ${mime || f.name}`);
          continue;
        }

        const controller = new AbortController();
        const id = `${Date.now()}_${Math.random().toString(36).slice(2)}_${f.name}`;
        setUploads((prev) => [
          ...prev,
          { id, name: f.name, progress: 0, status: 'uploading', controller, mime },
        ]);

        const form = new FormData();
        form.append('file', f);
        form.append('folder', folder);
        form.append('resource_type', resourceType);
        if (currentProjectId) {
          form.append('projectId', currentProjectId);
        }

        try {
          const res = await axios.post('/api/uploadmedia', form, {
            signal: controller.signal,
            onUploadProgress: (evt: AxiosProgressEvent) => {
              const total = evt.total;
              const loaded = evt.loaded;
              if (typeof total === 'number' && total > 0 && typeof loaded === 'number') {
                const pct = Math.min(100, Math.round((loaded / total) * 100));
                setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: pct } : u)));
              }
            },
          });
          const data = res.data as {
            url: string;
            original_filename: string;
            mime?: string;
          };
          await dispatch(
            createAttachmentThunk({
              projectId: currentProjectId,
              data: {
                fileName: data.original_filename || f.name,
                fileUrl: data.url,
                fileType: data.mime || mime || 'application/octet-stream',
              },
            })
          ).unwrap();
          setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: 100, status: 'done' } : u)));
          toast.success(`Uploaded ${f.name}`);
        } catch (e: any) {
          const canceled = e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || /aborted|canceled/i.test(String(e?.message || ''));
          const msg = e?.response?.data?.error || (canceled ? 'Upload canceled' : e?.message || 'Upload failed');
          setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: canceled ? 'canceled' : 'error', error: msg } : u)));
          if (!canceled) {
            // map common server codes to friendly messages
            const status = e?.response?.status;
            if (status === 413) {
              toast.error(`${f.name}: File too large`);
            } else if (status === 415) {
              toast.error(`${f.name}: Unsupported file type`);
            } else {
              toast.error(`${f.name}: ${msg}`);
            }
          }
        }
      }
    } finally {
      setIsUploading(false);
      try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  const cancelUpload = (id: string) => {
    setUploads((prev) => {
      const item = prev.find((u) => u.id === id);
      try { item?.controller.abort(); } catch {}
      return prev.map((u) => (u.id === id ? { ...u, status: 'canceled' } : u));
    });
  };

  const activeProjects = projects.filter(
    (p) => p.facultyId === user?.id && (p.status === 'in_progress' || p.currentStudents > 0)
  );

  const selectedProjectData = selectedProject
    ? projects.find((p) => p.id === selectedProject)
    : activeProjects[0];

  const currentProjectId = selectedProjectData?.id || null;

  const hasActiveUploads = uploads.some((u) => u.status === 'uploading');

  // Redux-backed data
  const projectComments = useAppSelector((state) =>
    currentProjectId ? selectCommentsForProject(state, currentProjectId) : []
  );
  const commentsLoading = useAppSelector((state) =>
    currentProjectId ? selectCommentsLoadingForProject(state, currentProjectId) : false
  );
  const tasks = useAppSelector((state) =>
    currentProjectId ? selectTasksForProject(state, currentProjectId) : []
  );
  const tasksLoading = useAppSelector((state) =>
    currentProjectId ? selectTasksLoadingForProject(state, currentProjectId) : false
  );
  const attachments = useAppSelector((state) =>
    currentProjectId ? selectAttachmentsForProject(state, currentProjectId) : []
  );
  const attachmentsLoading = useAppSelector((state) =>
    currentProjectId ? selectAttachmentsLoadingForProject(state, currentProjectId) : false
  );

  // Initialize selected project from query param if present
  useEffect(() => {
    const pid = searchParams.get('projectId');
    if (!pid) return;
    const exists = activeProjects.find((p) => p.id === pid);
    if (exists) setSelectedProject(pid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, activeProjects.length]);

  // Fetch data when project changes
  useEffect(() => {
    if (!currentProjectId) return;
    if (!projectComments?.length && !commentsLoading) {
      dispatch(fetchComments({ projectId: currentProjectId }));
    }
    if (!tasks?.length && !tasksLoading) {
      dispatch(fetchProjectTasks({ projectId: currentProjectId }));
    }
    if (!attachments?.length && !attachmentsLoading) {
      dispatch(fetchProjectAttachments({ projectId: currentProjectId }));
    }
  }, [currentProjectId, dispatch, projectComments?.length, commentsLoading, tasks?.length, tasksLoading, attachments?.length, attachmentsLoading]);

  const sendMessage = () => {
    const msg = newMessage.trim();
    if (!msg) {
      toast.error('Please type a message before sending');
      return;
    }
    if (!currentProjectId) {
      toast.error('Select a project first');
      return;
    }
    dispatch(createCommentThunk({ projectId: currentProjectId, body: msg }))
      .unwrap()
      .then(() => {
        setNewMessage('');
        toast.success('Message sent');
      })
      .catch(() => toast.error('Failed to send message'));
  };

  const addTask = () => {
    const taskTitle = newTask.trim();
    if (!taskTitle) {
      toast.error('Please enter a task description');
      return;
    }
    if (!currentProjectId) {
      toast.error('Select a project first');
      return;
    }
    dispatch(createTaskThunk({ projectId: currentProjectId, data: { title: taskTitle } }))
      .unwrap()
      .then(() => {
        setNewTask('');
        toast.success('Task added');
      })
      .catch(() => toast.error('Failed to add task'));
  };

  if (activeProjects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collaboration Hub</h1>
          <p className="text-gray-600 mt-1">Collaborate with your project teams</p>
        </div>

        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Active Collaborations
          </h3>
          <p className="text-gray-600 mb-6">
            Once students join your projects, you'll be able to collaborate with them here.
          </p>
          <button onClick={() => router.push('/projects')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            View My Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Collaboration Hub</h1>
        <p className="text-gray-600 mt-1">Collaborate and manage your active project teams</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Project Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Active Projects</h2>
            <div className="space-y-2">
              {activeProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedProject === project.id ||
                    (!selectedProject && project === activeProjects[0])
                      ? 'bg-blue-100 border border-blue-200 text-blue-900'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="font-medium text-sm mb-1">{project.title}</div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {project.currentStudents} student
                    {project.currentStudents !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Collaboration Area */}
        <div className="lg:col-span-3">
          {selectedProjectData && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Project Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {selectedProjectData.title}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {selectedProjectData.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {selectedProjectData.currentStudents} collaborator
                      {selectedProjectData.currentStudents !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'chat', label: 'Chat', icon: MessageSquare },
                    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                    { id: 'files', label: 'Files', icon: FolderOpen },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'chat' && (
                  <div className="space-y-4">
                    {/* Messages */}
                    <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-4">
                      {projectComments.map((c) => {
                        const isMe = c.authorId === user?.id;
                        const ts = new Date(c.createdAt);
                        return (
                          <div key={c.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div className="text-sm font-medium mb-1">{c.authorName}</div>
                              <div className="text-sm">{c.body}</div>
                              <div className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                {ts.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Message Input */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                      </div>
                      <button
                        onClick={sendMessage}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'tasks' && (
                  <div className="space-y-4">
                    {/* Add Task */}
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          placeholder="Add a new task..."
                          className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyDown={(e) => e.key === 'Enter' && addTask()}
                        />
                      </div>
                      <button
                        onClick={addTask}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Tasks List */}
                    <div className="space-y-3">
                      {tasks.map((task) => {
                        const status = task.status; // 'TODO' | 'IN_PROGRESS' | 'DONE'
                        const statusLabel =
                          status === 'DONE' ? 'done' : status === 'IN_PROGRESS' ? 'in progress' : 'todo';
                        const statusClass =
                          status === 'DONE'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200';
                        return (
                          <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 flex items-center space-x-4">
                                  <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    {task.assignedToId ? `Assigned to ${task.assignedToId}` : 'Unassigned'}
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    Updated {new Date(task.updatedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="space-y-4">
                    {/* Upload Area */}
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                    >
                      <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">
                        Drag and drop files here, or click to browse
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={(e) => handleUpload(e.target.files)}
                        accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={hasActiveUploads}
                        className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {hasActiveUploads ? 'Uploading...' : 'Choose Files'}
                      </button>
                      {uploads.length > 0 && (
                        <div className="mt-4 space-y-2 text-left">
                          {uploads.map((u) => (
                            <div key={u.id} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-gray-800 truncate pr-2">{u.name}</div>
                                {u.status === 'uploading' && (
                                  <button
                                    onClick={() => cancelUpload(u.id)}
                                    className="text-xs text-red-600 hover:text-red-700"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                              <div className="mt-2">
                                <div className="w-full h-2 bg-gray-200 rounded">
                                  <div
                                    className={`h-2 rounded ${u.status === 'error' ? 'bg-red-500' : 'bg-blue-600'}`}
                                    style={{ width: `${u.progress}%` }}
                                  />
                                </div>
                                <div className="mt-1 text-xs text-gray-600">
                                  {u.status === 'uploading' && `${u.progress}%`}
                                  {u.status === 'done' && 'Uploaded'}
                                  {u.status === 'canceled' && 'Canceled'}
                                  {u.status === 'error' && (u.error || 'Upload failed')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Files List */}
                    <div className="space-y-3">
                      {attachments.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-blue-100 flex items-center justify-center">
                              {file.fileType?.startsWith('image/') ? (
                                <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-cover" />
                              ) : (
                                <FolderOpen className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{file.fileName}</div>
                              <div className="text-sm text-gray-500">
                                {file.fileType} • Uploaded on {new Date(file.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                              Download
                            </a>
                            <button
                              onClick={() => renameAttachment({ id: file.id, fileName: file.fileName, projectId: file.projectId })}
                              className="text-gray-600 hover:text-gray-800 text-sm"
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => deleteAttachment({ id: file.id, projectId: file.projectId, fileName: file.fileName })}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAwardBadge && selectedStudent && (
        <AwardBadge
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          onClose={() => setShowAwardBadge(false)}
          projectId={selectedProjectData?.id}
        />
      )}
    </div>
  );
}
