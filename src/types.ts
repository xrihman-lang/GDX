export interface CompanySettings {
  companyName: string;
  companyAddress?: string;
  phoneNumber?: string;
  logoUrl?: string;
  updatedAt: string;
}

export interface Employee {
  id?: string;
  fullName: string;
  mobileNumber: string;
  employeeId?: string;
  salaryType: 'Monthly' | 'Daily';
  salaryAmount: number;
  overtimeRate?: number;
  joiningDate?: string;
  department?: string;
  position?: string;
  photoUrl?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id?: string;
  employeeId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Half Day' | 'Holiday' | 'Overtime';
  month: number;
  year: number;
  timestamp: number;
}

export interface Advance {
  id?: string;
  employeeId: string;
  date: string;
  amount: number;
  month: number;
  year: number;
  timestamp: number;
}

export interface Overtime {
  id?: string;
  employeeId: string;
  date: string;
  hours: number;
  amount: number;
  month: number;
  year: number;
  timestamp: number;
}

export interface SalarySlip {
  id?: string;
  employeeId: string;
  month: number;
  year: number;
  workingDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  overtimeAmount: number;
  advanceDeduction: number;
  netSalary: number;
  generatedAt: string;
}
