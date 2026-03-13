import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Loader2 } from 'lucide-react';
import { timeSlotService } from '../services/db';
import { TimeSlot } from '../models/types';

export const SettingsPage: React.FC = () => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: ''
  });

  const fetchSlots = async () => {
    setLoading(true);
    const data = await timeSlotService.getAll();
    setSlots(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await timeSlotService.add(formData);
    setFormData({ startTime: '', endTime: '' });
    fetchSlots();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this time slot?')) {
      await timeSlotService.delete(id);
      fetchSlots();
    }
  };

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
          Configuration <span className="text-gradient">Settings</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Configure system-wide settings and parameters.</p>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white/5">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
            <Clock size={24} className="mr-3 text-emerald-600 dark:text-emerald-400" />
            Lecture Time Slots
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Define the standard periods for laboratory reservations.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-6 items-end mb-10 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-all">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Time</label>
              <input 
                type="time" 
                required
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">End Time</label>
              <input 
                type="time" 
                required
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
              />
            </div>
            <button 
              type="submit"
              className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <Plus size={20} className="mr-2" strokeWidth={3} />
              Add Slot
            </button>
          </form>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {slots.map((slot) => (
                <div key={slot.id} className="group flex items-center justify-between p-5 bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shadow-sm">
                      <Clock size={20} />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white tracking-tight">{slot.startTime} - {slot.endTime}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(slot.id)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {slots.length === 0 && (
                <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 font-bold italic tracking-tight">No time slots configured yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white/5">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">System Information</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center py-4 border-b border-slate-50 dark:border-slate-800/50">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Department</span>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight">Information Technology</span>
          </div>
          <div className="flex justify-between items-center py-4 border-b border-slate-50 dark:border-slate-800/50">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Institution</span>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight">Tamale Technical University</span>
          </div>
          <div className="flex justify-between items-center py-4">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">System Version</span>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-bold text-slate-900 dark:text-white tracking-tight">1.0.0-stable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
