"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Experience } from "../../lib/profileApi";

interface ExperienceCardProps {
  experience: Experience;
  canEdit?: boolean;
  onEdit?: (experience: Experience) => void;
  onDelete?: (id: string) => void;
}

const levelColors = {
  "Beginner": "bg-green-100 text-green-800 border-green-200",
  "Intermediate": "bg-blue-100 text-blue-800 border-blue-200", 
  "Advanced": "bg-purple-100 text-purple-800 border-purple-200",
  "Expert": "bg-orange-100 text-orange-800 border-orange-200"
};

export function ExperienceCard({ experience, canEdit = false, onEdit, onDelete }: ExperienceCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {experience.area}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="outline" 
                className={`${experience.level ? levelColors[experience.level] : ''} font-medium`}
              >
                {experience.level}
              </Badge>
              {experience.yearsExp && (
                <Badge variant="secondary" className="text-xs">
                  {experience.yearsExp} year{experience.yearsExp !== 1 ? 's' : ''} exp
                </Badge>
              )}
            </div>
          </div>
          
          {canEdit && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(experience)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(experience.id)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      {experience.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 leading-relaxed">
            {experience.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
