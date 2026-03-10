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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipment Inventory</h1>
          <p className="text-gray-500 dark:text-gray-400">Track and manage laboratory resources.</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem(null);
            setFormData({ name: '', category: '', totalQuantity: 0, availableQuantity: 0, labId: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          <span>Add Equipment</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : (
        <DataTable 
          data={equipment}
          columns={columns}
          title="Equipment_Inventory"
          actions={(item) => (
            <div className="flex justify-end space-x-2">
              <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingItem ? 'Edit Equipment' : 'Add Equipment'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipment Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  placeholder="e.g. Dell Latitude 5400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select 
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Laboratory</label>
                <select 
                  required
                  value={formData.labId}
                  onChange={(e) => setFormData({...formData, labId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                >
                  <option value="">Select Lab</option>
                  {labs.map(lab => (
                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Quantity</label>
                  <input 
                    type="number" 
                    required
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({...formData, totalQuantity: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
                </div>
                {editingItem && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available</label>
                    <input 
                      type="number" 
                      required
                      value={formData.availableQuantity}
                      onChange={(e) => setFormData({...formData, availableQuantity: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                    />
                  </div>
                )}
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
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
