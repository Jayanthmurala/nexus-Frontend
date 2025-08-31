import { Metadata } from 'next';
import { RoleGuard } from '@/components/Auth/RoleGuard';
import StudentEventsMarketplace from '@/components/Dashboard/Student/StudentEventsMarketplace';

export const metadata: Metadata = {
  title: 'Events - Student Dashboard',
  description: 'Browse and register for academic events',
};

export default function StudentEventsPage() {
  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <StudentEventsMarketplace />
      </div>
    </RoleGuard>
  );
}
