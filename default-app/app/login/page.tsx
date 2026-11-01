'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, User, Loader2, AlertCircle, Package } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        username: formData.username,
        password: formData.password,
      });

      if (result?.error) {
        setError('Invalid username or password.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="px-8 py-8 text-center border-b border-slate-100">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4">
              <Package size={26} />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Asset Management System</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in with your staff credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-800 p-3 rounded-lg border border-red-100 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-slate-700">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-slate-500 text-xs">
          Unauthorized access is prohibited. Contact your system administrator for access.
        </p>
      </div>
    </div>
  );
}
