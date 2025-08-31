'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Users, 
  Award, 
  Code, 
  BookOpen, 
  Star, 
  TrendingUp,
  Calendar,
  UserPlus
} from 'lucide-react';

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
}

interface ProfileStatsProps {
  role: 'faculty' | 'student';
  stats: {
    projects?: number;
    publications?: number;
    badges?: number;
    followers?: number;
    following?: number;
    citations?: number;
    collaborations?: number;
    achievements?: number;
  };
  loading?: boolean;
}

export default function ProfileStats({ role, stats, loading = false }: ProfileStatsProps) {
  const facultyStats: StatCard[] = [
    {
      label: 'Publications',
      value: stats.publications || 0,
      icon: <FileText className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200'
    },
    {
      label: 'Followers',
      value: stats.followers || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    {
      label: 'Following',
      value: stats.following || 0,
      icon: <UserPlus className="w-5 h-5" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200'
    }
  ];

  const studentStats: StatCard[] = [
    {
      label: 'Projects',
      value: stats.projects || 0,
      icon: <Code className="w-5 h-5" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200'
    },
    {
      label: 'Badges',
      value: stats.badges || 0,
      icon: <Award className="w-5 h-5" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-200'
    },
    {
      label: 'Followers',
      value: stats.followers || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    {
      label: 'Following',
      value: stats.following || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200'
    }
  ];

  const currentStats = role === 'faculty' ? facultyStats : studentStats;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const StatSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    >
      {currentStats.map((stat, index) => (
        <motion.div
          key={stat.label}
          variants={itemVariants}
          whileHover={{ 
            scale: 1.02,
            y: -4,
            transition: { duration: 0.2 }
          }}
          className={`bg-white rounded-2xl border-2 ${stat.bgColor} p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color} group-hover:scale-110 transition-transform duration-200`}>
              {stat.icon}
            </div>
            
            {stat.change && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                stat.change.trend === 'up' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : stat.change.trend === 'down'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                <TrendingUp className={`w-3 h-3 ${
                  stat.change.trend === 'down' ? 'rotate-180' : ''
                }`} />
                +{stat.change.value}
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              className={`text-3xl font-bold ${stat.color} group-hover:scale-105 transition-transform duration-200`}
            >
              {typeof stat.value === 'number' && stat.value > 0 ? (
                <CountUp end={stat.value} duration={1.5} delay={0.5 + index * 0.1} />
              ) : (
                stat.value
              )}
            </motion.div>
            <p className="text-gray-600 font-medium text-sm">{stat.label}</p>
          </div>

          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// CountUp component for animated numbers
function CountUp({ end, duration = 2, delay = 0 }: { end: number; duration?: number; delay?: number }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const increment = end / (duration * 60); // 60fps
      const counter = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(counter);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);

      return () => clearInterval(counter);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [end, duration, delay]);

  return <span>{count}</span>;
}
