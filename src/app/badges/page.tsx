'use client';

import React, { useState } from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import { Award } from 'lucide-react';
import type { UserRole } from '@/contexts/AuthContext';
import AwardBadge from '@/components/Dashboard/Faculty/AwardBadge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectBadgeDefinitions,
  selectRecentAwards,
  selectAwardCounts,
  selectBadgesLoading,
  fetchBadgeDefinitions,
  fetchRecentAwards,
  fetchAwardCounts,
  createBadgeDefinitionThunk,
} from '@/store/slices/badgesSlice';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function BadgesPage() {
  const allowed: UserRole[] = ['faculty'];
  const [open, setOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const dispatch = useAppDispatch();
  const badges = useAppSelector(selectBadgeDefinitions);
  const recentAwards = useAppSelector(selectRecentAwards);
  const awardCounts = useAppSelector(selectAwardCounts);
  const loading = useAppSelector(selectBadgesLoading);

  React.useEffect(() => {
    if (!badges || badges.length === 0) {
      dispatch(fetchBadgeDefinitions());
    }
    dispatch(fetchRecentAwards(undefined));
    dispatch(fetchAwardCounts());
  }, [dispatch]);

  const seedDefaultBadges = async () => {
    try {
      setSeeding(true);
      const existing = new Set(badges.map((b) => b.name.trim().toLowerCase()));
      const defaults = [
        {
          name: 'Team Player',
          description: 'Consistently collaborates and supports teammates effectively.',
          icon: '🤝',
          color: 'bg-blue-600',
          category: 'Collaboration',
          rarity: 'common' as const,
          criteria: 'Recognizes teamwork and collaboration on projects.',
        },
        {
          name: 'Leadership',
          description: 'Demonstrates strong leadership and initiative.',
          icon: '⭐',
          color: 'bg-amber-600',
          category: 'Leadership',
          rarity: 'rare' as const,
          criteria: 'Guides and mentors peers effectively.',
        },
        {
          name: 'Innovation',
          description: 'Introduces creative, impactful ideas and solutions.',
          icon: '💡',
          color: 'bg-yellow-600',
          category: 'Innovation',
          rarity: 'epic' as const,
          criteria: 'Delivers innovative features or research directions.',
        },
        {
          name: 'Problem Solver',
          description: 'Excels at debugging and resolving complex issues.',
          icon: '🧩',
          color: 'bg-green-600',
          category: 'Skill',
          rarity: 'common' as const,
          criteria: 'Unblocks progress with systematic problem solving.',
        },
        {
          name: 'Research Excellence',
          description: 'Outstanding contribution to research objectives.',
          icon: '🔬',
          color: 'bg-purple-600',
          category: 'Research',
          rarity: 'epic' as const,
          criteria: 'High-quality experiments, analysis, or publications.',
        },
        {
          name: 'Community Impact',
          description: 'Meaningful impact beyond the project team.',
          icon: '🌍',
          color: 'bg-teal-600',
          category: 'Impact',
          rarity: 'rare' as const,
          criteria: 'Contributions benefit a wider community or users.',
        },
        {
          name: 'Outstanding Presentation',
          description: 'Exceptional clarity and delivery in presentations.',
          icon: '🎤',
          color: 'bg-pink-600',
          category: 'Communication',
          rarity: 'rare' as const,
          criteria: 'Communicates ideas and results effectively.',
        },
        {
          name: 'Top Contributor',
          description: 'Consistently delivers high-value contributions.',
          icon: '🏆',
          color: 'bg-indigo-600',
          category: 'Performance',
          rarity: 'legendary' as const,
          criteria: 'Exceptional sustained contribution to outcomes.',
        },
      ];

      const toCreate = defaults.filter((d) => !existing.has(d.name.trim().toLowerCase()));
      if (toCreate.length === 0) {
        toast('Default badges already exist');
        return;
      }

      for (const payload of toCreate) {
        await dispatch(createBadgeDefinitionThunk(payload)).unwrap();
      }
      toast.success(`Created ${toCreate.length} default badge${toCreate.length > 1 ? 's' : ''}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create default badges');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-4">
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Badges</h1>
          </div>
          <p className="text-gray-600 text-sm">Faculty can award and manage badges. Browse available badges and view recent awards.</p>
          <div className="mt-4">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              onClick={() => setOpen(true)}
            >
              <Award className="w-4 h-4" />
              Award Badge
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 ml-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md text-sm disabled:opacity-60"
              onClick={seedDefaultBadges}
              disabled={seeding}
              title="Create ~8 default badges"
            >
              {seeding ? 'Creating…' : 'Create Default Badges'}
            </button>
          </div>
        </div>

        {/* Available Badges */}
        <div className="bg-white border rounded-xl">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Available Badges</h2>
            <span className="text-sm text-gray-500">{badges.length} total</span>
          </div>
          <div className="p-6">
            {loading && badges.length === 0 ? (
              <div className="text-sm text-gray-500">Loading badges…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {badges.map((b) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`text-2xl p-2 rounded-lg ${b.color || 'bg-gray-400'} text-white`}>{b.icon || '🏅'}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 truncate">{b.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 capitalize">{b.rarity}</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{b.description}</p>
                          <div className="mt-2 text-xs text-gray-500">Awarded {awardCounts[b.id] || 0} times</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Recent Awards */}
        <div className="bg-white border rounded-xl">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Awards</h2>
            <span className="text-sm text-gray-500">{recentAwards.length} shown</span>
          </div>
          <div className="divide-y">
            <AnimatePresence>
              {recentAwards.length === 0 ? (
                <div className="p-6 text-sm text-gray-600">No awards yet. Use "Award Badge" to recognize students.</div>
              ) : (
                recentAwards.map((ra) => {
                  const badge = badges.find((b) => b.id === ra.badgeId);
                  return (
                    <motion.div
                      key={ra.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="p-6 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`text-xl p-2 rounded-lg ${badge?.color || 'bg-gray-400'} text-white`}>
                          {badge?.icon || '🏅'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{badge?.name || 'Unknown Badge'}</div>
                          <div className="text-sm text-gray-600 truncate">Student ID: {ra.studentId}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 shrink-0">{new Date(ra.awardedAt as any).toLocaleString()}</div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {open && (
          <AwardBadge onClose={() => setOpen(false)} />
        )}
      </div>
    </RoleGuard>
  );
}
