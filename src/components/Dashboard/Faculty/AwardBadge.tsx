'use client';

import React, { useState } from 'react';
import { X, Award as AwardIcon, Search, CheckCircle, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectBadgeDefinitions } from '@/store/slices/badgesSlice';
import { fetchBadgeDefinitions, awardBadge as awardBadgeThunk } from '@/store/slices/badgesSlice';

import toast from 'react-hot-toast';
import { fetchMyProjects, selectProjects, selectProjectsLoading } from '@/store/slices/projectsSlice';
import { fetchProjectApplications } from '@/store/slices/applicationsSlice';
import { BadgeDefinition } from '@/lib/profileApi';

interface AwardBadgeProps {
  onClose: () => void;
  studentId?: string;
  studentName?: string;
  projectId?: string;
}

 type StudentAggregate = {
   id: string;
   name: string;
   department: string;
   collegeMemberId?: string;
   projects: { id: string; title: string }[];
 };

export default function AwardBadge({ onClose, studentId, studentName, projectId }: AwardBadgeProps) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const badges = useAppSelector(selectBadgeDefinitions);
  const [selectedStudent, setSelectedStudent] = useState<string>(studentId || '');
  const [selectedStudentName, setSelectedStudentName] = useState<string>(studentName || '');
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [badgeSearchTerm, setBadgeSearchTerm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Data for dynamic student loading
  const projects = useAppSelector(selectProjects);
  const projectsLoading = useAppSelector(selectProjectsLoading);
  const applicationsByProject = useAppSelector((state) => state.applications.byProjectId as Record<string, any[]>);
  const applicationsLoadingByProject = useAppSelector((state) => state.applications.loadingByProjectId as Record<string, boolean>);
  // Profile functionality removed - using network directory for user data
  const directoryUsers = useAppSelector((state) => state.network.directory.items || []);
  const directoryLoading = useAppSelector((state) => state.network.directory.loading);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>(projectId || 'all');

  React.useEffect(() => {
    if (!badges || badges.length === 0) {
      dispatch(fetchBadgeDefinitions());
    }
  }, [badges?.length, dispatch]);

  // Load faculty projects on mount
  React.useEffect(() => {
    if (user?.role !== 'faculty') return;
    if (!projectsLoading && (!projects || projects.length === 0)) {
      dispatch(fetchMyProjects());
    }
  }, [dispatch, user?.role, projects?.length, projectsLoading]);

  // My projects authored by this faculty
  const myProjects = React.useMemo(() => {
    return (projects || []).filter((p: any) => p.authorId === user?.id);
  }, [projects, user?.id]);

  // Ensure applications are loaded for each project (all statuses; we'll filter client-side)
  React.useEffect(() => {
    if (user?.role !== 'faculty') return;
    myProjects.forEach((p: any) => {
      const hasData = Array.isArray(applicationsByProject[p.id]);
      const isLoading = !!applicationsLoadingByProject[p.id];
      if (!hasData && !isLoading) {
        dispatch(fetchProjectApplications({ projectId: p.id, status: 'ACCEPTED' }));
      }
    });
  }, [dispatch, user?.role, myProjects, applicationsByProject, applicationsLoadingByProject]);

  // Aggregate ACCEPTED applications into unique students with project list
  const acceptedApplications = React.useMemo(() => {
    const ids = myProjects.map((p: any) => p.id);
    const apps = ids.flatMap((pid: string) => (applicationsByProject[pid] || []));
    return apps.filter((a: any) => a.status === 'ACCEPTED');
  }, [myProjects, applicationsByProject]);

  const studentsList = React.useMemo(() => {
    const map = new Map<string, StudentAggregate>();
    acceptedApplications.forEach((app: any) => {
      const proj = myProjects.find((p: any) => p.id === app.projectId);
      const existing: StudentAggregate = map.get(app.studentId) ?? {
        id: app.studentId,
        name: app.studentName,
        department: app.studentDepartment,
        collegeMemberId: app.studentCollegeMemberId,
        projects: [],
      };
      if (proj && !existing.projects.some((pr) => pr.id === proj.id)) {
        existing.projects.push({ id: proj.id, title: proj.title });
      }
      map.set(app.studentId, existing);
    });
    return Array.from(map.values());
  }, [acceptedApplications, myProjects]);

  // Profile functionality removed - no preloading needed
  // Students data comes from directory users

  const filteredStudents = React.useMemo(() => {
    const base = projectFilter && projectFilter !== 'all'
      ? studentsList.filter((s) => s.projects.some((pr) => pr.id === projectFilter))
      : studentsList;
    const q = studentSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter((s) => {
      // Profile functionality removed - search by name only
      return s.name.toLowerCase().includes(q);
    });
  }, [studentsList, projectFilter, studentSearch]);

  const studentsLoading = React.useMemo(() => {
    if (projectsLoading) return true;
    if (!myProjects || myProjects.length === 0) return false;
    return myProjects.some((p: any) => !!applicationsLoadingByProject[p.id]);
  }, [projectsLoading, myProjects, applicationsLoadingByProject]);

  const handleExportCsv = React.useCallback(() => {
    const rows = filteredStudents;
    const header = ['Name', 'User ID', 'College Member ID', 'Department', 'Projects Count', 'Projects'];
    const lines = [header.join(',')];
    const csvData = rows.map((s) => {
      // Profile functionality removed - basic data only
      return [
        s.name,
        s.id,
        'N/A', // collegeMemberId not available
        'N/A', // department not available
        s.projects.length,
        s.projects.map((pr) => pr.title).join('; ')
      ];
    });
    const blob = new Blob([csvData.map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `students_export_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredStudents]);

  const filteredBadges = badges.filter((badge) =>
    badge.name.toLowerCase().includes(badgeSearchTerm.toLowerCase()) ||
    badge.description.toLowerCase().includes(badgeSearchTerm.toLowerCase())
  );

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedBadge || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      const effectiveProjectId = projectId || (projectFilter && projectFilter !== 'all' ? projectFilter : undefined);
      await dispatch(
        awardBadgeThunk({
          badgeDefinitionId: selectedBadge,
          userId: selectedStudent,
          reason: reason.trim(),
          projectId: effectiveProjectId,
          awardedByName: user?.displayName || user?.name,
        })
      ).unwrap();
      toast.success(`Badge awarded to ${selectedStudentName || 'student'}`);
      onClose();
    } catch (error) {
      console.error('Error awarding badge:', error);
      toast.error('Failed to award badge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AwardIcon className="w-6 h-6 mr-3" />
              <h2 className="text-xl font-bold">Award Badge</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-purple-100 mt-2">
            Recognize student achievements with badges
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Selection */}
            {!studentId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student *
                </label>
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search by name or College Member ID..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Projects</option>
                    {myProjects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                  {studentsLoading ? (
                    <div className="p-3 text-sm text-gray-500">Loading students…</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No students found</div>
                  ) : (
                    filteredStudents.map((s) => {
                      const selected = selectedStudent === s.id;
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => { setSelectedStudent(s.id); setSelectedStudentName(s.name); }}
                          className={`w-full text-left p-3 hover:bg-gray-50 flex items-center justify-between ${selected ? 'bg-blue-50' : ''}`}
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">{s.name}</div>
                            <div className="text-xs text-gray-600">
                              ID: {s.collegeMemberId || s.id} • Dept: {s.department || '—'}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {s.projects.slice(0, 3).map((pr: any) => (
                                <span key={pr.id} className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-700 rounded">{pr.title}</span>
                              ))}
                              {s.projects.length > 3 && (
                                <span className="text-[10px] text-gray-500">+{s.projects.length - 3} more</span>
                              )}
                            </div>
                          </div>
                          {selected && <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Badge Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Badges
              </label>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={badgeSearchTerm}
                  onChange={(e) => setBadgeSearchTerm(e.target.value)}
                  placeholder="Search badges by name or description..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Badge Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Badge *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {filteredBadges.map((badge: BadgeDefinition) => (
                  <div
                    key={badge.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedBadge === badge.id
                        ? 'border-blue-500 bg-blue-50'
                        : `${getRarityColor(badge.rarity)} hover:border-blue-300`
                    }`}
                    onClick={() => setSelectedBadge(badge.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`text-2xl p-2 rounded-lg ${badge.color} text-white`}>
                        {badge.icon || '🏅'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            badge.rarity === 'common' ? 'bg-gray-100 text-gray-700' :
                            badge.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                            badge.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {badge.rarity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                        <p className="text-xs text-gray-500">
                          <strong>Criteria:</strong> {badge.criteria}
                        </p>
                      </div>
                      {selectedBadge === badge.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Award *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why this student deserves this badge..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                required
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedStudent || !selectedBadge || !reason.trim() || isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Awarding...
                  </>
                ) : (
                  <>
                    <AwardIcon className="w-4 h-4 mr-2" />
                    Award Badge
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
