import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Users, Loader2 } from 'lucide-react';
import { labService } from '../services/db';
import { Laboratory } from '../models/types';
import { DataTable } from '../components/DataTable';

export const LabsPage: React.FC = () => {
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 0,
    location: '',
    color: '#10b981'
  });

  const fetchLabs = async () => {
    setLoading(true);
    const data = await labService.getAll();
    setLabs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLab) {
      await labService.update(editingLab.id, formData);
    } else {
      await labService.add(formData);
    }
    setIsModalOpen(false);
    setEditingLab(null);
    setFormData({ name: '', description: '', capacity: 0, location: '', color: '#10b981' });
    fetchLabs();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this laboratory?')) {
      await labService.delete(id);
      fetchLabs();
    }
  };

  const openEdit = (lab: Laboratory) => {
    setEditingLab(lab);
    setFormData({
      name: lab.name,
      description: lab.description,
      capacity: lab.capacity,
      location: lab.location,
      color: lab.color
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      header: 'Lab Name',
      key: 'name',
      accessor: (lab: Laboratory) => (
        <div className="flex items-center space-x-3">
          <div className="w-3 h-8 rounded-full" style={{ backgroundColor: lab.color }}></div>
          <span className="font-medium text-gray-900 dark:text-white">{lab.name}</span>
        </div>
      )
    },
    { header: 'Location', key: 'location', accessor: (lab: Laboratory) => lab.location },
    { header: 'Capacity', key: 'capacity', accessor: (lab: Laboratory) => lab.capacity },
    { header: 'Description', key: 'description', accessor: (lab: Laboratory) => lab.description }
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Laboratories</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage physical IT laboratories and their configurations.</p>
        </div>
        <button 
          onClick={() => {
            setEditingLab(null);
            setFormData({ name: '', description: '', capacity: 0, location: '', color: '#10b981' });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Add Laboratory</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
      ) : (
        <DataTable 
          data={labs}
          columns={columns}
          title="Laboratories"
          actions={(lab) => (
            <div className="flex justify-end space-x-2">
              <button onClick={() => openEdit(lab)} className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(lab.id)} className="p-2.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          )}
        />
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="glass dark:glass-dark rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 dark:border-white/10 transition-all animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-white/10 dark:border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{editingLab ? 'Edit Lab' : 'Add New Lab'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Lab Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                  placeholder="e.g. Computer Lab 1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                  rows={3}
                  placeholder="Brief description of the lab..."
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Capacity</label>
                  <input 
                    type="number" 
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Location</label>
                  <input 
                    type="text" 
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                    placeholder="e.g. Block A, 2nd Floor"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Calendar Color</label>
                <div className="flex space-x-3 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
                  {['#10b981', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({...formData, color: c})}
                      className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${formData.color === c ? 'border-slate-900 dark:border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98]"
                >
                  {editingLab ? 'Update Laboratory' : 'Create Laboratory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
