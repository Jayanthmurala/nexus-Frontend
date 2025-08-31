'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Briefcase } from 'lucide-react';
import { Experience, ExperiencePayload } from '@/lib/profileApi';
import toast from 'react-hot-toast';

interface FacultyExperienceTabProps {
  experiences: Experience[];
  isOwnProfile: boolean;
  loading: boolean;
  onAddExperience: (data: ExperiencePayload) => Promise<void>;
  onUpdateExperience: (id: string, data: ExperiencePayload) => Promise<void>;
  onDeleteExperience: (id: string) => Promise<void>;
}

export default function FacultyExperienceTab({
  experiences,
  isOwnProfile,
  loading,
  onAddExperience,
  onUpdateExperience,
  onDeleteExperience
}: FacultyExperienceTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExperiencePayload>({
    area: '',
    level: 'Beginner',
    yearsExp: 0,
    description: ''
  });

  const resetForm = () => {
    setFormData({
      area: '',
      level: 'Beginner',
      yearsExp: 0,
      description: ''
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    try {
      await onAddExperience(formData);
      resetForm();
      toast.success('Experience added successfully!');
    } catch (error) {
      toast.error('Failed to add experience');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await onUpdateExperience(id, formData);
      resetForm();
      toast.success('Experience updated successfully!');
    } catch (error) {
      toast.error('Failed to update experience');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this experience?')) {
      try {
        await onDeleteExperience(id);
        toast.success('Experience deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete experience');
      }
    }
  };

  const startEdit = (experience: Experience) => {
    setFormData({
      area: experience.area,
      level: experience.level,
      yearsExp: experience.yearsExp || 0,
      description: experience.description || ''
    });
    setEditingId(experience.id);
    setShowAddForm(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-purple-600" />
          Professional Experience
        </h3>
        {isOwnProfile && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Experience
          </button>
        )}
      </div>

      {/* Add Experience Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 border border-purple-200 rounded-xl p-6"
        >
          <h4 className="text-lg font-semibold text-purple-900 mb-4">Add New Experience</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area of Expertise</label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g., Machine Learning, Data Science"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                <input
                  type="number"
                  value={formData.yearsExp}
                  onChange={(e) => setFormData({ ...formData, yearsExp: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your experience in this area..."
                rows={3}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Experience
              </button>
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Experience List */}
      <div className="space-y-4">
        {experiences.length > 0 ? (
          experiences.map((experience, index) => (
            <motion.div
              key={experience.id}
              variants={itemVariants}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              {editingId === experience.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Area of Expertise</label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                      <input
                        type="number"
                        value={formData.yearsExp}
                        onChange={(e) => setFormData({ ...formData, yearsExp: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdate(experience.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={resetForm}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{experience.area}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        experience.level === 'Expert' ? 'bg-purple-100 text-purple-800' :
                        experience.level === 'Advanced' ? 'bg-blue-100 text-blue-800' :
                        experience.level === 'Intermediate' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {experience.level}
                      </span>
                    </div>
                    {experience.yearsExp && (
                      <p className="text-sm text-purple-600 font-medium mb-2">
                        {experience.yearsExp} years of experience
                      </p>
                    )}
                    {experience.description && (
                      <p className="text-gray-700 leading-relaxed">{experience.description}</p>
                    )}
                  </div>
                  {isOwnProfile && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => startEdit(experience)}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(experience.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <motion.div
            variants={itemVariants}
            className="text-center py-12 bg-gray-50 rounded-xl"
          >
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No professional experience added yet</p>
            {isOwnProfile && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Your First Experience
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
