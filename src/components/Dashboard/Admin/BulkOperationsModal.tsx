'use client';

import React, { useState } from 'react';
import { X, Users, Download, Upload, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { headAdminApi, type HeadAdminUser } from '@/lib/headAdminApi';

interface BulkOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedUsers: HeadAdminUser[];
  allUsers: HeadAdminUser[];
  departments: string[];
}

const BULK_OPERATIONS = [
  { id: 'status', label: 'Update Status', icon: Users },
  { id: 'role', label: 'Change Role', icon: Users },
  { id: 'export', label: 'Export Users', icon: Download },
  { id: 'import', label: 'Import Users', icon: Upload },
];

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const ROLES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'DEPT_ADMIN', label: 'Department Admin' },
  { value: 'PLACEMENTS_ADMIN', label: 'Placements Admin' },
];

export default function BulkOperationsModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  selectedUsers,
  allUsers,
  departments 
}: BulkOperationsModalProps) {
  const [selectedOperation, setSelectedOperation] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const handleStatusUpdate = async () => {
    if (!newStatus || selectedUsers.length === 0) return;

    setLoading(true);
    try {
      const promises = selectedUsers.map(user => 
        headAdminApi.updateUser(user.id, { status: newStatus as any })
      );
      
      await Promise.all(promises);
      toast.success(`Updated status for ${selectedUsers.length} users`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!newRole || selectedUsers.length === 0) return;

    setLoading(true);
    try {
      const promises = selectedUsers.map(user => 
        headAdminApi.updateUser(user.id, { roles: [newRole] })
      );
      
      await Promise.all(promises);
      toast.success(`Updated role for ${selectedUsers.length} users`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update roles:', error);
      toast.error('Failed to update user roles');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const usersToExport = selectedUsers.length > 0 ? selectedUsers : allUsers;
    
    const csvContent = [
      // Header
      ['Name', 'Email', 'Role', 'Department', 'Year', 'Member ID', 'Status', 'Created At', 'Last Login'].join(','),
      // Data rows
      ...usersToExport.map(user => [
        `"${user.displayName}"`,
        `"${user.email}"`,
        `"${user.roles.join(', ')}"`,
        `"${user.department || ''}"`,
        user.year || '',
        `"${user.collegeMemberId || ''}"`,
        user.status,
        new Date(user.createdAt).toLocaleDateString(),
        user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${usersToExport.length} users to CSV`);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      }).filter(obj => obj.Name || obj.Email);

      setImportPreview(preview);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvFile) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const users = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return {
            displayName: obj.Name || obj['Display Name'] || obj.displayName,
            email: obj.Email || obj.email,
            roles: [obj.Role || obj.role || 'STUDENT'],
            department: obj.Department || obj.department,
            year: obj.Year ? parseInt(obj.Year) : undefined,
            collegeMemberId: obj['Member ID'] || obj.collegeMemberId,
            status: obj.Status || 'ACTIVE',
          };
        }).filter(user => user.displayName && user.email);

        const result = await headAdminApi.bulkCreateUsers({ users });
        
        toast.success(`Successfully created ${result.summary.successful} users`);
        if (result.summary.failed > 0) {
          toast.error(`Failed to create ${result.summary.failed} users`);
        }
        
        onSuccess();
        onClose();
      };
      reader.readAsText(csvFile);
    } catch (error: any) {
      console.error('Failed to import users:', error);
      toast.error('Failed to import users');
    } finally {
      setLoading(false);
    }
  };

  const renderOperationContent = () => {
    switch (selectedOperation) {
      case 'status':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Update status for {selectedUsers.length} selected users
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Status</option>
                {STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={loading || !newStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        );

      case 'role':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                Change role for {selectedUsers.length} selected users
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Role</option>
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleUpdate}
                disabled={loading || !newRole}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Export {selectedUsers.length > 0 ? `${selectedUsers.length} selected users` : `all ${allUsers.length} users`} to CSV
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        );

      case 'import':
        return (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Import Users from CSV</p>
                  <p className="text-xs text-orange-700 mt-1">
                    Expected columns: Name, Email, Role, Department, Year, Member ID, Status
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {importPreview.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows)</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left">Email</th>
                        <th className="px-2 py-1 text-left">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-2 py-1">{row.Name || row['Display Name']}</td>
                          <td className="px-2 py-1">{row.Email}</td>
                          <td className="px-2 py-1">{row.Role || 'STUDENT'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={loading || !csvFile}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Import Users'}
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-2 gap-4">
            {BULK_OPERATIONS.map(operation => {
              const Icon = operation.icon;
              const isDisabled = (operation.id === 'status' || operation.id === 'role') && selectedUsers.length === 0;
              
              return (
                <button
                  key={operation.id}
                  onClick={() => setSelectedOperation(operation.id)}
                  disabled={isDisabled}
                  className={`p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Icon className="w-6 h-6 text-blue-600 mb-2" />
                  <h3 className="font-medium text-gray-900">{operation.label}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {operation.id === 'export' && `Export ${selectedUsers.length > 0 ? 'selected' : 'all'} users`}
                    {operation.id === 'import' && 'Import users from CSV file'}
                    {(operation.id === 'status' || operation.id === 'role') && 
                      (selectedUsers.length > 0 ? `${selectedUsers.length} users selected` : 'Select users first')
                    }
                  </p>
                </button>
              );
            })}
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">
              {selectedOperation ? BULK_OPERATIONS.find(op => op.id === selectedOperation)?.label : 'Bulk Operations'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {renderOperationContent()}
        </div>
      </div>
    </div>
  );
}
