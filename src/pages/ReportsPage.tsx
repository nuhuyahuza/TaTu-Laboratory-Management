import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { labService, equipmentService, requestService, reservationService } from '../services/db';
import { Loader2, Download, FileText, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [labUsageData, setLabUsageData] = useState<any[]>([]);
  const [equipmentStatusData, setEquipmentStatusData] = useState<any[]>([]);
  const [requestStatusData, setRequestStatusData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [labs, equip, requests, reservations] = await Promise.all([
          labService.getAll(),
          equipmentService.getAll(),
          requestService.getAll(),
          reservationService.getAll()
        ]);

        // 1. Lab Usage (Reservations per Lab)
        const labUsage = labs.map(lab => ({
          name: lab.name,
          value: reservations.filter(r => r.labId === lab.id).length
        }));
        setLabUsageData(labUsage);

        // 2. Equipment Status (Available vs Total)
        const totalEquip = equip.reduce((acc, curr) => acc + curr.totalQuantity, 0);
        const availEquip = equip.reduce((acc, curr) => acc + curr.availableQuantity, 0);
        setEquipmentStatusData([
          { name: 'Available', value: availEquip },
          { name: 'Borrowed', value: totalEquip - availEquip }
        ]);

        // 3. Request Status Distribution
        const statuses = ['pending', 'approved', 'rejected', 'completed'];
        const requestStatus = statuses.map(status => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: requests.filter(r => r.status === status).length
        }));
        setRequestStatusData(requestStatus);

      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            System <span className="text-gradient">Reports</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Detailed analytics and usage statistics for the laboratory system.</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <Download size={20} strokeWidth={3} />
          <span>Export Full Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Lab Usage Chart */}
        <div className="premium-card p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp size={22} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Laboratory Usage</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labUsageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#fff', padding: '12px 16px'}}
                  cursor={{fill: 'rgba(16, 185, 129, 0.05)'}}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Status Chart */}
        <div className="premium-card p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <PieChartIcon size={22} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Equipment Availability</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={equipmentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {equipmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#fff', padding: '12px 16px'}}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 700}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Request Status Chart */}
        <div className="premium-card p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <FileText size={22} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Request Distribution</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={requestStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  stroke="none"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {requestStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#fff', padding: '12px 16px'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 700}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="glass dark:glass-dark rounded-[2.5rem] p-10 flex flex-col justify-center shadow-2xl shadow-black/5 relative overflow-hidden border border-white/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-3xl animate-pulse"></div>
          
          <h3 className="text-2xl font-black mb-8 relative z-10 tracking-tight text-slate-900 dark:text-white">System Summary</h3>
          <div className="space-y-8 relative z-10">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-6">
              <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">Total Reservations</span>
              <span className="text-5xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">{labUsageData.reduce((acc, curr) => acc + curr.value, 0)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-6">
              <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">Total Equipment</span>
              <span className="text-5xl font-black tracking-tighter text-blue-600 dark:text-blue-400">{equipmentStatusData.reduce((acc, curr) => acc + curr.value, 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">Requests Processed</span>
              <span className="text-5xl font-black tracking-tighter text-amber-500">{requestStatusData.reduce((acc, curr) => acc + curr.value, 0)}</span>
            </div>
          </div>
          <p className="mt-12 text-slate-400 text-[10px] font-black uppercase tracking-widest opacity-60 relative z-10">
            * Data is updated in real-time based on system activity.
          </p>
        </div>
      </div>
    </div>
  );
};
