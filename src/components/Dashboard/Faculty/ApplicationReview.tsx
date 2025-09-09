'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  BookOpen,
  Star,
  MessageSquare,
  Search,
  Eye,
  Filter,
  Phone,
  GraduationCap,
  Award,
  LayoutGrid,
  Layers,
  Heart,
  X as XIcon,
  RotateCcw,
  ChevronDown,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Download,
  MoreHorizontal,
  Bookmark,
  Archive,
  Trash2,
  ExternalLink,
  Zap,
  TrendingUp,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchProfile,
} from '../../../store/slices/profileSlice';
import {
  fetchProjectApplications,
  updateApplicationStatusThunk,
} from '@/store/slices/applicationsSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';

type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'name' | 'status' | 'project';
type SortOrder = 'asc' | 'desc';

export default function ApplicationReview() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { projects } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const prefersReducedMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const applicationsByProject = useAppSelector((state) => state.applications.byProjectId);
  const applicationsLoadingByProject = useAppSelector((state) => state.applications.loadingByProjectId);

  const myProjects = projects.filter((p) => p.facultyId === user?.id);
  const myProjectIds = myProjects.map((p) => p.id);
  const myApplications = myProjectIds.flatMap((pid) => applicationsByProject[pid] || []);

  // Animation variants that respect reduced motion preferences
  const cardVariants = {
    hidden: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: prefersReducedMotion ? 0 : 0.3 } },
    exit: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : -20, transition: { duration: prefersReducedMotion ? 0 : 0.2 } }
  };

  // Initialize project filter from query params (deep-link support)
  useEffect(() => {
    const pid = searchParams?.get('projectId');
    if (pid && myProjects.some((p) => p.id === pid)) {
      setProjectFilter(pid);
    }
    // Only run on mount or when projects list changes size
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, myProjects.length]);

  // Ensure applications for faculty-owned projects are fetched
  useEffect(() => {
    if (!user || user.role !== 'faculty') return;
    myProjectIds.forEach((pid) => {
      const hasData = Array.isArray(applicationsByProject[pid]);
      const isLoading = !!applicationsLoadingByProject[pid];
      if (!hasData && !isLoading) {
        dispatch(fetchProjectApplications({ projectId: pid }));
      }
    });
  }, [dispatch, user?.id, user?.role, myProjectIds, applicationsByProject, applicationsLoadingByProject]);

  const filteredAndSortedApplications = useMemo(() => {
    let filtered = myApplications.filter((app) => {
      const statusLower = app.status.toLowerCase();
      const matchesSearch = app.studentName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || statusLower === statusFilter;
      const matchesProject = projectFilter === 'all' || app.projectId === projectFilter;
      return matchesSearch && matchesStatus && matchesProject;
    });

    // Sort applications
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
          break;
        case 'name':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'project':
          const projectA = projects.find(p => p.id === a.projectId)?.title || '';
          const projectB = projects.find(p => p.id === b.projectId)?.title || '';
          comparison = projectA.localeCompare(projectB);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [myApplications, searchTerm, statusFilter, projectFilter, sortBy, sortOrder, projects]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleApplicationUpdate = async (
    applicationId: string,
    status: 'accepted' | 'rejected'
  ) => {
    setIsLoading(true);
    try {
      const mapped = status.toUpperCase() as 'ACCEPTED' | 'REJECTED';
      await dispatch(updateApplicationStatusThunk({ applicationId, status: mapped }));
      toast.success(`Application ${status} successfully`);
    } catch (error) {
      toast.error(`Failed to ${status} application`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = async (action: 'accept' | 'reject') => {
    if (selectedApplications.size === 0) return;
    
    setIsLoading(true);
    try {
      const promises = Array.from(selectedApplications).map(id => 
        dispatch(updateApplicationStatusThunk({ 
          applicationId: id, 
          status: action.toUpperCase() as 'ACCEPTED' | 'REJECTED' 
        }))
      );
      await Promise.all(promises);
      toast.success(`${selectedApplications.size} applications ${action}ed`);
      setSelectedApplications(new Set());
    } catch (error) {
      toast.error(`Failed to ${action} applications`);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    {
      name: 'Total Applications',
      value: myApplications.length,
      icon: BookOpen,
      color: 'bg-blue-500',
    },
    {
      name: 'Pending Review',
      value: myApplications.filter((app) => app.status.toLowerCase() === 'pending').length,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      name: 'Accepted',
      value: myApplications.filter((app) => app.status.toLowerCase() === 'accepted').length,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      name: 'Response Rate',
      value: `${Math.round(
        (myApplications.filter((app) => app.status.toLowerCase() !== 'pending').length /
          Math.max(myApplications.length, 1)) *
          100
      )}%`,
      icon: Star,
      color: 'bg-purple-500',
    },
  ];

  const ApplicationCard = ({ application }: { application: any }) => {
    const project = projects.find((p) => p.id === application.projectId);
    if (!project) return null;
    
    const userId: string = application.studentId;
    const profile = useAppSelector((state) => state.profile.profile);
    const loadingProfile = useAppSelector((state) => state.profile.loading);

    useEffect(() => {
      if (selectedApplication === application.id && !profile && !loadingProfile) {
        dispatch(fetchProfile(userId));
      }
    }, [selectedApplication, application.id, profile, loadingProfile, dispatch, userId]);

    return (
      <Card className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden group">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div className="flex items-start space-x-4 flex-1">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                <User className="w-7 h-7 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                  {application.studentName}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                  <span className="truncate">Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge
                    variant={getStatusVariant(application.status)}
                    className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1"
                  >
                    {getStatusIcon(application.status)}
                    <span>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                  </Badge>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    project.projectType === 'research' 
                      ? 'bg-purple-100 text-purple-700' 
                      : project.projectType === 'project'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {project.projectType}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p className="truncate"><strong>Project:</strong> {project.title}</p>
                  <p className="truncate"><strong>Faculty:</strong> {project.facultyName}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 lg:flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <motion.button
                  onClick={() => handleApplicationUpdate(application.id, 'accepted')}
                  disabled={application.status.toLowerCase() !== 'pending'}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm min-w-[100px]"
                  whileHover={{ scale: application.status.toLowerCase() === 'pending' ? 1.02 : 1 }}
                  whileTap={{ scale: application.status.toLowerCase() === 'pending' ? 0.98 : 1 }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept
                </motion.button>
                <motion.button
                  onClick={() => handleApplicationUpdate(application.id, 'rejected')}
                  disabled={application.status.toLowerCase() !== 'pending'}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm min-w-[100px]"
                  whileHover={{ scale: application.status.toLowerCase() === 'pending' ? 1.02 : 1 }}
                  whileTap={{ scale: application.status.toLowerCase() === 'pending' ? 0.98 : 1 }}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </motion.button>
              </div>
              <motion.button
                onClick={() => setSelectedApplication(
                  selectedApplication === application.id ? null : application.id
                )}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm w-full sm:w-auto lg:min-w-[140px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Eye className="w-4 h-4" />
                {selectedApplication === application.id ? 'Hide' : 'View'} Details
              </motion.button>
            </div>
          </div>

          {selectedApplication === application.id && (
            <motion.div 
              className="mt-6 pt-6 border-t border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100"
                >
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                    Project Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <span className="font-semibold text-gray-700 w-20">Title:</span>
                      <span className="text-gray-900 font-medium">{project.title}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-gray-700 w-20">Faculty:</span>
                      <span className="text-gray-900">{project.facultyName}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-gray-700 w-20">Dept:</span>
                      <span className="text-gray-900">{project.departments?.join(', ')}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-gray-700 w-20">Duration:</span>
                      <span className="text-gray-900">{project.projectDuration}</span>
                    </div>
                  </div>
                </motion.div>

                {application.message && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100"
                  >
                    <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2 text-green-500" />
                      Application Message
                    </h4>
                    <div className="p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                      <p className="text-sm text-gray-700 leading-relaxed">{application.message}</p>
                    </div>
                  </motion.div>
                )}

                {loadingProfile && (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {profile && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-100"
                  >
                    <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-orange-500" />
                      Student Profile
                    </h4>
                    <div className="space-y-3 text-sm">
                      {profile.bio && (
                        <div>
                          <span className="font-semibold text-gray-700 block mb-1">Bio:</span>
                          <p className="text-gray-900">{profile.bio}</p>
                        </div>
                      )}
                      {profile.skills && profile.skills.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-700 block mb-2">Skills:</span>
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill: string) => (
                              <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile.socialLinks && (
                        <div className="flex gap-2 pt-2">
                          {profile.socialLinks.linkedin && (
                            <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              LinkedIn
                            </a>
                          )}
                          {profile.socialLinks.github && (
                            <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800">
                              GitHub
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <motion.div 
      className="space-y-8 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Enhanced Header with Actions */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Application Review
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Review and manage student applications for your projects
          </p>
        </div>
        <motion.div 
          className="mt-6 sm:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 bg-white border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {selectedApplications.size > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={() => handleBulkAction('accept')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold"
                disabled={isLoading}
              >
                <CheckCircle className="w-4 h-4" />
                Accept Selected ({selectedApplications.size})
              </Button>
              <Button
                onClick={() => handleBulkAction('reject')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold"
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4" />
                Reject Selected ({selectedApplications.size})
              </Button>
            </div>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-4 py-4 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
          >
            <option value="date">📅 Sort by Date</option>
            <option value="name">👤 Sort by Name</option>
            <option value="status">📊 Sort by Status</option>
            <option value="project">🚀 Sort by Project</option>
          </select>
          
          <motion.button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center px-4 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {sortOrder === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Applications List */}
      {filteredAndSortedApplications.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedApplications.map((application: any) => (
              <motion.div
                key={application.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout={!prefersReducedMotion}
              >
                <ApplicationCard application={application} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {myApplications.length === 0 ? (
              <>
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No applications yet</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Once students start applying to your projects, you'll see their applications here
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No applications found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Try adjusting your search criteria or filters to discover more applications
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
