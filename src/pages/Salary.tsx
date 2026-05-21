import React, { useState, useMemo } from 'react';
import { useFirestoreQuery } from '../hooks/useFirestore';
import { Employee, Attendance, Advance, Overtime, SalarySlip } from '../types';
import { createDocument } from '../lib/db';
import { format, getDaysInMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, FileText, Download, MessageCircle, Eye, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export default function Salary() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(currentDate);

  const { data: employees, loading: empLoading } = useFirestoreQuery<Employee>('employees');
  const { data: attendance, loading: attLoading } = useFirestoreQuery<Attendance>('attendance', [where('month', '==', month), where('year', '==', year)]);
  const { data: advances, loading: advLoading } = useFirestoreQuery<Advance>('advances', [where('month', '==', month), where('year', '==', year)]);
  const { data: overtimes, loading: otLoading } = useFirestoreQuery<Overtime>('overtime', [where('month', '==', month), where('year', '==', year)]);
  const { data: salarySlips, loading: slipLoading } = useFirestoreQuery<SalarySlip>('salary_slips', [where('month', '==', month), where('year', '==', year)]);

  const activeEmployees = employees.filter(e => e.isActive);

  // Salary Calculations
  const calculatedSalaries = useMemo(() => {
    return activeEmployees.map(emp => {
      const empAttendance = attendance.filter(a => a.employeeId === emp.id);
      const empAdvances = advances.filter(a => a.employeeId === emp.id);
      const empOvertimes = overtimes.filter(o => o.employeeId === emp.id);
      
      const presentDays = empAttendance.filter(a => a.status === 'Present').length;
      const absentDays = empAttendance.filter(a => a.status === 'Absent').length;
      const leaveDays = empAttendance.filter(a => a.status === 'Leave').length; 
      const halfDays = empAttendance.filter(a => a.status === 'Half Day').length;
      const holidayDays = empAttendance.filter(a => a.status === 'Holiday').length;
      
      const workingDays = presentDays + holidayDays + (halfDays * 0.5); // treat holidays as paid and half day as 0.5
      
      let baseGross = 0;
      if (emp.salaryType === 'Monthly') {
        const perDay = emp.salaryAmount / daysInMonth;
        baseGross = workingDays * perDay;
      } else {
        baseGross = workingDays * emp.salaryAmount;
      }
      
      const overtimeAmount = empOvertimes.reduce((sum, o) => sum + o.amount, 0);
      const advanceDeduction = empAdvances.reduce((sum, a) => sum + a.amount, 0);
      
      const netSalary = baseGross + overtimeAmount - advanceDeduction;

      return {
        emp,
        workingDays,
        absentDays,
        halfDays,
        leaveDays,
        overtimeAmount,
        advanceDeduction,
        netSalary: Math.max(0, Math.round(netSalary))
      };
    });
  }, [activeEmployees, attendance, advances, overtimes, daysInMonth]);

  const generateAndSaveSlip = async (data: typeof calculatedSalaries[0]) => {
    const id = `${data.emp.id}_${month}_${year}`;
    const obj: SalarySlip = {
        employeeId: data.emp.id!,
        month,
        year,
        workingDays: data.workingDays,
        absentDays: data.absentDays,
        leaveDays: data.leaveDays,
        halfDays: data.halfDays,
        overtimeAmount: data.overtimeAmount,
        advanceDeduction: data.advanceDeduction,
        netSalary: data.netSalary,
        generatedAt: new Date().toISOString()
    };
    await createDocument('salary_slips', id, obj);
    alert('Salary slip saved successfully.');
  };

  const handleWhatsApp = (data: typeof calculatedSalaries[0]) => {
     const text = `Salary Slip - ${format(currentDate, 'MMM yyyy')}%0A
*Employee*: ${data.emp.fullName}%0A
*ID*: ${data.emp.employeeId}%0A
*Working Days*: ${data.workingDays}%0A
*Absent*: ${data.absentDays}%0A
*Overtime added*: ₹${data.overtimeAmount}%0A
*Advance deducted*: ₹${data.advanceDeduction}%0A
*NET SALARY*: ₹${data.netSalary}%0A%0A
Have a great month!`;
     
     window.open(`https://wa.me/${data.emp.mobileNumber}?text=${text}`, '_blank');
  };

  const downloadPDF = (data: typeof calculatedSalaries[0]) => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("SALARY SLIP", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text(`Month: ${format(currentDate, 'MMMM yyyy')}`, 105, 30, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Employee Name: ${data.emp.fullName}`, 20, 50);
    doc.text(`Employee ID: ${data.emp.employeeId || 'N/A'}`, 20, 60);
    doc.text(`Department: ${data.emp.department || 'N/A'}`, 120, 50);
    doc.text(`Position: ${data.emp.position || 'N/A'}`, 120, 60);
    
    doc.line(20, 70, 190, 70);
    
    doc.setFont("helvetica", "bold");
    doc.text("Attendance Summary", 20, 85);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Paid Days: ${data.workingDays}`, 20, 95);
    doc.text(`Absent Days: ${data.absentDays}`, 20, 105);
    doc.text(`Half Days: ${data.halfDays}`, 20, 115);
    doc.text(`Leaves: ${data.leaveDays}`, 20, 125);
    
    doc.line(20, 135, 190, 135);
    
    doc.setFont("helvetica", "bold");
    doc.text("Earnings & Deductions", 20, 150);
    doc.setFont("helvetica", "normal");
    
    const baseDisplay = data.emp.salaryType === 'Monthly' ? `₹${data.emp.salaryAmount}/mo` : `₹${data.emp.salaryAmount}/day`;
    doc.text(`Base Wage Rating: ${baseDisplay}`, 20, 160);
    doc.text(`Overtime Added: ₹${data.overtimeAmount}`, 20, 170);
    doc.text(`Advance Deducted: -₹${data.advanceDeduction}`, 20, 180);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`NET SALARY: ₹${data.netSalary}`, 20, 205);
    
    doc.save(`${data.emp.fullName.replace(/\s+/g, '_')}_Salary_${format(currentDate, 'MMMyyyy')}.pdf`);
  };

  const loading = empLoading || attLoading || advLoading || otLoading || slipLoading;

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Payroll & Salary</h1>
          <p className="text-slate-400">Calculate month-end salary automatically.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm shadow-xl border border-white/10 p-2 rounded-2xl">
          <button 
            onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); }}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 shadow-inner">
            <span className="font-semibold text-white whitespace-nowrap">{format(currentDate, 'MMMM, yyyy')}</span>
          </div>
          <button
             onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); }}
             className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="bg-white/5 backdrop-blur-sm shadow-xl border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/20 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-sm font-medium text-slate-400">Employee</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-400">Paid Days</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-400">Missed</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-400">OT/Adv</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-400 font-bold">Net Salary</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
               <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 animate-pulse">Calculating salary data...</td></tr>
            ) : calculatedSalaries.length === 0 ? (
               <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No active employees found.</td></tr>
            ) : calculatedSalaries.map(row => {
               const savedSlip = salarySlips.find(s => s.employeeId === row.emp.id);
               return (
                <tr key={row.emp.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{row.emp.fullName}</p>
                    <p className="text-xs text-slate-500">{row.emp.employeeId}</p>
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-medium">
                    {row.workingDays}
                    <span className="text-xs text-slate-500 block">/ {daysInMonth}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {row.absentDays}A • {row.leaveDays}L • {row.halfDays}H
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <p className="text-blue-400">+₹{row.overtimeAmount}</p>
                    <p className="text-orange-400">-₹{row.advanceDeduction}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xl font-bold tracking-tight text-white">₹{row.netSalary}</p>
                    {savedSlip && <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-semibold">Saved</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                       {!savedSlip && (
                         <button onClick={() => generateAndSaveSlip(row)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors">
                            Save Slip
                         </button>
                       )}
                       <button onClick={() => handleWhatsApp(row)} className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors">
                          <MessageCircle className="w-4 h-4" />
                       </button>
                       <button onClick={() => downloadPDF(row)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="Download PDF">
                          <Download className="w-4 h-4" />
                       </button>
                       <button onClick={() => setSelectedDetails(row)} className="p-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
               )
            })}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDetails(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#020617] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setSelectedDetails(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">Payout Breakdown</h2>
                <p className="text-slate-400 text-sm">Detailed calculation for {selectedDetails.emp.fullName}</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Working Days (काम के दिन)</p>
                    <p className="text-2xl font-bold text-emerald-400">{selectedDetails.workingDays} <span className="text-sm text-slate-500">days</span></p>
                    <p className="text-xs text-slate-400 mt-2">Includes present, holidays & half-days</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Absent (छुट्टी)</p>
                    <p className="text-2xl font-bold text-red-400">{selectedDetails.absentDays} <span className="text-sm text-slate-500">days</span></p>
                    <p className="text-xs text-slate-400 mt-2">Days not worked</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                  <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Calculation (हिसाब)</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">Base Wage Setup (तय पगार)</span>
                      <span className="font-medium text-white">{selectedDetails.emp.salaryType === 'Monthly' ? `₹${selectedDetails.emp.salaryAmount} / month` : `₹${selectedDetails.emp.salaryAmount} / day`}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm pb-3 border-b border-white/5">
                      <span className="text-slate-300">Gross for worked days (काम का वेतन)</span>
                      <span className="font-medium text-emerald-400">+ ₹{Math.round(selectedDetails.netSalary - selectedDetails.overtimeAmount + selectedDetails.advanceDeduction)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">Overtime (ओवरटाइम)</span>
                      <span className="font-medium text-blue-400">+ ₹{selectedDetails.overtimeAmount}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm pb-3 border-b border-white/5">
                      <span className="text-slate-300">Advances Deducted (एडवांस कटती)</span>
                      <span className="font-medium text-orange-400">- ₹{selectedDetails.advanceDeduction}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold text-white">Net Payout (कुल भुगतान)</span>
                      <span className="text-2xl font-bold text-emerald-400">₹{selectedDetails.netSalary}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
