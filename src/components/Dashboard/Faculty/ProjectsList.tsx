'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Users, Pencil, Trash2, Search, Filter, MessageSquare, UserPlus, TrendingUp, Clock, CheckCircle, BarChart3, Zap, Star, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket, ApplicationUpdateEvent } from '@/lib/websocket';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EditProjectDialog from '@/components/Dashboard/Faculty/EditProjectDialog';
import { useRouter } from 'next/navigation';
import { projectTypeOptions } from '@/constants/projectOptions';
import {
  fetchMyProjects,
  deleteProject as deleteProjectThunk,
  updateProject as updateProjectThunk,
  selectProjects,
  selectProjectsLoading,
  selectProjectsError,
} from '@/store/slices/projectsSlice';
import type { Project, UpdateProjectRequest, ProgressStatus } from '@/lib/projectsApi';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export default function ProjectsList() {
  const router = useRouter();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const projects = useAppSelector(selectProjects);
  const loading = useAppSelector(selectProjectsLoading);
  const error = useAppSelector(selectProjectsError);
  const { connect, disconnect, onApplicationUpdate, offApplicationUpdate } = useWebSocket();

  useEffect(() => {
    dispatch(fetchMyProjects());
  }, [dispatch]);

  // WebSocket connection for application updates
  useEffect(() => {
    const socket = connect();
    
    const handleApplicationUpdate = (event: ApplicationUpdateEvent) => {
      const { type, application, projectId } = event;
      
      if (type === 'new-application') {
        toast.success(`New application received for project: ${application.projectId}`, {
          duration: 4000,
          icon: '📝',
        });
        
        // Refresh projects to get updated application count
        dispatch(fetchMyProjects());
      } else if (type === 'application-status-changed') {
        toast(`Application status updated for project: ${projectId}`, {
          icon: '🔄',
        });
        
        // Refresh projects to get updated application status
        dispatch(fetchMyProjects());
      }
    };

    onApplicationUpdate(handleApplicationUpdate);

    return () => {
      offApplicationUpdate(handleApplicationUpdate);
      disconnect();
    };
  }, [connect, disconnect, onApplicationUpdate, offApplicationUpdate, dispatch]);

  const myProjects = useMemo(() => projects, [projects]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProgressStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | (typeof projectTypeOptions)[number]['value']>('all');

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);

  const handleEdit = (project: Project) => {
    setSelected(project);
    setEditOpen(true);
  };

  const handleSave = async (updates: UpdateProjectRequest) => {
    if (!selected) {
      toast.error('No project selected');
      return;
    }
    try {
      await dispatch(updateProjectThunk({ id: selected.id, changes: updates })).unwrap();
      toast.success('Project updated');
      setEditOpen(false);
      setSelected(null);
    } catch (err) {
      console.error('Failed to update project', err);
      toast.error('Failed to update project');
    }
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    setEditOpen(open);
    if (!open) setSelected(null);
  };

  const filteredProjects = useMemo(() => {
    return myProjects.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : p.progressStatus === statusFilter;
      const matchesType = typeFilter === 'all' ? true : p.projectType.toLowerCase() === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [myProjects, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const open = myProjects.filter((p) => p.progressStatus === 'OPEN').length;
    const inProgress = myProjects.filter((p) => p.progressStatus === 'IN_PROGRESS').length;
    const completed = myProjects.filter((p) => p.progressStatus === 'COMPLETED').length;
    return { open, inProgress, completed };
  }, [myProjects]);

  if (!user) return null;

  // Animated counter component
  const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      let startTime: number;
      let animationFrame: number;
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        setCount(Math.floor(progress * value));
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };
      
      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);
    
    return <span>{count}</span>;
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Projects
          </h1>
          <p className="text-gray-600 mt-1">Manage and track your research projects</p>
        </div>
        <motion.span 
          className="text-sm text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AnimatedCounter value={myProjects.length} /> total projects
        </motion.span>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-1">Open Projects</p>
              <p className="text-3xl font-bold text-blue-900">
                <AnimatedCounter value={stats.open} />
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-amber-900">
                <AnimatedCounter value={stats.inProgress} />
              </p>
            </div>
            <div className="p-3 bg-amber-500 rounded-xl shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-900">
                <AnimatedCounter value={stats.completed} />
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 mb-1">Enrolled Students</p>
              <p className="text-3xl font-bold text-purple-900">
                <AnimatedCounter value={myProjects.reduce((sum, p) => sum + (p.acceptedStudentsCount || 0), 0)} />
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div 
        className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or description..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
            >
              <option value="all">All statuses</option>
              <option value="OPEN">🟢 Open</option>
              <option value="IN_PROGRESS">⚡ In progress</option>
              <option value="COMPLETED">✅ Completed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
            >
              <option value="all">All types</option>
              {projectTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Projects Content */}
      <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Project Overview</h2>
            <Badge variant="outline" className="text-sm font-semibold">
              <BarChart3 className="w-4 h-4 mr-2" />
              {myProjects.length} Projects
            </Badge>
          </div>
        </CardHeader>

      {myProjects.length === 0 ? (
        <CardContent className="p-8 text-center text-muted-foreground">
          You have not created any projects yet.
        </CardContent>
      ) : (
        <CardContent className="pt-4">
          {/* Table view (md and up) */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm" aria-label="Faculty projects table">
              <thead>
                <tr className="bg-accent text-muted-foreground">
                  <th scope="col" className="text-left font-medium px-4 py-3">Title</th>
                  <th scope="col" className="text-left font-medium px-4 py-3">Status</th>
                  <th scope="col" className="text-left font-medium px-4 py-3 hidden md:table-cell">Max Students</th>
                  <th scope="col" className="text-left font-medium px-4 py-3 hidden md:table-cell">Deadline</th>
                  <th scope="col" className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="border-t">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium flex items-center gap-2">
                        {project.title}
                        <Badge variant="outline">
                          {projectTypeOptions.find((o) => o.value.toUpperCase() === project.projectType)?.label || project.projectType}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground text-xs truncate max-w-[320px]">{project.description}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge
                        aria-label={`Status: ${project.progressStatus.replace('_', ' ')}`}
                        variant={
                          project.progressStatus === 'OPEN'
                            ? 'success'
                            : project.progressStatus === 'IN_PROGRESS'
                            ? 'info'
                            : 'muted'
                        }
                      >
                        {project.progressStatus.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-top hidden md:table-cell">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="w-4 h-4 mr-1" aria-hidden="true" />
                        {project.acceptedStudentsCount || 0}/{project.maxStudents}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground hidden md:table-cell">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(`/applications?projectId=${project.id}`)}
                          aria-label={`Review applications for ${project.title}`}
                          title={`Review applications`}
                        >
                          <MessageSquare className="w-4 h-4" aria-hidden="true" /> Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/collaboration?projectId=${project.id}`)}
                          aria-label={`Open collaboration hub for ${project.title}`}
                          title={`Collaboration hub`}
                        >
                          <UserPlus className="w-4 h-4" aria-hidden="true" /> Collaborate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(project)}
                          aria-label={`Edit project ${project.title}`}
                          title={`Edit ${project.title}`}
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" /> Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              aria-label={`Delete project ${project.title}`}
                              title={`Delete ${project.title}`}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete project?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete "{project.title}" and remove any associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={async () => { try { await dispatch(deleteProjectThunk(project.id)).unwrap(); toast.success('Project deleted'); } catch (e) { toast.error('Failed to delete'); } }}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>

          {/* Card view (mobile) */}
          <div className="grid gap-3 md:hidden">
            {filteredProjects.map((project) => (
              <div key={project.id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{project.title}</h3>
                      <Badge variant="outline">
                        {projectTypeOptions.find((o) => o.value.toUpperCase() === project.projectType)?.label || project.projectType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                  <Badge
                    aria-label={`Status: ${project.progressStatus.replace('_', ' ')}`}
                    variant={
                      project.progressStatus === 'OPEN'
                        ? 'success'
                        : project.progressStatus === 'IN_PROGRESS'
                        ? 'info'
                        : 'muted'
                    }
                  >
                    {project.progressStatus.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" aria-hidden="true" />
                    {project.acceptedStudentsCount || 0}/{project.maxStudents}
                  </div>
                  <div>
                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : '-'}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/applications?projectId=${project.id}`)}
                    aria-label={`Review applications for ${project.title}`}
                    title={`Review applications`}
                  >
                    <MessageSquare className="w-4 h-4" aria-hidden="true" />
                    <span className="ml-1">Review</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/collaboration?projectId=${project.id}`)}
                    aria-label={`Open collaboration hub for ${project.title}`}
                    title={`Collaboration hub`}
                  >
                    <UserPlus className="w-4 h-4" aria-hidden="true" />
                    <span className="ml-1">Collaborate</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(project)}
                    aria-label={`Edit project ${project.title}`}
                    title={`Edit ${project.title}`}
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    <span className="ml-1">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        aria-label={`Delete project ${project.title}`}
                        title={`Delete ${project.title}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        <span className="ml-1">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete project?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete "{project.title}" and remove any associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => { try { await dispatch(deleteProjectThunk(project.id)).unwrap(); toast.success('Project deleted'); } catch (e) { toast.error('Failed to delete'); } }}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
      <EditProjectDialog
        project={selected}
        open={editOpen}
        onOpenChange={handleEditDialogOpenChange}
        onSave={handleSave}
      />
    </Card>
    </motion.div>
  );
}
