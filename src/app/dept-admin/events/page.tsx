'use client';

import React, { useMemo, useState } from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import CreateEvent from '@/components/Dashboard/Faculty/CreateEvent';
import { Calendar, MapPin, Users, Plus } from 'lucide-react';

export default function DeptAdminEventsPage() {
  const allowed: UserRole[] = ['dept_admin'];
  const { user } = useAuth();
  const { events } = useData();
  const [open, setOpen] = useState(false);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const dept = user?.department;
    const deptEvents = events.filter(
      (e) => e.department === dept || e.department === 'All Departments'
    );
    const upcoming = deptEvents.filter((e) => e.date >= now).sort((a, b) => a.date.getTime() - b.date.getTime());
    const past = deptEvents.filter((e) => e.date < now).sort((a, b) => b.date.getTime() - a.date.getTime());
    return { upcoming, past };
  }, [events, user?.department]);

  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Department Events</h1>
            <p className="text-sm text-gray-600">
              {upcoming.length} upcoming • {past.length} past
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </button>
        </div>

        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h2>
          {upcoming.length ? (
            <ul className="space-y-3">
              {upcoming.map((e) => (
                <li key={e.id} className="p-4 rounded-lg border flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{e.title}</div>
                    <div className="text-xs text-gray-600 flex items-center gap-4 mt-1">
                      <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {e.date.toLocaleString()}</span>
                      <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {e.location}</span>
                      <span className="px-2 py-0.5 text-[11px] rounded-full bg-blue-100 text-blue-800">{e.type}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 flex items-center">
                    <Users className="w-4 h-4 mr-1" /> {e.registered}/{e.capacity}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No upcoming events.</p>
          )}
        </section>

        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past</h2>
          {past.length ? (
            <ul className="space-y-3">
              {past.map((e) => (
                <li key={e.id} className="p-4 rounded-lg border flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{e.title}</div>
                    <div className="text-xs text-gray-600 flex items-center gap-4 mt-1">
                      <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {e.date.toLocaleString()}</span>
                      <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {e.location}</span>
                      <span className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-700">{e.type}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 flex items-center">
                    <Users className="w-4 h-4 mr-1" /> {e.registered}/{e.capacity}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No past events.</p>
          )}
        </section>
      </div>
      {open && <CreateEvent onClose={() => setOpen(false)} onSuccess={() => setOpen(false)} />}
    </RoleGuard>
  );
}
