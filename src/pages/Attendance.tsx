import React, { useState, useMemo } from 'react';
import { useFirestoreQuery } from '../hooks/useFirestore';
import { Employee, Attendance, Overtime } from '../types';
import { createDocument, updateDocument, deleteDocument } from '../lib/db';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { where } from 'firebase/firestore';

export default function AttendancePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const formattedDate = format(currentDate, 'yyyy-MM-dd');
  
  const { data: employees, loading: empLoading } = useFirestoreQuery<Employee>('employees');
  
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  
  const { data: monthAttendance, loading: attLoading } = useFirestoreQuery<Attendance>(
    'attendance', 
    [where('month', '==', currentDate.getMonth() + 1), where('year', '==', currentDate.getFullYear())]
  );
  
  const { data: overtimes } = useFirestoreQuery<Overtime>(
    'overtime',
    [where('month', '==', currentDate.getMonth() + 1), where('year', '==', currentDate.getFullYear())]
  );

  const activeEmployees = employees.filter(e => e.isActive);

  const todayAttendance = useMemo(() => {
    return monthAttendance.filter(a => a.date === formattedDate);
  }, [monthAttendance, formattedDate]);
  
  const todayOvertimes = useMemo(() => {
    return overtimes.filter(o => o.date === formattedDate);
  }, [overtimes, formattedDate]);

  const [isOTModalOpen, setIsOTModalOpen] = useState(false);
  const [otData, setOtData] = useState({ employeeId: '', hours: 0 });

  const handleMarkAttendance = async (employee: Employee, status: Attendance['status']) => {
    const existing = todayAttendance.find(a => a.employeeId === employee.id);
    
    if (existing) {
      if (existing.status === status) {
        // Toggle off if clicking the same status
        await deleteDocument('attendance', existing.id!);
      } else {
        // Update status
        await updateDocument('attendance', existing.id!, { status });
      }
    } else {
      // Create new
      const id = `${employee.id}_${formattedDate}`;
      await createDocument('attendance', id, {
        employeeId: employee.id!,
        date: formattedDate,
        status,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        timestamp: Math.floor(new Date(formattedDate).getTime() / 1000)
      });
    }
  };

  const markDayAsHoliday = async () => {
    const promises = activeEmployees.map(emp => {
       const existing = todayAttendance.find(a => a.employeeId === emp.id);
       if(existing) {
         return updateDocument('attendance', existing.id!, { status: 'Holiday' });
       } else {
         const id = `${emp.id}_${formattedDate}`;
         return createDocument('attendance', id, {
            employeeId: emp.id!,
            date: formattedDate,
            status: 'Holiday',
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear(),
            timestamp: Math.floor(new Date(formattedDate).getTime() / 1000)
         });
       }
    });
    await Promise.all(promises);
    alert('Day marked as holiday for all employees');
  };

  const markSundaysAsHoliday = async () => {
    if(!confirm('Mark all Sundays of this month as Holiday?')) return;
    const days = eachDayOfInterval({ start, end });
    const sundays = days.filter(d => getDay(d) === 0);
    
    let total = 0;
    for(const d of sundays) {
      const dateStr = format(d, 'yyyy-MM-dd');
      for(const emp of activeEmployees) {
         const id = `${emp.id}_${dateStr}`;
         const existing = monthAttendance.find(a => a.id === id);
         if(!existing) {
            await createDocument('attendance', id, {
              employeeId: emp.id!,
              date: dateStr,
              status: 'Holiday',
              month: currentDate.getMonth() + 1,
              year: currentDate.getFullYear(),
              timestamp: Math.floor(d.getTime() / 1000)
            });
            total++;
         }
      }
    }
    alert(`Marked ${sundays.length} Sundays as holiday (${total} records).`);
  };

  const handleAddOT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otData.employeeId || otData.hours <= 0) return;
    const emp = activeEmployees.find(e => e.id === otData.employeeId);
    if (!emp) return;
    
    const rate = emp.overtimeRate || (emp.salaryAmount / 30 / 8); // fallback
    const amount = otData.hours * rate;
    
    const id = Date.now().toString();
    await createDocument('overtime', id, {
       employeeId: emp.id!,
       date: formattedDate,
       hours: otData.hours,
       amount,
       month: currentDate.getMonth() + 1,
       year: currentDate.getFullYear(),
       timestamp: Math.floor(currentDate.getTime() / 1000)
    });
    
    setIsOTModalOpen(false);
    setOtData({ employeeId: '', hours: 0 });
  };

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Attendance</h1>
          <p className="text-slate-400">Mark daily attendance and manage holidays.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm shadow-xl border border-white/10 p-2 rounded-2xl">
          <button 
            onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); }}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 shadow-inner">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white whitespace-nowrap">{format(currentDate, 'dd MMM, yyyy')}</span>
          </div>
          <button
             onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d); }}
             className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={markDayAsHoliday} className="px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl font-medium text-sm hover:bg-purple-500/20 transition-colors">
          Mark Today as Holiday
        </button>
        <button onClick={markSundaysAsHoliday} className="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-medium text-sm hover:bg-slate-700 transition-colors">
          Auto-mark Sundays (This Month)
        </button>
        <button onClick={() => setIsOTModalOpen(true)} className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-medium text-sm hover:bg-blue-500/20 transition-colors flex items-center gap-2">
          <Clock className="w-4 h-4" /> Add Overtime
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-sm shadow-xl border border-white/10 rounded-2xl overflow-hidden">
         <table className="w-full text-left">
           <thead className="bg-black/20 border-b border-white/10">
             <tr>
               <th className="px-6 py-4 text-sm font-medium text-slate-400">Employee</th>
               <th className="px-6 py-4 text-sm font-medium text-slate-400">Overtime</th>
               <th className="px-6 py-4 text-sm font-medium text-slate-400 text-right">Attendance Status</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-white/5">
             {empLoading || attLoading ? (
               <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500 animate-pulse">Loading data...</td></tr>
             ) : activeEmployees.length === 0 ? (
               <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No active employees found.</td></tr>
             ) : (
               activeEmployees.map(emp => {
                 const record = todayAttendance.find(a => a.employeeId === emp.id);
                 const status = record?.status;
                 const ot = todayOvertimes.find(o => o.employeeId === emp.id);

                 return (
                   <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors">
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold border border-white/10">
                           {emp.photoUrl ? <img src={emp.photoUrl} alt="" className="w-full h-full object-cover"/> : emp.fullName.charAt(0)}
                         </div>
                         <div>
                           <p className="text-white font-medium">{emp.fullName}</p>
                           <p className="text-xs text-slate-500">{emp.employeeId} • {emp.position || 'Employee'}</p>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       {ot ? (
                         <span className="text-xs px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400">
                           {ot.hours} hrs (₹{ot.amount.toFixed(0)})
                         </span>
                       ) : (
                         <span className="text-xs text-slate-600">-</span>
                       )}
                     </td>
                     <td className="px-6 py-4 text-right">
                       <div className="flex flex-wrap justify-end gap-2">
                         {['Present', 'Absent', 'Half Day', 'Leave', 'Holiday'].map((s) => (
                           <button
                             key={s}
                             onClick={() => handleMarkAttendance(emp, s as any)}
                             className={cn(
                               "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                               status === s 
                                 ? s === 'Present' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" 
                                 : s === 'Absent' ? "bg-red-500/20 text-red-400 border-red-500/50"
                                 : s === 'Leave' ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                                 : s === 'Half Day' ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                 : "bg-purple-500/20 text-purple-400 border-purple-500/50"
                               : "bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700/50 hover:text-white"
                             )}
                           >
                             {s}
                           </button>
                         ))}
                       </div>
                     </td>
                   </tr>
                 );
               })
             )}
           </tbody>
         </table>
      </div>

      <AnimatePresence>
        {isOTModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOTModalOpen(false)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-xl relative z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">Add Overtime</h2>
                </div>
                <button onClick={() => setIsOTModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleAddOT} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Employee</label>
                  <select required value={otData.employeeId} onChange={(e) => setOtData({...otData, employeeId: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 ring-blue-500 outline-none">
                    <option value="" disabled>Select Employee</option>
                    {activeEmployees.map(e => (
                      <option key={e.id} value={e.id}>{e.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Hours</label>
                  <input required type="number" step="0.5" min="0.5" value={otData.hours || ''} onChange={(e) => setOtData({...otData, hours: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 ring-blue-500 outline-none" placeholder="e.g. 2" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsOTModalOpen(false)} className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">Save Overtime</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
