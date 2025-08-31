'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Briefcase, 
  FolderOpen, 
  Mail, 
  Award,
  Code,
  FileText,
  Heart
} from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface ProfileTabsProps {
  role: 'faculty' | 'student';
  activeTab: string;
  onTabChange: (tabId: string) => void;
  counts?: {
    publications?: number;
    projects?: number;
    badges?: number;
    experiences?: number;
  };
}

export default function ProfileTabs({ role, activeTab, onTabChange, counts }: ProfileTabsProps) {
  const facultyTabs: Tab[] = [
    {
      id: 'about',
      label: 'About',
      icon: <User className="w-4 h-4" />
    },
    {
      id: 'experience',
      label: 'Experience',
      icon: <Briefcase className="w-4 h-4" />,
      count: counts?.experiences
    },
    {
      id: 'publications',
      label: 'Publications',
      icon: <FileText className="w-4 h-4" />,
      count: counts?.publications
    },
    {
      id: 'contact',
      label: 'Contact',
      icon: <Mail className="w-4 h-4" />
    }
  ];

  const studentTabs: Tab[] = [
    {
      id: 'about',
      label: 'About',
      icon: <User className="w-4 h-4" />
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <Code className="w-4 h-4" />,
      count: counts?.projects
    },
    {
      id: 'badges',
      label: 'Badges',
      icon: <Award className="w-4 h-4" />,
      count: counts?.badges
    },
    {
      id: 'contact',
      label: 'Contact',
      icon: <Mail className="w-4 h-4" />
    }
  ];

  const tabs = role === 'faculty' ? facultyTabs : studentTabs;
  const roleColors = {
    faculty: {
      active: 'border-purple-500 text-purple-600 bg-purple-50',
      inactive: 'border-transparent text-gray-500 hover:text-purple-600 hover:bg-purple-50/50',
      indicator: 'bg-purple-500'
    },
    student: {
      active: 'border-emerald-500 text-emerald-600 bg-emerald-50',
      inactive: 'border-transparent text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50',
      indicator: 'bg-emerald-500'
    }
  };

  const colors = roleColors[role];

  return (
    <div className="relative">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-50 p-1 rounded-xl mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id ? colors.active : colors.inactive
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            
            {/* Count badge */}
            {tab.count !== undefined && tab.count > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full ${
                  activeTab === tab.id 
                    ? 'bg-white text-current' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {tab.count}
              </motion.span>
            )}

            {/* Active indicator */}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className={`absolute inset-0 ${colors.indicator} rounded-lg -z-10 opacity-10`}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Mobile Tab Indicator */}
      <div className="md:hidden">
        <div className="flex justify-center mb-4">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  activeTab === tab.id ? colors.indicator : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
