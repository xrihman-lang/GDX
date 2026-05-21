import React, { useState } from 'react';
import { useFirestoreQuery } from '../hooks/useFirestore';
import { Employee } from '../types';
import { createDocument, updateDocument, deleteDocument } from '../lib/db';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Employees() {
  const { data: employees, loading } = useFirestoreQuery<Employee>('employees');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Employee>>({
    fullName: '',
    mobileNumber: '',
    salaryType: 'Monthly',
    salaryAmount: 0,
    isActive: true,
  });

  const filtered = employees.filter(e => 
    e.fullName.toLowerCase().includes(search.toLowerCase()) || 
    e.mobileNumber.includes(search)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobileNumber) return;

    if (editingId) {
      await updateDocument('employees', editingId, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
    } else {
      const id = Date.now().toString();
      await createDocument('employees', id, {
        ...formData,
        employeeId: `EMP-${id.slice(-4)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setIsModalOpen(false);
    setFormData({ fullName: '', mobileNumber: '', salaryType: 'Monthly', salaryAmount: 0, isActive: true });
    setEditingId(null);
  };

  const openEdit = (emp: Employee) => {
    setFormData(emp);
    setEditingId(emp.id!);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      await deleteDocument('employees', id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Employees</h1>
          <p className="text-slate-400">Manage your workforce.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ fullName: '', mobileNumber: '', salaryType: 'Monthly', salaryAmount: 0, isActive: true });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input 
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ring-blue-500"
        />
      </div>

      <div className="bg-white/5 backdrop-blur-sm shadow-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left bg-transparent">
            <thead className="bg-black/20 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Name</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">ID / Dept</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Contact</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Salary Setup</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No employees found.</td></tr>
              ) : (
                filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold overflow-hidden border border-white/10">
                          {emp.photoUrl ? <img src={emp.photoUrl} alt="Photo" className="w-full h-full object-cover"/> : emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{emp.fullName}</p>
                          <p className="text-xs text-slate-500">{emp.position || 'Employee'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{emp.employeeId}</p>
                      <p className="text-xs text-slate-500">{emp.department || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{emp.mobileNumber}</td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm font-medium">₹{emp.salaryAmount}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{emp.salaryType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-full border",
                        emp.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(emp)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(emp.id!)} className="p-2 bg-slate-800 hover:bg-red-900/40 text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-xl relative z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Employee' : 'Add Employee'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                  <input required type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Mobile Number</label>
                  <input required type="tel" value={formData.mobileNumber} onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Salary Type</label>
                    <select value={formData.salaryType} onChange={(e) => setFormData({...formData, salaryType: e.target.value as 'Monthly' | 'Daily'})}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 ring-blue-500 outline-none">
                      <option value="Monthly">Monthly</option>
                      <option value="Daily">Daily</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Salary Amount (₹)</label>
                    <input required type="number" min="0" value={formData.salaryAmount} onChange={(e) => setFormData({...formData, salaryAmount: Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Department</label>
                    <input type="text" value={formData.department || ''} onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Position</label>
                    <input type="text" value={formData.position || ''} onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 ring-blue-500" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-slate-950 border-white/10" />
                  <label htmlFor="isActive" className="text-sm font-medium text-white">Active Employee</label>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">Save Employee</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
