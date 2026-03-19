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
import { ModuleSettings, RoleModuleSettings } from '../models/types';
import { motion } from 'motion/react';

export const ModulesPage: React.FC = () => {
  const [settings, setSettings] = useState<ModuleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = moduleSettingsService.subscribe((data) => {
      setSettings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = (role: keyof Omit<ModuleSettings, 'id' | 'updatedAt'>, moduleKey: keyof RoleModuleSettings) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [role]: {
        ...settings[role],
        [moduleKey]: !settings[role][moduleKey]
      }
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
    { key: 'labs', label: 'Laboratories', icon: FlaskConical, description: 'Manage laboratory rooms and capacities' },
    { key: 'departments', label: 'Departments', icon: Briefcase, description: 'Organize labs and users by department' },
    { key: 'equipment', label: 'Equipment', icon: HardDrive, description: 'Track lab equipment and inventory' },
    { key: 'requests', label: 'Equipment Requests', icon: ClipboardList, description: 'Handle equipment borrowing requests' },
    { key: 'reservations', label: 'Lab Reservations', icon: Calendar, description: 'Manage lab room bookings' },
    { key: 'calendar', label: 'Calendar', icon: Calendar, description: 'Visual schedule of all lab activities' },
    { key: 'reports', label: 'Reports', icon: TrendingUp, description: 'Analytics and usage statistics' },
    { key: 'users', label: 'Users', icon: Users, description: 'Manage system users and permissions' },
  ];

  const roles: (keyof Omit<ModuleSettings, 'id' | 'updatedAt'>)[] = ['admin', 'lecturer', 'student'];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Modules & <span className="text-gradient">Features</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            Enable or disable system modules per user role.
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

      <div className="overflow-x-auto rounded-[2.5rem] glass dark:glass-dark border border-white/20 dark:border-white/10 shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 dark:border-white/5">
              <th className="p-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Module</th>
              {roles.map(role => (
                <th key={role} className="p-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-center">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <tr key={mod.key} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                  <td className="p-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{mod.label}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{mod.description}</p>
                      </div>
                    </div>
                  </td>
                  {roles.map(role => {
                    const isEnabled = settings?.[role]?.[mod.key as keyof RoleModuleSettings];
                    return (
                      <td key={role} className="p-8 text-center">
                        <button
                          onClick={() => handleToggle(role, mod.key as keyof RoleModuleSettings)}
                          className={`w-14 h-7 rounded-full relative transition-all duration-500 ${
                            isEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        >
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-sm ${
                            isEnabled ? 'left-8' : 'left-1'
                          }`} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
