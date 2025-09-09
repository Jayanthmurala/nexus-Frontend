"use client";

import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
  TrendingUp,
  Star,
  Download,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  updateTaskThunk,
  selectTasksForProject,
  selectTasksLoadingForProject,
} from "@/store/slices/tasksSlice";
import type { TaskStatus } from "@/lib/projectsApi";
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
    const pid = searchParams?.get("projectId");
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
  const [newComment, setNewComment] = useState("");
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [showTaskForm, setShowTaskForm] = useState(false);


  const handleCreateTask = () => {
    const title = newTask.title.trim();
    if (!title) {
      toast.error("Please enter a task title");
      return;
    }
    if (!currentProjectId) {
      toast.error("Select a project first");
      return;
    }
    dispatch(createTaskThunk({ projectId: currentProjectId, data: { title } }))
      .unwrap()
      .then(() => {
        setNewTask({ title: "", description: "" });
        setShowTaskForm(false);
        toast.success("Task created");
      })
      .catch(() => toast.error("Failed to create task"));
  };

  const handleToggleTask = (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = 
      currentStatus === "TODO" ? "IN_PROGRESS" : 
      currentStatus === "IN_PROGRESS" ? "DONE" : "TODO";
    
    dispatch(updateTaskThunk({ taskId, changes: { status: nextStatus } }))
      .unwrap()
      .then(() => {
        toast.success("Task status updated");
      })
      .catch(() => toast.error("Failed to update task status"));
  };

  // File uploads
  type UploadItem = {
    fileName: ReactNode;
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
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
        setUploads((prev) => [...prev, { id, fileName: f.name, name: f.name, progress: 0, status: "uploading", controller, mime }]);

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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Create a synthetic event to match the expected signature
      const syntheticEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(syntheticEvent);
    }
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
      <motion.div 
        className="space-y-8 p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Collaboration Hub
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Collaborate with your joined project teams</p>
        </motion.div>
        <motion.div 
          className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200 shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Collaborations Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">Once your applications are accepted, you'll be able to collaborate here with your project teams.</p>
            <motion.button 
              onClick={() => router.push("/student/my-applications")} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ExternalLink className="w-4 h-4 mr-2 inline" />
              View My Applications
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  const handleSendComment = () => {
    const content = newComment.trim();
    if (!content) {
      toast.error("Please type a message before sending");
      return;
    }
    if (!currentProjectId) {
      toast.error("Select a project first");
      return;
    }
    dispatch(createCommentThunk({ projectId: currentProjectId, body: content }))
      .unwrap()
      .then(() => {
        setNewComment("");
        toast.success("Message sent");
      })
      .catch(() => toast.error("Failed to send message"));
  };

  return (
    <motion.div 
      className="space-y-8 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Collaboration Hub
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Collaborate with your project teams</p>
        </div>
        <motion.div 
          className="mt-4 sm:mt-0 flex items-center space-x-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.span 
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {projects.length} active project{projects.length !== 1 ? 's' : ''}
          </motion.span>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Project Sidebar */}
        <motion.div 
          className="lg:col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Star className="w-5 h-5 mr-2 text-blue-600" />
              My Projects
            </h2>
            <div className="space-y-3">
              {projects.map((p, index) => {
                const isActive = (selectedProjectId ? selectedProjectId === p.id : selectedProject?.id === p.id);
                const isSelected = currentProjectId === p.id;
                const acceptedCount = isSelected
                  ? projectApplications.reduce((acc, a) => (a.status === "ACCEPTED" ? acc + 1 : acc), 0)
                  : undefined;
                return (
                  <motion.button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 text-blue-900 shadow-md" 
                        : "hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="font-semibold text-sm mb-2 line-clamp-2">{p.title}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {typeof acceptedCount === "number"
                        ? `${acceptedCount} collaborator${acceptedCount !== 1 ? "s" : ""}`
                        : "—"}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Main Collaboration Area */}
        <motion.div 
          className="lg:col-span-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {selectedProject && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              {/* Project Header */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProject.title}</h2>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{selectedProject.description}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-1 text-blue-600" />
                        <span className="font-medium">{selectedProject.authorName}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 mr-1 text-green-600" />
                        <span>Started {new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <motion.span 
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      {(() => {
                        const c = projectApplications.reduce((acc, a) => (a.status === "ACCEPTED" ? acc + 1 : acc), 0);
                        return `${c} collaborator${c !== 1 ? "s" : ""}`;
                      })()}
                    </motion.span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 bg-gray-50">
                <nav className="flex space-x-1 px-6 py-2">
                  {[
                    { id: "chat", label: "Chat", icon: MessageSquare, count: projectComments.length },
                    { id: "tasks", label: "Tasks", icon: CheckSquare, count: tasks.length },
                    { id: "files", label: "Files", icon: FolderOpen, count: attachments.length },
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-white text-blue-600 shadow-md border border-blue-200"
                          : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <tab.icon className="w-4 h-4 mr-2" />
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                          activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === "chat" && (
                    <motion.div 
                      key="chat"
                      className="space-y-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200 overflow-hidden">
                        <div className="h-96 overflow-y-auto p-6 space-y-4">
                          {projectComments.length === 0 ? (
                            <div className="text-center py-12">
                              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">No messages yet. Start the conversation!</p>
                            </div>
                          ) : (
                            projectComments.map((c, index) => {
                              const isOwn = c.authorId === user?.id;
                              return (
                                <motion.div 
                                  key={c.id} 
                                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                    isOwn 
                                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
                                      : "bg-white text-gray-900 border border-gray-200"
                                  }`}>
                                    <div className="text-sm leading-relaxed">{c.body}</div>
                                    <div className={`text-xs mt-2 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
                                      {c.authorName} • {new Date(c.createdAt).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendComment()}
                        />
                        <motion.button
                          onClick={handleSendComment}
                          disabled={!newComment.trim()}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white p-3 rounded-xl transition-all duration-200 shadow-lg disabled:shadow-none"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Send className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "tasks" && (
                    <motion.div 
                      key="tasks"
                      className="space-y-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                          <CheckSquare className="w-5 h-5 mr-2 text-green-600" />
                          Project Tasks
                        </h3>
                        <motion.button
                          onClick={() => setShowTaskForm(true)}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Task
                        </motion.button>
                      </div>

                      <AnimatePresence>
                        {showTaskForm && (
                          <motion.div 
                            className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 shadow-lg"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="space-y-4">
                              <input
                                type="text"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                placeholder="Task title"
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                              />
                              <textarea
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                placeholder="Task description"
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                rows={3}
                              />
                              <div className="flex space-x-3">
                                <motion.button
                                  onClick={handleCreateTask}
                                  disabled={!newTask.title.trim()}
                                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 text-white text-sm font-semibold py-2 px-6 rounded-xl transition-all duration-200 shadow-lg disabled:shadow-none"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Create Task
                                </motion.button>
                                <motion.button
                                  onClick={() => setShowTaskForm(false)}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold py-2 px-6 rounded-xl transition-all duration-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Cancel
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-4">
                        {tasks.length === 0 ? (
                          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-green-50 rounded-xl border border-gray-200">
                            <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No tasks yet. Create one to get started!</p>
                          </div>
                        ) : (
                          tasks.map((task, index) => (
                            <motion.div 
                              key={task.id} 
                              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 mb-2 text-lg">{task.title}</h4>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span className="flex items-center">
                                      <Users className="w-3 h-3 mr-1" />
                                      {task.assignedToId ? `Assigned to ${task.assignedToId}` : "Unassigned"}
                                    </span>
                                    <span className="flex items-center">
                                      <CalendarIcon className="w-3 h-3 mr-1" />
                                      {new Date(task.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full font-medium ${
                                      task.status === "DONE" 
                                        ? "bg-green-100 text-green-800 border border-green-200" 
                                        : task.status === "IN_PROGRESS"
                                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                                        : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                    }`}>
                                      {task.status === "DONE" ? "✓ Completed" : task.status === "IN_PROGRESS" ? "🔄 In Progress" : "⏳ Todo"}
                                    </span>
                                  </div>
                                </div>
                                <motion.button
                                  onClick={() => handleToggleTask(task.id, task.status)}
                                  className="ml-4 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Update Status
                                </motion.button>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "files" && (
                    <motion.div 
                      key="files"
                      className="space-y-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                          <FolderOpen className="w-5 h-5 mr-2 text-purple-600" />
                          Project Files
                        </h3>
                        <motion.label 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Upload File
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </motion.label>
                      </div>

                      {/* Upload Progress */}
                      <AnimatePresence>
                        {uploads.length > 0 && (
                          <motion.div 
                            className="space-y-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {uploads.map((upload, index) => (
                              <motion.div 
                                key={upload.id} 
                                className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 shadow-sm"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-semibold text-gray-900">{upload.fileName}</span>
                                  <div className="flex items-center space-x-3">
                                    <span className="text-xs font-medium text-gray-600">
                                      {upload.status === "uploading" && `${upload.progress}%`}
                                      {upload.status === "done" && "✓ Uploaded"}
                                      {upload.status === "error" && "✗ Failed"}
                                      {upload.status === "canceled" && "✗ Canceled"}
                                    </span>
                                    {upload.status === "uploading" && (
                                      <button
                                        onClick={() => cancelUpload(upload.id)}
                                        className="text-red-600 hover:text-red-700 text-xs font-medium"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {upload.status === "uploading" && (
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <motion.div
                                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${upload.progress}%` }}
                                      transition={{ duration: 0.3 }}
                                    />
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Files List */}
                      <div className="space-y-4">
                        {attachments.length === 0 ? (
                          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border border-gray-200">
                            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No files uploaded yet. Share files with your team!</p>
                          </div>
                        ) : (
                          attachments.map((file, index) => (
                            <motion.div 
                              key={file.id} 
                              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                                    <Paperclip className="w-6 h-6 text-purple-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 text-sm mb-1">{file.fileName}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                      <span className="flex items-center">
                                        <Users className="w-3 h-3 mr-1" />
                                        {file.uploaderName}
                                      </span>
                                      <span>•</span>
                                      <span className="flex items-center">
                                        <CalendarIcon className="w-3 h-3 mr-1" />
                                        {new Date(file.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <motion.a 
                                  href={file.fileUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all duration-200 shadow-lg flex items-center"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </motion.a>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
