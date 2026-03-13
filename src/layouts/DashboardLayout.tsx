import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FlaskConical, 
  HardDrive, 
  ClipboardList, 
  Calendar, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Bell,
  Briefcase,
  TrendingUp,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { notificationService } from '../services/db';
import { Notification } from '../models/types';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

const SidebarItem: React.FC<{ to: string, icon: any, label: string, active: boolean }> = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-500 group relative ${
      active 
        ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 scale-[1.02]' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="sidebar-active"
        className="absolute inset-0 bg-emerald-600 rounded-2xl -z-10"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
    <Icon size={20} className={`${active ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} strokeWidth={active ? 2.5 : 2} />
    <span className={`font-bold tracking-tight transition-all ${active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>{label}</span>
  </Link>
);

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      const fetchNotifications = async () => {
        const data = await notificationService.getByUser(profile.id);
        setNotifications(data);
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [profile?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const menuItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'lecturer', 'student'] },
    { to: '/labs', icon: FlaskConical, label: 'Laboratories', roles: ['admin'] },
    { to: '/departments', icon: Briefcase, label: 'Departments', roles: ['admin'] },
    { to: '/equipment', icon: HardDrive, label: 'Equipment', roles: ['admin'] },
    { to: '/requests', icon: ClipboardList, label: 'Equipment Requests', roles: ['admin', 'lecturer', 'student'] },
    { to: '/reservations', icon: Calendar, label: 'Lab Reservations', roles: ['admin', 'lecturer', 'student'] },
    { to: '/calendar', icon: Calendar, label: 'Calendar', roles: ['admin', 'lecturer', 'student'] },
    { to: '/reports', icon: TrendingUp, label: 'Reports', roles: ['admin', 'lecturer'] },
    { to: '/users', icon: Users, label: 'Users', roles: ['admin'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(profile?.role || ''));

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
      {/* Sidebar - Glassmorphism */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-20'
        } glass border-r transition-all duration-500 flex flex-col z-30 no-print m-4 rounded-3xl shadow-2xl shadow-black/5`}
      >
        <div className="p-8 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 rotate-3 group-hover:rotate-12 transition-transform duration-500">
                <span className="font-black text-2xl text-white">T</span>
              </div>
              <span className="font-black text-2xl tracking-tighter text-gradient">TaTU Lab</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-emerald-600"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4 scrollbar-hide">
          {filteredItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={isSidebarOpen ? item.label : ''}
              active={location.pathname === item.to}
            />
          ))}
        </nav>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-bold">Logout</span>}
          </button>
        </div>
      </aside>

    {/* Main Content */}
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header - Glassmorphism */}
      <header className={`h-20 flex items-center justify-between px-10 z-20 transition-all duration-500 no-print m-4 rounded-3xl glass shadow-xl shadow-black/5`}>
        <div className="flex items-center space-x-3 text-slate-400 text-sm">
          <span className="font-medium">Home</span>
          <ChevronRight size={14} />
          <span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-tight capitalize">
            {location.pathname.split('/')[1] || 'Dashboard'}
          </span>
        </div>

        <div className="flex items-center space-x-8">
          <button 
            onClick={toggleTheme}
            className="p-2.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all hover:scale-110"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all hover:scale-110"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-bounce"></span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                ></div>
                <div className="absolute right-0 mt-4 w-96 glass dark:glass-dark rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="p-6 border-b border-white/10 dark:border-white/5 flex justify-between items-center bg-white/5">
                    <h4 className="font-black text-slate-900 dark:text-white tracking-tight">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="max-h-[32rem] overflow-y-auto scrollbar-hide">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id}
                          onClick={() => handleMarkAsRead(notification.id)}
                          className={`p-6 hover:bg-white/10 dark:hover:bg-white/5 transition-all border-b border-white/5 cursor-pointer group ${!notification.read ? 'bg-emerald-500/5' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-sm font-bold tracking-tight ${!notification.read ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                              {notification.title}
                            </p>
                            {!notification.read && <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></span>}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{notification.message}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 font-bold uppercase tracking-widest">
                            {notification.createdAt?.toDate ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                          <Bell size={24} />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight">No notifications yet</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 text-center border-t border-white/5 bg-white/5">
                    <button className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline">View All Notifications</button>
                  </div>
                </div>
              </>
            )}
          </div>
          <Link to="/profile" className="flex items-center space-x-3 group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{profile?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{profile?.role}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold group-hover:ring-2 group-hover:ring-emerald-500 transition-all overflow-hidden">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                profile?.name?.charAt(0)
              )}
            </div>
          </Link>
        </div>
      </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
