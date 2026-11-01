'use client';

import React, { useState } from 'react';
import { X, Wrench, Loader2, CheckCircle2 } from 'lucide-react';

interface MaintenanceModalProps {
  item: { id: string; name: string };
  newStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function MaintenanceModal({ item, newStatus, onClose, onSuccess }: MaintenanceModalProps) {
  const [description, setDescription] = useState('');
  const [technician, setTechnician] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Log the maintenance/issue
      await fetch(`/api/items/${item.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Status changed to ${newStatus}: ${description}`,
          technicianName: technician,
          cost: cost || 0,
        }),
      });

      // 2. Update the item status
      await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition: newStatus,
          lastMaintenanceDate: newStatus === 'FUNCTIONAL' ? new Date() : undefined,
        }),
      });

      onSuccess();
    } catch (err) {
      console.error('Failed to log maintenance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="text-blue-400" size={24} />
            <div>
              <h3 className="font-bold text-lg">Log Issue: {item.name}</h3>
              <p className="text-slate-400 text-xs">Reporting {newStatus.toLowerCase()} status</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Issue Description</label>
            <textarea
              required
              rows={3}
              placeholder="Explain the problem or reason for maintenance..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Technician</label>
              <input
                type="text"
                placeholder="Name"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Est. Cost</label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
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
              className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
