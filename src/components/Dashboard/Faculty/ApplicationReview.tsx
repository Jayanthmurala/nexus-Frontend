'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchStudentProfileById,
  selectStudentProfileById,
  selectStudentProfileLoadingById,
  selectStudentProfileErrorById,
} from '@/store/slices/studentProfilesSlice';
import {
  fetchProjectApplications,
  updateApplicationStatusThunk,
} from '@/store/slices/applicationsSlice';

export default function ApplicationReview() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { projects } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<string | null>(
    null
  );
  const searchParams = useSearchParams();
  const applicationsByProject = useAppSelector((state) => state.applications.byProjectId);
  const applicationsLoadingByProject = useAppSelector((state) => state.applications.loadingByProjectId);

  const myProjects = projects.filter((p) => p.facultyId === user?.id);
  const myProjectIds = myProjects.map((p) => p.id);
  const myApplications = myProjectIds.flatMap((pid) => applicationsByProject[pid] || []);

  // Initialize project filter from query params (deep-link support)
  useEffect(() => {
    const pid = searchParams.get('projectId');
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

  const filteredApplications = myApplications.filter((app) => {
    const statusLower = app.status.toLowerCase();
    const matchesSearch = app.studentName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || statusLower === statusFilter;
    const matchesProject = projectFilter === 'all' || app.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

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

  const handleApplicationUpdate = (
    applicationId: string,
    status: 'accepted' | 'rejected'
  ) => {
    const mapped = status.toUpperCase() as 'ACCEPTED' | 'REJECTED';
    dispatch(updateApplicationStatusThunk({ applicationId, status: mapped }));
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
    const profile = useAppSelector((state) => selectStudentProfileById(state, userId));
    const loadingProfile = useAppSelector((state) => selectStudentProfileLoadingById(state, userId));
    const profileError = useAppSelector((state) => selectStudentProfileErrorById(state, userId));

    useEffect(() => {
      if (selectedApplication === application.id && !profile && !loadingProfile) {
        dispatch(fetchStudentProfileById(userId));
      }
    }, [selectedApplication, application.id, profile, loadingProfile, dispatch, userId]);

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4 flex-1">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {application.studentName}
                </h3>
                {profile?.contactInfo && (
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <Mail className="w-4 h-4 mr-1" />
                    <span>{profile.contactInfo}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600 text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    Applied {new Date(application.appliedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end mb-2">
                {getStatusIcon(application.status.toLowerCase())}
                <span
                  className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    application.status.toLowerCase()
                  )}`}
                >
                  {application.status.toLowerCase().charAt(0).toUpperCase() +
                    application.status.toLowerCase().slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-1">Applied for:</h4>
            <p className="text-gray-700 font-semibold">{project.title}</p>
            <p className="text-gray-600 text-sm mt-1">{project.department}</p>
          </div>

          {/* Application Message */}
          {application.message && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Application Message:</h4>
              <p className="text-gray-700 text-sm leading-relaxed bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                {application.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={() =>
                setSelectedApplication(
                  selectedApplication === application.id ? null : application.id
                )
              }
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Profile
            </button>

            {application.status.toLowerCase() === 'pending' && (
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    handleApplicationUpdate(application.id, 'rejected')
                  }
                  className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </button>
                <button
                  onClick={() =>
                    handleApplicationUpdate(application.id, 'accepted')
                  }
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Accept
                </button>
              </div>
            )}

            {application.status.toLowerCase() !== 'pending' && (
              <span className="text-sm text-gray-500">
                {application.status.toLowerCase() === 'accepted' ? 'Accepted' : 'Rejected'} •
                {new Date(application.appliedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Expanded Profile View */}
          {selectedApplication === application.id && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {loadingProfile && (
                <p className="text-sm text-gray-500">Loading profile...</p>
              )}
              {profileError && (
                <p className="text-sm text-red-600">Failed to load profile: {profileError}</p>
              )}
              {!loadingProfile && !profileError && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Academic Details</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <strong>Year:</strong> {profile?.year ?? '—'}
                      </p>
                      <p>
                        <strong>Department:</strong> {profile?.department || application.studentDepartment || '—'}
                      </p>
                      {profile?.collegeMemberId && (
                        <p>
                          <strong>College Member ID:</strong> {profile.collegeMemberId}
                        </p>
                      )}
                      {profile?.bio && (
                        <p>
                          <strong>Bio:</strong> {profile.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Skills & Links</h5>
                    <div className="text-sm text-gray-700 space-y-2">
                      {profile?.skills && profile.skills.length > 0 && (
                        <div>
                          <strong className="block mb-1">Skills:</strong>
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill) => (
                              <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile?.expertise && (profile.expertise as any).length > 0 && (
                        <div>
                          <strong className="block mb-1">Expertise:</strong>
                          <div className="flex flex-wrap gap-2">
                            {(profile.expertise as any).map((exp: string) => (
                              <span key={exp} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">
                                {exp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        {profile?.linkedIn && (
                          <a className="text-blue-600 hover:underline" href={profile.linkedIn} target="_blank" rel="noreferrer">LinkedIn</a>
                        )}
                        {profile?.github && (
                          <a className="text-blue-600 hover:underline" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
                        )}
                        {profile?.resumeUrl && (
                          <a className="text-blue-600 hover:underline" href={profile.resumeUrl} target="_blank" rel="noreferrer">Resume</a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
        <p className="text-gray-600 mt-1">
          Review and manage student applications for your projects
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Projects</option>
              {myProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          {myApplications.length === 0 ? (
            <>
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No applications yet
              </h3>
              <p className="text-gray-600">
                Once students start applying to your projects, you'll see their applications here
              </p>
            </>
          ) : (
            <>
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No applications found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or filters
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
