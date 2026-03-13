import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Loader2, Calendar, Zap, Check } from 'lucide-react';
import { timeSlotService, workingHoursService } from '../services/db';
import { TimeSlot, WorkingHours } from '../models/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const SettingsPage: React.FC = () => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  
  const [slotFormData, setSlotFormData] = useState({
    startTime: '',
    endTime: '',
    day: 'Monday'
  });

  const [whFormData, setWhFormData] = useState({
    startTime: '',
    endTime: '',
    days: [] as string[]
  });

  const fetchData = async () => {
    setLoading(true);
    const [slotsData, whData] = await Promise.all([
      timeSlotService.getAll(),
      workingHoursService.getAll()
    ]);
    setSlots(slotsData);
    setWorkingHours(whData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await timeSlotService.add(slotFormData);
    setSlotFormData({ startTime: '', endTime: '', day: 'Monday' });
    fetchData();
  };

  const handleWhSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (whFormData.days.length === 0) {
      alert('Please select at least one day');
      return;
    }
    await workingHoursService.add(whFormData);
    setWhFormData({ startTime: '', endTime: '', days: [] });
    fetchData();
  };

  const handleSlotDelete = async (id: string) => {
    if (window.confirm('Delete this time slot?')) {
      await timeSlotService.delete(id);
      fetchData();
    }
  };

  const handleWhDelete = async (id: string) => {
    if (window.confirm('Delete these working hours?')) {
      await workingHoursService.delete(id);
      fetchData();
    }
  };

  const toggleDay = (day: string) => {
    setWhFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const generateSlots = async (wh: WorkingHours) => {
    setIsGenerating(wh.id);
    try {
      const start = parseInt(wh.startTime.split(':')[0]) * 60 + parseInt(wh.startTime.split(':')[1]);
      const end = parseInt(wh.endTime.split(':')[0]) * 60 + parseInt(wh.endTime.split(':')[1]);
      
      const newSlots: Omit<TimeSlot, 'id'>[] = [];
      
      for (const day of wh.days) {
        let current = start;
        while (current + 60 <= end) {
          const sH = Math.floor(current / 60).toString().padStart(2, '0');
          const sM = (current % 60).toString().padStart(2, '0');
          const eH = Math.floor((current + 60) / 60).toString().padStart(2, '0');
          const eM = ((current + 60) % 60).toString().padStart(2, '0');
          
          const startTime = `${sH}:${sM}`;
          const endTime = `${eH}:${eM}`;
          
          // Check for conflicts
          const exists = slots.some(s => s.day === day && s.startTime === startTime && s.endTime === endTime);
          if (!exists) {
            newSlots.push({ startTime, endTime, day });
          }
          
          current += 60;
        }
      }
      
      if (newSlots.length > 0) {
        await timeSlotService.bulkAdd(newSlots);
        await fetchData();
      } else {
        alert('No new slots to generate. All slots already exist or interval is too short.');
      }
    } catch (error) {
      console.error("Error generating slots:", error);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="max-w-6xl space-y-12 pb-20">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
          Configuration <span className="text-gradient">Settings</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Configure system-wide parameters and automation rules.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Working Hours Section */}
        <div className="premium-card overflow-hidden h-fit">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white/5">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
              <Calendar size={24} className="mr-3 text-emerald-600 dark:text-emerald-400" />
              Working Hours
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Define laboratory operational hours to automate slot generation.</p>
          </div>

          <div className="p-8 space-y-8">
            <form onSubmit={handleWhSubmit} className="space-y-6 bg-slate-50 dark:bg-slate-950/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Time</label>
                  <input 
                    type="time" 
                    required
                    value={whFormData.startTime}
                    onChange={(e) => setWhFormData({...whFormData, startTime: e.target.value})}
                    className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">End Time</label>
                  <input 
                    type="time" 
                    required
                    value={whFormData.endTime}
                    onChange={(e) => setWhFormData({...whFormData, endTime: e.target.value})}
                    className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Select Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${whFormData.days.includes(day) ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-500/50'}`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center shadow-xl shadow-emerald-600/20 active:scale-[0.98]"
              >
                <Plus size={20} className="mr-2" strokeWidth={3} />
                Add Working Hours
              </button>
            </form>

            <div className="space-y-4">
              {workingHours.map(wh => (
                <div key={wh.id} className="glass dark:glass-dark p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-emerald-500/30 transition-all group">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                        <Clock size={16} />
                      </div>
                      <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{wh.startTime} - {wh.endTime}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {wh.days.map(day => (
                        <span key={day} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md text-[9px] font-black uppercase tracking-tighter">
                          {day.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => generateSlots(wh)}
                      disabled={isGenerating === wh.id}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      {isGenerating === wh.id ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                      <span>Generate Slots</span>
                    </button>
                    <button
                      onClick={() => handleWhDelete(wh.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {workingHours.length === 0 && (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/30 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 font-bold italic text-sm">No working hours defined yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Individual Time Slots Section */}
        <div className="premium-card overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white/5">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
              <Clock size={24} className="mr-3 text-emerald-600 dark:text-emerald-400" />
              Active Time Slots
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Manually manage individual slots or view generated ones.</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSlotSubmit} className="space-y-6 bg-slate-50 dark:bg-slate-950/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 mb-10">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Time</label>
                  <input 
                    type="time" 
                    required
                    value={slotFormData.startTime}
                    onChange={(e) => setSlotFormData({...slotFormData, startTime: e.target.value})}
                    className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">End Time</label>
                  <input 
                    type="time" 
                    required
                    value={slotFormData.endTime}
                    onChange={(e) => setSlotFormData({...slotFormData, endTime: e.target.value})}
                    className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Day of Week</label>
                <select
                  value={slotFormData.day}
                  onChange={(e) => setSlotFormData({...slotFormData, day: e.target.value})}
                  className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold appearance-none"
                >
                  {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center active:scale-[0.98]"
              >
                <Plus size={20} className="mr-2" strokeWidth={3} />
                Add Manual Slot
              </button>
            </form>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {DAYS.map(day => {
                const daySlots = slots.filter(s => s.day === day || (!s.day && day === 'Monday'));
                if (daySlots.length === 0) return null;
                return (
                  <div key={day} className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mt-6 mb-2">{day}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {daySlots.map((slot) => (
                        <div key={slot.id} className="group flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl hover:border-emerald-500/50 transition-all">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                              <Clock size={14} />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{slot.startTime} - {slot.endTime}</span>
                          </div>
                          <button 
                            onClick={() => handleSlotDelete(slot.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {slots.length === 0 && (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 font-bold italic">No time slots configured yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white/5">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">System Information</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center py-4 border-b border-slate-50 dark:border-slate-800/50">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Department</span>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight text-gradient">Information Technology</span>
          </div>
          <div className="flex justify-between items-center py-4 border-b border-slate-50 dark:border-slate-800/50">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Institution</span>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight">Tamale Technical University</span>
          </div>
          <div className="flex justify-between items-center py-4">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">System Status</span>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">Operational (v1.0.0-stable)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

