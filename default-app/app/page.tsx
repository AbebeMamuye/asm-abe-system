'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  CheckCircle2,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DashboardStats = {
  totalItems: number;
  lowStockCount: number;
  issuesToday: number;
  monthIn: number;
  monthOut: number;
  assetHealth: { functional: number; maintenance: number; broken: number };
  recentTransactions: Array<{
    id: string;
    type: string;
    quantity: number;
    date: string;
    supplier?: string | null;
    department?: string | null;
    item?: { name: string } | null;
  }>;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          setStats(await res.json());
        }
      } catch {
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-blue-600" size={36} aria-label="Loading" />
      </div>
    );
  }

  const statCards = [
    { name: 'Active assets', value: stats?.totalItems ?? 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Below reorder level', value: stats?.lowStockCount ?? 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Functional', value: stats?.assetHealth?.functional ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Issues today', value: stats?.issuesToday ?? 0, icon: ArrowUpRight, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Overview of inventory levels, asset condition, and recent stock movements.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.name}</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                <stat.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-slate-600">Received this month (units)</span>
          <span className="font-semibold text-emerald-700">{stats?.monthIn ?? 0}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-slate-600">Issued this month (units)</span>
          <span className="font-semibold text-violet-700">{stats?.monthOut ?? 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent transactions</h2>
            <Link href="/reports" className="text-sm text-blue-600 hover:underline">
              View reports
            </Link>
          </div>
          <div className="p-4">
            {stats?.recentTransactions?.length ? (
              <ul className="divide-y divide-slate-100">
                {stats.recentTransactions.map((trx) => (
                  <li
                    key={trx.id}
                    className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'p-2 rounded-lg shrink-0',
                          trx.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'
                        )}
                      >
                        {trx.type === 'IN' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{trx.item?.name ?? '—'}</p>
                        <p className="text-xs text-slate-500">
                          {trx.type === 'IN'
                            ? `Supplier: ${trx.supplier || '—'}`
                            : `Department: ${trx.department || '—'}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          trx.type === 'IN' ? 'text-emerald-700' : 'text-violet-700'
                        )}
                      >
                        {trx.type === 'IN' ? '+' : '−'}
                        {trx.quantity}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(trx.date).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-slate-500 py-10 text-sm">No transactions recorded yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900">Asset condition</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">Counts by operational status</p>
          <ul className="space-y-3">
            <li className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Functional
              </span>
              <span className="font-semibold">{stats?.assetHealth?.functional ?? 0}</span>
            </li>
            <li className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <Wrench size={16} className="text-amber-600" />
                Under maintenance
              </span>
              <span className="font-semibold">{stats?.assetHealth?.maintenance ?? 0}</span>
            </li>
            <li className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <AlertCircle size={16} className="text-red-600" />
                Non-functional
              </span>
              <span className="font-semibold">{stats?.assetHealth?.broken ?? 0}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
