'use client';

import React, { useState } from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import CreateProject from '@/components/Dashboard/Faculty/CreateProject';
import ProjectsList from '@/components/Dashboard/Faculty/ProjectsList';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

export default function ProjectsPage() {
  const [open, setOpen] = useState(false);
  return (
    <RoleGuard roles={['faculty']}>
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Action bar */}
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button aria-label="Create a new project">
                <Plus className="w-4 h-4 mr-2" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <CreateProject onComplete={() => setOpen(false)} showClose={false} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Full-width projects list */}
        <ProjectsList />
      </div>
    </RoleGuard>
  );
}
