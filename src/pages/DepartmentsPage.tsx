import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Briefcase, Loader2 } from 'lucide-react';
import { departmentService } from '../services/db';
import { Department } from '../models/types';
import { DataTable } from '../components/DataTable';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchDepartments = async () => {
    setLoading(true);
    const data = await departmentService.getAll();
    setDepartments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDept) {
      await departmentService.update(editingDept.id, formData);
    } else {
      await departmentService.add(formData);
    }
    setIsModalOpen(false);
    setEditingDept(null);
    setFormData({ name: '', description: '' });
    fetchDepartments();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      await departmentService.delete(id);
      fetchDepartments();
    }
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      header: 'Department Name',
      key: 'name',
      accessor: (dept: Department) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Briefcase size={18} />
          </div>
          <span className="font-medium text-gray-900 dark:text-white">{dept.name}</span>
        </div>
      )
    },
    { header: 'Description', key: 'description', accessor: (dept: Department) => dept.description }
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Departments</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage university departments and academic units.</p>
        </div>
        <button 
          onClick={() => {
            setEditingDept(null);
            setFormData({ name: '', description: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Add Department</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
      ) : (
        <DataTable 
          data={departments}
          columns={columns}
          title="Departments"
          actions={(dept) => (
            <div className="flex justify-end space-x-2">
              <button onClick={() => openEdit(dept)} className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(dept.id)} className="p-2.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition-all">
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
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{editingDept ? 'Edit Department' : 'Add Department'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Department Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                  placeholder="e.g. Information Technology"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                  rows={4}
                  placeholder="Brief description of the department..."
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98]"
                >
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
