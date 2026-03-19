import React, { useState, useEffect } from 'react';
import { User, Mail, Loader2, Plus, Upload, X, FileText } from 'lucide-react';
import { userService, departmentService } from '../services/db';
import { UserProfile, Department } from '../models/types';
import { DataTable } from '../components/DataTable';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'lecturer' | 'admin',
    department: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const [userData, deptData] = await Promise.all([
      userService.getAll(),
      departmentService.getAll()
    ]);
    setUsers(userData);
    setDepartments(deptData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'student', department: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    setLoading(true);
    try {
      const lines = bulkText.split('\n').filter(line => line.trim());
      const usersToCreate = lines.map(line => {
        const [name, email, password, role, department] = line.split(',').map(s => s.trim());
        return { name, email, password, role, department };
      });

      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: usersToCreate })
      });
      const data = await res.json();
      console.log('Bulk results:', data.results);
      setIsBulkModalOpen(false);
      setBulkText('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider">Admin</span>;
      case 'lecturer': return <span className="px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold uppercase tracking-wider">Lecturer</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider">Student</span>;
    }
  };

  const columns = [
    {
      header: 'User',
      key: 'name',
      accessor: (u: UserProfile) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
            {u.photoURL ? (
              <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              u.name.charAt(0)
            )}
          </div>
          <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
        </div>
      )
    },
    {
      header: 'Email',
      key: 'email',
      accessor: (u: UserProfile) => (
        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
          <Mail size={14} className="text-slate-400" />
          <span>{u.email}</span>
        </div>
      )
    },
    { 
      header: 'Department', 
      key: 'department', 
      accessor: (u: UserProfile) => <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{u.department || 'N/A'}</span> 
    },
    {
      header: 'Role',
      key: 'role',
      accessor: (u: UserProfile) => getRoleBadge(u.role)
    },
    {
      header: 'Joined',
      key: 'createdAt',
      accessor: (u: UserProfile) => (
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">View and manage system users and their permissions.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center space-x-2 glass text-slate-700 dark:text-slate-300 px-6 py-3 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all font-bold text-sm"
          >
            <Upload size={20} />
            <span>Bulk Upload</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 transition-all font-bold text-sm shadow-lg shadow-emerald-600/20"
          >
            <Plus size={20} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>
      ) : (
        <DataTable 
          data={users}
          columns={columns}
          title="User_Management"
        />
      )}

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="glass-card w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Add New User</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-medium"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-medium"
                  placeholder="name@ttu.edu.gh"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Initial Password</label>
                <input 
                  type="password" required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-medium"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Department</label>
                  <select 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold"
                  >
                    <option value="">Select Dept</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit" disabled={loading}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="glass-card w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Bulk User Upload</h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-emerald-500/10 p-5 rounded-2xl flex items-start space-x-4 border border-emerald-500/20">
                <FileText className="text-emerald-600 dark:text-emerald-400 mt-1" size={24} />
                <div className="text-sm text-emerald-900 dark:text-emerald-300">
                  <p className="font-black uppercase tracking-wider mb-1">Instructions:</p>
                  <p className="font-medium">Enter users in CSV format (one per line):</p>
                  <code className="block mt-2 bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl font-mono text-xs border border-emerald-500/10">Name, Email, Password, Role, Department</code>
                  <p className="mt-2 font-medium">Roles: <span className="font-bold">student, lecturer, admin</span></p>
                </div>
              </div>
              <textarea 
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full h-64 px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm transition-all dark:text-white"
                placeholder="John Doe, john@ttu.edu.gh, pass123, student, IT&#10;Jane Smith, jane@ttu.edu.gh, pass456, lecturer, Engineering"
              />
              <div className="pt-4">
                <button 
                  onClick={handleBulkUpload} disabled={loading || !bulkText.trim()}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Process Bulk Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
