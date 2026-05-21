import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { login, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] px-4">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center relative z-10 shadow-2xl"
      >
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <LogIn className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Smart Duty Manager Pro</h1>
        <p className="text-slate-400 mb-8">Sign in to manage your company attendance and payroll.</p>
        
        <button
          onClick={login}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors focus:ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950"
        >
          Continue with Google
        </button>
        <div className="mt-8 text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <span>Powered by</span>
          <span className="text-blue-400 font-bold tracking-widest bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">GDX</span>
        </div>
      </motion.div>
    </div>
  );
}
