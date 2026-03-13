import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, HardDrive, Loader2 } from 'lucide-react';
import { equipmentService, labService } from '../services/db';
import { Equipment, Laboratory } from '../models/types';
import { DataTable } from '../components/DataTable';

export const EquipmentPage: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    totalQuantity: 0,
    availableQuantity: 0,
    labId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const [equipData, labsData] = await Promise.all([
      equipmentService.getAll(),
      labService.getAll()
    ]);
    setEquipment(equipData);
    setLabs(labsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      availableQuantity: editingItem ? formData.availableQuantity : formData.totalQuantity
    };
    
    if (editingItem) {
      await equipmentService.update(editingItem.id, data);
    } else {
      await equipmentService.add(data);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: '', category: '', totalQuantity: 0, availableQuantity: 0, labId: '' });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      await equipmentService.delete(id);
      fetchData();
    }
  };

  const openEdit = (item: Equipment) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      totalQuantity: item.totalQuantity,
      availableQuantity: item.availableQuantity,
      labId: item.labId
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      header: 'Equipment Name',
      key: 'name',
      accessor: (item: Equipment) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <HardDrive size={18} />
          </div>
          <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
        </div>
      )
    },
    { header: 'Category', key: 'category', accessor: (item: Equipment) => item.category },
    { 
      header: 'Laboratory', 
      key: 'labId', 
      accessor: (item: Equipment) => labs.find(l => l.id === item.labId)?.name || 'Unassigned'
    },
    { header: 'Total', key: 'totalQuantity', accessor: (item: Equipment) => item.totalQuantity },
    { header: 'Available', key: 'availableQuantity', accessor: (item: Equipment) => item.availableQuantity },
    {
      header: 'Status',
      key: 'status',
      accessor: (item: Equipment) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.availableQuantity > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          {item.availableQuantity > 0 ? 'In Stock' : 'Out of Stock'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Equipment Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Track and manage laboratory resources.</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem(null);
            setFormData({ name: '', category: '', totalQuantity: 0, availableQuantity: 0, labId: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Add Equipment</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
      ) : (
        <DataTable 
          data={equipment}
          columns={columns}
          title="Equipment_Inventory"
          actions={(item) => (
            <div className="flex justify-end space-x-2">
              <button onClick={() => openEdit(item)} className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition-all">
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
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{editingItem ? 'Edit Equipment' : 'Add Equipment'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Equipment Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                  placeholder="e.g. Dell Latitude 5400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                <select 
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                >
                  <option value="">Select Category</option>
                  <option value="Computer">Computer</option>
                  <option value="Projector">Projector</option>
                  <option value="Cables">Cables</option>
                  <option value="Networking">Networking</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Laboratory</label>
                <select 
                  required
                  value={formData.labId}
                  onChange={(e) => setFormData({...formData, labId: e.target.value})}
                  className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                >
                  <option value="">Select Lab</option>
                  {labs.map(lab => (
                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Total Quantity</label>
                  <input 
                    type="number" 
                    required
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({...formData, totalQuantity: parseInt(e.target.value)})}
                    className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
                {editingItem && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Available</label>
                    <input 
                      type="number" 
                      required
                      value={formData.availableQuantity}
                      onChange={(e) => setFormData({...formData, availableQuantity: parseInt(e.target.value)})}
                      className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    />
                  </div>
                )}
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98]"
                >
                  {editingItem ? 'Update Equipment' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
