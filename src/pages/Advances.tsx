import React, { useState } from 'react';
import { useFirestoreQuery } from '../hooks/useFirestore';
import { Employee, Advance } from '../types';
import { createDocument, deleteDocument } from '../lib/db';
import { format } from 'date-fns';
import { Plus, Trash2, Wallet, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { where } from 'firebase/firestore';

export default function Advances() {
  const { data: employees, loading: empLoading } = useFirestoreQuery<Employee>('employees');
  const [currentDate] = useState(new Date());
  
  const { data: advances, loading: advLoading } = useFirestoreQuery<Advance>('advances', [
      where('month', '==', currentDate.getMonth() + 1),
      where('year', '==', currentDate.getFullYear())
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || formData.amount <= 0) return;

    const id = Date.now().toString();
    const dateObj = new Date(formData.date);
    
    await createDocument('advances', id, {
      ...formData,
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      timestamp: Math.floor(dateObj.getTime() / 1000)
    });

    setIsModalOpen(false);
    setFormData({ employeeId: '', amount: 0, date: format(new Date(), 'yyyy-MM-dd') });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Advances</h1>
          <p className="text-slate-400">Manage employee salary advances for {format(currentDate, 'MMMM yyyy')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Give Advance
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-sm shadow-xl border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/20 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-sm font-medium text-slate-400">Date</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-400">Employee</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-400 text-right">Amount (₹)</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {empLoading || advLoading ? (
               <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : advances.length === 0 ? (
               <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No advances given this month.</td></tr>
            ) : advances.map(adv => {
              const emp = employees.find(e => e.id === adv.employeeId);
              return (
                <tr key={adv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-300">{format(new Date(adv.date), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 text-white font-medium">{emp?.fullName || 'Unknown'}</td>
                  <td className="px-6 py-4 text-right text-orange-400 font-semibold">{adv.amount}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                       onClick={() => confirm('Delete advance?') && deleteDocument('advances', adv.id!)}
                       className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg inline-flex"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-xl relative z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">Give Advance</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Employee</label>
                  <select required value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 ring-blue-500 outline-none">
                    <option value="" disabled>Select Employee</option>
                    {employees.filter(e => e.isActive).map(e => (
                      <option key={e.id} value={e.id}>{e.fullName} ({e.employeeId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                  <input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Amount (₹)</label>
                  <input required type="number" min="1" value={formData.amount} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 ring-blue-500 outline-none" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">Add Advance</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
