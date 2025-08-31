'use client';

import React, { useEffect, useState } from 'react';
import { Plus, X, ChevronRight, ChevronLeft, Check, FileText, Users, Target, BookOpen, Minus, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { departments, durationOptions, projectTypeOptions } from '@/constants/projectOptions';

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 1000;

interface CreateProjectProps {
  onComplete: () => void;
  showClose?: boolean;
}

interface ArrayInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, value: string) => void;
  placeholder: string;
  suggestions?: string[];
  errors: { [key: string]: string };
  field: string;
}

const ArrayInput: React.FC<ArrayInputProps> = ({
  label,
  values,
  onAdd,
  onRemove,
  onUpdate,
  placeholder,
  suggestions = [],
  errors,
  field,
}) => (
  <div className="space-y-3">
    <Label className="text-sm font-semibold text-gray-700">{label} *</Label>
    {values.map((value, index) => (
      <div key={index} className="flex items-center gap-3">
        <Input
          value={value}
          onChange={(e) => onUpdate(index, e.target.value)}
          placeholder={placeholder}
          className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          list={`${field}-suggestions`}
        />
        {values.length > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <Minus className="w-4 h-4" />
          </Button>
        )}
        {index === values.length - 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
    ))}
    {suggestions.length > 0 && (
      <datalist id={`${field}-suggestions`}>
        {suggestions.map((suggestion, index) => (
          <option key={index} value={suggestion} />
        ))}
      </datalist>
    )}
    {errors[field] && <p className="text-red-600 text-sm mt-1">{errors[field]}</p>}
  </div>
);

