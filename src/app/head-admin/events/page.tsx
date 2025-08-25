'use client';

import React, { useState } from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Calendar, MapPin, Users, Plus } from 'lucide-react';
import CreateEvent from '@/components/Dashboard/Faculty/CreateEvent';

export default function HeadAdminEventsPage() {
  const allowed: UserRole[] = ['head_admin'];
  const { events } = useData();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-sm text-gray-600">Institution-wide events and activities</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {events.length ? (
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{e.title}</div>
                      <div className="text-xs text-gray-500 capitalize">{e.type}</div>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                      {e.department}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {new Date(e.date).toLocaleString()}</div>
                    <div className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {e.location}</div>
                    <div className="flex items-center"><Users className="w-4 h-4 mr-1" /> {e.registered}/{e.capacity}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No events yet.</p>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateEvent onClose={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />
      )}
    </RoleGuard>
  );
}
