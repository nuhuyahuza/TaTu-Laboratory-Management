import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  User, 
  HardDrive,
  Loader2
} from 'lucide-react';
import { requestService, equipmentService } from '../services/db';
import { EquipmentRequest, Equipment } from '../models/types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { DataTable } from '../components/DataTable';

export const RequestsPage: React.FC = () => {
  const { profile, isAdmin, isStudent } = useAuth();
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    equipmentId: '',
    quantity: 1,
    purpose: '',
    course: '',
    startTime: '',
    endTime: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const [reqData, equipData] = await Promise.all([
      isAdmin ? requestService.getAll() : requestService.getByUser(profile?.id || ''),
      equipmentService.getAll()
    ]);
    setRequests(reqData);
    setEquipment(equipData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.id, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedEquip = equipment.find(e => e.id === formData.equipmentId);
    if (!selectedEquip) return;

    await requestService.add({
      ...formData,
      equipmentName: selectedEquip.name,
      studentId: profile?.id || '',
      studentName: profile?.name || '',
      lecturerId: '', // Optional or selected
      status: 'pending',
      pickedUp: false,
      returned: false,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime)
    });

    setIsModalOpen(false);
    setFormData({ equipmentId: '', quantity: 1, purpose: '', course: '', startTime: '', endTime: '' });
    fetchData();
  };

  const handleStatusUpdate = async (id: string, status: string, equipmentId: string, quantity: number) => {
    await requestService.updateStatus(id, status, equipmentId, quantity);
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">Approved</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">Rejected</span>;
      case 'completed': return <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">Completed</span>;
      default: return <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">Pending</span>;
    }
  };

  const columns = [
    {
      header: 'Equipment',
      key: 'equipmentName',
      accessor: (req: EquipmentRequest) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <HardDrive size={18} />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{req.equipmentName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{req.course}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Student',
      key: 'studentName',
      accessor: (req: EquipmentRequest) => (
        <div className="flex items-center space-x-2">
          <User size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">{req.studentName}</span>
        </div>
      )
    },
    { header: 'Quantity', key: 'quantity', accessor: (req: EquipmentRequest) => req.quantity },
    {
      header: 'Duration',
      key: 'startTime',
      accessor: (req: EquipmentRequest) => (
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock size={14} />
          <span>{format(req.startTime.toDate(), 'MMM d, HH:mm')} - {format(req.endTime.toDate(), 'HH:mm')}</span>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      accessor: (req: EquipmentRequest) => getStatusBadge(req.status)
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipment Requests</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage borrowing requests and equipment tracking.</p>
        </div>
        {isStudent && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            <span>New Request</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : (
        <DataTable 
          data={requests}
          columns={columns}
          title="Equipment_Requests"
          actions={(req) => isAdmin ? (
            <div className="flex justify-end space-x-2">
              {req.status === 'pending' && (
                <>
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'approved', req.equipmentId, req.quantity)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    title="Approve"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'rejected', req.equipmentId, req.quantity)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Reject"
                  >
                    <XCircle size={20} />
                  </button>
                </>
              )}
              {req.status === 'approved' && !req.returned && (
                   <button 
                   onClick={() => handleStatusUpdate(req.id, 'completed', req.equipmentId, req.quantity)}
                   className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:underline"
                 >
                   Mark Returned
                 </button>
              )}
            </div>
          ) : null}
        />
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800 transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Equipment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipment</label>
                <select 
                  required
                  value={formData.equipmentId}
                  onChange={(e) => setFormData({...formData, equipmentId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                >
                  <option value="">Select Equipment</option>
                  {equipment.filter(e => e.availableQuantity > 0).map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.availableQuantity} available)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Code</label>
                  <input 
                    type="text" 
                    required
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                    placeholder="e.g. IT 302"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                <textarea 
                  required
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  rows={3}
                  placeholder="Why do you need this equipment?"
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
