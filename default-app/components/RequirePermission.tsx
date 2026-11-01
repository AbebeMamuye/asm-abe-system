'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { roleHasPermission } from '@/lib/permissions';

type RequirePermissionProps = {
  action: string;
  children: React.ReactNode;
};

export function RequirePermission({ action, children }: RequirePermissionProps) {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (status === 'loading') {
    return (
      <div className="py-16 text-center text-slate-500 text-sm">Loading…</div>
    );
  }

  if (!roleHasPermission(role, action)) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <h1 className="text-lg font-semibold text-slate-900">Access restricted</h1>
        <p className="text-slate-600 text-sm">
          Your account does not have permission for this operation. Contact an administrator if you
          need access.
        </p>
        <Link href="/" className="inline-block text-sm text-blue-600 hover:underline">
          Return to dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
