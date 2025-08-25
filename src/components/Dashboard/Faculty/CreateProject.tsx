'use client';

import React, { useMemo, useState } from 'react';
import { Save, X, Plus, Minus, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/store/hooks';
import { createProject as createProjectThunk } from '@/store/slices/projectsSlice';
import type { CreateProjectRequest, ProjectType } from '@/lib/projectsApi';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { departments, durationOptions, projectTypeOptions } from '@/constants/projectOptions';

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 1000;

interface CreateProjectProps {
  onComplete: () => void;
  showClose?: boolean;
}

const ArrayInput = ({
  label,
  field,
  placeholder,
  suggestions = [],
  formData,
  errors,
  handleArrayChange,
  removeArrayItem,
  addArrayItem,
}: {
  label: string;
  field: string;
  placeholder: string;
  suggestions?: string[];
  formData: any;
  errors: any;
  handleArrayChange: (field: string, index: number, value: string) => void;
  removeArrayItem: (field: string, index: number) => void;
  addArrayItem: (field: string) => void;
}) => (
  <div>
    <Label className="mb-2 block">{label}</Label>
    {(formData[field] as string[]).map((item, index) => (
      <div key={index} className="flex items-center space-x-2 mb-2">
        <div className="flex-1 relative">
          <Input
            value={item}
            onChange={(e) => handleArrayChange(field, index, e.target.value)}
            placeholder={placeholder}
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-lg shadow-lg hidden">
              {suggestions
                .filter((s) => s.toLowerCase().includes(item.toLowerCase()))
                .slice(0, 5)
                .map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleArrayChange(field, index, suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
            </div>
          )}
        </div>
        {(formData[field] as string[]).length > 1 && (
          <Button
            type="button"
            onClick={() => removeArrayItem(field, index)}
            variant="ghost"
            size="icon"
            className="text-red-600"
          >
            <Minus className="w-4 h-4" />
          </Button>
        )}
        {index === (formData[field] as string[]).length - 1 && (
          <Button
            type="button"
            onClick={() => addArrayItem(field)}
            variant="ghost"
            size="icon"
            className="text-blue-600"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
    ))}
    {errors[field] && <p className="text-red-600 text-sm mt-1">{errors[field]}</p>}
  </div>
);

export default function CreateProject({ onComplete, showClose = true }: CreateProjectProps) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const getInitialFormData = () => ({
    title: '',
    description: '',
    department: user?.department || '',
    projectType: 'project' as (typeof projectTypeOptions)[number]['value'],
    skills: [''],
    duration: '',
    maxStudents: 2,
    deadline: '',
    tags: [''],
    requirements: [''],
    outcomes: [''],
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [initialSnapshot] = useState(getInitialFormData());

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // departments and durationOptions are imported from '@/constants/projectOptions'

  const commonSkills = [
    'React',
    'Python',
    'JavaScript',
    'Machine Learning',
    'Data Analysis',
    'Node.js',
    'Java',
    'C++',
    'Database Design',
    'API Development',
    'UI/UX Design',
    'Mobile Development',
    'Cloud Computing',
    'DevOps',
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maxStudents' ? parseInt(value) : value,
    }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev as any)[field].map((item: string, i: number) => (i === index ? value : item)),
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...((prev as any)[field] as string[]), ''],
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: ((prev as any)[field] as string[]).filter((_: string, i: number) => i !== index),
    }));
  };

  const deadlineWarning = useMemo(() => {
    if (!formData.deadline) return false;
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      return formData.deadline < todayStr;
    } catch {
      return false;
    }
  }, [formData.deadline]);

  const isDirty = useMemo(() => {
    const normalize = (d: typeof formData) => ({
      title: d.title.trim(),
      description: d.description.trim(),
      department: d.department || '',
      projectType: d.projectType || 'project',
      skills: (d.skills || []).map((s) => s.trim()).filter(Boolean),
      duration: d.duration || '',
      maxStudents: d.maxStudents,
      deadline: d.deadline || '',
      tags: (d.tags || []).map((t) => t.trim()).filter(Boolean),
      requirements: (d.requirements || []).map((r) => r.trim()).filter(Boolean),
      outcomes: (d.outcomes || []).map((o) => o.trim()).filter(Boolean),
    });
    return JSON.stringify(normalize(formData)) !== JSON.stringify(normalize(initialSnapshot));
  }, [formData, initialSnapshot]);

  const handleClose = () => {
    if (loading) return;
    if (isDirty) {
      const confirmClose = window.confirm('Discard unsaved changes?');
      if (!confirmClose) return;
    }
    onComplete();
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) newErrors.title = 'Project title is required';
    if (!formData.description.trim()) newErrors.description = 'Project description is required';
    if (!formData.projectType) newErrors.projectType = 'Project type is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (formData.maxStudents < 1) newErrors.maxStudents = 'At least 1 student position is required';

    if (formData.skills.every((skill) => !skill.trim())) {
      newErrors.skills = 'At least one skill is required';
    }
    if (formData.requirements.every((req) => !req.trim())) {
      newErrors.requirements = 'At least one requirement is required';
    }
    if (formData.outcomes.every((outcome) => !outcome.trim())) {
      newErrors.outcomes = 'At least one expected outcome is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const isAllDepts = formData.department === 'All Departments';
      const payload: CreateProjectRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        projectDuration: formData.duration || undefined,
        skills: formData.skills.filter((s) => s.trim()),
        projectType: formData.projectType.toUpperCase() as ProjectType,
        visibleToAllDepts: isAllDepts || undefined,
        departments: !isAllDepts && formData.department ? [formData.department] : undefined,
        maxStudents: formData.maxStudents,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        tags: formData.tags.filter((t) => t.trim()),
        requirements: formData.requirements.filter((r) => r.trim()),
        outcomes: formData.outcomes.filter((o) => o.trim()),
      };

      await dispatch(createProjectThunk(payload)).unwrap();
      toast.success('Project created successfully');
      setFormData(getInitialFormData());
      onComplete();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-1">Post a research opportunity for students to collaborate</p>
        </div>
        {showClose && (
          <Button onClick={handleClose} variant="ghost" size="icon" aria-label="Close" disabled={loading}>
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Basic Information
            </h2>

            <div>
              <Label htmlFor="projectType" className="mb-1 block">Project Type *</Label>
              <Select
                value={formData.projectType}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, projectType: value as (typeof projectTypeOptions)[number]['value'] }));
                  if (errors.projectType) setErrors((prev) => ({ ...prev, projectType: '' }));
                }}
              >
                <SelectTrigger id="projectType" className={errors.projectType ? 'border-destructive focus:ring-destructive' : ''}>
                  <SelectValue placeholder="Select Project Type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectType && <p className="text-red-600 text-sm mt-1">{errors.projectType}</p>}
            </div>

            <div>
              <Label htmlFor="title" className="mb-1 block">Project Title *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter a clear, descriptive project title"
                maxLength={TITLE_MAX}
                className={errors.title ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
              <p className="text-xs text-gray-500 mt-1 text-right">{formData.title.length}/{TITLE_MAX}</p>
            </div>

            <div>
              <Label htmlFor="description" className="mb-1 block">Project Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Provide a detailed description of the project, its objectives, methodology, and scope"
                maxLength={DESCRIPTION_MAX}
                className={errors.description ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
              <p className="text-xs text-gray-500 mt-1 text-right">{formData.description.length}/{DESCRIPTION_MAX}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department" className="mb-1 block">Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, department: value }));
                    if (errors.department) setErrors((prev) => ({ ...prev, department: '' }));
                  }}
                >
                  <SelectTrigger id="department" className={errors.department ? 'border-destructive focus:ring-destructive' : ''}>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-red-600 text-sm mt-1">{errors.department}</p>}
              </div>

              <div>
                <Label htmlFor="duration" className="mb-1 block">Duration *</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, duration: value }));
                    if (errors.duration) setErrors((prev) => ({ ...prev, duration: '' }));
                  }}
                >
                  <SelectTrigger id="duration" className={errors.duration ? 'border-destructive focus:ring-destructive' : ''}>
                    <SelectValue placeholder="Select Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((duration) => (
                      <SelectItem key={duration} value={duration}>
                        {duration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.duration && <p className="text-red-600 text-sm mt-1">{errors.duration}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxStudents" className="mb-1 block">Maximum Students *</Label>
                <Input
                  id="maxStudents"
                  name="maxStudents"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.maxStudents}
                  onChange={handleInputChange}
                  className={errors.maxStudents ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {errors.maxStudents && <p className="text-red-600 text-sm mt-1">{errors.maxStudents}</p>}
              </div>

              <div>
                <Label htmlFor="deadline" className="mb-1 block">Application Deadline</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
                {deadlineWarning && (
                  <p className="text-amber-600 text-sm mt-1">Selected deadline is in the past.</p>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Required Skills
            </h2>
            <ArrayInput
              label="Skills"
              field="skills"
              placeholder="Enter required skill"
              suggestions={commonSkills}
              formData={formData}
              errors={errors}
              handleArrayChange={handleArrayChange}
              removeArrayItem={removeArrayItem}
              addArrayItem={addArrayItem}
            />
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Project Requirements
            </h2>
            <div>
              <Label htmlFor="requirements" className="mb-1 block">Requirements (one per line) *</Label>
              <Textarea
                id="requirements"
                value={(formData.requirements || []).join('\n')}
                onChange={(e) => {
                  const lines = e.target.value
                    .split(/\r?\n/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  setFormData((prev) => ({ ...prev, requirements: lines }));
                  if (errors.requirements) setErrors((prev) => ({ ...prev, requirements: '' }));
                }}
                rows={4}
                placeholder="Enter one requirement per line"
                className={errors.requirements ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.requirements && (
                <p className="text-red-600 text-sm mt-1">{errors.requirements}</p>
              )}
            </div>
          </div>

          {/* Expected Outcomes */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Save className="w-5 h-5 mr-2" />
              Expected Outcomes
            </h2>
            <div>
              <Label htmlFor="outcomes" className="mb-1 block">Outcomes (one per line) *</Label>
              <Textarea
                id="outcomes"
                value={(formData.outcomes || []).join('\n')}
                onChange={(e) => {
                  const lines = e.target.value
                    .split(/\r?\n/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  setFormData((prev) => ({ ...prev, outcomes: lines }));
                  if (errors.outcomes) setErrors((prev) => ({ ...prev, outcomes: '' }));
                }}
                rows={4}
                placeholder="Enter one outcome per line"
                className={errors.outcomes ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.outcomes && (
                <p className="text-red-600 text-sm mt-1">{errors.outcomes}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Tags
            </h2>
            <ArrayInput
              label="Tags"
              field="tags"
              placeholder="Enter relevant tag"
              formData={formData}
              errors={errors}
              handleArrayChange={handleArrayChange}
              removeArrayItem={removeArrayItem}
              addArrayItem={addArrayItem}
            />
          </div>

          {/* Submit Button */}
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Button type="submit" disabled={loading} className="min-w-[180px]">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Project...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Project
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </motion.div>
  );
}
