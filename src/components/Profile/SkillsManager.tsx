'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Edit2, Check, AlertCircle } from 'lucide-react';
import { profileApi } from '@/lib/profileApi';
import toast from 'react-hot-toast';

interface SkillsManagerProps {
  skills: string[];
  isEditable: boolean;
  onSkillsUpdate?: (skills: string[]) => void;
}

export default function SkillsManager({ skills, isEditable, onSkillsUpdate }: SkillsManagerProps) {
  const [localSkills, setLocalSkills] = useState<string[]>(skills);
  const [isAdding, setIsAdding] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    setLoading(true);
    try {
      const updatedSkills = await profileApi.addSkill(newSkill.trim());
      setLocalSkills(updatedSkills);
      setNewSkill('');
      setIsAdding(false);
      onSkillsUpdate?.(updatedSkills);
      toast.success('Skill added successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    setLoading(true);
    try {
      const updatedSkills = await profileApi.removeSkill(skillToRemove);
      setLocalSkills(updatedSkills);
      onSkillsUpdate?.(updatedSkills);
      toast.success('Skill removed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove skill');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSkill();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewSkill('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-emerald-500" />
          Skills ({localSkills.length}/50)
        </h3>
        {isEditable && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={loading || localSkills.length >= 50}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {localSkills.map((skill) => (
            <motion.div
              key={skill}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full font-medium"
            >
              <span className="text-sm">{skill}</span>
              {isEditable && (
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  disabled={loading}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-emerald-200 rounded-full disabled:cursor-not-allowed"
                  title="Remove skill"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}

          {isAdding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full"
            >
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter skill name"
                className="bg-transparent border-none outline-none text-sm w-24 placeholder-gray-500"
                autoFocus
                maxLength={100}
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={handleAddSkill}
                  disabled={!newSkill.trim() || loading}
                  className="p-0.5 text-green-600 hover:bg-green-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add skill"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewSkill('');
                  }}
                  disabled={loading}
                  className="p-0.5 text-red-600 hover:bg-red-100 rounded-full disabled:cursor-not-allowed"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {localSkills.length === 0 && !isAdding && (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <AlertCircle className="w-4 h-4" />
            {isEditable ? 'No skills added yet. Click "Add Skill" to get started.' : 'No skills listed.'}
          </div>
        )}
      </div>

      {localSkills.length >= 45 && (
        <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          You're approaching the maximum limit of 50 skills.
        </div>
      )}
    </div>
  );
}
