import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Briefcase, 
  HardDrive, 
  ClipboardList, 
  Calendar, 
  TrendingUp, 
  Users, 
  Loader2,
  Save,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { moduleSettingsService } from '../services/db';
import { ModuleSettings } from '../models/types';
import { motion } from 'motion/react';

export const ModulesPage: React.FC = () => {
  const [settings, setSettings] = useState<ModuleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await moduleSettingsService.get();
        setSettings(data);
      } catch (error) {
        console.error("Error fetching module settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (key: string) => {
    if (!settings) return;
    const k = key as keyof Omit<ModuleSettings, 'id' | 'updatedAt'>;
    setSettings({
      ...settings,
      [k]: !settings[k]
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      await moduleSettingsService.update(settings);
      setMessage({ type: 'success', text: 'Module settings updated successfully!' });
    } catch (error) {
      console.error("Error updating module settings:", error);
      setMessage({ type: 'error', text: 'Failed to update module settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  const modules = [
    { key: 'labsEnabled', label: 'Laboratories', icon: FlaskConical, description: 'Manage laboratory rooms and capacities' },
    { key: 'departmentsEnabled', label: 'Departments', icon: Briefcase, description: 'Organize labs and users by department' },
    { key: 'equipmentEnabled', label: 'Equipment', icon: HardDrive, description: 'Track lab equipment and inventory' },
    { key: 'requestsEnabled', label: 'Equipment Requests', icon: ClipboardList, description: 'Handle equipment borrowing requests' },
    { key: 'reservationsEnabled', label: 'Lab Reservations', icon: Calendar, description: 'Manage lab room bookings' },
    { key: 'calendarEnabled', label: 'Calendar', icon: Calendar, description: 'Visual schedule of all lab activities' },
    { key: 'reportsEnabled', label: 'Reports', icon: TrendingUp, description: 'Analytics and usage statistics' },
    { key: 'usersEnabled', label: 'Users', icon: Users, description: 'Manage system users and permissions' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Modules & <span className="text-gradient">Features</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            Enable or disable system modules to customize your experience.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span className="font-bold">{message.text}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const isEnabled = settings?.[mod.key as keyof ModuleSettings] as boolean;

          return (
            <motion.div
              key={mod.key}
              whileHover={{ y: -5 }}
              className={`premium-card p-6 cursor-pointer border-2 transition-all ${
                isEnabled ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-transparent'
              }`}
              onClick={() => handleToggle(mod.key as keyof ModuleSettings)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isEnabled ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  <Icon size={24} />
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${
                  isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    isEnabled ? 'left-7' : 'left-1'
                  }`} />
                </div>
              </div>
              <h3 className={`text-xl font-black mb-2 ${isEnabled ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                {mod.label}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {mod.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
