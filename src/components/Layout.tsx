import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Wallet, Receipt, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/attendance', icon: CalendarDays, label: 'Attendance' },
  { to: '/advances', icon: Wallet, label: 'Advances' },
  { to: '/salary', icon: Receipt, label: 'Salary Slips' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">SDM <span className="text-blue-500">PRO</span></span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 p-3 transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-blue-600/10 border-l-4 border-blue-500 text-blue-400 rounded-r-lg" 
                    : "hover:bg-white/5 rounded-lg text-slate-400"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Owner Account</p>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white overflow-hidden shadow-lg">
                {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : user?.email?.[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-white">{user?.displayName || 'Admin'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden h-16 border-b border-white/10 flex items-center justify-between px-4 bg-slate-950/50 backdrop-blur-xl z-20">
          <h1 className="text-lg font-semibold tracking-tight text-white">SDM <span className="text-blue-500">PRO</span></h1>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>
        
        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden absolute top-16 left-0 right-0 bg-[#020617] border-b border-white/10 z-20 overflow-hidden"
            >
              <nav className="p-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                        isActive ? "bg-blue-600/10 text-blue-400" : "text-slate-400"
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                ))}
                <button
                  onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 bg-transparent flex flex-col">
          <div className="max-w-6xl mx-auto w-full flex-1">
            <Outlet />
          </div>

          <div className="max-w-6xl mx-auto w-full mt-auto pt-8">
            <footer className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-medium pb-2">
              <div className="flex space-x-4">
                <span>v1.0.0 Stable Build</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-emerald-500 hidden sm:inline">● Connected</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Powered by</span>
                <span className="bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 font-bold tracking-widest">GDX</span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