export default function CreateProject({ onComplete, showClose = false }: CreateProjectProps) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<CreateProjectRequest>({
    title: '',
    description: '',
    projectType: 'RESEARCH' as ProjectType,
    projectDuration: '',
    maxStudents: 1,
    deadline: '',
    skills: [''],
    requirements: [''],
    outcomes: [''],
    departments: [user?.department || ''],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const steps = [
    { id: 1, title: 'Project Details', icon: FileText, description: 'Basic project information' },
    { id: 2, title: 'Team & Timeline', icon: Users, description: 'Team size and project duration' },
    { id: 3, title: 'Requirements', icon: Target, description: 'Skills and requirements' },
    { id: 4, title: 'Review & Submit', icon: Check, description: 'Final review and submission' },
  ];

  const commonSkills = [
    'React', 'Python', 'JavaScript', 'Machine Learning', 'Data Analysis', 'Node.js',
    'TypeScript', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'UI/UX Design',
    'Project Management', 'Research Methods', 'Statistical Analysis'
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.projectType) newErrors.projectType = 'Project type is required';
    }
    
    if (step === 2) {
      if (formData.maxStudents < 1) newErrors.maxStudents = 'At least 1 student required';
      if (!formData.projectDuration) newErrors.projectDuration = 'Duration is required';
    }
    
    if (step === 3) {
      if (!formData.skills?.length || formData.skills.every(s => !s.trim())) {
        newErrors.skills = 'At least one skill is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const updateFormData = (field: keyof CreateProjectRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addArrayItem = (field: 'skills' | 'requirements' | 'outcomes') => {
    const currentArray = formData[field] || [];
    updateFormData(field, [...currentArray, '']);
  };

  const removeArrayItem = (field: 'skills' | 'requirements' | 'outcomes', index: number) => {
    const currentArray = formData[field] || [];
    updateFormData(field, currentArray.filter((_, i) => i !== index));
  };

  const updateArrayItem = (field: 'skills' | 'requirements' | 'outcomes', index: number, value: string) => {
    const currentArray = formData[field] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    updateFormData(field, newArray);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setIsSubmitting(true);
    try {
      const cleanedData = {
        ...formData,
        skills: formData.skills?.filter(s => s.trim()) || [],
        requirements: formData.requirements?.filter(r => r.trim()) || [],
        outcomes: formData.outcomes?.filter(o => o.trim()) || [],
        // Convert date to ISO datetime string in Indian timezone (IST)
        deadline: formData.deadline ? 
          new Date(formData.deadline + 'T23:59:59+05:30').toISOString() : 
          undefined,
        // Handle department visibility logic
        visibleToAllDepts: !formData.departments || formData.departments.length === 0 || formData.departments[0] === '',
        departments: formData.departments?.filter(d => d && d.trim() !== '') || [],
      };
      
      await dispatch(createProjectThunk(cleanedData)).unwrap();
      toast.success('Project created successfully!');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="Enter project title"
                className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                maxLength={TITLE_MAX}
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
              <p className="text-gray-500 text-xs mt-1">{formData.title.length}/{TITLE_MAX} characters</p>
            </div>
            
            <div>
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Project Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Describe your project in detail"
                className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
                maxLength={DESCRIPTION_MAX}
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
              <p className="text-gray-500 text-xs mt-1">{formData.description.length}/{DESCRIPTION_MAX} characters</p>
            </div>
            
            <div>
              <Label className="text-sm font-semibold text-gray-700">Project Type *</Label>
              <Select value={formData.projectType} onValueChange={(value) => updateFormData('projectType', value as ProjectType)}>
                <SelectTrigger className="mt-2 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toUpperCase()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectType && <p className="text-red-600 text-sm mt-1">{errors.projectType}</p>}
            </div>
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="maxStudents" className="text-sm font-semibold text-gray-700">Maximum Students *</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxStudents}
                  onChange={(e) => updateFormData('maxStudents', parseInt(e.target.value) || 1)}
                  className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.maxStudents && <p className="text-red-600 text-sm mt-1">{errors.maxStudents}</p>}
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700">Project Duration *</Label>
                <Select value={formData.projectDuration} onValueChange={(value) => updateFormData('projectDuration', value)}>
                  <SelectTrigger className="mt-2 border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.projectDuration && <p className="text-red-600 text-sm mt-1">{errors.projectDuration}</p>}
              </div>
            </div>
            
            <div>
              <Label htmlFor="deadline" className="text-sm font-semibold text-gray-700">Application Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => updateFormData('deadline', e.target.value)}
                className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-gray-500 text-xs mt-1">Optional - leave blank for flexible deadline</p>
            </div>
            
            <div>
              <Label className="text-sm font-semibold text-gray-700">Target Departments *</Label>
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-gray-300 rounded-md bg-white">
                  {formData.departments && formData.departments.length > 0 ? (
                    formData.departments.map((dept, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {dept}
                        <button
                          type="button"
                          onClick={() => {
                            const newDepts = formData.departments?.filter((_, i) => i !== index) || [];
                            updateFormData('departments', newDepts);
                            updateFormData('visibleToAllDepts', newDepts.length === 0);
                          }}
                          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">All Departments (visible to all students)</span>
                  )}
                </div>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value === 'All Departments') {
                      updateFormData('visibleToAllDepts', true);
                      updateFormData('departments', []);
                    } else {
                      const currentDepts = formData.departments || [];
                      if (!currentDepts.includes(value)) {
                        const newDepts = [...currentDepts, value];
                        updateFormData('departments', newDepts);
                        updateFormData('visibleToAllDepts', false);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Add department..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Departments">All Departments</SelectItem>
                    {departments.filter(dept => dept !== 'All Departments').map((dept) => (
                      <SelectItem 
                        key={dept} 
                        value={dept}
                        disabled={formData.departments?.includes(dept)}
                      >
                        {dept} {formData.departments?.includes(dept) && '✓'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.departments && <p className="text-red-600 text-sm mt-1">{errors.departments}</p>}
              <p className="text-gray-500 text-xs mt-1">Select multiple departments or choose "All Departments" for visibility to all students</p>
            </div>
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <ArrayInput
              label="Required Skills"
              values={formData.skills || []}
              onChange={(values) => updateFormData('skills', values)}
              onAdd={() => addArrayItem('skills')}
              onRemove={(index) => removeArrayItem('skills', index)}
              onUpdate={(index, value) => updateArrayItem('skills', index, value)}
              placeholder="e.g., React, Python, Machine Learning"
              suggestions={commonSkills}
              errors={errors}
              field="skills"
            />
            
            <ArrayInput
              label="Project Requirements"
              values={formData.requirements || []}
              onChange={(values) => updateFormData('requirements', values)}
              onAdd={() => addArrayItem('requirements')}
              onRemove={(index) => removeArrayItem('requirements', index)}
              onUpdate={(index, value) => updateArrayItem('requirements', index, value)}
              placeholder="e.g., Strong programming background, Available 10+ hours/week"
              errors={errors}
              field="requirements"
            />
            
            <ArrayInput
              label="Expected Outcomes"
              values={formData.outcomes || []}
              onChange={(values) => updateFormData('outcomes', values)}
              onAdd={() => addArrayItem('outcomes')}
              onRemove={(index) => removeArrayItem('outcomes', index)}
              onUpdate={(index, value) => updateArrayItem('outcomes', index, value)}
              placeholder="e.g., Research paper publication, Working prototype"
              errors={errors}
              field="outcomes"
            />
          </motion.div>
        );
        
      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Project Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="font-semibold text-gray-700">Title:</span>
                  <p className="text-gray-900 mt-1">{formData.title}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Type:</span>
                  <p className="text-gray-900 mt-1">{projectTypeOptions.find(opt => opt.value.toUpperCase() === formData.projectType)?.label}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Max Students:</span>
                  <p className="text-gray-900 mt-1">{formData.maxStudents}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Duration:</span>
                  <p className="text-gray-900 mt-1">{formData.projectDuration}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="font-semibold text-gray-700">Description:</span>
                <p className="text-gray-900 mt-1">{formData.description}</p>
              </div>
              
              {formData.skills && formData.skills.filter(s => s.trim()).length > 0 && (
                <div className="mb-4">
                  <span className="font-semibold text-gray-700">Skills:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.filter(s => s.trim()).map((skill, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800 border-blue-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {formData.requirements && formData.requirements.filter(r => r.trim()).length > 0 && (
                <div className="mb-4">
                  <span className="font-semibold text-gray-700">Requirements:</span>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {formData.requirements.filter(r => r.trim()).map((req, index) => (
                      <li key={index} className="text-gray-900 text-sm">{req}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {formData.outcomes && formData.outcomes.filter(o => o.trim()).length > 0 && (
                <div>
                  <span className="font-semibold text-gray-700">Expected Outcomes:</span>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {formData.outcomes.filter(o => o.trim()).map((outcome, index) => (
                      <li key={index} className="text-gray-900 text-sm">{outcome}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  return (
    <motion.div 
      className="w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Create New Project
                </h1>
                <p className="text-gray-600 text-sm">Step {currentStep} of {totalSteps}</p>
              </div>
            </div>
            {showClose && (
              <Button variant="ghost" size="sm" onClick={onComplete} className="hover:bg-gray-100">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Stepper */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : isActive
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </motion.div>
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 max-w-[100px]">{step.description}</p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Form Content */}
      <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </CardContent>
        
        <CardFooter className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-3">
              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold px-8"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                  <Save className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
