import React, { useState, useEffect } from 'react';
import { useFirestoreQuery, useFirestoreDoc } from '../hooks/useFirestore';
import { CompanySettings } from '../types';
import { createDocument, updateDocument } from '../lib/db';
import { Building2, Save } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function Settings() {
  const { data: settings, loading } = useFirestoreDoc<CompanySettings>('company', 'settings');
  const [formData, setFormData] = useState<Partial<CompanySettings>>({
    companyName: '',
    companyAddress: '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName) return;

    if (settings) {
      await updateDocument('company', 'settings', {
         ...formData,
         updatedAt: new Date().toISOString()
      });
    } else {
      await createDocument('company', 'settings', {
         ...formData,
         updatedAt: new Date().toISOString()
      });
    }
    alert("Settings saved successfully.");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
        <p className="text-slate-400">Configure your company identity and rules.</p>
      </header>

      {loading ? (
        <div className="animate-pulse flex gap-4 text-slate-500">Loading settings...</div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl rounded-2xl p-6 space-y-6">
           <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="p-3 bg-slate-800 rounded-xl">
                 <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Company Profile</h2>
                <p className="text-sm text-slate-400">This information appears on salary slips.</p>
              </div>
           </div>

           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Company Name *</label>
               <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})}
                 className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 ring-blue-500 outline-none" />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Office Address</label>
               <textarea rows={3} value={formData.companyAddress} onChange={e => setFormData({...formData, companyAddress: e.target.value})}
                 className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 ring-blue-500 outline-none resize-none" />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Contact Phone</label>
               <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                 className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 ring-blue-500 outline-none" />
             </div>
           </div>

           <div className="pt-4 flex justify-end">
             <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">
                <Save className="w-5 h-5" />
                Save Changes
             </button>
           </div>
        </form>
      )}

      <div className="mt-8 pt-8 border-t border-white/5">
        <h3 className="text-red-400 font-medium mb-2">Danger Zone</h3>
        <p className="text-sm text-slate-500 mb-4">Permanently delete your account and all associated company data. This action cannot be undone.</p>
        <button onClick={() => alert("Please contact support to delete your account.")} className="px-4 py-2 border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl font-medium text-sm transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  );
}
