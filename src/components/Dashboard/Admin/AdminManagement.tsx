'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Key, 
  UserPlus,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Shield,
  GraduationCap,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { headAdminApi, type HeadAdminUser, type CollegeStats, type College } from '@/lib/headAdminApi';
import { 
  CreateUserModal, 
  EditUserModal, 
  DeleteUserModal, 
  ResetPasswordModal 
} from './UserManagementModals';
import BulkOperationsModal from './BulkOperationsModal';
import AdvancedSearchModal, { type SearchCriteria } from './AdvancedSearchModal';

interface AdminManagementProps {}

const ROLES = [
  { value: 'STUDENT', label: 'Student', icon: GraduationCap, color: 'text-blue-600' },
  { value: 'FACULTY', label: 'Faculty', icon: Briefcase, color: 'text-green-600' },
  { value: 'DEPT_ADMIN', label: 'Dept Admin', icon: Shield, color: 'text-purple-600' },
  { value: 'PLACEMENTS_ADMIN', label: 'Placements Admin', icon: UserCheck, color: 'text-orange-600' },
];

const STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'PENDING_VERIFICATION', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'bg-red-100 text-red-800' },
];

const ACADEMIC_YEARS = [1, 2, 3, 4];

export default function AdminManagement({}: AdminManagementProps) {
  const [users, setUsers] = useState<HeadAdminUser[]>([]);
  const [stats, setStats] = useState<CollegeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedUser, setSelectedUser] = useState<HeadAdminUser | null>(null);
  const [activeFilters, setActiveFilters] = useState<SearchCriteria>({});
  const [college, setCollege] = useState<College | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  const itemsPerPage = 20;

  useEffect(() => {
    loadUsers();
    loadStats();
    loadCollege();
  }, [currentPage, searchTerm, selectedRole, selectedDepartment, selectedStatus, selectedYear]);

  useEffect(() => {
    loadCollege();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await headAdminApi.getUsers({
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        search: searchTerm || undefined,
        role: selectedRole || undefined,
        department: selectedDepartment || undefined,
        status: selectedStatus || undefined,
        year: selectedYear ? parseInt(selectedYear) : undefined,
      });
      
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await headAdminApi.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadCollege = async () => {
    try {
      const collegeData = await headAdminApi.getCollege();
      setCollege(collegeData);
      setDepartments(collegeData.departments || []);
    } catch (error) {
      console.error('Failed to load college:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSelectedDepartment('');
    setSelectedStatus('');
    setSelectedYear('');
    setCurrentPage(1);
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleEditUser = (user: HeadAdminUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: HeadAdminUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleResetPassword = (user: HeadAdminUser) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleAdvancedSearch = (criteria: SearchCriteria) => {
    setActiveFilters(criteria);
    // Apply advanced search filters to the current search
    setSearchTerm(criteria.name || criteria.email || criteria.collegeMemberId || '');
    setSelectedRole(criteria.roles?.[0] || '');
    setSelectedDepartment(criteria.departments?.[0] || '');
    setSelectedStatus(criteria.statuses?.[0] || '');
    setSelectedYear(criteria.years?.[0]?.toString() || '');
    setCurrentPage(1);
  };

  const clearAdvancedFilters = () => {
    setActiveFilters({});
    clearFilters();
  };

  const hasActiveAdvancedFilters = Object.keys(activeFilters).length > 0;

  const getRoleIcon = (roles: string[]) => {
    const primaryRole = roles[0];
    const roleConfig = ROLES.find(r => r.value === primaryRole);
    if (roleConfig) {
      const Icon = roleConfig.icon;
      return <Icon className={`w-4 h-4 ${roleConfig.color}`} />;
    }
    return <Users className="w-4 h-4 text-gray-500" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUSES.find(s => s.value === status);
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${statusConfig?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusConfig?.label || status}
      </span>
    );
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200/50 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-gray-600 mt-1">Manage students, faculty, and administrators in your college</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadUsers}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <UserPlus className="h-5 w-5" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalUsers || 0}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-xl border border-green-100 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.usersByRole?.STUDENT || 0}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-xl border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Faculty</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.usersByRole?.FACULTY || 0}</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-orange-50 p-6 rounded-xl border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide">Recent (30d)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.recentRegistrations || 0}</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-xl">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
        <form onSubmit={handleSearch} className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or member ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={() => setShowAdvancedSearch(true)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              hasActiveAdvancedFilters ? 'bg-purple-50 border-purple-300 text-purple-700' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Search className="w-4 h-4" />
            Advanced
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Departments</option>
                {departments.map((dept: string) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Years</option>
                {ACADEMIC_YEARS.map(year => (
                  <option key={year} value={year.toString()}>Year {year}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2 lg:col-span-4 flex items-center justify-between">
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear basic filters
              </button>
              {hasActiveAdvancedFilters && (
                <button
                  type="button"
                  onClick={clearAdvancedFilters}
                  className="px-4 py-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
                >
                  Clear advanced filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === users.length && users.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {selectedUsers.size > 0 ? `${selectedUsers.size} selected` : 'Select all'}
                </span>
              </label>
            </div>
            
            {selectedUsers.size > 0 && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowBulkModal(true)}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  Bulk Operations ({selectedUsers.size})
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                        />
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.avatarUrl ? (
                              <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <Users className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.collegeMemberId && (
                              <div className="text-xs text-gray-400">ID: {user.collegeMemberId}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.roles)}
                        <span className="text-sm text-gray-900">
                          {user.roles.map(role => ROLES.find(r => r.value === role)?.label || role).join(', ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.department || '-'}</div>
                      {user.year && (
                        <div className="text-xs text-gray-500">Year {user.year}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Reset password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm border rounded ${
                        page === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={async () => {
          await loadUsers();
          await loadStats();
        }}
        departments={departments}
      />
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadUsers}
        user={selectedUser}
        departments={departments}
      />
      <DeleteUserModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={loadUsers}
        user={selectedUser}
      />
      
      <ResetPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={loadUsers}
        user={selectedUser}
      />
      
      <BulkOperationsModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          loadUsers();
          setSelectedUsers(new Set());
        }}
        selectedUsers={users.filter(u => selectedUsers.has(u.id))}
        allUsers={users}
        departments={departments}
      />
      
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onApplyFilters={handleAdvancedSearch}
        currentFilters={activeFilters}
        departments={departments}
      />
    </div>
  );
}
