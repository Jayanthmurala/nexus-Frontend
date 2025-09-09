"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { Experience, ExperiencePayload } from "../../lib/profileApi";

interface ExperienceFormProps {
  experience?: Experience;
  onSubmit: (data: ExperiencePayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;

const COMMON_AREAS = [
  "Artificial Intelligence",
  "Machine Learning", 
  "Internet of Things (IoT)",
  "Blockchain",
  "Cloud Computing",
  "Cybersecurity",
  "Data Science",
  "Web Development",
  "Mobile Development",
  "DevOps",
  "Software Engineering",
  "Database Management",
  "Network Administration",
  "UI/UX Design",
  "Computer Vision",
  "Natural Language Processing",
  "Robotics",
  "Quantum Computing",
  "Augmented Reality",
  "Virtual Reality"
];

export function ExperienceForm({ experience, onSubmit, onCancel, isLoading = false }: ExperienceFormProps) {
  const [formData, setFormData] = useState<ExperiencePayload>({
    area: experience?.area || "",
    level: experience?.level || "Beginner",
    yearsExp: experience?.yearsExp || undefined,
    description: experience?.description || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.area?.trim()) return;
    
    onSubmit({
      ...formData,
      area: formData.area?.trim() || "",
      description: formData.description?.trim() || undefined,
      yearsExp: formData.yearsExp || undefined
    });
  };

  const handleAreaChange = (value: string) => {
    setFormData(prev => ({ ...prev, area: value }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {experience ? "Edit Experience" : "Add Experience"}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="area">Area of Expertise *</Label>
            <Select value={formData.area} onValueChange={handleAreaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select or type an area..." />
              </SelectTrigger>
              <SelectContent>
                {COMMON_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="area"
              value={formData.area}
              onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
              placeholder="Or type a custom area..."
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Proficiency Level *</Label>
            <Select 
              value={formData.level} 
              onValueChange={(value: typeof EXPERIENCE_LEVELS[number]) => 
                setFormData(prev => ({ ...prev, level: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearsExp">Years of Experience</Label>
            <Input
              id="yearsExp"
              type="number"
              min="0"
              max="50"
              value={formData.yearsExp || ""}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                yearsExp: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your experience in this area..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              type="submit" 
              disabled={!formData.area?.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? "Saving..." : (experience ? "Update" : "Add")}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
