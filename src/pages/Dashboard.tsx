import React, { useMemo } from 'react';
import { useFirestoreQuery } from '../hooks/useFirestore';
import { Employee, Attendance } from '../types';
import { Users, UserCheck, UserX, ReceiptIndianRupee } from 'lucide-react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: employees, loading: empLoading } = useFirestoreQuery<Employee>('employees');
  const { data: attendance, loading: attLoading } = useFirestoreQuery<Attendance>('attendance');

  const today = format(new Date(), 'yyyy-MM-dd');
  
  const stats = useMemo(() => {
    const activeEmployees = employees.filter(e => e.isActive);
    const todaysAttendance = attendance.filter(a => a.date === today);
    
    const present = todaysAttendance.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
    const absent = todaysAttendance.filter(a => a.status === 'Absent').length;
    
    // approx monthly expense (monthly salaries + daily * 26)
    const monthlyExpense = activeEmployees.reduce((acc, emp) => {
      if (emp.salaryType === 'Monthly') return acc + emp.salaryAmount;
      return acc + (emp.salaryAmount * 26); // rough estimate
    }, 0);

    return { total: activeEmployees.length, present, absent, monthlyExpense };
  }, [employees, attendance, today]);

  // Chart Data preparation
  const last7Days = useMemo(() => {
    return Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = format(d, 'yyyy-MM-dd');
      const atts = attendance.filter(a => a.date === ds);
      const pr = atts.filter(a => a.status === 'Present').length;
      return {
        date: format(d, 'dd MMM'),
        Present: pr,
      };
    }).reverse();
  }, [attendance]);

  if (empLoading || attLoading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  const statCards = [
    { label: 'Active Employees', value: stats.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Present Today', value: stats.present, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Absent Today', value: stats.absent, icon: UserX, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Estimated Monthly Payroll', value: `₹${stats.monthlyExpense.toLocaleString()}`, icon: ReceiptIndianRupee, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Overview</h1>
        <p className="text-slate-400">Welcome back! Here's what's happening today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl flex items-start justify-between"
          >
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">{card.label}</p>
              <h2 className="text-2xl font-bold text-white">{card.value}</h2>
            </div>
            <div className={`p-3 rounded-xl ${card.bg}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Attendance (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="Present" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl flex flex-col justify-center items-center text-center space-y-4"
        >
           <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-400" />
           </div>
           <h3 className="text-xl font-semibold text-white">Manage Workforce</h3>
           <p className="text-slate-400 max-w-sm">
             Head over to the Employees section to add or modify profiles, keep track of daily wages, and streamline payroll execution.
           </p>
        </motion.div>
      </div>
    </div>
  );
}
