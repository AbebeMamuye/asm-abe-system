'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  FileSpreadsheet,
  Loader2,
  History,
  Activity,
  CheckCircle2,
  AlertCircle,
  Wrench,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { MaintenanceModal } from '@/components/MaintenanceModal';
import { MaintenanceHistoryModal } from '@/components/MaintenanceHistoryModal';
import { NewAssetModal } from '@/components/NewAssetModal';

interface Item {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  condition: 'FUNCTIONAL' | 'UNDER_MAINTENANCE' | 'NON_FUNCTIONAL';
  location: string;
}

const CONDITION_LABELS: Record<Item['condition'], string> = {
  FUNCTIONAL: 'Functional',
  UNDER_MAINTENANCE: 'Under maintenance',
  NON_FUNCTIONAL: 'Non-functional',
};

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [maintenanceItem, setMaintenanceItem] = useState<{ id: string; name: string } | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [historyItem, setHistoryItem] = useState<{ id: string; name: string } | null>(null);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((i) => i.category))).sort();
    return ['All', ...unique];
  }, [items]);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        setItems(await res.json());
      }
    } catch {
      console.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleStatusChange = async (item: Item, newStatus: string) => {
    if (newStatus === 'FUNCTIONAL') {
      setLoading(true);
      try {
        await fetch(`/api/items/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ condition: newStatus, lastMaintenanceDate: new Date() }),
        });
        fetchItems();
      } catch {
        console.error('Failed to update status');
      } finally {
        setLoading(false);
      }
    } else {
      setMaintenanceItem({ id: item.id, name: item.name });
      setPendingStatus(newStatus);
    }
  };

  const exportToExcel = () => {
    const rows = filteredItems.map((item) => ({
      Name: item.name,
      Category: item.category,
      Location: item.location || '',
      Quantity: item.quantity,
      Unit: item.unit,
      'Reorder level': item.reorderLevel,
      Condition: CONDITION_LABELS[item.condition] ?? item.condition,
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Inventory');
    XLSX.writeFile(book, `inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
          <p className="text-slate-600 text-sm mt-1">Assets on hand, locations, and condition status.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportToExcel}
            disabled={loading || filteredItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setIsNewAssetModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
          >
            <Plus size={18} />
            New asset
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            placeholder="Search by name, category, or ID"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm min-w-[200px]"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'All' ? 'All categories' : cat}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="px-6 py-3 font-medium">Asset</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium text-center">Qty</th>
                <th className="px-6 py-3 font-medium">Condition</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    No assets match your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.quantity <= item.reorderLevel;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center',
                              item.condition === 'FUNCTIONAL'
                                ? 'bg-emerald-50 text-emerald-600'
                                : item.condition === 'UNDER_MAINTENANCE'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-red-50 text-red-600'
                            )}
                          >
                            <Activity size={18} />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-400 font-mono truncate max-w-[220px]">
                              {item.id}
                              {isLowStock && (
                                <span className="ml-2 text-red-600 font-sans font-medium">Low stock</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{item.category}</td>
                      <td className="px-6 py-4 text-slate-700">{item.location || '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn('font-semibold', isLowStock && 'text-red-600')}>
                          {item.quantity}
                        </span>
                        <span className="text-slate-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                            item.condition === 'FUNCTIONAL' && 'bg-emerald-50 text-emerald-800',
                            item.condition === 'UNDER_MAINTENANCE' && 'bg-amber-50 text-amber-800',
                            item.condition === 'NON_FUNCTIONAL' && 'bg-red-50 text-red-800'
                          )}
                        >
                          {CONDITION_LABELS[item.condition]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item, 'FUNCTIONAL')}
                            title="Mark functional"
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          >
                            <CheckCircle2 size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item, 'UNDER_MAINTENANCE')}
                            title="Mark under maintenance"
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                          >
                            <Wrench size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item, 'NON_FUNCTIONAL')}
                            title="Mark non-functional"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <AlertCircle size={17} />
                          </button>
                          <button
                            type="button"
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                            title="Maintenance history"
                            onClick={() => setHistoryItem({ id: item.id, name: item.name })}
                          >
                            <History size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {maintenanceItem && (
        <MaintenanceModal
          item={maintenanceItem}
          newStatus={pendingStatus}
          onClose={() => {
            setMaintenanceItem(null);
            setPendingStatus('');
          }}
          onSuccess={() => {
            setMaintenanceItem(null);
            setPendingStatus('');
            fetchItems();
          }}
        />
      )}

      {historyItem && (
        <MaintenanceHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />
      )}

      {isNewAssetModalOpen && (
        <NewAssetModal
          onClose={() => setIsNewAssetModalOpen(false)}
          onSuccess={() => {
            setIsNewAssetModalOpen(false);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}
