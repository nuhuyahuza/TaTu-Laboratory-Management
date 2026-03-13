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

  const handleMarkPickedUp = async (id: string) => {
    await requestService.markPickedUp(id);
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">Approved</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">Rejected</span>;
      case 'completed': return <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">Completed</span>;
      default: return <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">Pending</span>;
    }
  };

  const columns = [
    {
      header: 'Equipment',
      key: 'equipmentName',
      accessor: (req: EquipmentRequest) => (
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shadow-sm">
            <HardDrive size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white tracking-tight">{req.equipmentName}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">{req.course}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Student',
      key: 'studentName',
      accessor: (req: EquipmentRequest) => (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <User size={12} className="text-slate-500" />
          </div>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-bold">{req.studentName}</span>
        </div>
      )
    },
    { header: 'Qty', key: 'quantity', accessor: (req: EquipmentRequest) => <span className="font-black text-slate-900 dark:text-white">{req.quantity}</span> },
    {
      header: 'Duration',
      key: 'startTime',
      accessor: (req: EquipmentRequest) => (
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
          <Clock size={14} className="text-emerald-500" />
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
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Equipment <span className="text-gradient">Requests</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Manage borrowing requests and equipment tracking.</p>
        </div>
        {isStudent && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            <span>New Request</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
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
                    className="w-9 h-9 flex items-center justify-center text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-all active:scale-90"
                    title="Approve"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'rejected', req.equipmentId, req.quantity)}
                    className="w-9 h-9 flex items-center justify-center text-red-600 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all active:scale-90"
                    title="Reject"
                  >
                    <XCircle size={20} />
                  </button>
                </>
              )}
              {req.status === 'approved' && !req.pickedUp && (
                <button 
                  onClick={() => handleMarkPickedUp(req.id)}
                  className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                >
                  Mark Picked Up
                </button>
              )}
              {req.status === 'approved' && req.pickedUp && !req.returned && (
                 <button 
                 onClick={() => handleStatusUpdate(req.id, 'completed', req.equipmentId, req.quantity)}
                 className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="glass dark:glass-dark rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 dark:border-white/10 transition-all animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-white/10 dark:border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Request Equipment</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Equipment</label>
                <select 
                  required
                  value={formData.equipmentId}
                  onChange={(e) => setFormData({...formData, equipmentId: e.target.value})}
                  className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                >
                  <option value="">Select Equipment</option>
                  {equipment.filter(e => e.availableQuantity > 0).map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.availableQuantity} available)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Quantity</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Course Code</label>
                  <input 
                    type="text" 
                    required
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                    className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    placeholder="e.g. IT 302"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">End Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Purpose</label>
                <textarea 
                  required
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  className="w-full px-5 py-3 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                  rows={3}
                  placeholder="Why do you need this equipment?"
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98]"
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
