'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Award, Trophy, Users, Settings, Search, Filter, Plus, BarChart3, Clock, User, Star, Zap, TrendingUp, Palette, X, Download } from 'lucide-react';
import { BadgeDefinition } from '@/lib/profileApi';
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
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [seeding, setSeeding] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const dispatch = useAppDispatch();
  const badges = useAppSelector(selectBadgeDefinitions);
  const recentAwards = useAppSelector(selectRecentAwards);
  const awardCounts = useAppSelector(selectAwardCounts);
  const loading = useAppSelector(selectBadgesLoading);

  // Role-based configuration
  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty' || user?.role === 'dept_admin' || user?.role === 'head_admin';

  // Define tabs based on user role
  const tabs = useMemo(() => {
    if (isStudent) {
      return [
        { id: 'my-badges', label: 'My Badges', icon: User, count: 0 },
        { id: 'gallery', label: 'Badge Gallery', icon: Award, count: badges.length },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, count: 0 }
      ];
    } else if (isFaculty) {
      return [
        { id: 'award', label: 'Award Badge', icon: Award, count: 0 },
        { id: 'gallery', label: 'Badge Gallery', icon: Award, count: badges.length },
        { id: 'manage', label: 'Manage Badges', icon: Settings, count: badges.length },
        { id: 'recent', label: 'Recent Awards', icon: Clock, count: recentAwards.length },
        { id: 'stats', label: 'Statistics', icon: BarChart3, count: 0 }
      ];
    }
    return [
      { id: 'gallery', label: 'Badge Gallery', icon: Award, count: badges.length }
    ];
  }, [isStudent, isFaculty, badges.length, recentAwards.length]);

  // Set default tab based on role
  React.useEffect(() => {
    if (!activeTab && tabs.length > 0) {
      if (isStudent) {
        setActiveTab('my-badges');
      } else if (isFaculty) {
        setActiveTab('award');
      } else {
        setActiveTab('gallery');
      }
    }
  }, [activeTab, tabs, isStudent, isFaculty]);

  React.useEffect(() => {
    if (!badges || badges.length === 0) {
      dispatch(fetchBadgeDefinitions());
    }
    if (isFaculty) {
      dispatch(fetchRecentAwards(undefined));
      dispatch(fetchAwardCounts());
    }
  }, [dispatch, isFaculty]);

  const exportBadgesCSV = async () => {
    try {
      setExporting(true);
      
      // Fetch detailed badge awards data with student information
      const response = await fetch('/api/profile/v1/badges/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch export data');
      }
      
      const exportData = await response.json();
      
      // Create CSV content
      const headers = [
        'Badge Name',
        'Student Name', 
        'College Member ID',
        'Department',
        'Award Date',
        'Awarded By',
        'Reason',
        'Badge Category',
        'Badge Rarity',
        'Project Name',
        'Event Name'
      ];
      
      const csvContent = [
        headers.join(','),
        ...exportData.map((award: any) => [
          `"${award.badgeName || ''}"`,
          `"${award.studentName || ''}"`,
          `"${award.collegeMemberId || ''}"`,
          `"${award.department || ''}"`,
          `"${new Date(award.awardedAt).toLocaleDateString()}"`,
          `"${award.awardedByName || ''}"`,
          `"${award.reason || ''}"`,
          `"${award.badgeCategory || ''}"`,
          `"${award.badgeRarity || ''}"`,
          `"${award.projectName || ''}"`,
          `"${award.eventName || ''}"`,
        ].join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `badges-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Badge data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export badge data');
    } finally {
      setExporting(false);
    }
  };

  const seedDefaultBadges = async () => {
    try {
      setSeeding(true);
      const existing = new Set(badges.map((b) => b.name.trim().toLowerCase()));
      const defaults = [
        // Academic Excellence
        {
          name: 'Academic Excellence',
          description: 'Demonstrates outstanding academic performance and dedication to learning.',
          icon: '🎓',
          color: 'bg-blue-600',
          category: 'Academic',
          rarity: 'RARE' as const,
          criteria: 'Maintains high GPA and shows exceptional understanding of coursework.',
        },
        {
          name: 'Research Pioneer',
          description: 'Makes significant contributions to research and discovery.',
          icon: '🔬',
          color: 'bg-purple-600',
          category: 'Research',
          rarity: 'EPIC' as const,
          criteria: 'Publishes papers, presents at conferences, or leads breakthrough research.',
        },
        {
          name: 'Innovation Champion',
          description: 'Introduces creative solutions and thinks outside the box.',
          icon: '💡',
          color: 'bg-yellow-600',
          category: 'Innovation',
          rarity: 'EPIC' as const,
          criteria: 'Develops novel approaches, creates innovative projects, or solves complex problems creatively.',
        },
        
        // Collaboration & Leadership
        {
          name: 'Team Player',
          description: 'Consistently collaborates effectively and supports teammates.',
          icon: '🤝',
          color: 'bg-green-600',
          category: 'Collaboration',
          rarity: 'COMMON' as const,
          criteria: 'Works well in groups, helps others, and contributes to team success.',
        },
        {
          name: 'Natural Leader',
          description: 'Demonstrates exceptional leadership skills and inspires others.',
          icon: '👑',
          color: 'bg-amber-600',
          category: 'Leadership',
          rarity: 'RARE' as const,
          criteria: 'Leads projects, mentors peers, and drives positive change.',
        },
        {
          name: 'Mentor',
          description: 'Guides and supports fellow students in their academic journey.',
          icon: '🧑‍🏫',
          color: 'bg-indigo-600',
          category: 'Leadership',
          rarity: 'RARE' as const,
          criteria: 'Provides guidance, tutoring, or mentorship to other students.',
        },

        // Technical Skills
        {
          name: 'Code Master',
          description: 'Demonstrates exceptional programming and technical skills.',
          icon: '💻',
          color: 'bg-slate-600',
          category: 'Technical',
          rarity: 'RARE' as const,
          criteria: 'Writes clean code, solves complex technical challenges, or contributes to open source.',
        },
        {
          name: 'Problem Solver',
          description: 'Excels at analytical thinking and debugging complex issues.',
          icon: '🧩',
          color: 'bg-emerald-600',
          category: 'Technical',
          rarity: 'COMMON' as const,
          criteria: 'Systematically approaches problems and finds effective solutions.',
        },
        {
          name: 'AI Enthusiast',
          description: 'Shows exceptional interest and skill in artificial intelligence.',
          icon: '🤖',
          color: 'bg-violet-600',
          category: 'Technical',
          rarity: 'EPIC' as const,
          criteria: 'Works on AI/ML projects, understands algorithms, or contributes to AI research.',
        },

        // Communication & Presentation
        {
          name: 'Outstanding Presenter',
          description: 'Delivers clear, engaging, and impactful presentations.',
          icon: '🎤',
          color: 'bg-pink-600',
          category: 'Communication',
          rarity: 'RARE' as const,
          criteria: 'Presents complex ideas clearly and engages audiences effectively.',
        },
        {
          name: 'Technical Writer',
          description: 'Creates clear, comprehensive technical documentation.',
          icon: '📝',
          color: 'bg-cyan-600',
          category: 'Communication',
          rarity: 'COMMON' as const,
          criteria: 'Writes detailed reports, documentation, or technical blogs.',
        },

        // Impact & Achievement
        {
          name: 'Community Impact',
          description: 'Makes meaningful contributions beyond the classroom.',
          icon: '🌍',
          color: 'bg-teal-600',
          category: 'Impact',
          rarity: 'RARE' as const,
          criteria: 'Participates in community service, hackathons, or social impact projects.',
        },
        {
          name: 'Project Champion',
          description: 'Successfully leads or completes significant projects.',
          icon: '🚀',
          color: 'bg-orange-600',
          category: 'Achievement',
          rarity: 'RARE' as const,
          criteria: 'Delivers high-quality projects on time and exceeds expectations.',
        },
        {
          name: 'Consistent Performer',
          description: 'Maintains high standards and reliable performance.',
          icon: '⭐',
          color: 'bg-blue-500',
          category: 'Performance',
          rarity: 'COMMON' as const,
          criteria: 'Consistently meets deadlines and maintains quality work.',
        },
        {
          name: 'Excellence Award',
          description: 'Represents the highest level of achievement and dedication.',
          icon: '🏆',
          color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
          category: 'Achievement',
          rarity: 'LEGENDARY' as const,
          criteria: 'Demonstrates exceptional performance across multiple areas over extended period.',
        },

        // Special Recognition
        {
          name: 'First Achievement',
          description: 'Congratulations on earning your first badge!',
          icon: '🎉',
          color: 'bg-rose-500',
          category: 'Milestone',
          rarity: 'COMMON' as const,
          criteria: 'Automatically awarded for first badge earned.',
        },
      ];

      const toCreate = defaults.filter((d) => !existing.has(d.name.trim().toLowerCase()));
      if (toCreate.length === 0) {
        toast('Default badges already exist');
        return;
      }

      for (const payload of toCreate) {
        try {
          console.log(`🔄 Creating badge "${payload.name}" with payload:`, JSON.stringify(payload, null, 2));
          await dispatch(createBadgeDefinitionThunk(payload)).unwrap();
          console.log(`✅ Created badge: ${payload.name}`);
        } catch (badgeErr: any) {
          console.error(`❌ Failed to create badge "${payload.name}":`, badgeErr);
          
          // Extract meaningful error message
          let errorMessage = 'Unknown error';
          if (badgeErr?.response?.data?.message) {
            errorMessage = badgeErr.response.data.message;
          } else if (badgeErr?.response?.data?.error) {
            errorMessage = badgeErr.response.data.error;
          } else if (badgeErr?.message) {
            errorMessage = badgeErr.message;
          } else if (typeof badgeErr === 'string') {
            errorMessage = badgeErr;
          } else {
            errorMessage = JSON.stringify(badgeErr, null, 2);
          }
          
          throw new Error(`Failed to create badge "${payload.name}": ${errorMessage}`);
        }
      }
      toast.success(`Created ${toCreate.length} default badge${toCreate.length > 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Badge creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Failed to create default badges: ${errorMessage}`);
    } finally {
      setSeeding(false);
    }
  };

  // Filter badges based on search and rarity
  const filteredBadges = useMemo(() => {
    return badges.filter(badge => {
      const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           badge.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRarity = rarityFilter === 'all' || badge.rarity === rarityFilter;
      return matchesSearch && matchesRarity;
    });
  }, [badges, searchTerm, rarityFilter]);

  // Filter recent awards based on search term (student name, member ID, badge name)
  const filteredRecentAwards = useMemo(() => {
    if (!searchTerm.trim()) return recentAwards;
    
    return recentAwards.filter(award => {
      const badge = badges.find(b => b.id === award.badgeId);
      const badgeName = badge?.name || '';
      const studentName = award.studentName || '';
      const collegeMemberId = award.collegeMemberId || '';
      const studentId = award.studentId || '';
      
      const searchLower = searchTerm.toLowerCase();
      return (
        badgeName.toLowerCase().includes(searchLower) ||
        studentName.toLowerCase().includes(searchLower) ||
        collegeMemberId.toLowerCase().includes(searchLower) ||
        studentId.toLowerCase().includes(searchLower)
      );
    });
  }, [recentAwards, searchTerm, badges]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Please log in to view badges</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Badges</h1>
            </div>
            <p className="text-blue-100">
              {isStudent 
                ? "Discover achievements and track your progress" 
                : "Recognize student achievements and manage badge system"
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{badges.length}</div>
            <div className="text-blue-100 text-sm">Available Badges</div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <nav className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Award Badge Tab (Faculty) */}
            {activeTab === 'award' && isFaculty && (
              <motion.div
                key="award"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Award Student Badges</h3>
                  <p className="text-gray-600 mb-6">Recognize outstanding student achievements with badges</p>
                  <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                  >
                    <Award className="w-5 h-5" />
                    Award Badge to Student
                  </button>
                </div>
              </motion.div>
            )}

            {/* My Badges Tab (Students) */}
            {activeTab === 'my-badges' && isStudent && (
              <motion.div
                key="my-badges"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">My Badge Collection</h3>
                  <div className="text-sm text-gray-500">0 badges earned</div>
                </div>

                {/* Badge Progress Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['common', 'rare', 'epic', 'legendary'].map(rarity => {
                    const rarityBadges = badges.filter(b => b.rarity === rarity);
                    const earnedCount = 0;
                    const percentage = rarityBadges.length > 0 ? Math.round((earnedCount / rarityBadges.length) * 100) : 0;
                    
                    return (
                      <motion.div
                        key={rarity}
                        className={`p-4 rounded-2xl border-2 ${
                          rarity === 'common' ? 'border-gray-200 bg-gray-50' :
                          rarity === 'rare' ? 'border-blue-200 bg-blue-50' :
                          rarity === 'epic' ? 'border-purple-200 bg-purple-50' :
                          'border-yellow-200 bg-yellow-50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-center">
                          <div className={`text-2xl font-bold mb-1 ${
                            rarity === 'common' ? 'text-gray-700' :
                            rarity === 'rare' ? 'text-blue-700' :
                            rarity === 'epic' ? 'text-purple-700' :
                            'text-yellow-700'
                          }`}>
                            {earnedCount}/{rarityBadges.length}
                          </div>
                          <div className="text-sm font-medium text-gray-900 capitalize mb-2">{rarity}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                rarity === 'common' ? 'bg-gray-500' :
                                rarity === 'rare' ? 'bg-blue-500' :
                                rarity === 'epic' ? 'bg-purple-500' :
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Recent Achievements */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h4>
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No badges earned yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Participate in projects and activities to earn your first badge!
                    </p>
                  </div>
                </div>

                {/* Badge Categories Progress */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Progress by Category</h4>
                  <div className="space-y-4">
                    {Array.from(new Set(badges.map(b => b.category).filter(Boolean))).map(category => {
                      const categoryBadges = badges.filter(b => b.category === category);
                      const earnedInCategory = 0;
                      const progress = categoryBadges.length > 0 ? (earnedInCategory / categoryBadges.length) * 100 : 0;
                      
                      return (
                        <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-700">
                                {(category || 'U').charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{category || 'Uncategorized'}</div>
                              <div className="text-sm text-gray-500">
                                {earnedInCategory} of {categoryBadges.length} badges
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700 w-10 text-right">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Next Badges to Earn */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Badges to Discover</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {badges.slice(0, 6).map((badge) => (
                      <motion.div
                        key={badge.id}
                        className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl opacity-50">{badge.icon || '🏅'}</div>
                          <div className="min-w-0">
                            <h5 className="font-medium text-gray-900 truncate">{badge.name}</h5>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{badge.description}</p>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                                badge.rarity === 'common' ? 'bg-gray-100 text-gray-700' :
                                badge.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                                badge.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {badge.rarity}
                              </span>
                              <span className="text-xs text-gray-500">{badge.category}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Badge Gallery Tab */}
            {activeTab === 'gallery' && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search badges by name, description, student name, or member ID..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                      value={rarityFilter}
                      onChange={(e) => setRarityFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="all">All Rarities</option>
                      <option value="common">Common</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="legendary">Legendary</option>
                    </select>
                  </div>
                </div>

                {/* Badge Grid */}
                {loading && badges.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <div className="text-gray-500">Loading badges...</div>
                  </div>
                ) : filteredBadges.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <div className="text-gray-500">No badges found matching your criteria</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                      {filteredBadges.map((badge, index) => (
                        <motion.div
                          key={badge.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                            badge.rarity === 'common' ? 'border-gray-200 bg-gray-50 hover:border-gray-300' :
                            badge.rarity === 'rare' ? 'border-blue-200 bg-blue-50 hover:border-blue-300' :
                            badge.rarity === 'epic' ? 'border-purple-200 bg-purple-50 hover:border-purple-300' :
                            'border-yellow-200 bg-yellow-50 hover:border-yellow-300'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`text-4xl p-4 rounded-2xl mx-auto mb-4 w-fit ${badge.color || 'bg-gray-400'} text-white shadow-lg`}>
                              {badge.icon || '🏅'}
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">{badge.name}</h3>
                            <div className="flex items-center justify-center gap-2 mb-3">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                badge.rarity === 'common' ? 'bg-gray-100 text-gray-700' :
                                badge.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                                badge.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                              </span>
                              {badge.category && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  {badge.category}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{badge.description}</p>
                            {badge.criteria && (
                              <div className="text-xs text-gray-500 bg-white rounded-lg p-3 border">
                                <strong>Criteria:</strong> {badge.criteria}
                              </div>
                            )}
                            <div className="mt-4 text-xs text-gray-400">
                              Awarded {awardCounts[badge.id] || 0} times
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* Manage Badges Tab (Faculty) */}
            {activeTab === 'manage' && isFaculty && (
              <motion.div
                key="manage"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Badge Management</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={exportBadgesCSV}
                      disabled={exporting}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {exporting ? 'Exporting...' : 'Export to CSV'}
                    </button>
                    <button
                      onClick={() => setShowDesigner(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors"
                    >
                      <Palette className="w-4 h-4" />
                      Design Custom Badge
                    </button>
                    <button
                      onClick={seedDefaultBadges}
                      disabled={seeding}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {seeding ? 'Creating...' : 'Seed Default Badges'}
                    </button>
                  </div>
                </div>
                
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Badge Management Tools</h4>
                  <p className="text-gray-600">Use the buttons above to create custom badges or seed default badges.</p>
                </div>
              </motion.div>
            )}

            {/* Recent Awards Tab (Faculty) */}
            {activeTab === 'recent' && isFaculty && (
              <motion.div
                key="recent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900">Recent Badge Awards</h3>
                {filteredRecentAwards.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No recent badge awards</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredRecentAwards.map((award, index) => {
                        const badge = badges.find(b => b.id === award.badgeId);
                        return (
                          <motion.div
                            key={award.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow"
                          >
                            <div className={`text-2xl p-3 rounded-xl ${badge?.color || 'bg-gray-400'} text-white`}>
                              {badge?.icon || '🏅'}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{badge?.name || 'Unknown Badge'}</h4>
                              <p className="text-sm text-gray-600">Awarded to: {award.studentName || 'Unknown'} ({award.collegeMemberId || award.studentId})</p>
                              <p className="text-xs text-gray-500 mt-1">{award.reason}</p>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              {new Date(award.awardedAt).toLocaleDateString()}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* Statistics Tab (Faculty) */}
            {activeTab === 'stats' && isFaculty && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900">Badge Statistics & Analytics</h3>
                
                {/* Overview Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div 
                    className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-700 mb-1">Total Badges</p>
                        <p className="text-3xl font-bold text-blue-900">{badges.length}</p>
                      </div>
                      <div className="p-3 bg-blue-500 rounded-xl">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-green-700 mb-1">Total Awards</p>
                        <p className="text-3xl font-bold text-green-900">
                          {Object.values(awardCounts).reduce((sum, count) => sum + count, 0)}
                        </p>
                      </div>
                      <div className="p-3 bg-green-500 rounded-xl">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-purple-700 mb-1">Categories</p>
                        <p className="text-3xl font-bold text-purple-900">
                          {new Set(badges.map(b => b.category).filter(Boolean)).size}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-500 rounded-xl">
                        <Filter className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-amber-700 mb-1">Recent Awards</p>
                        <p className="text-3xl font-bold text-amber-900">{recentAwards.length}</p>
                      </div>
                      <div className="p-3 bg-amber-500 rounded-xl">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Badge Distribution by Rarity */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Badge Distribution by Rarity</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['common', 'rare', 'epic', 'legendary'].map(rarity => {
                      const count = badges.filter(b => b.rarity === rarity).length;
                      const percentage = badges.length > 0 ? Math.round((count / badges.length) * 100) : 0;
                      return (
                        <div key={rarity} className="text-center">
                          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${
                            rarity === 'common' ? 'bg-gray-100 text-gray-700' :
                            rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                            rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            <span className="text-2xl font-bold">{count}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 capitalize">{rarity}</p>
                          <p className="text-xs text-gray-500">{percentage}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Most Popular Badges */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Most Awarded Badges</h4>
                  <div className="space-y-3">
                    {badges
                      .filter((badge) => badge && typeof badge === 'object' && 'id' in badge)
                      .sort((a, b) => {
                        const countA = awardCounts?.[a.id] || 0;
                        const countB = awardCounts?.[b.id] || 0;
                        return countB - countA;
                      })
                      .slice(0, 5)
                      .map((badge, index) => {
                        const count = awardCounts?.[badge.id] || 0;
                        const maxCount = Math.max(...Object.values(awardCounts || {}));
                        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        
                        return (
                          <div key={badge.id} className="flex items-center gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`text-2xl p-2 rounded-lg ${badge.color || 'bg-gray-400'} text-white`}>
                                {badge.icon || '🏅'}
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900">{badge.name}</h5>
                                <p className="text-sm text-gray-500">{badge.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{count} awards</div>
                              <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Badge Categories */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Badge Categories</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(new Set(badges.map(b => b.category).filter(Boolean))).map(category => {
                      const categoryBadges = badges.filter(b => b.category === category);
                      const totalAwards = categoryBadges.reduce((sum, badge) => sum + (awardCounts[badge.id] || 0), 0);
                      
                      return (
                        <div key={category} className="p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{category}</h5>
                            <span className="text-sm text-gray-500">{categoryBadges.length} badges</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-600">{totalAwards}</div>
                          <div className="text-xs text-gray-500">total awards</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Badge Activity</h4>
                  {filteredRecentAwards.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No recent badge activity
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {filteredRecentAwards.slice(0, 10).map((award, index) => {
                        const badge = badges.find(b => b.id === award.badgeId);
                        const timeAgo = new Date(award.awardedAt).toLocaleDateString();
                        
                        return (
                          <motion.div
                            key={award.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className={`text-lg p-2 rounded-lg ${badge?.color || 'bg-gray-400'} text-white`}>
                              {badge?.icon || '🏅'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                <span className="font-semibold">{badge?.name}</span> awarded to {award.studentName || 'Unknown'} ({award.collegeMemberId || award.studentId})
                              </p>
                              <p className="text-xs text-gray-500">{timeAgo}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Leaderboard Tab (Students) */}
            {activeTab === 'leaderboard' && isStudent && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Badge Leaderboard</h4>
                  <p className="text-gray-600">Leaderboard functionality coming soon...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Award Badge Modal */}
        {open && (
          <AwardBadge onClose={() => setOpen(false)} />
        )}

        {/* Custom Badge Designer Modal */}
        {showDesigner && (
          <BadgeDesigner onClose={() => setShowDesigner(false)} />
        )}
        </div>
      </div>
    </div>
  );
}

// Badge Designer Component
function BadgeDesigner({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: '',
    category: '',
    rarity: 'COMMON' as const,
    color: 'bg-blue-600',
    icon: ''
  });
  const [creating, setCreating] = useState(false);

  const rarityOptions = [
    { value: 'COMMON', label: 'Common', color: 'bg-gray-500' },
    { value: 'RARE', label: 'Rare', color: 'bg-blue-500' },
    { value: 'EPIC', label: 'Epic', color: 'bg-purple-500' },
    { value: 'LEGENDARY', label: 'Legendary', color: 'bg-yellow-500' }
  ];

  const colorOptions = [
    'bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-red-600',
    'bg-yellow-600', 'bg-pink-600', 'bg-indigo-600', 'bg-teal-600',
    'bg-orange-600', 'bg-cyan-600', 'bg-emerald-600', 'bg-rose-600'
  ];

  const emojiOptions = [
    '🏆', '🎖️', '🥇', '⭐', '🌟', '💎', '👑', '🔥',
    '💡', '🚀', '🎯', '🎨', '🔬', '💻', '📚', '🎓',
    '🤝', '💪', '🧠', '❤️', '🌍', '🎉', '✨', '🎪'
  ];

  const categoryOptions = [
    'Academic', 'Technical', 'Leadership', 'Communication', 'Innovation',
    'Collaboration', 'Impact', 'Achievement', 'Performance', 'Milestone'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.criteria.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      // Include all fields now that backend validation supports them
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        criteria: formData.criteria.trim() || undefined,
        category: formData.category || undefined,
        rarity: formData.rarity,
        color: formData.color,
        icon: formData.icon || undefined
      };

      console.log('Custom badge payload:', JSON.stringify(payload, null, 2));
      await dispatch(createBadgeDefinitionThunk(payload)).unwrap();
      toast.success(`Badge "${formData.name}" created successfully!`);
      onClose();
    } catch (err: any) {
      console.error('Failed to create custom badge:', err);
      console.error('Error response:', err?.response?.data);
      
      let errorMessage = 'Failed to create badge';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Check for validation errors
      if (err?.response?.data?.issues) {
        const issues = err.response.data.issues.map((issue: any) => 
          `${issue.path?.join('.')}: ${issue.message}`
        ).join(', ');
        errorMessage = `Validation error: ${issues}`;
      }
      
      toast.error(`Failed to create badge: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Palette className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Design Custom Badge</h2>
              <p className="text-sm text-gray-500">Create a unique badge for your students</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Badge Preview */}
          <div className="text-center">
            <div className="inline-block p-6 bg-gray-50 rounded-2xl">
              <div className={`w-20 h-20 ${formData.color} rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg mx-auto mb-3`}>
                {formData.icon || '🏅'}
              </div>
              <h3 className="font-semibold text-gray-900">{formData.name || 'Badge Name'}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  formData.rarity === 'COMMON' ? 'bg-gray-100 text-gray-700' :
                  formData.rarity === 'RARE' ? 'bg-blue-100 text-blue-700' :
                  formData.rarity === 'EPIC' ? 'bg-purple-100 text-purple-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {formData.rarity}
                </span>
                {formData.category && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {formData.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Badge Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Badge Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter badge name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this badge represents..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            {/* Criteria */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Award Criteria *
              </label>
              <textarea
                value={formData.criteria}
                onChange={(e) => setFormData(prev => ({ ...prev, criteria: e.target.value }))}
                placeholder="Specify the criteria for earning this badge..."
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select category...</option>
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Rarity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rarity
              </label>
              <select
                value={formData.rarity}
                onChange={(e) => setFormData(prev => ({ ...prev, rarity: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {rarityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Badge Color
            </label>
            <div className="grid grid-cols-6 gap-3">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-12 h-12 ${color} rounded-xl border-4 transition-all ${
                    formData.color === color ? 'border-gray-800 scale-110' : 'border-gray-200 hover:border-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Badge Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {emojiOptions.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                  className={`w-12 h-12 text-2xl rounded-xl border-2 transition-all hover:bg-gray-50 ${
                    formData.icon === emoji ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Palette className="w-4 h-4" />
                  Create Badge
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
