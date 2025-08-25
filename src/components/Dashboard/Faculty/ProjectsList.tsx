'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Users, Pencil, Trash2, Search, Filter, MessageSquare, UserPlus } from 'lucide-react';
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

  useEffect(() => {
    dispatch(fetchMyProjects());
  }, [dispatch]);

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

  return (
    <Card>
      <CardHeader className="p-4 pb-0 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Projects</h2>
          <span className="text-sm text-muted-foreground">{myProjects.length} total</span>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span className="text-muted-foreground">Open</span>
            <span className="font-semibold">{stats.open}</span>
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span className="text-muted-foreground">In progress</span>
            <span className="font-semibold">{stats.inProgress}</span>
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span className="text-muted-foreground">Completed</span>
            <span className="font-semibold">{stats.completed}</span>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or description"
              className="w-full rounded-md border px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Search projects"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-md border px-3 py-2 text-sm bg-background"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-md border px-3 py-2 text-sm bg-background"
              aria-label="Filter by project type"
            >
              <option value="all">All types</option>
              {projectTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
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
                        {project.maxStudents}
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
                    {project.maxStudents}
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
  );
}
