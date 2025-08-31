'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Trophy, 
  Star, 
  Calendar, 
  User, 
  Filter,
  Search,
  Sparkles
} from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  awardedAt: string;
  awardedBy: string;
  awardedByName: string;
  reason: string;
  projectId?: string;
}

interface StudentBadgesTabProps {
  badges: Badge[];
  loading?: boolean;
}

export default function StudentBadgesTab({ badges, loading = false }: StudentBadgesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const rarityConfig = {
    common: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-300',
      glow: 'shadow-gray-200/50'
    },
    rare: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-300',
      glow: 'shadow-blue-200/50'
    },
    epic: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-300',
      glow: 'shadow-purple-200/50'
    },
    legendary: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-300',
      glow: 'shadow-yellow-200/50'
    }
  };

  // Get unique categories and rarities
  const categories = Array.from(new Set(badges.map(badge => badge.category))).sort();
  const rarities = ['common', 'rare', 'epic', 'legendary'];

  // Filter badges
  const filteredBadges = badges.filter(badge => {
    const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         badge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = !selectedRarity || badge.rarity === selectedRarity;
    const matchesCategory = !selectedCategory || badge.category === selectedCategory;
    return matchesSearch && matchesRarity && matchesCategory;
  });

  // Group badges by rarity for stats
  const badgeStats = rarities.map(rarity => ({
    rarity,
    count: badges.filter(badge => badge.rarity === rarity).length,
    ...rarityConfig[rarity as keyof typeof rarityConfig]
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: "easeOut",
        type: "spring",
        bounce: 0.3
      }
    }
  };

  const BadgeSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <BadgeSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Badge Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {badgeStats.map((stat) => (
          <div
            key={stat.rarity}
            className={`${stat.bg} ${stat.border} border-2 rounded-2xl p-4 text-center`}
          >
            <div className={`text-2xl font-bold ${stat.text} mb-1`}>
              {stat.count}
            </div>
            <div className={`text-sm ${stat.text} capitalize font-medium`}>
              {stat.rarity}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search badges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <select
          value={selectedRarity}
          onChange={(e) => setSelectedRarity(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">All Rarities</option>
          {rarities.map(rarity => (
            <option key={rarity} value={rarity} className="capitalize">
              {rarity}
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Badges Grid */}
      {filteredBadges.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedRarity || selectedCategory ? 'No badges found' : 'No badges earned yet'}
          </h3>
          <p className="text-gray-500">
            {searchTerm || selectedRarity || selectedCategory 
              ? 'Try adjusting your search or filters'
              : 'Keep working on projects and participating in events to earn badges!'
            }
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <AnimatePresence>
            {filteredBadges.map((badge) => {
              const rarity = rarityConfig[badge.rarity];
              return (
                <motion.div
                  key={badge.id}
                  variants={itemVariants}
                  layout
                  whileHover={{ 
                    scale: 1.02, 
                    y: -4,
                    transition: { duration: 0.2 }
                  }}
                  className={`bg-white rounded-2xl border-2 ${rarity.border} p-6 shadow-lg ${rarity.glow} hover:shadow-xl transition-all duration-300 group relative overflow-hidden`}
                >
                  {/* Rarity glow effect */}
                  <div className={`absolute inset-0 ${rarity.bg} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  {/* Legendary sparkle effect */}
                  {badge.rarity === 'legendary' && (
                    <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                      <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Badge Icon */}
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-200" style={{ backgroundColor: badge.color }}>
                        {badge.icon?.startsWith('http') ? (
                          <img src={badge.icon} alt={badge.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <Award className="w-8 h-8" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {badge.name}
                          </h3>
                          <span className={`px-2 py-1 ${rarity.bg} ${rarity.text} text-xs font-bold rounded-full capitalize`}>
                            {badge.rarity}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3">
                          {badge.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(badge.awardedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {badge.awardedByName}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className={`p-3 ${rarity.bg} rounded-xl`}>
                      <div className="text-xs font-medium text-gray-700 mb-1">Awarded for:</div>
                      <div className="text-sm text-gray-800">{badge.reason}</div>
                    </div>

                    {/* Category tag */}
                    <div className="mt-3 flex justify-between items-center">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        {badge.category}
                      </span>
                      
                      {badge.rarity === 'legendary' && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Trophy className="w-4 h-4" />
                          <span className="text-xs font-bold">LEGENDARY</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
