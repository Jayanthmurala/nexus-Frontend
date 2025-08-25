'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import { Users, Search, Filter, Download, Award } from 'lucide-react';
import type { UserRole } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyProjects, selectProjects, selectProjectsLoading } from '@/store/slices/projectsSlice';
import { fetchProjectApplications } from '@/store/slices/applicationsSlice';
import { fetchStudentProfileById } from '@/store/slices/studentProfilesSlice';
import AwardBadge from '@/components/Dashboard/Faculty/AwardBadge';
import toast from 'react-hot-toast';

type AppStatus = 'ACCEPTED' | 'PENDING' | 'REJECTED';
type StudentProjectRef = { id: string; title: string; status: AppStatus };
type StudentAgg = {
  id: string;
  name: string;
  department: string;
  projects: StudentProjectRef[];
  acceptedCount: number;
  pendingCount: number;
  rejectedCount: number;
};

export default function StudentsPage() {
  const allowed: UserRole[] = ['faculty'];
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const projects = useAppSelector(selectProjects);
  const projectsLoading = useAppSelector(selectProjectsLoading);
  const applicationsByProject = useAppSelector((s) => s.applications.byProjectId as Record<string, any[]>);
  const applicationsLoadingByProject = useAppSelector((s) => s.applications.loadingByProjectId as Record<string, boolean>);
  const profilesById = useAppSelector((s) => s.studentProfiles.byId as Record<string, any>);
  const profilesLoadingById = useAppSelector((s) => s.studentProfiles.loading as Record<string, boolean>);

  const [openAward, setOpenAward] = React.useState<{ studentId: string; studentName: string; projectId?: string } | null>(null);

  // Filters
  const [query, setQuery] = React.useState('');
  const [projectFilter, setProjectFilter] = React.useState<'all' | string>('all');
  const [statusAccepted, setStatusAccepted] = React.useState(true);
  const [statusPending, setStatusPending] = React.useState(true);
  const [statusRejected, setStatusRejected] = React.useState(true);
  const [departmentFilter, setDepartmentFilter] = React.useState<'all' | string>('all');
  const [sortBy, setSortBy] = React.useState<'name' | 'projects'>('name');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

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

  // Ensure applications are loaded for each project (all statuses for rich filtering)
  React.useEffect(() => {
    if (user?.role !== 'faculty') return;
    myProjects.forEach((p: any) => {
      const hasData = Array.isArray(applicationsByProject[p.id]);
      const isLoading = !!applicationsLoadingByProject[p.id];
      if (!hasData && !isLoading) {
        dispatch(fetchProjectApplications({ projectId: p.id }));
      }
    });
  }, [dispatch, user?.role, myProjects, applicationsByProject, applicationsLoadingByProject]);

  // Aggregate applications into unique students with per-project status
  const studentsList = React.useMemo((): StudentAgg[] => {
    const map = new Map<string, StudentAgg>();
    const projById = new Map<string, any>(myProjects.map((p: any) => [p.id, p]));
    myProjects.forEach((p: any) => {
      (applicationsByProject[p.id] || []).forEach((app: any) => {
        const existing: StudentAgg = map.get(app.studentId) || {
          id: app.studentId,
          name: app.studentName,
          department: app.studentDepartment,
          projects: [],
          acceptedCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
        };
        const title = projById.get(app.projectId)?.title || 'Untitled';
        if (!existing.projects.some((pr) => pr.id === app.projectId)) {
          existing.projects.push({ id: app.projectId, title, status: app.status as AppStatus });
          if (app.status === 'ACCEPTED') existing.acceptedCount += 1;
          if (app.status === 'PENDING') existing.pendingCount += 1;
          if (app.status === 'REJECTED') existing.rejectedCount += 1;
        }
        map.set(app.studentId, existing);
      });
    });
    return Array.from(map.values());
  }, [myProjects, applicationsByProject]);

  // Build department options and preload student profiles (for College Member ID)
  const departmentOptions = React.useMemo(() => {
    const set = new Set<string>();
    studentsList.forEach((s) => { if (s.department) set.add(s.department); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [studentsList]);

  React.useEffect(() => {
    studentsList.forEach((s) => {
      const prof = profilesById?.[s.id];
      const loading = profilesLoadingById?.[s.id];
      if (typeof prof === 'undefined' && !loading) {
        dispatch(fetchStudentProfileById(s.id));
      }
    });
  }, [dispatch, studentsList, profilesById, profilesLoadingById]);

  // Apply filters
  const filteredStudents = React.useMemo(() => {
    const statusSet = new Set<string>([
      ...(statusAccepted ? ['ACCEPTED'] : []),
      ...(statusPending ? ['PENDING'] : []),
      ...(statusRejected ? ['REJECTED'] : []),
    ]);
    const base = studentsList.filter((s) => {
      // Project filter
      if (projectFilter !== 'all' && !s.projects.some((pr) => pr.id === projectFilter)) return false;
      // Status filter (any matching project status qualifies)
      if (statusSet.size > 0 && !s.projects.some((pr) => statusSet.has(pr.status))) return false;
      // Department filter
      if (departmentFilter !== 'all' && s.department !== departmentFilter) return false;
      return true;
    });
    const q = query.trim().toLowerCase();
    const afterQuery = !q
      ? base
      : base.filter((s) => {
          const cmid = (profilesById?.[s.id]?.collegeMemberId || '').toLowerCase();
          return s.name.toLowerCase().includes(q) || cmid.includes(q);
        });
    const sorted = [...afterQuery].sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return sortDir === 'asc' ? cmp : -cmp;
      } else {
        const ac = a.projects.length - b.projects.length;
        return sortDir === 'asc' ? ac : -ac;
      }
    });
    return sorted;
  }, [studentsList, projectFilter, statusAccepted, statusPending, statusRejected, departmentFilter, query, profilesById, sortBy, sortDir]);

  // Loading state for the students list
  const studentsLoading = React.useMemo(() => {
    if (projectsLoading) return true;
    if (!myProjects || myProjects.length === 0) return false;
    return myProjects.some((p: any) => !!applicationsLoadingByProject[p.id]);
  }, [projectsLoading, myProjects, applicationsLoadingByProject]);

  // Export CSV
  const handleExportCsv = React.useCallback(() => {
    const header = ['Name', 'User ID', 'College Member ID', 'Department', 'Projects Count', 'Projects (Title [Status])', 'Accepted', 'Pending', 'Rejected'];
    const lines = [header.join(',')];
    filteredStudents.forEach((s) => {
      const profile = profilesById?.[s.id];
      const cmid = profile?.collegeMemberId || '';
      const proj = s.projects.map((pr) => `${pr.title} [${pr.status}]`).join('; ');
      const values = [s.name, s.id, cmid, s.department || '', String(s.projects.length), proj, String(s.acceptedCount), String(s.pendingCount), String(s.rejectedCount)];
      const escaped = values.map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(escaped.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `faculty_students_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredStudents, profilesById]);

  // Export XLSX (Excel) using dynamic import to avoid bundling if unused
  const handleExportXlsx = React.useCallback(async () => {
    try {
      const mod: any = await import('xlsx');
      const XLSX = mod.default || mod;
      const rows = filteredStudents.map((s) => {
        const profile = profilesById?.[s.id];
        const cmid = profile?.collegeMemberId || '';
        const proj = s.projects.map((pr) => `${pr.title} [${pr.status}]`).join('; ');
        return {
          Name: s.name,
          UserID: s.id,
          CollegeMemberID: cmid,
          Department: s.department || '',
          ProjectsCount: s.projects.length,
          Projects: proj,
          Accepted: s.acceptedCount,
          Pending: s.pendingCount,
          Rejected: s.rejectedCount,
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `faculty_students_${dateStr}.xlsx`);
    } catch (err: any) {
      console.error('XLSX export failed', err);
      toast.error('Excel export failed. CSV export is still available.');
    }
  }, [filteredStudents, profilesById]);

  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-4">
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Students</h1>
          </div>
          <p className="text-gray-600 text-sm">View all students collaborating on your projects. Filter and export to CSV/Excel.</p>
        </div>

        {/* Filters */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or College Member ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value as any)}
              className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Projects</option>
              {myProjects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 flex items-center gap-1"><Filter className="w-4 h-4" /> Status:</span>
              <label className="text-xs text-gray-700 flex items-center gap-1">
                <input type="checkbox" className="rounded" checked={statusAccepted} onChange={(e) => setStatusAccepted(e.target.checked)} /> Accepted
              </label>
              <label className="text-xs text-gray-700 flex items-center gap-1">
                <input type="checkbox" className="rounded" checked={statusPending} onChange={(e) => setStatusPending(e.target.checked)} /> Pending
              </label>
              <label className="text-xs text-gray-700 flex items-center gap-1">
                <input type="checkbox" className="rounded" checked={statusRejected} onChange={(e) => setStatusRejected(e.target.checked)} /> Rejected
              </label>
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value as any)}
              className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-2 px-3 border border-gray-300 rounded-lg"
              >
                <option value="name">Sort: Name</option>
                <option value="projects">Sort: Projects Count</option>
              </select>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as any)}
                className="py-2 px-3 border border-gray-300 rounded-lg"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportCsv} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button onClick={handleExportXlsx} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Download className="w-4 h-4" /> Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="text-sm text-gray-600">{studentsLoading ? 'Loading students…' : `${filteredStudents.length} student${filteredStudents.length === 1 ? '' : 's'}`}</div>
          </div>
          <div className="divide-y">
            {studentsLoading ? (
              <div className="p-6 text-sm text-gray-500">Loading…</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No students match your filters.</div>
            ) : (
              filteredStudents.map((s) => {
                const profile = profilesById?.[s.id];
                return (
                  <div key={s.id} className="p-6 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{s.name}</div>
                      <div className="text-xs text-gray-600">Dept: {s.department || '—'}{profile?.collegeMemberId ? ` • ID: ${profile.collegeMemberId}` : ''}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.projects.slice(0, 4).map((pr) => (
                          <span key={pr.id} className="px-2 py-0.5 text-[10px] rounded border" title={pr.title}>
                            <span className="text-gray-700">{pr.title}</span>
                            <span className={`ml-1 text-[10px] ${pr.status === 'ACCEPTED' ? 'text-green-600' : pr.status === 'PENDING' ? 'text-amber-600' : 'text-red-600'}`}>[{pr.status}]</span>
                          </span>
                        ))}
                        {s.projects.length > 4 && (
                          <span className="text-[10px] text-gray-500">+{s.projects.length - 4} more</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-600">Accepted {s.acceptedCount} • Pending {s.pendingCount} • Rejected {s.rejectedCount}</span>
                      <button
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs"
                        onClick={() => setOpenAward({ studentId: s.id, studentName: s.name, projectId: projectFilter !== 'all' ? projectFilter : undefined })}
                      >
                        <Award className="w-4 h-4" /> Award Badge
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {openAward && (
          <AwardBadge
            onClose={() => setOpenAward(null)}
            studentId={openAward.studentId}
            studentName={openAward.studentName}
            projectId={openAward.projectId}
          />
        )}
      </div>
    </RoleGuard>
  );
}
