'use client';

import React, { useState } from 'react';
import { X, PackagePlus, Loader2, CheckCircle2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewAssetModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewAssetModal({ onClose, onSuccess }: NewAssetModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Stationery',
    unit: 'pcs',
    quantity: '',
    reorderLevel: '10',
    location: '',
    modelNumber: '',
    serialNumber: '',
  });

  const categories = [
    'Stationery',
    'Cleaning Supplies',
    'Electronics',
    'Medical Equipment',
    'Furniture',
    'Laboratory',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          quantity: Number(formData.quantity) || 0,
          reorderLevel: Number(formData.reorderLevel) || 10,
          modelNumber: formData.modelNumber,
          serialNumber: formData.serialNumber,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        throw new Error('Failed to create item');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PackagePlus className="text-blue-400" size={24} />
            <div>
              <h3 className="font-bold text-lg">Register New Asset</h3>
              <p className="text-slate-400 text-xs">Add a completely new item to the system tracking</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Asset Name / የንብረት ስም</label>
            <input
              required
              type="text"
              placeholder="e.g., Office Desk"
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category / ምድብ</label>
              <select
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unit Type</label>
              <input
                required
                type="text"
                placeholder="e.g., pcs, box, kg..."
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Initial Qty</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Reorder Level (Alert)</label>
              <input
                type="number"
                min="0"
                placeholder="10"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Model Number</label>
              <input
                type="text"
                placeholder="e.g., XPS-15"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                value={formData.modelNumber}
                onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Serial Number</label>
              <input
                type="text"
                placeholder="Unique S/N"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] h-12 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              <span>Save New Asset</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
