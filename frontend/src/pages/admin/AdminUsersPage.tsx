import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, AlertTriangle, CheckCircle2, XCircle, UserX, Shield, LogOut } from 'lucide-react';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
import { Skeleton } from '../../components/ui/Skeleton';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.listAdminUsers(roleFilter, search);
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // debounce search
    const to = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(to);
  }, [search, roleFilter]);

  const handleRoleChange = async (userId: number, currentRole: string) => {
    const newRole = prompt(`Change role for user ${userId}? (STUDENT, TEACHER, PARENT, ADMIN)`, currentRole);
    if (!newRole) return;
    if (['STUDENT', 'TEACHER', 'PARENT', 'ADMIN'].includes(newRole.toUpperCase())) {
      try {
        await api.updateUserRole(userId, { role: newRole.toUpperCase() });
        fetchUsers();
      } catch (e: any) {
        alert(e.message || 'Failed to update role');
      }
    } else {
      alert('Invalid role');
    }
  };

  const handleStatusChange = async (userId: number, currentActive: boolean) => {
    const action = currentActive ? 'Deactivate' : 'Activate';
    if (!window.confirm(`Are you sure you want to ${action} user ${userId}?`)) return;
    try {
      await api.updateUserRole(userId, { role: (users.find(u => u.id === userId)?.role || 'STUDENT'), is_active: !currentActive });
      fetchUsers();
    } catch (e: any) {
      alert(e.message || 'Failed to update status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">Manage all registered accounts across CampusBuddy.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Teachers</option>
            <option value="PARENT">Parents</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No users found.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full bg-slate-100" />
                        <div>
                          <p className="font-bold text-slate-900">{u.full_name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold">
                          <UserX className="w-3 h-3" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleRoleChange(u.id, u.role)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-xs transition"
                      >
                        Change Role
                      </button>
                      <button
                        onClick={() => handleStatusChange(u.id, u.is_active)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      >
                        {u.is_active ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
