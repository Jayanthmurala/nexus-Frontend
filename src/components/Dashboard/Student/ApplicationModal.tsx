"use client";

import React, { useState, useEffect } from "react";
import { X, Send, User, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import type { Project } from "@/lib/projectsApi";

interface ApplicationModalProps {
  project?: Project | null;
  onSubmit: (projectId: string, message: string) => Promise<void>;
  onClose: () => void;
}

export default function ApplicationModal({ project, onSubmit, onClose }: ApplicationModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const open = !!project;

  useEffect(() => {
    if (!open) {
      setMessage("");
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!project || !user) return;

    const newErrors: { message?: string } = {};
    
    if (!message.trim()) {
      newErrors.message = "Please explain why you want to join this project";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(project.id, message);
      onClose();
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center">
              <User className="w-6 h-6 mr-3" />
              Apply to Project
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6">
          {project && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
              <h3 className="font-bold text-gray-900 mb-1">{project.title}</h3>
              <p className="text-sm text-gray-600">by {project.authorName}</p>
              <p className="text-sm text-blue-600">{project.departments.join(', ')}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {project.skills.map((skill) => (
                  <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Application Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain your interest, relevant skills, and what you hope to contribute to this project..."
                className={`w-full px-4 py-3 border rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                  errors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                rows={6}
              />
              {errors.message && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.message}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !message.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
