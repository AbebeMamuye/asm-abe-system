'use client';

import React, { useState, useEffect } from 'react';
import { X, History, Loader2, Calendar, Wrench, User, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface MaintenanceLog {
  id: string;
  description: string;
  technicianName: string;
  cost: number;
  completionDate: string;
}

interface MaintenanceHistoryModalProps {
  item: { id: string; name: string };
  onClose: () => void;
}

export function MaintenanceHistoryModal({ item, onClose }: MaintenanceHistoryModalProps) {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/items/${item.id}/maintenance`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error('Failed to fetch maintenance history');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [item.id]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg">
              <History size={24} />
            </div>
            <div>
              <h3 className="font-bold text-xl">Maintenance History</h3>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Asset Log: {item.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-slate-500 font-bold uppercase tracking-tighter">Accessing secure logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Wrench size={32} />
              </div>
              <p className="text-slate-400 font-medium">No maintenance records found for this asset.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="relative group pl-8">
                  {/* Timeline Line */}
                  <div className="absolute left-3 top-0 bottom-[-24px] w-0.5 bg-slate-100 last:bg-transparent" />
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-110">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all hover:shadow-xl group-hover:-translate-y-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase italic">
                        <Calendar size={14} className="text-blue-500" />
                        {format(new Date(log.completionDate), 'PPP')}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                          <User size={14} />
                          <span>{log.technicianName || 'In-house Staff'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          <CreditCard size={14} />
                          <span>${log.cost?.toLocaleString() || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-slate-700 text-sm leading-relaxed font-medium bg-white p-4 rounded-xl shadow-inner border border-slate-50">
                      {log.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-right">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-slate-800 transition-colors shadow-lg"
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>
  );
}
