import type { Metadata } from 'next';
import { AdminDashboard } from '@/features/admin/components/admin-dashboard';

export const metadata: Metadata = {
  title: 'Operator Tools',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
