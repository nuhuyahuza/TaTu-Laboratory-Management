import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FlaskConical, 
  HardDrive, 
  ClipboardList, 
  Calendar as CalendarIcon, 
  Users, 
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { labService, equipmentService, requestService, reservationService } from '../services/db';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) => (
  <div className="premium-card p-6 flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-all duration-500">
    <div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3>
    </div>
    <div className={`p-4 rounded-2xl ${color} shadow-2xl shadow-emerald-500/20 group-hover:rotate-12 transition-all duration-500`}>
      <Icon className="text-white" size={24} strokeWidth={2.5} />
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const { profile, isAdmin, isStudent } = useAuth();
  const [stats, setStats] = useState({
    labs: 0,
    equipment: 0,
    pendingRequests: 0,
    activeReservations: 0,
    borrowedItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [labs, equip, requests, reservations] = await Promise.all([
          labService.getAll(),
          equipmentService.getAll(),
          requestService.getAll(),
          reservationService.getAll()
        ]);

        setStats({
          labs: labs.length,
          equipment: equip.length,
          pendingRequests: requests.filter(r => r.status === 'pending').length,
          activeReservations: reservations.filter(r => r.status === 'approved').length,
          borrowedItems: requests.filter(r => r.status === 'approved' && r.pickedUp && !r.returned).length
        });

        const labCounts = labs.map(lab => ({
          name: lab.name,
          count: reservations.filter(r => r.labId === lab.id).length,
          color: lab.color
        }));
        setChartData(labCounts);

        const combined = [
          ...requests.map(r => ({ ...r, type: 'request', date: r.createdAt?.toDate() || new Date() })),
          ...reservations.map(r => ({ ...r, type: 'reservation', date: r.createdAt?.toDate() || new Date() }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
        
        setRecentActivity(combined);

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Clock className="animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
            Welcome back, <span className="text-gradient">{profile?.name?.split(' ')[0]}</span>!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            Here's what's happening in the labs today.
          </p>
        </div>
        <div className="flex -space-x-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-50 dark:border-slate-950 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
              U{i}
            </div>
          ))}
          <div className="w-10 h-10 rounded-full border-4 border-slate-50 dark:border-slate-950 bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
            +12
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Laboratories" 
          value={stats.labs} 
          icon={FlaskConical} 
          color="bg-emerald-600" 
        />
        <StatCard 
          title="Equipment" 
          value={stats.equipment} 
          icon={HardDrive} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="Pending" 
          value={stats.pendingRequests} 
          icon={ClipboardList} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Active" 
          value={stats.activeReservations} 
          icon={CalendarIcon} 
          color="bg-indigo-600" 
        />
        <StatCard 
          title="Borrowed" 
          value={stats.borrowedItems} 
          icon={HardDrive} 
          color="bg-rose-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 premium-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Lab Usage Overview</h3>
            <Link to="/reports" className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center hover:bg-emerald-500/20 transition-all">
              FULL REPORT <ArrowUpRight size={14} className="ml-1.5" />
            </Link>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} />
                <Tooltip 
                  cursor={{fill: 'rgba(16, 185, 129, 0.05)'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', backgroundColor: '#0f172a', color: '#fff'}}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="space-y-8">
          <div className="premium-card p-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Quick Actions</h3>
            <div className="space-y-4">
              {isStudent && (
                <>
                  <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-emerald-500/10 group">
                    <span className="font-bold">Reserve a Lab</span>
                    <CalendarIcon size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-blue-500/5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-all border border-blue-500/10 group">
                    <span className="font-bold">Request Equipment</span>
                    <HardDrive size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                </>
              )}
              {isAdmin && (
                <>
                  <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-emerald-500/10 group">
                    <span className="font-bold">Add New Lab</span>
                    <FlaskConical size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-all border border-indigo-500/10 group">
                    <span className="font-bold">Manage Users</span>
                    <Users size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="premium-card p-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Recent Activity</h3>
            <div className="space-y-6">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start space-x-4 group">
                  <div className={`p-2.5 rounded-xl ${activity.type === 'request' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    {activity.type === 'request' ? <HardDrive size={18} /> : <CalendarIcon size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                      {activity.type === 'request' ? activity.equipmentName : activity.labName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                      {activity.studentName} • <span className="uppercase tracking-wider text-[10px] font-black">{activity.status}</span>
                    </p>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                    {activity.date.toLocaleDateString()}
                  </p>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
;
