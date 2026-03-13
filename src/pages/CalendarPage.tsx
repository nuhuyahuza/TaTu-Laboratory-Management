import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { reservationService, labService } from '../services/db';
import { LabReservation, Laboratory } from '../models/types';
import { Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const [resData, labsData] = await Promise.all([
        reservationService.getAll(),
        labService.getAll()
      ]);

      const calendarEvents = resData
        .filter(res => res.status === 'approved')
        .map(res => {
          const lab = labsData.find(l => l.id === res.labId);
          return {
            id: res.id,
            title: `${res.labName} - ${res.course}`,
            start: res.startTime.toDate(),
            end: res.endTime.toDate(),
            backgroundColor: lab?.color || '#3b82f6',
            borderColor: lab?.color || '#3b82f6',
            extendedProps: {
              student: res.studentName,
              course: res.course,
              lab: res.labName
            }
          };
        });

      setEvents(calendarEvents);
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Lab <span className="text-gradient">Schedule</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Visual overview of laboratory reservations and availability.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3 premium-card p-8">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              slotMinTime="07:00:00"
              slotMaxTime="21:00:00"
              allDaySlot={false}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
              }}
            />
          </div>

          <div className="space-y-8">
            <div className="premium-card p-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 tracking-tight flex items-center">
                <Info size={22} className="mr-2 text-emerald-600 dark:text-emerald-400" />
                Event Details
              </h3>
              {selectedEvent ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1">Laboratory</p>
                    <p className="text-slate-900 dark:text-white font-bold">{selectedEvent.extendedProps.lab}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1">Course</p>
                    <p className="text-slate-900 dark:text-white font-bold">{selectedEvent.extendedProps.course}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1">Reserved By</p>
                    <p className="text-slate-900 dark:text-white font-bold">{selectedEvent.extendedProps.student}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1">Time</p>
                    <p className="text-slate-900 dark:text-white font-bold">
                      {format(selectedEvent.start, 'HH:mm')} - {format(selectedEvent.end, 'HH:mm')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info size={24} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium italic">Click an event on the calendar to see details.</p>
                </div>
              )}
            </div>

            <div className="glass dark:glass-dark p-8 rounded-[2rem] border border-white/20 shadow-xl shadow-black/5">
              <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-[10px] mb-6">Calendar Legend</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-8 font-medium leading-relaxed">Each laboratory is represented by a unique color assigned by the administrator.</p>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                  <span className="text-[10px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest">Approved Reservations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
