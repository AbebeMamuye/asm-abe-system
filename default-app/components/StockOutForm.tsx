'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowUpRight, Loader2, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
}

const DEPARTMENTS = [
  'Laboratory',
  'Pharmacy',
  'Administration',
  'Emergency',
  'Dental',
  'Pediatrics',
  'General Medicine',
  'Cleaning/Maintenance'
];

export function StockOutForm() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    department: '',
    voucherNumber: '',
    requisitionNumber: '',
  });

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('/api/items');
        if (res.ok) {
          const data = await res.json();
          setItems(data);
        }
      } catch (err) {
        console.error('Failed to fetch items');
      } finally {
        setFetching(false);
      }
    };
    fetchItems();
  }, []);

  const selectedItem = items.find(i => i.id === formData.itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(formData.quantity);

    if (!formData.itemId || !formData.quantity || qtyNum <= 0 || !formData.department) {
      setStatus({ type: 'error', message: 'Please provide item, quantity, and department.' });
      return;
    }

    if (selectedItem && qtyNum > selectedItem.quantity) {
      setStatus({ 
        type: 'error', 
        message: `Insufficient stock! Currently available: ${selectedItem.quantity} ${selectedItem.unit}.` 
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OUT',
          itemId: formData.itemId,
          quantity: qtyNum,
          department: formData.department,
          voucherNumber: formData.voucherNumber,
          requisitionNumber: formData.requisitionNumber,
        }),
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Model 20 (Stock-Out) recorded successfully!' });
        setFormData({ itemId: '', quantity: '', department: '', voucherNumber: '', requisitionNumber: '' });
        // Refresh local item state to reflect new quantity for next transaction
        const updatedItemsRes = await fetch('/api/items');
        if (updatedItemsRes.ok) {
          const updatedItems = await updatedItemsRes.json();
          setItems(updatedItems);
        }
        router.refresh(); 
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to record transaction');
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="bg-slate-900 px-8 py-6 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Model 20 — Requisition / issue</h2>
            <p className="text-slate-400 text-sm mt-0.5">Issue stock to a department or unit.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {status && (
          <div className={cn(
            "p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
            status.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
          )}>
            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Voucher number</label>
            <input
              type="text"
              placeholder="e.g. M20/001"
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
              value={formData.voucherNumber}
              onChange={(e) => setFormData({ ...formData, voucherNumber: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Requisition number</label>
            <input
              type="text"
              placeholder="e.g. REQ/2026/05"
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
              value={formData.requisitionNumber}
              onChange={(e) => setFormData({ ...formData, requisitionNumber: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Asset</label>
          <div className="relative">
            <select
              disabled={fetching}
              className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium disabled:opacity-50"
              value={formData.itemId}
              onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
            >
              <option value="">{fetching ? 'Fetching assets...' : 'Choose an asset...'}</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.unit}) - {item.quantity} available
                </option>
              ))}
            </select>
            <Package className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
          {selectedItem && (
            <p className={cn(
               "text-xs font-bold px-2 py-1 rounded inline-block",
               selectedItem.quantity <= 0 ? "text-red-600 bg-red-50" : "text-slate-500 bg-slate-100"
            )}>
              Inventory: {selectedItem.quantity} units remaining
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Quantity</label>
            <input
              type="number"
              min="1"
              placeholder="0"
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Receiving department</label>
            <div className="relative">
              <select
                className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="">Choose department...</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || fetching || (selectedItem && selectedItem.quantity <= 0)}
          className="w-full h-12 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowUpRight size={20} />}
          <span>Save issue record</span>
        </button>
      </form>
    </div>
  );
}
