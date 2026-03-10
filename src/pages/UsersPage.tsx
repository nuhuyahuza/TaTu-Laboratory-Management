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
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold">
            {u.name.charAt(0)}
          </div>
          <span className="font-medium text-gray-900 dark:text-white">{u.name}</span>
        </div>
      )
    },
    {
      header: 'Email',
      key: 'email',
      accessor: (u: UserProfile) => (
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Mail size={14} className="text-gray-400" />
          <span>{u.email}</span>
        </div>
      )
    },
    { header: 'Department', key: 'department', accessor: (u: UserProfile) => u.department },
    {
      header: 'Role',
      key: 'role',
      accessor: (u: UserProfile) => getRoleBadge(u.role)
    },
    {
      header: 'Joined',
      key: 'createdAt',
      accessor: (u: UserProfile) => u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400">View and manage system users and their permissions.</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center space-x-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            <Upload size={20} />
            <span>Bulk Upload</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : (
        <DataTable 
          data={users}
          columns={columns}
          title="User_Management"
        />
      )}

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800 transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New User</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input 
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  placeholder="name@ttu.edu.gh"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Password</label>
                <input 
                  type="password" required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                  <select 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
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
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-slate-800 transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Bulk User Upload</h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl flex items-start space-x-3">
                <FileText className="text-emerald-600 dark:text-emerald-400 mt-1" size={20} />
                <div className="text-sm text-emerald-800 dark:text-emerald-300">
                  <p className="font-bold">Instructions:</p>
                  <p>Enter users in CSV format (one per line):</p>
                  <code className="block mt-1 bg-white/50 dark:bg-slate-800/50 p-1 rounded">Name, Email, Password, Role, Department</code>
                  <p className="mt-1">Roles: student, lecturer, admin</p>
                </div>
              </div>
              <textarea 
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full h-64 px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm transition-colors"
                placeholder="John Doe, john@ttu.edu.gh, pass123, student, IT&#10;Jane Smith, jane@ttu.edu.gh, pass456, lecturer, Engineering"
              />
              <div className="pt-4">
                <button 
                  onClick={handleBulkUpload} disabled={loading || !bulkText.trim()}
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
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
