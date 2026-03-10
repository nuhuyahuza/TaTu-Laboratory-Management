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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lab Schedule</h1>
          <p className="text-gray-500 dark:text-gray-400">Visual overview of laboratory reservations and availability.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
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

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Info size={20} className="mr-2 text-emerald-600 dark:text-emerald-400" />
                Event Details
              </h3>
              {selectedEvent ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Laboratory</p>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedEvent.extendedProps.lab}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Course</p>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedEvent.extendedProps.course}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Reserved By</p>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedEvent.extendedProps.student}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Time</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {format(selectedEvent.start, 'HH:mm')} - {format(selectedEvent.end, 'HH:mm')}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">Click an event on the calendar to see details.</p>
              )}
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <h4 className="text-emerald-800 dark:text-emerald-300 font-bold mb-2">Calendar Legend</h4>
              <p className="text-emerald-700 dark:text-emerald-400 text-xs mb-4">Each laboratory is represented by a unique color assigned by the administrator.</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Approved Reservations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
