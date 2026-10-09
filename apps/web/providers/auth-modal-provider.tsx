'use client';

import { createContext, Suspense, useContext, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { safeNextPath } from '@/lib/safe-next-path';
import { Dialog } from '@/components/ui/dialog';
import { useAuth } from '@/providers/auth-provider';
import { LoginForm } from '@/features/auth/components/login-form';
import { RegisterForm } from '@/features/auth/components/register-form';

type AuthModalContextValue = { openAuth: (reason?: string) => void };
const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [register, setRegister] = useState(false);
  const [reason, setReason] = useState('Đăng nhập để tiếp tục hành trình của bạn.');
  useEffect(() => {
    const onExpired = () => {
      // Guest-facing API 401s are not expired authenticated sessions.
      if (user) openAuth('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    };
    window.addEventListener('menhvi:session-expired', onExpired);
    return () => window.removeEventListener('menhvi:session-expired', onExpired);
  }, [user]);
  function openAuth(message?: string) { setReason(message || 'Đăng nhập để tiếp tục hành trình của bạn.'); setOpen(true); }
  return <AuthModalContext.Provider value={{ openAuth }}>
    {children}
    <Suspense fallback={null}>
      <AuthModalDialog open={open} onClose={() => setOpen(false)} register={register} setRegister={setRegister} reason={reason} />
    </Suspense>
  </AuthModalContext.Provider>;
}

function AuthModalDialog({ open, onClose, register, setRegister, reason }: {
  open: boolean;
  onClose: () => void;
  register: boolean;
  setRegister: (value: boolean) => void;
  reason: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Carry the originating discovery route through onboarding without accepting external redirects.
  const query = searchParams.toString();
  const destination = safeNextPath(`${pathname}${query ? `?${query}` : ''}`);
  return (
    <Dialog open={open} onClose={onClose} title={register ? 'Đăng ký Mệnh Vi' : 'Đăng nhập Mệnh Vi'} description={reason}>
      <div className="mb-4 flex gap-4">
        <button type="button" aria-pressed={!register} onClick={() => setRegister(false)}>Đăng nhập</button>
        <button type="button" aria-pressed={register} onClick={() => setRegister(true)}>Đăng ký</button>
      </div>
      {register ? <RegisterForm onSuccess={onClose} returnTo={destination} /> : <LoginForm onSuccess={onClose} returnTo={destination} />}
    </Dialog>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) throw new Error('AuthModalProvider missing');
  return context;
}
