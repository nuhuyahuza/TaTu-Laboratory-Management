import React, { useState, useEffect } from 'react';
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
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="text-white" size={24} />
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

        // Prepare chart data: Reservations per lab
        const labCounts = labs.map(lab => ({
          name: lab.name,
          count: reservations.filter(r => r.labId === lab.id).length,
          color: lab.color
        }));
        setChartData(labCounts);

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {profile?.name}</h1>
        <p className="text-gray-500 dark:text-gray-400">Here's what's happening in the labs today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Laboratories" 
          value={stats.labs} 
          icon={FlaskConical} 
          color="bg-emerald-600" 
        />
        <StatCard 
          title="Total Equipment" 
          value={stats.equipment} 
          icon={HardDrive} 
          color="bg-yellow-500" 
        />
        <StatCard 
          title="Pending Requests" 
          value={stats.pendingRequests} 
          icon={ClipboardList} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Active Reservations" 
          value={stats.activeReservations} 
          icon={CalendarIcon} 
          color="bg-yellow-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lab Usage Overview</h3>
            <button className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center hover:underline">
              View Report <ArrowUpRight size={16} className="ml-1" />
            </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'rgba(16, 185, 129, 0.05)'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#fff'}}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Quick Actions */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
          <div className="space-y-4">
            {isStudent && (
              <>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                  <span className="font-medium">Reserve a Lab</span>
                  <CalendarIcon size={20} />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                  <span className="font-medium">Request Equipment</span>
                  <HardDrive size={20} />
                </button>
              </>
            )}
            {isAdmin && (
              <>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                  <span className="font-medium">Add New Lab</span>
                  <FlaskConical size={20} />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                  <span className="font-medium">Manage Users</span>
                  <Users size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
