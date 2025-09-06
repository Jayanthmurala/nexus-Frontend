'use client';

import React from 'react';
import { motion } from 'framer-motion';
import RoleGuard from '../../components/common/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Award, 
  GraduationCap,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Eye,
  ChevronDown,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Loader2,
  X
} from 'lucide-react';
import type { UserRole } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMyProjects, selectProjects, selectProjectsLoading } from '../../store/slices/projectsSlice';
import { fetchProjectApplications } from '../../store/slices/applicationsSlice';
import { fetchProfile } from '../../store/slices/profileSlice';
import { profileApi } from '../../lib/profileApi';
import AwardBadge from '../../components/Dashboard/Faculty/AwardBadge';
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
  // State for storing multiple student profiles
  const [profilesById, setProfilesById] = React.useState<Record<string, any>>({});
  const [profilesLoadingById, setProfilesLoadingById] = React.useState<Record<string, boolean>>({});

  const [openAward, setOpenAward] = React.useState<{ studentId: string; studentName: string; projectId?: string } | null>(null);

  // Filters
  const [query, setQuery] = React.useState('');
  const [projectFilter, setProjectFilter] = React.useState<'all' | string>('all');
  const [statusAccepted, setStatusAccepted] = React.useState(true);
  const [statusPending, setStatusPending] = React.useState(true);
  const [statusRejected, setStatusRejected] = React.useState(true);
  const [departmentFilter, setDepartmentFilter] = React.useState<'all' | string>('all');
  const [yearFilter, setYearFilter] = React.useState<'all' | string>('all');
  const [sortBy, setSortBy] = React.useState<'name' | 'projects' | 'department' | 'year'>('name');
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

  // Build filter options and preload student profiles (for College Member ID)
  const departmentOptions = React.useMemo(() => {
    const set = new Set<string>();
    studentsList.forEach((s) => { if (s.department) set.add(s.department); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [studentsList]);

  const yearOptions = React.useMemo(() => {
    const set = new Set<number>();
    studentsList.forEach((s) => {
      const profile = profilesById?.[s.id];
      if (profile?.year && typeof profile.year === 'number') {
        set.add(profile.year);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [studentsList, profilesById]);

  // Fetch student profiles with proper error handling
  React.useEffect(() => {
    const fetchStudentProfile = async (studentId: string) => {
      if (profilesById[studentId] || profilesLoadingById[studentId]) return;
      
      setProfilesLoadingById(prev => ({ ...prev, [studentId]: true }));
      try {
        const profile = await profileApi.getProfile(studentId);
        setProfilesById(prev => ({ ...prev, [studentId]: profile }));
      } catch (error) {
        console.error(`Failed to fetch profile for student ${studentId}:`, error);
        // Set empty profile to prevent infinite retries
        setProfilesById(prev => ({ ...prev, [studentId]: null }));
      } finally {
        setProfilesLoadingById(prev => ({ ...prev, [studentId]: false }));
      }
    };

    studentsList.forEach((s) => {
      fetchStudentProfile(s.id);
    });
  }, [studentsList, profilesById, profilesLoadingById]);

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
      // Year filter
      if (yearFilter !== 'all') {
        const profile = profilesById?.[s.id];
        const studentYear = profile?.year;
        if (studentYear !== parseInt(yearFilter, 10)) return false;
      }
      return true;
    });
    const q = query.trim().toLowerCase();
    const afterQuery = !q
      ? base
      : base.filter((s) => {
          const profile = profilesById?.[s.id];
          const cmid = (profile?.collegeMemberId || '').toLowerCase();
          const email = (profile?.email || '').toLowerCase();
          return s.name.toLowerCase().includes(q) || 
                 cmid.includes(q) || 
                 email.includes(q) ||
                 (s.department || '').toLowerCase().includes(q);
        });
    const sorted = [...afterQuery].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * dir;
        case 'department':
          return (a.department || '').localeCompare(b.department || '') * dir;
        case 'year': {
          const aYear = profilesById?.[a.id]?.year || 0;
          const bYear = profilesById?.[b.id]?.year || 0;
          return (aYear - bYear) * dir;
        }
        case 'projects':
        default:
          return (a.projects.length - b.projects.length) * dir;
      }
    });
    return sorted;
  }, [studentsList, projectFilter, statusAccepted, statusPending, statusRejected, departmentFilter, yearFilter, query, profilesById, sortBy, sortDir]);

  // Loading state for the students list
  const studentsLoading = React.useMemo(() => {
    if (projectsLoading) return true;
    if (!myProjects || myProjects.length === 0) return false;
    return myProjects.some((p: any) => !!applicationsLoadingByProject[p.id]);
  }, [projectsLoading, myProjects, applicationsLoadingByProject]);

  // Export CSV
  const handleExportCsv = React.useCallback(() => {
    if (filteredStudents.length === 0) {
      toast.error('No students to export');
      return;
    }

    const header = ['College Member ID', 'Name', 'Department', 'Email', 'Year', 'Projects Count', 'Projects (Title [Status])', 'Accepted', 'Pending', 'Rejected'];
    const lines = [header.join(',')];
    
    filteredStudents.forEach((s) => {
      const profile = profilesById?.[s.id];
      const cmid = profile?.collegeMemberId || 'N/A';
      const email = profile?.email || profile?.alternateEmail || 'N/A';
      const year = profile?.year || 'N/A';
      const proj = s.projects.map((pr) => `${pr.title} [${pr.status}]`).join('; ') || 'No projects';
      const values = [
        cmid, 
        s.name, 
        s.department || 'N/A', 
        email, 
        String(year), 
        String(s.projects.length), 
        proj, 
        String(s.acceptedCount), 
        String(s.pendingCount), 
        String(s.rejectedCount)
      ];
      const escaped = values.map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(escaped.join(','));
    });
    
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    a.download = `faculty_students_${dateStr}_${timeStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`CSV export completed: faculty_students_${dateStr}_${timeStr}.csv`);
  }, [filteredStudents, profilesById]);

  // Export XLSX (Excel) using dynamic import to avoid bundling if unused
  const handleExportXlsx = React.useCallback(async () => {
    if (filteredStudents.length === 0) {
      toast.error('No students to export');
      return;
    }

    try {
      toast.loading('Preparing Excel export...');
      
      // Dynamic import with proper error handling
      let XLSX;
      try {
        const xlsxModule = await import('xlsx');
        XLSX = xlsxModule.default || xlsxModule;
      } catch (importError) {
        console.error('Failed to load XLSX library:', importError);
        toast.error('Excel library not available. Please use CSV export instead.');
        return;
      }

      const rows = filteredStudents.map((s) => {
        const profile = profilesById?.[s.id];
        const cmid = profile?.collegeMemberId || 'N/A';
        const email = profile?.email || profile?.alternateEmail || 'N/A';
        const year = profile?.year || 'N/A';
        const proj = s.projects.map((pr) => `${pr.title} [${pr.status}]`).join('; ');
        
        return {
          'College Member ID': cmid,
          'Name': s.name,
          'Department': s.department || 'N/A',
          'Email': email,
          'Year': year,
          'Projects Count': s.projects.length,
          'Projects (Title [Status])': proj || 'No projects',
          'Accepted': s.acceptedCount,
          'Pending': s.pendingCount,
          'Rejected': s.rejectedCount,
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 18 }, // College Member ID
        { wch: 25 }, // Name
        { wch: 20 }, // Department
        { wch: 30 }, // Email
        { wch: 10 }, // Year
        { wch: 15 }, // Projects Count
        { wch: 50 }, // Projects
        { wch: 12 }, // Accepted
        { wch: 12 }, // Pending
        { wch: 12 }, // Rejected
      ];
      ws['!cols'] = colWidths;
      
      // Add header styling
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E3F2FD' } },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Faculty Students');
      
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
      const filename = `faculty_students_${dateStr}_${timeStr}.xlsx`;
      
      XLSX.writeFile(wb, filename);
      toast.dismiss();
      toast.success(`Excel export completed: ${filename}`);
    } catch (err: any) {
      console.error('XLSX export failed:', err);
      toast.dismiss();
      toast.error(`Excel export failed: ${err.message || 'Unknown error'}. CSV export is still available.`);
    }
  }, [filteredStudents, profilesById]);

  return (
    <RoleGuard roles={allowed}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold mb-2">Student Management</h1>
                      <p className="text-blue-100 text-lg">Manage and track students collaborating on your research projects</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold">{filteredStudents.length}</div>
                      <div className="text-blue-100 text-sm">Total Students</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold">{myProjects.length}</div>
                      <div className="text-blue-100 text-sm">Active Projects</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="w-5 h-5 text-blue-600" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, College Member ID, email, or department..."
                    className="pl-10 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Project</label>
                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All Projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {myProjects.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Department</label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departmentOptions.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Academic Year</label>
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All Years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {yearOptions.map((y) => (
                          <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Sort By</label>
                    <div className="flex gap-2">
                      <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'projects' | 'department' | 'year')}>
                        <SelectTrigger className="h-10 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="department">Department</SelectItem>
                          <SelectItem value="year">Academic Year</SelectItem>
                          <SelectItem value="projects">Projects Count</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                        className="px-3"
                      >
                        {sortDir === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Actions</label>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          setQuery('');
                          setProjectFilter('all');
                          setDepartmentFilter('all');
                          setYearFilter('all');
                          setStatusAccepted(true);
                          setStatusPending(true);
                          setStatusRejected(true);
                          setSortBy('name');
                          setSortDir('asc');
                        }}
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Export Controls */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Export Filtered Data</label>
                    <div className="flex gap-2">
                      <Button onClick={handleExportCsv} variant="outline" size="sm" className="flex-1">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button onClick={handleExportXlsx} variant="outline" size="sm" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                      <strong>{filteredStudents.length}</strong> students will be exported
                    </div>
                  </div>
                </div>
                
                {/* Status Filters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Application Status</label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="accepted" 
                        checked={statusAccepted} 
                        onCheckedChange={(checked) => setStatusAccepted(checked === true)} 
                      />
                      <label htmlFor="accepted" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                          Accepted
                        </Badge>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="pending" 
                        checked={statusPending} 
                        onCheckedChange={(checked) => setStatusPending(checked === true)} 
                      />
                      <label htmlFor="pending" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                          Pending
                        </Badge>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="rejected" 
                        checked={statusRejected} 
                        onCheckedChange={(checked) => setStatusRejected(checked === true)} 
                      />
                      <label htmlFor="rejected" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                        <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                          Rejected
                        </Badge>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Students List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Students Overview
                    {studentsLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BarChart3 className="w-4 h-4" />
                    {studentsLoading ? 'Loading students...' : `${filteredStudents.length} student${filteredStudents.length === 1 ? '' : 's'} found`}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                      <p className="text-gray-600">Loading students...</p>
                    </div>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-600">Try adjusting your filters to see more results.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredStudents.map((s, index) => {
                      const profile = profilesById?.[s.id];
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          className="group p-6 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            {/* Student Info */}
                            <div className="flex items-start gap-4 flex-1">
                              <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                <AvatarImage src={profile?.avatarUrl} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                                  {s.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg text-gray-900 truncate">{s.name}</h3>
                                  {profile?.collegeMemberId && (
                                    <Badge variant="outline" className="text-xs font-mono w-fit">
                                      ID: {profile.collegeMemberId}
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center gap-1">
                                    <Building2 className="w-4 h-4" />
                                    <span>{s.department || 'No Department'}</span>
                                  </div>
                                  {profile?.year && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      <span>Year {profile.year}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>{s.projects.length} Project{s.projects.length !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                                
                                {/* Project Tags */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {s.projects.slice(0, 3).map((pr) => (
                                    <Badge 
                                      key={pr.id} 
                                      variant="secondary"
                                      className={`text-xs ${
                                        pr.status === 'ACCEPTED' 
                                          ? 'bg-green-100 text-green-700 border-green-200' 
                                          : pr.status === 'PENDING' 
                                          ? 'bg-amber-100 text-amber-700 border-amber-200' 
                                          : 'bg-red-100 text-red-700 border-red-200'
                                      }`}
                                      title={pr.title}
                                    >
                                      <span className="truncate max-w-[120px]">{pr.title}</span>
                                      <span className="ml-1 font-medium">[{pr.status}]</span>
                                    </Badge>
                                  ))}
                                  {s.projects.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{s.projects.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Stats */}
                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div className="flex items-center gap-1 text-green-600">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="font-medium">{s.acceptedCount}</span> Accepted
                                  </div>
                                  <div className="flex items-center gap-1 text-amber-600">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                    <span className="font-medium">{s.pendingCount}</span> Pending
                                  </div>
                                  <div className="flex items-center gap-1 text-red-600">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="font-medium">{s.rejectedCount}</span> Rejected
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Button */}
                            <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                              <Button
                                onClick={() => setOpenAward({ studentId: s.id, studentName: s.name, projectId: projectFilter !== 'all' ? projectFilter : undefined })}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
                                size="sm"
                              >
                                <Award className="w-4 h-4 mr-2" />
                                Award Badge
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
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
    </RoleGuard>
  );
}
