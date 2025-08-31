'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { Project, UpdateProjectRequest, ProjectType, ProgressStatus } from '@/lib/projectsApi'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { departments as departmentOptions, durationOptions, projectTypeOptions } from '@/constants/projectOptions'

const TITLE_MAX = 100
const DESC_MAX = 1000

interface EditProjectDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updates: UpdateProjectRequest) => void
}

// Small helper to edit string array fields
function ArrayField({
  label,
  values,
  setValues,
  placeholder,
  error,
  idPrefix,
}: {
  label: string
  values: string[]
  setValues: (vals: string[]) => void
  placeholder: string
  error?: string
  idPrefix: string
}) {
  const handleChange = (index: number, value: string) => {
    setValues(values.map((v, i) => (i === index ? value : v)))
  }
  const addItem = () => setValues([...values, ''])
  const removeItem = (index: number) => setValues(values.filter((_, i) => i !== index))

  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      {values.map((item, index) => (
        <div key={index} className="flex items-center gap-2 mb-2">
          <Input
            id={`${idPrefix}-${index}`}
            value={item}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={placeholder}
          />
          {values.length > 1 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} aria-label={`Remove ${label} ${index + 1}`}>
              Remove
            </Button>
          )}
          {index === values.length - 1 && (
            <Button type="button" variant="ghost" size="sm" onClick={addItem} aria-label={`Add ${label}`}>
              Add
            </Button>
          )}
        </div>
      ))}
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  )
}

// Using shared constants from '@/constants/projectOptions'

