'use client';

import React, { useEffect, useMemo, useState } from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import { Calendar, MapPin, Building2, Clock, Link2, Download, Pencil, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  fetchEventById,
  selectCurrentEvent,
  selectEventsLoading,
  deleteEventById,
  exportEventRegistrations,
  updateEvent,
} from '@/store/slices/eventsSlice';
import type { UpdateEventRequest, EventType, EventMode } from '@/lib/eventsApi';

export default function EventDetailClient({ id }: { id: string }) {
  const allowed: UserRole[] = ['faculty'];
  const dispatch = useAppDispatch();
  const router = useRouter();
  const ev = useAppSelector(selectCurrentEvent);
  const loading = useAppSelector(selectEventsLoading);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    description: string;
    startAt: string; // datetime-local
    endAt: string;   // datetime-local
    type: EventType;
    mode: EventMode;
    location: string;
    meetingUrl: string;
    capacity: string | number;
    visibleToAllDepts: boolean;
    departments: string;
  }>({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    type: 'SEMINAR',
    mode: 'ONSITE',
    location: '',
    meetingUrl: '',
    capacity: '',
    visibleToAllDepts: true,
    departments: '',
  });

  useEffect(() => {
    if (!ev || ev.id !== id) {
      void dispatch(fetchEventById(id));
    }
  }, [dispatch, id, ev]);

  const when = useMemo(() => {
    if (!ev) return '';
    const start = new Date(ev.startAt);
    const end = ev.endAt ? new Date(ev.endAt) : undefined;
    return end ? `${start.toLocaleString()} - ${end.toLocaleString()}` : start.toLocaleString();
  }, [ev]);

  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    const tzOffset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOffset * 60000);
    return local.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (!ev) return;
    setForm({
      title: ev.title,
      description: ev.description,
      startAt: toLocalInput(ev.startAt),
      endAt: ev.endAt ? toLocalInput(ev.endAt) : '',
      type: ev.type as EventType,
      mode: ev.mode as EventMode,
      location: ev.location || '',
      meetingUrl: ev.meetingUrl || '',
      capacity: typeof ev.capacity === 'number' ? ev.capacity : '',
      visibleToAllDepts: ev.visibleToAllDepts,
      departments: (ev.departments ?? []).join(', '),
    });
  }, [ev]);

  const onSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ev) return;

    // Minimal validation
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.startAt) {
      toast.error('Start date/time is required');
      return;
    }

    const changes: UpdateEventRequest = {};

    if (form.title !== ev.title) changes.title = form.title.trim();
    if (form.description !== ev.description) changes.description = form.description.trim();

    const startIso = new Date(form.startAt).toISOString();
    if (startIso !== ev.startAt) changes.startAt = startIso;

    if (form.endAt) {
      const endIso = new Date(form.endAt).toISOString();
      if (ev.endAt !== endIso) changes.endAt = endIso;
    }

    if (form.type !== (ev.type as EventType)) changes.type = form.type;
    if (form.mode !== (ev.mode as EventMode)) changes.mode = form.mode;

    const nextLocation = form.location.trim();
    if ((ev.location || '') !== nextLocation) changes.location = nextLocation || null;

    const nextMeetingUrl = form.meetingUrl.trim();
    if ((ev.meetingUrl || '') !== nextMeetingUrl) changes.meetingUrl = nextMeetingUrl || null;

    const nextCap = form.capacity === '' ? null : Number(form.capacity);
    if ((ev.capacity ?? null) !== nextCap) changes.capacity = nextCap;

    if (ev.visibleToAllDepts !== form.visibleToAllDepts) changes.visibleToAllDepts = form.visibleToAllDepts;
    if (!form.visibleToAllDepts) {
      const depts = form.departments
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
      if (JSON.stringify(depts) !== JSON.stringify(ev.departments || [])) changes.departments = depts;
    }

    try {
      await dispatch(updateEvent({ id: ev.id, changes })).unwrap();
      toast.success('Event updated');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update event');
    }
  };

  const handleDelete = async () => {
    if (!ev) return;
    const ok = window.confirm('Are you sure you want to delete this event? This action cannot be undone.');
    if (!ok) return;
    try {
      await dispatch(deleteEventById(ev.id)).unwrap();
      toast.success('Event deleted');
      router.replace('/events');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete event');
    }
  };

  const handleExport = async () => {
    if (!ev) return;
    try {
      const { blob, filename } = await dispatch(exportEventRegistrations(ev.id)).unwrap();

      // Try to filter CSV columns on the client to only: Student Name, Registration Number, Department, Year
      try {
        // Support both CSV and XLSX exports from server; be resilient to octet-stream
        let wb: XLSX.WorkBook | null = null;
        try {
          const ab = await blob.arrayBuffer();
          wb = XLSX.read(ab, { type: 'array' });
        } catch {
          wb = null;
        }
        if (!wb) {
          const csvText = await blob.text();
          wb = XLSX.read(csvText, { type: 'string' });
        }
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' }) as string[][];
        if (!rows.length) throw new Error('Empty CSV');

        const norm = (s: any) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');

        // Alias sets for header detection
        const nameAliases = [
          'student name',
          'name',
          'full name',
          'student full name',
          'name of student',
          'student',
          'studentname',
          'fullname',
        ];
        const memberAliases = [
          'member id',
          'membership id',
          'membershipid',
          'memberid',
          'membership number',
          'membership no',
          'member number',
          'member no',
          'college membership id',
          'college member id',
          'college id',
          'reg id',
          'regid',
          'registration id',
          'registration number',
          'registrationnumber',
          'reg number',
          'registration no',
          'reg no',
          'reg no.',
          'regd no',
          'regd number',
          'register no',
          'register number',
          'student id',
          'roll number',
          'roll no',
          'admission number',
          'admission no',
          'enrollment number',
          'enrolment number',
          'enrollment no',
          'enrolment no',
        ];
        const deptAliases = [
          'department',
          'dept',
          'department name',
          'dept name',
          'department code',
          'dept code',
          'departmentname',
          'deptname',
          'branch',
          'stream',
          'programme',
          'program',
        ];
        const yearAliases = [
          'year',
          'year of study',
          'year-of-study',
          'academic year',
          'batch year',
          'year level',
          'class year',
          'study year',
          'yearofstudy',
          'academicyear',
          'batchyear',
          'yearlevel',
          'classyear',
          'studyyear',
          'yos',
        ];

        // Scan first few rows to identify the actual header row
        let headerRowIdx = -1;
        let iName = -1, iMembership = -1, iDept = -1, iYear = -1;
        const maxScan = Math.min(rows.length, 100);
        for (let r = 0; r < maxScan; r++) {
          const headerRaw = (rows[r] || []).map((x) => String(x ?? ''));
          const normHeader = headerRaw.map(norm);
          const findIdx = (aliases: string[]) => {
            const aliasNorms = aliases.map(norm);
            for (let i = 0; i < normHeader.length; i++) {
              const h = normHeader[i];
              for (const a of aliasNorms) {
                if (h === a || h.includes(a) || a.includes(h)) return i;
              }
            }
            return -1;
          };

          const n = findIdx(nameAliases);
          const m = findIdx(memberAliases);
          const d = findIdx(deptAliases);
          const y = findIdx(yearAliases);
          if (n !== -1 && m !== -1 && d !== -1 && y !== -1) {
            headerRowIdx = r;
            iName = n; iMembership = m; iDept = d; iYear = y;
            try { console.warn('[EventDetail] Detected header row', rows[r]); } catch {}
            break;
          }
        }

        if (headerRowIdx === -1) {
          try { console.warn('[EventDetail] Could not detect header row. Attempting fallback using first row as header. Preview:', rows.slice(0, 2)); } catch {}
          const headerRaw = (rows[0] || []).map((x) => String(x ?? ''));
          const normHeader = headerRaw.map(norm);
          const findIdx = (aliases: string[]) => {
            const aliasNorms = aliases.map(norm);
            for (let i = 0; i < normHeader.length; i++) {
              const h = normHeader[i];
              for (const a of aliasNorms) {
                if (h === a || h.includes(a) || a.includes(h)) return i;
              }
            }
            return -1;
          };
          const n = findIdx(nameAliases);
          const m = findIdx(memberAliases);
          const d = findIdx(deptAliases);
          const y = findIdx(yearAliases);
          headerRowIdx = 0;
          iName = n; iMembership = m; iDept = d; iYear = y;
        }

        const dataRows = rows.slice(headerRowIdx + 1);

        const missing: string[] = [];
        if (iName === -1) missing.push('Student Name');
        if (iMembership === -1) missing.push('Member ID');
        if (iDept === -1) missing.push('Department');
        if (iYear === -1) missing.push('Year');
        if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`);

        const outHeader = ['Student Name', 'Member ID', 'Department', 'Year'];
        const outRows = dataRows.map((r) => [r[iName] ?? '', r[iMembership] ?? '', r[iDept] ?? '', r[iYear] ?? '']);
        const outWs = XLSX.utils.aoa_to_sheet([outHeader, ...outRows]);
        const outWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(outWb, outWs, 'Registrations');
        const outArr = XLSX.write(outWb, { type: 'array', bookType: 'csv' });
        const outBlob = new Blob([outArr], { type: 'text/csv;charset=utf-8;' });
        const outName = (filename?.replace(/\.csv$/i, '') || 'registrations') + '_filtered.csv';

        const url = window.URL.createObjectURL(outBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = outName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Exported filtered CSV');
        return;
      } catch (filterError) {
        try { console.warn('[EventDetail] CSV filtering failed; required columns missing', filterError); } catch {}
        toast.error('Export failed: required columns not found. Expected: Student Name, Member ID, Department, Year');
        return;
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to export registrations');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-4">
        {loading && (
          <div className="bg-white border rounded-xl p-6 text-center text-gray-700">Loading...</div>
        )}
        {!loading && !ev && (
          <div className="bg-white border rounded-xl p-6 text-center text-gray-700">Event not found.</div>
        )}
        {!loading && ev && (
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">{ev.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleEdit} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button onClick={handleExport} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button onClick={handleDelete} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{ev.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {when}</div>
              {ev.location && (
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {ev.location}</div>
              )}
              {ev.meetingUrl && (
                <div className="flex items-center gap-2"><Link2 className="w-4 h-4" /> <a className="text-blue-600 hover:underline" href={ev.meetingUrl} target="_blank" rel="noreferrer">Join link</a></div>
              )}
              <div className="flex items-center gap-2"><Building2 className="w-4 h-4" /> {ev.visibleToAllDepts ? 'All Departments' : (ev.departments?.join(', ') || '—')}</div>
              <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">{ev.type}</span></div>
              <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{ev.mode}</span></div>
              {typeof ev.capacity === 'number' && (
                <div className="flex items-center gap-2"><span className="text-gray-600">Capacity:</span> {ev.capacity}</div>
              )}
              <div className="flex items-center gap-2"><span className="text-gray-600">Registered:</span> {ev.registrationCount ?? 0}</div>
            </div>
          </div>
        )}
        {isEditing && ev && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => !loading && setIsEditing(false)} />
            <div className="relative bg-white w-full max-w-2xl mx-4 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Edit Event</h2>
              <form onSubmit={onSubmitEdit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Starts</label>
                    <input
                      type="datetime-local"
                      className="w-full border rounded-lg px-3 py-2"
                      value={form.startAt}
                      onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Ends</label>
                    <input
                      type="datetime-local"
                      className="w-full border rounded-lg px-3 py-2"
                      value={form.endAt}
                      onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Type</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EventType }))}
                      disabled={loading}
                    >
                      <option value="WORKSHOP">WORKSHOP</option>
                      <option value="SEMINAR">SEMINAR</option>
                      <option value="HACKATHON">HACKATHON</option>
                      <option value="MEETUP">MEETUP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Mode</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      value={form.mode}
                      onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as EventMode }))}
                      disabled={loading}
                    >
                      <option value="ONLINE">ONLINE</option>
                      <option value="ONSITE">ONSITE</option>
                      <option value="HYBRID">HYBRID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Capacity</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border rounded-lg px-3 py-2"
                      value={form.capacity}
                      onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Meeting URL</label>
                    <input
                      type="url"
                      className="w-full border rounded-lg px-3 py-2"
                      value={form.meetingUrl}
                      onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={form.visibleToAllDepts}
                      onChange={(e) => setForm((f) => ({ ...f, visibleToAllDepts: e.target.checked }))}
                      disabled={loading}
                    />
                    Visible to all departments
                  </label>
                </div>
                {!form.visibleToAllDepts && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Departments (comma-separated)</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2"
                      value={form.departments}
                      onChange={(e) => setForm((f) => ({ ...f, departments: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
