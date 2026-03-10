import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  User, 
  FlaskConical,
  Loader2
} from 'lucide-react';
import { reservationService, labService, timeSlotService } from '../services/db';
import { LabReservation, Laboratory, TimeSlot } from '../models/types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { DataTable } from '../components/DataTable';

export const ReservationsPage: React.FC = () => {
  const { profile, isAdmin, isStudent } = useAuth();
  const [reservations, setReservations] = useState<LabReservation[]>([]);
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    labId: '',
    course: '',
    date: '',
    slotId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const [resData, labsData, slotsData] = await Promise.all([
      reservationService.getAll(),
      labService.getAll(),
      timeSlotService.getAll()
    ]);
    
    if (isAdmin) {
        setReservations(resData);
    } else {
        setReservations(resData.filter(r => r.studentId === profile?.id));
    }
    
    setLabs(labsData);
    setTimeSlots(slotsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.id, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedLab = labs.find(l => l.id === formData.labId);
    const selectedSlot = timeSlots.find(s => s.id === formData.slotId);
    if (!selectedLab || !selectedSlot) return;

    // Construct start and end dates
    const start = new Date(`${formData.date}T${selectedSlot.startTime}`);
    const end = new Date(`${formData.date}T${selectedSlot.endTime}`);

    // Check for overlaps (simplified client-side check)
    const overlap = reservations.some(r => 
        r.labId === formData.labId && 
        r.status === 'approved' &&
        ((start >= r.startTime.toDate() && start < r.endTime.toDate()) ||
        (end > r.startTime.toDate() && end <= r.endTime.toDate()))
    );

    if (overlap) {
        alert('This lab is already reserved for the selected time slot.');
        return;
    }

    await reservationService.add({
      labId: formData.labId,
      labName: selectedLab.name,
      studentId: profile?.id || '',
      studentName: profile?.name || '',
      lecturerId: '', // Lecturer who will approve or is assigned
      course: formData.course,
      startTime: start,
      endTime: end,
      status: 'pending'
    });

    setIsModalOpen(false);
    setFormData({ labId: '', course: '', date: '', slotId: '' });
    fetchData();
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    await reservationService.updateStatus(id, status);
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">Approved</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">Rejected</span>;
      default: return <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">Pending</span>;
    }
  };

  const columns = [
    {
      header: 'Laboratory',
      key: 'labName',
      accessor: (res: LabReservation) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <FlaskConical size={18} />
          </div>
          <span className="font-medium text-gray-900 dark:text-white">{res.labName}</span>
        </div>
      )
    },
    {
      header: 'Reserved By',
      key: 'studentName',
      accessor: (res: LabReservation) => (
        <div className="flex items-center space-x-2">
          <User size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">{res.studentName}</span>
        </div>
      )
    },
    { header: 'Course', key: 'course', accessor: (res: LabReservation) => res.course },
    {
      header: 'Time Slot',
      key: 'startTime',
      accessor: (res: LabReservation) => (
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock size={14} />
          <span>{format(res.startTime.toDate(), 'MMM d, HH:mm')} - {format(res.endTime.toDate(), 'HH:mm')}</span>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      accessor: (res: LabReservation) => getStatusBadge(res.status)
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lab Reservations</h1>
          <p className="text-gray-500 dark:text-gray-400">Schedule laboratory usage for lectures and practicals.</p>
        </div>
        {isStudent && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            <span>Reserve Lab</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : (
        <DataTable 
          data={reservations}
          columns={columns}
          title="Lab_Reservations"
          actions={(res) => isAdmin && res.status === 'pending' ? (
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => handleStatusUpdate(res.id, 'approved')}
                className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                title="Approve"
              >
                <CheckCircle2 size={20} />
              </button>
              <button 
                onClick={() => handleStatusUpdate(res.id, 'rejected')}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Reject"
              >
                <XCircle size={20} />
              </button>
            </div>
          ) : null}
        />
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800 transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lab Reservation</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Slot</label>
                <select 
                  required
                  value={formData.slotId}
                  onChange={(e) => setFormData({...formData, slotId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                >
                  <option value="">Select Slot</option>
                  {timeSlots.map(slot => (
                    <option key={slot.id} value={slot.id}>{slot.startTime} - {slot.endTime}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Request Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