export default function EditProjectDialog({ project, open, onOpenChange, onSave }: EditProjectDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [maxStudents, setMaxStudents] = useState<number>(2)
  const [deadline, setDeadline] = useState<string>('')
  const [departments, setDepartments] = useState<string[]>([])
  const [duration, setDuration] = useState<string>('')
  const [projectType, setProjectType] = useState<(typeof projectTypeOptions)[number]['value']>('project')
  const [skills, setSkills] = useState<string[]>([''])
  const [requirements, setRequirements] = useState<string[]>([''])
  const [outcomes, setOutcomes] = useState<string[]>([''])
  const [tags, setTags] = useState<string[]>([''])
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const [isSaving, setIsSaving] = useState(false)
  const [progressStatus, setProgressStatus] = useState<ProgressStatus>('OPEN')

  useEffect(() => {
    if (project) {
      setTitle(project.title)
      setDescription(project.description)
      setMaxStudents(project.maxStudents)
      setDeadline(project.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : '')
      setDepartments(project.visibleToAllDepts ? [] : (project.departments || []))
      setDuration(project.projectDuration || '')
      setProjectType(project.projectType ? project.projectType.toLowerCase().replace(/_/g, '_') as (typeof projectTypeOptions)[number]['value'] : 'project')
      setSkills(project.skills && project.skills.length ? project.skills : [''])
      setRequirements(project.requirements && project.requirements.length ? project.requirements : [''])
      setOutcomes(project.outcomes && project.outcomes.length ? project.outcomes : [''])
      setTags(project.tags && project.tags.length ? project.tags : [''])
      setProgressStatus(project.progressStatus)
      setErrors({})
    }
  }, [project])

  // Soft warning if deadline is in the past (doesn't block submit)
  const deadlineWarning = useMemo(() => {
    if (!deadline) return false
    try {
      const todayStr = new Date().toISOString().slice(0, 10)
      return deadline < todayStr
    } catch {
      return false
    }
  }, [deadline])

  // Track unsaved changes
  const isDirty = useMemo(() => {
    if (!project) return false
    const initialMax = project.maxStudents
    const eqArr = (a: string[], b: string[]) => {
      const aa = (a || []).map((s) => s.trim()).filter(Boolean)
      const bb = (b || []).map((s) => s.trim()).filter(Boolean)
      if (aa.length !== bb.length) return true
      for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return true
      return false
    }
    const projDeadline = project.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : ''
    return (
      title !== project.title ||
      description !== project.description ||
      maxStudents !== initialMax ||
      projectType.toUpperCase() !== project.projectType ||
      JSON.stringify([...departments].sort()) !== JSON.stringify([...(project.visibleToAllDepts ? [] : (project.departments || []))].sort()) ||
      duration !== (project.projectDuration || '') ||
      deadline !== projDeadline ||
      eqArr(skills, project.skills || []) ||
      eqArr(requirements, project.requirements || []) ||
      eqArr(outcomes, project.outcomes || []) ||
      eqArr(tags, project.tags || []) ||
      progressStatus !== project.progressStatus
    )
  }, [project, title, description, maxStudents, departments, duration, deadline, skills, requirements, outcomes, tags, projectType, progressStatus])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isDirty) {
      const confirmClose = window.confirm('Discard unsaved changes?')
      if (!confirmClose) return
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { [k: string]: string } = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    if (!description.trim()) newErrors.description = 'Description is required'
    if (!projectType) newErrors.projectType = 'Project type is required'
    if (maxStudents < 1) newErrors.maxStudents = 'At least 1 student required'
    if (departments.length === 0) newErrors.departments = 'At least one department is required'
    if (!duration) newErrors.duration = 'Duration is required'
    if (skills.every((s) => !s.trim())) newErrors.skills = 'At least one skill is required'
    if (requirements.every((r) => !r.trim())) newErrors.requirements = 'At least one requirement is required'
    if (outcomes.every((o) => !o.trim())) newErrors.outcomes = 'At least one expected outcome is required'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsSaving(true)
    try {
      const isAllDepts = departments.length === 0
      const payload: UpdateProjectRequest = {
        title: title.trim(),
        description: description.trim(),
        projectDuration: duration || undefined,
        skills: skills.filter((s) => s.trim()),
        projectType: projectType.toUpperCase() as ProjectType,
        // For updates, send explicit boolean to allow toggling from true -> false
        visibleToAllDepts: isAllDepts ? true : false,
        // If visible to all, clear departments; otherwise set the selected departments
        departments: isAllDepts ? [] : departments,
        maxStudents,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        tags: tags.filter((t) => t.trim()),
        requirements: requirements.filter((r) => r.trim()),
        outcomes: outcomes.filter((o) => o.trim()),
        progressStatus,
      }
      onSave(payload)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update basic details of your project.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          <div>
            <Label className="mb-1 block">Project Type</Label>
            <Select value={projectType} onValueChange={(val) => setProjectType(val as (typeof projectTypeOptions)[number]['value'])}>
              <SelectTrigger className={errors.projectType ? 'border-destructive focus:ring-destructive' : ''}>
                <SelectValue placeholder="Select Project Type" />
              </SelectTrigger>
              <SelectContent>
                {projectTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.projectType && <p className="text-red-600 text-sm mt-1">{errors.projectType}</p>}
          </div>

          <div>
            <Label className="mb-1 block">Project Status</Label>
            <Select value={progressStatus} onValueChange={(val) => setProgressStatus(val as ProgressStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit_title" className="mb-1 block">Title</Label>
            <Input
              id="edit_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              className={errors.title ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            <div className="text-xs text-muted-foreground mt-1 text-right">{title.length}/{TITLE_MAX}</div>
          </div>

          <div>
            <Label htmlFor="edit_description" className="mb-1 block">Description</Label>
            <Textarea
              id="edit_description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={DESC_MAX}
              className={errors.description ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            <div className="text-xs text-muted-foreground mt-1 text-right">{description.length}/{DESC_MAX}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_maxStudents" className="mb-1 block">Max Students</Label>
              <Input
                id="edit_maxStudents"
                type="number"
                min={1}
                max={10}
                value={maxStudents}
                onChange={(e) => setMaxStudents(parseInt(e.target.value || '0', 10))}
                className={errors.maxStudents ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.maxStudents && <p className="text-red-600 text-sm mt-1">{errors.maxStudents}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Target Departments</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-gray-300 rounded-md bg-white">
                  {departments && departments.length > 0 ? (
                    departments.map((dept, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {dept}
                        <button
                          type="button"
                          onClick={() => {
                            const newDepts = departments.filter((_, i) => i !== index);
                            setDepartments(newDepts);
                          }}
                          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                        >
                          ×
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
                      setDepartments([]);
                    } else {
                      if (!departments.includes(value)) {
                        setDepartments([...departments, value]);
                      }
                    }
                  }}
                >
                  <SelectTrigger className={errors.departments ? 'border-destructive focus:ring-destructive' : ''}>
                    <SelectValue placeholder="Add department..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Departments">All Departments</SelectItem>
                    {departmentOptions.filter(dept => dept !== 'All Departments').map((dept) => (
                      <SelectItem 
                        key={dept} 
                        value={dept}
                        disabled={departments.includes(dept)}
                      >
                        {dept} {departments.includes(dept) && '✓'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.departments && <p className="text-red-600 text-sm mt-1">{errors.departments}</p>}
            </div>
            <div>
              <Label className="mb-1 block">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className={errors.duration ? 'border-destructive focus:ring-destructive' : ''}>
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.duration && <p className="text-red-600 text-sm mt-1">{errors.duration}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="edit_deadline" className="mb-1 block">Deadline</Label>
            <Input id="edit_deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            {deadlineWarning && (
              <p className="text-amber-600 text-sm mt-1">Selected deadline is in the past.</p>
            )}
          </div>

          <ArrayField
            label="Skills"
            values={skills}
            setValues={setSkills}
            placeholder="Enter required skill"
            error={errors.skills}
            idPrefix="edit_skills"
          />

          <div>
            <Label htmlFor="edit_requirements_text" className="mb-1 block">Requirements (one per line)</Label>
            <Textarea
              id="edit_requirements_text"
              value={(requirements || []).join('\n')}
              onChange={(e) => {
                const lines = e.target.value
                  .split(/\r?\n/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                setRequirements(lines)
                if (errors.requirements) setErrors((prev) => ({ ...prev, requirements: '' }))
              }}
              rows={4}
              placeholder="Enter one requirement per line"
              className={errors.requirements ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.requirements && (
              <p className="text-red-600 text-sm mt-1">{errors.requirements}</p>
            )}
          </div>

          <div>
            <Label htmlFor="edit_outcomes_text" className="mb-1 block">Outcomes (one per line)</Label>
            <Textarea
              id="edit_outcomes_text"
              value={(outcomes || []).join('\n')}
              onChange={(e) => {
                const lines = e.target.value
                  .split(/\r?\n/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                setOutcomes(lines)
                if (errors.outcomes) setErrors((prev) => ({ ...prev, outcomes: '' }))
              }}
              rows={4}
              placeholder="Enter one outcome per line"
              className={errors.outcomes ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.outcomes && (
              <p className="text-red-600 text-sm mt-1">{errors.outcomes}</p>
            )}
          </div>

          <ArrayField
            label="Tags"
            values={tags}
            setValues={setTags}
            placeholder="Enter relevant tag"
            idPrefix="edit_tags"
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
