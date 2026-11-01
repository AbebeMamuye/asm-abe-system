'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Menu, X, LogOut, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItemsForRole } from '@/lib/navigation';

function userInitials(name?: string | null, username?: string) {
  const source = name || username || '?';
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user as { name?: string; username?: string; role?: string } | undefined;
  const sidebarItems = navItemsForRole(user?.role);

  return (
    <>
      <button
        type="button"
        aria-label="Toggle navigation"
        className="fixed top-4 left-4 z-50 p-2 md:hidden bg-white rounded-lg shadow-sm border border-slate-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Package size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold leading-snug">Asset Management</h1>
                <p className="text-xs text-slate-400 mt-0.5">Store & property control</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium">
                {userInitials(user?.name, user?.username)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || user?.username || 'Signed in'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.role || 'User'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
