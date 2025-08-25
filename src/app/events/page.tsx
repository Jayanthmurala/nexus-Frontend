'use client';

import React, { useMemo, useState } from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import { Calendar } from 'lucide-react';
import type { UserRole } from '@/contexts/AuthContext';
import CreateEvent from '@/components/Dashboard/Faculty/CreateEvent';
import { useData } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function EventsPage() {
  const allowed: UserRole[] = ['faculty'];
  const [open, setOpen] = useState(false);
  const { events } = useData();
  const sorted = useMemo(() => {
    return [...events].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [events]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<'all' | 'workshop' | 'seminar' | 'competition' | 'networking'>('all');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter(ev =>
      (typeFilter === 'all' || ev.type === typeFilter) &&
      (q === '' || ev.title.toLowerCase().includes(q) || ev.description.toLowerCase().includes(q))
    );
  }, [sorted, query, typeFilter]);
  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-4">
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Events</h1>
          </div>
          <p className="text-gray-600 text-sm">Faculty can manage department events here. Create, view, and plan upcoming activities.</p>
          <div className="mt-4">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              onClick={() => setOpen(true)}
            >
              <Calendar className="w-4 h-4" />
              Create Event
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-xl">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">All Events</h2>
            <span className="text-sm text-gray-500">{filtered.length} shown</span>
          </div>
          <div className="px-6 py-3 border-b flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full md:max-w-sm px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full md:w-auto px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All types</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="competition">Competition</option>
              <option value="networking">Networking</option>
            </select>
          </div>
          <div className="divide-y">
            <AnimatePresence>
              {filtered.length === 0 ? (
                <div className="p-6 text-sm text-gray-600">No events match your filters.</div>
              ) : (
                filtered.map((ev) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">{ev.type.toUpperCase()}</span>
                        <h3 className="font-medium text-gray-900 truncate">{ev.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{ev.description}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(ev.date).toLocaleString()}</span>
                        <span className="inline-flex items-center gap-1">📍{ev.location}</span>
                        <span className="inline-flex items-center gap-1">👥 {ev.registered}/{ev.capacity}</span>
                        <span className="inline-flex items-center gap-1">🏫 {ev.department}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/events/${ev.id}`} className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">View</Link>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {open && <CreateEvent onClose={() => setOpen(false)} />}
      </div>
    </RoleGuard>
  );
}
