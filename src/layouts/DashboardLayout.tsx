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

const SidebarItem: React.FC<{ to: string, icon: any, label: string, active: boolean }> = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-emerald-600 text-white shadow-md' 
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
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
      // Poll for notifications every minute
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
    { to: '/users', icon: Users, label: 'Users', roles: ['admin'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(profile?.role || ''));

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 dark:bg-slate-900 text-white transition-all duration-300 flex flex-col z-30 border-r border-gray-800 dark:border-slate-800`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-xl">T</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">TTU Lab</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-gray-800 rounded-md"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
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

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

    {/* Main Content */}
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-8 z-20 transition-colors">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-sm">
          <span>Home</span>
          <ChevronRight size={14} />
          <span className="text-emerald-600 dark:text-emerald-400 font-medium capitalize">
            {location.pathname.split('/')[1] || 'Dashboard'}
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <h4 className="font-bold text-gray-900 dark:text-white">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full font-bold">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id}
                          onClick={() => handleMarkAsRead(notification.id)}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-50 dark:border-slate-800 cursor-pointer ${!notification.read ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}
                        >
                          <p className={`text-sm font-semibold ${!notification.read ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2">
                            {notification.createdAt?.toDate ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No notifications yet
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center border-t border-gray-100 dark:border-slate-800">
                    <button className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline">View All Notifications</button>
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
