'use client';

import React, { useState } from 'react';
import { X, Search, Filter, Calendar, Users } from 'lucide-react';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: SearchCriteria) => void;
  currentFilters: SearchCriteria;
  departments: string[];
}

export interface SearchCriteria {
  name?: string;
  email?: string;
  collegeMemberId?: string;
  roles?: string[];
  departments?: string[];
  statuses?: string[];
  years?: number[];
  createdAfter?: string;
  createdBefore?: string;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
  hasNeverLoggedIn?: boolean;
}

const ROLES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'DEPT_ADMIN', label: 'Department Admin' },
  { value: 'PLACEMENTS_ADMIN', label: 'Placements Admin' },
];

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const ACADEMIC_YEARS = [1, 2, 3, 4];

export default function AdvancedSearchModal({ isOpen, onClose, onApplyFilters, currentFilters, departments }: AdvancedSearchModalProps) {
  const [criteria, setCriteria] = useState<SearchCriteria>({});

  const handleSearch = () => {
    onApplyFilters(criteria);
    onClose();
  };

  const handleReset = () => {
    setCriteria({});
  };

  const updateCriteria = (key: keyof SearchCriteria, value: any) => {
    setCriteria(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = (key: keyof SearchCriteria, value: string) => {
    const currentArray = (criteria[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateCriteria(key, newArray.length > 0 ? newArray : undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Advanced Search</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={criteria.name || ''}
                  onChange={(e) => updateCriteria('name', e.target.value || undefined)}
                  placeholder="Search by display name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={criteria.email || ''}
                  onChange={(e) => updateCriteria('email', e.target.value || undefined)}
                  placeholder="Search by email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member ID</label>
                <input
                  type="text"
                  value={criteria.collegeMemberId || ''}
                  onChange={(e) => updateCriteria('collegeMemberId', e.target.value || undefined)}
                  placeholder="Student/Employee ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Roles */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Roles</h3>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(role => (
                <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(criteria.roles || []).includes(role.value)}
                    onChange={() => toggleArrayValue('roles', role.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Departments */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Departments</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {departments.map((dept: string) => (
                <label key={dept} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(criteria.departments || []).includes(dept)}
                    onChange={() => toggleArrayValue('departments', dept)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{dept}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Status</h3>
            <div className="flex flex-wrap gap-4">
              {STATUSES.map(status => (
                <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(criteria.statuses || []).includes(status.value)}
                    onChange={() => toggleArrayValue('statuses', status.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Years (for students) */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Academic Years</h3>
            <div className="flex flex-wrap gap-4">
              {ACADEMIC_YEARS.map(year => (
                <label key={year} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(criteria.years || []).includes(year)}
                    onChange={() => toggleArrayValue('years', year.toString())}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Year {year}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Account Created</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">After</label>
                    <input
                      type="date"
                      value={criteria.createdAfter || ''}
                      onChange={(e) => updateCriteria('createdAfter', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Before</label>
                    <input
                      type="date"
                      value={criteria.createdBefore || ''}
                      onChange={(e) => updateCriteria('createdBefore', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Last Login</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">After</label>
                    <input
                      type="date"
                      value={criteria.lastLoginAfter || ''}
                      onChange={(e) => updateCriteria('lastLoginAfter', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Before</label>
                    <input
                      type="date"
                      value={criteria.lastLoginBefore || ''}
                      onChange={(e) => updateCriteria('lastLoginBefore', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteria.hasNeverLoggedIn || false}
                      onChange={(e) => updateCriteria('hasNeverLoggedIn', e.target.checked || undefined)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Never logged in</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Reset All Filters
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
