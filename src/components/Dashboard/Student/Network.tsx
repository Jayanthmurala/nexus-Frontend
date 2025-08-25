'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Users, UserPlus, Search } from 'lucide-react';

export default function Network() {
  const { user } = useAuth();
  const { users, follows } = useData();

  const people = useMemo(
    () => users.filter((u) => (u.role === 'student' || u.role === 'faculty') && u.id !== user?.id),
    [users, user]
  );

  const suggestions = people.slice(0, 6);

  const followingUsers = useMemo(
    () =>
      follows
        .filter((f) => f.followerId === user?.id)
        .map((f) => users.find((u) => u.id === f.followingId))
        .filter(Boolean) as typeof users,
    [follows, users, user]
  );

  const followerUsers = useMemo(
    () =>
      follows
        .filter((f) => f.followingId === user?.id)
        .map((f) => users.find((u) => u.id === f.followerId))
        .filter(Boolean) as typeof users,
    [follows, users, user]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Network
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Discover and follow students and faculty to build your professional network.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search people by name, skills, or interests (coming soon)"
              className="w-full pl-9 pr-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
          <button
            type="button"
            className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50"
            disabled
          >
            Search
          </button>
        </div>
      </div>

      {/* Suggestions and lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suggestions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">People you may follow</h2>
            <span className="text-sm text-gray-500">{people.length} people</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((s) => (
              <div key={s.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
                <Link href={`/student/profile/${s.id}`} className="flex items-center gap-3 hover:opacity-90">
                  {/* Avatar */}
                  {s.avatar ? (
                    <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500" />)
                  }
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-600">
                      {s.department || (s.role === 'faculty' ? 'Faculty' : 'Student')}
                      {typeof s.year === 'number' ? ` · Year ${s.year}` : ''}
                    </div>
                  </div>
                </Link>
                <button
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm text-gray-700 disabled:opacity-60"
                  disabled
                  title="Follow (coming soon)"
                >
                  <UserPlus className="w-4 h-4" /> Follow
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Following/Followers */}
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900">Following</h3>
            {followingUsers.length === 0 ? (
              <p className="text-sm text-gray-600 mt-2">You are not following anyone yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {followingUsers.map((u) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <Link href={`/student/profile/${u.id}`} className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500" />
                      )}
                      <span className="text-sm text-gray-800">{u.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900">Followers</h3>
            {followerUsers.length === 0 ? (
              <p className="text-sm text-gray-600 mt-2">No followers yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {followerUsers.map((u) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <Link href={`/student/profile/${u.id}`} className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500" />
                      )}
                      <span className="text-sm text-gray-800">{u.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 text-blue-800 border border-blue-100 rounded-xl p-4 text-sm">
        Click a person to view their profile. Following and messaging are coming soon.
      </div>
    </div>
  );
}
