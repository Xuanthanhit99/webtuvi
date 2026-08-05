import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReflectionHome } from '@/features/reflection/components/reflection-home';

export const metadata: Metadata = { title: 'Reflections' };

export default function ReflectionsPage() {
  return (
    <Suspense fallback={null}>
      <ReflectionHome />
    </Suspense>
  );
}
