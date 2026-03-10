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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage university departments and academic units.</p>
        </div>
        <button 
          onClick={() => {
            setEditingDept(null);
            setFormData({ name: '', description: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          <span>Add Department</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : (
        <DataTable 
          data={departments}
          columns={columns}
          title="Departments"
          actions={(dept) => (
            <div className="flex justify-end space-x-2">
              <button onClick={() => openEdit(dept)} className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(dept.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingDept ? 'Edit Department' : 'Add Department'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  placeholder="e.g. Information Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  rows={4}
                  placeholder="Brief description of the department..."
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
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
