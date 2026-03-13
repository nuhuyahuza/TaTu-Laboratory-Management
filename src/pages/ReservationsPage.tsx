import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  User, 
  FlaskConical,
  Loader2,
  Calendar as CalendarIcon,
  List as ListIcon,
  Info
} from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { reservationService, labService, timeSlotService } from '../services/db';
import { LabReservation, Laboratory, TimeSlot } from '../models/types';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays, startOfDay, parse } from 'date-fns';
import { DataTable } from '../components/DataTable';

export const ReservationsPage: React.FC = () => {
  const { profile, isAdmin, isStudent } = useAuth();
  const [reservations, setReservations] = useState<LabReservation[]>([]);
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>(isStudent ? 'calendar' : 'list');
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    labId: '',
    course: '',
    date: '',
    slotId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, labsData, slotsData] = await Promise.all([
        reservationService.getAll(),
        labService.getAll(),
        timeSlotService.getAll()
      ]);
      
      setReservations(resData);
      setLabs(labsData);
      setTimeSlots(slotsData);
      
      if (labsData.length > 0 && !selectedLabId) {
        setSelectedLabId(labsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.id, isAdmin]);

  // Generate calendar events including available slots
  const calendarEvents = useMemo(() => {
    if (!selectedLabId || timeSlots.length === 0) return [];

    const events: any[] = [];
    const selectedLab = labs.find(l => l.id === selectedLabId);
    
    // 1. Add existing reservations
    reservations
      .filter(r => r.labId === selectedLabId && (r.status === 'approved' || r.status === 'pending'))
      .forEach(res => {
        events.push({
          id: res.id,
          title: `${res.course} (${res.status})`,
          start: res.startTime.toDate(),
          end: res.endTime.toDate(),
          backgroundColor: res.status === 'approved' ? (selectedLab?.color || '#10b981') : '#f59e0b',
          className: res.status === 'approved' ? 'shadow-lg shadow-emerald-500/10' : 'shadow-lg shadow-amber-500/10',
          extendedProps: { type: 'booked', ...res }
        });
      });

    // 2. Generate available slots for the next 14 days
    const today = startOfDay(new Date());
    for (let i = 0; i < 14; i++) {
      const currentDate = addDays(today, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayName = format(currentDate, 'EEEE');

      timeSlots
        .filter(slot => !slot.day || slot.day === dayName)
        .forEach(slot => {
          const start = new Date(`${dateStr}T${slot.startTime}`);
          const end = new Date(`${dateStr}T${slot.endTime}`);

        // Check if this slot is already booked or pending
        const isBooked = reservations.some(r => 
          r.labId === selectedLabId && 
          (r.status === 'approved' || r.status === 'pending') &&
          ((start >= r.startTime.toDate() && start < r.endTime.toDate()) ||
          (end > r.startTime.toDate() && end <= r.endTime.toDate()))
        );

        if (!isBooked) {
          events.push({
            title: 'Available',
            start: start,
            end: end,
            className: 'available-slot',
            extendedProps: { 
              type: 'available',
              date: dateStr,
              slotId: slot.id,
              labId: selectedLabId
            }
          });
        }
      });
    }

    return events;
  }, [selectedLabId, reservations, timeSlots, labs]);

  const handleEventClick = (info: any) => {
    const { type, date, slotId, labId } = info.event.extendedProps;
    if (type === 'available' && isStudent) {
      setFormData({
        labId: labId,
        date: date,
        slotId: slotId,
        course: ''
      });
      setIsModalOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedLab = labs.find(l => l.id === formData.labId);
    const selectedSlot = timeSlots.find(s => s.id === formData.slotId);
    if (!selectedLab || !selectedSlot) return;

    const start = new Date(`${formData.date}T${selectedSlot.startTime}`);
    const end = new Date(`${formData.date}T${selectedSlot.endTime}`);

    await reservationService.add({
      labId: formData.labId,
      labName: selectedLab.name,
      studentId: profile?.id || '',
      studentName: profile?.name || '',
      lecturerId: '',
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
      case 'approved': return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Approved</span>;
      case 'rejected': return <span className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20">Rejected</span>;
      default: return <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">Pending</span>;
    }
  };

  const columns = [
    {
      header: 'Laboratory',
      key: 'labName',
      accessor: (res: LabReservation) => (
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/10">
            <FlaskConical size={18} />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">{res.labName}</span>
        </div>
      )
    },
    {
      header: 'Reserved By',
      key: 'studentName',
      accessor: (res: LabReservation) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
            {res.studentName.charAt(0)}
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{res.studentName}</span>
        </div>
      )
    },
    { header: 'Course', key: 'course', accessor: (res: LabReservation) => <span className="font-bold text-slate-600 dark:text-slate-400">{res.course}</span> },
    {
      header: 'Time Slot',
      key: 'startTime',
      accessor: (res: LabReservation) => (
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Clock size={14} className="text-emerald-500" />
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
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Lab Reservations</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Schedule laboratory usage for lectures and practicals.</p>
        </div>
        <div className="flex items-center space-x-2 glass p-1.5 rounded-2xl border border-white/10 shadow-xl">
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all duration-300 ${viewMode === 'calendar' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
          >
            <CalendarIcon size={18} />
            <span className="text-sm font-black uppercase tracking-widest">Calendar</span>
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
          >
            <ListIcon size={18} />
            <span className="text-sm font-black uppercase tracking-widest">List View</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
      ) : viewMode === 'list' ? (
        <div className="premium-card overflow-hidden">
          <DataTable 
            data={isAdmin ? reservations : reservations.filter(r => r.studentId === profile?.id)}
            columns={columns}
            title="Lab_Reservations"
            actions={(res) => isAdmin && res.status === 'pending' ? (
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => handleStatusUpdate(res.id, 'approved')}
                  className="p-2.5 text-emerald-600 hover:bg-emerald-500/10 rounded-xl transition-all border border-transparent hover:border-emerald-500/20"
                  title="Approve"
                >
                  <CheckCircle2 size={20} />
                </button>
                <button 
                  onClick={() => handleStatusUpdate(res.id, 'rejected')}
                  className="p-2.5 text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
                  title="Reject"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ) : null}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1 space-y-8">
            <div className="premium-card p-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Select Laboratory</h3>
              <div className="space-y-3">
                {labs.map(lab => (
                  <button
                    key={lab.id}
                    onClick={() => setSelectedLabId(lab.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${selectedLabId === lab.id ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 shadow-lg shadow-emerald-500/10' : 'border-transparent bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'}`}
                  >
                    <span className="font-bold">{lab.name}</span>
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: lab.color }}></div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-8 rounded-3xl border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
              <h4 className="text-emerald-800 dark:text-emerald-300 font-black uppercase tracking-widest text-xs mb-4 flex items-center">
                <Info size={18} className="mr-2" />
                How to Reserve
              </h4>
              <p className="text-emerald-700 dark:text-emerald-400 text-sm leading-relaxed font-medium">
                Click on any <span className="font-black text-emerald-600 dark:text-emerald-300">"Available"</span> slot in the calendar to request a reservation for the selected laboratory.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 premium-card p-8">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              height="auto"
              slotMinTime="07:00:00"
              slotMaxTime="21:00:00"
              allDaySlot={false}
              nowIndicator={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
              }}
            />
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="glass-card w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Lab Reservation</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Laboratory</label>
                <input 
                  type="text"
                  readOnly
                  value={labs.find(l => l.id === formData.labId)?.name || ''}
                  className="w-full px-5 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-none text-slate-500 dark:text-slate-400 rounded-2xl outline-none cursor-not-allowed font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Course Code</label>
                <input 
                  type="text" 
                  required
                  value={formData.course}
                  onChange={(e) => setFormData({...formData, course: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold"
                  placeholder="e.g. IT 302"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Date</label>
                  <input 
                    type="date" 
                    readOnly
                    value={formData.date}
                    className="w-full px-5 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-none text-slate-500 dark:text-slate-400 rounded-2xl outline-none cursor-not-allowed font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Time Slot</label>
                  <input 
                    type="text"
                    readOnly
                    value={timeSlots.find(s => s.id === formData.slotId) ? `${timeSlots.find(s => s.id === formData.slotId)?.startTime} - ${timeSlots.find(s => s.id === formData.slotId)?.endTime}` : ''}
                    className="w-full px-5 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-none text-slate-500 dark:text-slate-400 rounded-2xl outline-none cursor-not-allowed font-bold"
                  />
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
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
