'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowDownLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
}

export function StockInForm() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    supplier: '',
    voucherNumber: '',
    unitPrice: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemId || !formData.quantity || Number(formData.quantity) <= 0) {
      setStatus({ type: 'error', message: 'Please provide a valid item and positive quantity.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'IN',
          itemId: formData.itemId,
          quantity: Number(formData.quantity),
          supplier: formData.supplier,
          voucherNumber: formData.voucherNumber,
          unitPrice: formData.unitPrice ? Number(formData.unitPrice) : undefined,
          totalPrice: (Number(formData.quantity) * (Number(formData.unitPrice) || 0)) || undefined,
        }),
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Model 19 (Stock-In) recorded successfully!' });
        setFormData({ itemId: '', quantity: '', supplier: '', voucherNumber: '', unitPrice: '' });
        router.refresh(); // Refresh page data
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
          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
            <ArrowDownLeft size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Model 19 — Receiving voucher</h2>
            <p className="text-slate-400 text-sm mt-0.5">Record stock received into store.</p>
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
              placeholder="e.g. M19/001"
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
              value={formData.voucherNumber}
              onChange={(e) => setFormData({ ...formData, voucherNumber: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Supplier</label>
            <input
              type="text"
              placeholder="Source of the asset"
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
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
              <option value="">{fetching ? 'Fetching items...' : 'Choose an asset...'}</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.unit}) - Currently: {item.quantity}</option>
              ))}
            </select>
            <Package className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
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
            <label className="text-sm font-medium text-slate-700">Unit price (ETB)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || fetching}
          className="w-full h-12 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowDownLeft size={20} />}
          <span>Save receiving voucher</span>
        </button>
      </form>
    </div>
  );
}
