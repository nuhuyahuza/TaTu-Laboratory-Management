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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laboratories</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage physical IT laboratories and their configurations.</p>
        </div>
        <button 
          onClick={() => {
            setEditingLab(null);
            setFormData({ name: '', description: '', capacity: 0, location: '', color: '#10b981' });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          <span>Add Laboratory</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : (
        <DataTable 
          data={labs}
          columns={columns}
          title="Laboratories"
          actions={(lab) => (
            <div className="flex justify-end space-x-2">
              <button onClick={() => openEdit(lab)} className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(lab.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          )}
        />
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800 transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingLab ? 'Edit Lab' : 'Add New Lab'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lab Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                  placeholder="e.g. Computer Lab 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                  rows={3}
                  placeholder="Brief description of the lab..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity</label>
                  <input 
                    type="number" 
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input 
                    type="text" 
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                    placeholder="e.g. Block A, 2nd Floor"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Calendar Color</label>
                <div className="flex space-x-2">
                  {['#10b981', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({...formData, color: c})}
                      className={`w-8 h-8 rounded-full border-2 ${formData.color === c ? 'border-gray-900 dark:border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
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
