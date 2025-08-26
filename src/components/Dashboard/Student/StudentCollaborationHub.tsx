"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import type { AxiosProgressEvent } from "axios";
import {
  MessageSquare,
  CheckSquare,
  FolderOpen,
  Paperclip,
  Send,
  Plus,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectMyApplications,
  fetchMyApplications,
  fetchProjectApplications,
  selectApplicationsForProject,
  selectApplicationsLoadingForProject,
} from "@/store/slices/applicationsSlice";
import {
  fetchComments,
  createCommentThunk,
  selectCommentsForProject,
  selectCommentsLoadingForProject,
} from "@/store/slices/commentsSlice";
import {
  fetchProjectTasks,
  createTaskThunk,
  selectTasksForProject,
  selectTasksLoadingForProject,
} from "@/store/slices/tasksSlice";
import {
  fetchProjectAttachments,
  createAttachmentThunk,
  selectAttachmentsForProject,
  selectAttachmentsLoadingForProject,
} from "@/store/slices/attachmentsSlice";

export default function StudentCollaborationHub() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMyAppsRef = useRef(false);
  const myApplications = useAppSelector(selectMyApplications);
  // Per-project guards to avoid refetch loops when API returns empty arrays
  const requestedAcceptedAppsByProjectRef = useRef<Set<string>>(new Set());
  const requestedCommentsByProjectRef = useRef<Set<string>>(new Set());
  const requestedTasksByProjectRef = useRef<Set<string>>(new Set());
  const requestedAttachmentsByProjectRef = useRef<Set<string>>(new Set());

  // Reset guard on user change
  useEffect(() => {
    requestedMyAppsRef.current = false;
    // Also reset per-project request guards when user changes
    requestedAcceptedAppsByProjectRef.current.clear();
    requestedCommentsByProjectRef.current.clear();
    requestedTasksByProjectRef.current.clear();
    requestedAttachmentsByProjectRef.current.clear();
  }, [user?.id, user?.role]);

  // Load the student's applications; we'll derive collaborations from ACCEPTED apps (guarded)
  useEffect(() => {
    if (!user || user.role !== "student") return;
    if (requestedMyAppsRef.current) return;
    if ((myApplications?.length ?? 0) > 0) return;
    requestedMyAppsRef.current = true;
    dispatch(fetchMyApplications());
  }, [dispatch, user?.id, user?.role, myApplications?.length]);

  // Derive collaboration projects from accepted applications (dedup by projectId)
  const projects = useMemo(() => {
    const acc = (myApplications || []).filter((a) => a.status === "ACCEPTED" && a.project);
    const map = new Map<string, any>();
    for (const a of acc) {
      const p = a.project!;
      if (!map.has(p.id)) map.set(p.id, p);
    }
    return Array.from(map.values());
  }, [myApplications]);

  // Initial selection from query param
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  useEffect(() => {
    const pid = searchParams.get("projectId");
    if (pid) setSelectedProjectId(pid);
  }, [searchParams]);

  const selectedProject = useMemo(() => {
    if (!projects.length) return undefined;
    const found = projects.find((p) => p.id === selectedProjectId);
    return found || projects[0];
  }, [projects, selectedProjectId]);

  const currentProjectId = selectedProject?.id || null;

  // Applications data for selected project to compute collaborator count
  const projectApplications = useAppSelector((state) =>
    currentProjectId ? selectApplicationsForProject(state, currentProjectId) : []
  );
  const projectApplicationsLoading = useAppSelector((state) =>
    currentProjectId ? selectApplicationsLoadingForProject(state, currentProjectId) : false
  );

  // Ensure accepted applications for the selected project are loaded (to show collaborator count)
  useEffect(() => {
    if (!currentProjectId) return;
    if (requestedAcceptedAppsByProjectRef.current.has(currentProjectId)) return;
    if (projectApplicationsLoading) return;
    // Mark as requested immediately to prevent loops even if API returns []
    requestedAcceptedAppsByProjectRef.current.add(currentProjectId);
    dispatch(fetchProjectApplications({ projectId: currentProjectId, status: "ACCEPTED" }));
  }, [currentProjectId, projectApplicationsLoading, dispatch]);

  // Redux-backed collaboration data
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

  // Fetch data when project changes
  useEffect(() => {
    if (!currentProjectId) return;
    if (!commentsLoading && !requestedCommentsByProjectRef.current.has(currentProjectId)) {
      requestedCommentsByProjectRef.current.add(currentProjectId);
      dispatch(fetchComments({ projectId: currentProjectId }));
    }
    if (!tasksLoading && !requestedTasksByProjectRef.current.has(currentProjectId)) {
      requestedTasksByProjectRef.current.add(currentProjectId);
      dispatch(fetchProjectTasks({ projectId: currentProjectId }));
    }
    if (!attachmentsLoading && !requestedAttachmentsByProjectRef.current.has(currentProjectId)) {
      requestedAttachmentsByProjectRef.current.add(currentProjectId);
      dispatch(fetchProjectAttachments({ projectId: currentProjectId }));
    }
  }, [currentProjectId, dispatch, commentsLoading, tasksLoading, attachmentsLoading]);

  const [activeTab, setActiveTab] = useState<"chat" | "tasks" | "files">("chat");
  const [newMessage, setNewMessage] = useState("");
  const [newTask, setNewTask] = useState("");

  const sendMessage = () => {
    const body = newMessage.trim();
    if (!body) {
      toast.error("Please type a message before sending");
      return;
    }
    if (!currentProjectId) {
      toast.error("Select a project first");
      return;
    }
    dispatch(createCommentThunk({ projectId: currentProjectId, body }))
      .unwrap()
      .then(() => {
        setNewMessage("");
        toast.success("Message sent");
      })
      .catch(() => toast.error("Failed to send message"));
  };

  const addTask = () => {
    const title = newTask.trim();
    if (!title) {
      toast.error("Please enter a task description");
      return;
    }
    if (!currentProjectId) {
      toast.error("Select a project first");
      return;
    }
    dispatch(createTaskThunk({ projectId: currentProjectId, data: { title } }))
      .unwrap()
      .then(() => {
        setNewTask("");
        toast.success("Task added");
      })
      .catch(() => toast.error("Failed to add task"));
  };

  // File uploads
  type UploadItem = {
    id: string;
    name: string;
    progress: number;
    status: "uploading" | "done" | "error" | "canceled";
    controller: AbortController;
    error?: string;
    mime?: string;
  };
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  const DOC_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

  const hasActiveUploads = uploads.some((u) => u.status === "uploading");

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (!currentProjectId) {
      toast.error("Select a project first");
      return;
    }
    try {
      setIsUploading(true);
      const files = Array.from(fileList);
      for (const f of files) {
        const mime = (f as any).type as string | undefined;
        let resourceType: "auto" | "raw" = "auto";
        if (mime && DOC_TYPES.has(mime)) resourceType = "raw";
        else if (mime && IMAGE_TYPES.has(mime)) resourceType = "auto";
        else {
          toast.error(`Unsupported file type: ${mime || f.name}`);
          continue;
        }

        const id = `${Date.now()}_${Math.random().toString(36).slice(2)}_${f.name}`;
        const controller = new AbortController();
        setUploads((prev) => [...prev, { id, name: f.name, progress: 0, status: "uploading", controller, mime }]);

        const form = new FormData();
        form.append("file", f);
        form.append("folder", "project_files");
        form.append("resource_type", resourceType);
        form.append("projectId", currentProjectId);

        try {
          const res = await axios.post("/api/uploadmedia", form, {
            signal: controller.signal,
            onUploadProgress: (evt: AxiosProgressEvent) => {
              const total = evt.total;
              const loaded = evt.loaded;
              if (typeof total === "number" && total > 0 && typeof loaded === "number") {
                const pct = Math.min(100, Math.round((loaded / total) * 100));
                setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: pct } : u)));
              }
            },
          });
          const data = res.data as { url: string; original_filename: string; mime?: string };
          await dispatch(
            createAttachmentThunk({
              projectId: currentProjectId,
              data: {
                fileName: data.original_filename || f.name,
                fileUrl: data.url,
                fileType: data.mime || mime || "application/octet-stream",
              },
            })
          ).unwrap();
          setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: 100, status: "done" } : u)));
          toast.success(`Uploaded ${f.name}`);
        } catch (e: any) {
          const canceled = e?.code === "ERR_CANCELED" || e?.name === "CanceledError" || /aborted|canceled/i.test(String(e?.message || ""));
          const msg = e?.response?.data?.error || (canceled ? "Upload canceled" : e?.message || "Upload failed");
          setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: canceled ? "canceled" : "error", error: msg } : u)));
          if (!canceled) toast.error(`${f.name}: ${msg}`);
        }
      }
    } finally {
      setIsUploading(false);
      try { if (fileInputRef.current) fileInputRef.current.value = ""; } catch {}
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
      return prev.map((u) => (u.id === id ? { ...u, status: "canceled" } : u));
    });
  };

  if (!projects.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collaboration Hub</h1>
          <p className="text-gray-600 mt-1">Collaborate with your joined project teams</p>
        </div>
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Collaborations Yet</h3>
          <p className="text-gray-600 mb-6">Once your applications are accepted, you'll be able to collaborate here.</p>
          <button onClick={() => router.push("/student/my-applications")} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            View My Applications
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
        <p className="text-gray-600 mt-1">Collaborate with your project teams</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Project Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-4">My Projects</h2>
            <div className="space-y-2">
              {projects.map((p) => {
                const isActive = (selectedProjectId ? selectedProjectId === p.id : selectedProject?.id === p.id);
                const isSelected = currentProjectId === p.id;
                const acceptedCount = isSelected
                  ? projectApplications.reduce((acc, a) => (a.status === "ACCEPTED" ? acc + 1 : acc), 0)
                  : undefined;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isActive ? "bg-blue-100 border border-blue-200 text-blue-900" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">{p.title}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {typeof acceptedCount === "number"
                        ? `${acceptedCount} collaborator${acceptedCount !== 1 ? "s" : ""}`
                        : "—"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Collaboration Area */}
        <div className="lg:col-span-3">
          {selectedProject && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Project Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">{selectedProject.title}</h2>
                    <p className="text-gray-600 text-sm">{selectedProject.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {(() => {
                        const c = projectApplications.reduce((acc, a) => (a.status === "ACCEPTED" ? acc + 1 : acc), 0);
                        return `${c} collaborator${c !== 1 ? "s" : ""}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: "chat", label: "Chat", icon: MessageSquare },
                    { id: "tasks", label: "Tasks", icon: CheckSquare },
                    { id: "files", label: "Files", icon: FolderOpen },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
                {activeTab === "chat" && (
                  <div className="space-y-4">
                    <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-4">
                      {projectComments.map((c) => {
                        const isMe = c.authorId === user?.id;
                        const ts = new Date(c.createdAt);
                        return (
                          <div key={c.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                              <div className="text-sm font-medium mb-1">{c.authorName}</div>
                              <div className="text-sm">{c.body}</div>
                              <div className={`text-xs mt-1 ${isMe ? "text-blue-100" : "text-gray-500"}`}>{ts.toLocaleTimeString()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                      </div>
                      <button onClick={sendMessage} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "tasks" && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          placeholder="Add a new task..."
                          className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyDown={(e) => e.key === "Enter" && addTask()}
                        />
                      </div>
                      <button onClick={addTask} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {tasks.map((task) => {
                        const status = task.status; // 'TODO' | 'IN_PROGRESS' | 'DONE'
                        const statusLabel = status === "DONE" ? "done" : status === "IN_PROGRESS" ? "in progress" : "todo";
                        const statusClass =
                          status === "DONE"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-yellow-100 text-yellow-800 border-yellow-200";
                        return (
                          <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusClass}`}>{statusLabel}</span>
                                </div>
                                <div className="text-sm text-gray-600 flex items-center space-x-4">
                                  <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    {task.assignedToId ? `Assigned to ${task.assignedToId}` : "Unassigned"}
                                  </div>
                                  <div className="flex items-center">
                                    <CalendarIcon className="w-4 h-4 mr-1" />
                                    Updated {new Date(task.updatedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "files" && (
                  <div className="space-y-4">
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                    >
                      <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Drag and drop files here, or click to browse</p>
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
                        {hasActiveUploads ? "Uploading..." : "Choose Files"}
                      </button>
                      {uploads.length > 0 && (
                        <div className="mt-4 space-y-2 text-left">
                          {uploads.map((u) => (
                            <div key={u.id} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-gray-800 truncate pr-2">{u.name}</div>
                                {u.status === "uploading" && (
                                  <button onClick={() => cancelUpload(u.id)} className="text-xs text-red-600 hover:text-red-700">
                                    Cancel
                                  </button>
                                )}
                              </div>
                              <div className="mt-2">
                                <div className="w-full h-2 bg-gray-200 rounded">
                                  <div className={`h-2 rounded ${u.status === "error" ? "bg-red-500" : "bg-blue-600"}`} style={{ width: `${u.progress}%` }} />
                                </div>
                                <div className="mt-1 text-xs text-gray-600">
                                  {u.status === "uploading" && `${u.progress}%`}
                                  {u.status === "done" && "Uploaded"}
                                  {u.status === "canceled" && "Canceled"}
                                  {u.status === "error" && (u.error || "Upload failed")}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {attachments.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-blue-100 flex items-center justify-center">
                              {file.fileType?.startsWith("image/") ? (
                                // eslint-disable-next-line @next/next/no-img-element
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
    </div>
  );
}
