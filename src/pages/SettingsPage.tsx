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
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuration Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure system-wide settings and parameters.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <Clock size={20} className="mr-2 text-emerald-600 dark:text-emerald-400" />
            Lecture Time Slots
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Define the standard periods for laboratory reservations.</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end mb-8 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl transition-colors">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Start Time</label>
              <input 
                type="time" 
                required
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">End Time</label>
              <input 
                type="time" 
                required
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
              />
            </div>
            <button 
              type="submit"
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center shadow-sm"
            >
              <Plus size={20} className="mr-2" />
              Add Slot
            </button>
          </form>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-600" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {slots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <Clock size={18} />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{slot.startTime} - {slot.endTime}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(slot.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {slots.length === 0 && (
                <p className="col-span-full text-center py-8 text-gray-500 italic">No time slots configured yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">System Information</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between py-2 border-b border-gray-50 dark:border-slate-800">
            <span className="text-gray-500 dark:text-gray-400">Department</span>
            <span className="font-medium dark:text-white">Information Technology</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50 dark:border-slate-800">
            <span className="text-gray-500 dark:text-gray-400">Institution</span>
            <span className="font-medium dark:text-white">Tamale Technical University</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500 dark:text-gray-400">System Version</span>
            <span className="font-medium dark:text-white">1.0.0-stable</span>
          </div>
        </div>
      </div>
    </div>
  );
};
