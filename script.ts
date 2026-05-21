import fs from 'fs';
import path from 'path';

function walk(dir: string) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let c = fs.readFileSync(p, 'utf8');
      
      let modified = false;
      
      // Update overall zinc usage to slate
      if (c.includes('zinc-')) {
        c = c.replace(/zinc-/g, 'slate-');
        modified = true;
      }
      
      // Fix background classes for main sections as per Sleek Interface
      const regex1 = /bg-slate-900 border border-white\/5 rounded-2xl overflow-hidden/g;
      if (regex1.test(c)) {
        c = c.replace(regex1, 'bg-white/5 backdrop-blur-sm shadow-xl border border-white/10 rounded-2xl overflow-hidden');
        modified = true;
      }
      
      // table transparent background
      const regex2 = /table className="w-full text-left bg-slate-900"/g;
      if (regex2.test(c)) {
        c = c.replace(regex2, 'table className="w-full text-left bg-transparent"');
        modified = true;
      }

      // thead transparent background
      const regex3 = /thead className="bg-slate-900\/50 border-b border-white\/5"/g;
      if (regex3.test(c)) {
        c = c.replace(regex3, 'thead className="bg-black/20 border-b border-white/10"');
        modified = true;
      }

      const regex4 = /bg-slate-900 border border-white\/5 rounded-2xl shadow-xl relative/g;
      if (regex4.test(c)) {
        c = c.replace(regex4, 'bg-slate-950 font-sans border border-white/10 rounded-2xl shadow-2xl relative');
        modified = true;
      }

      // Replace bg-zinc-900 border border-white/5 for Cards to sleek interface format
      const regex5 = /bg-slate-900 border border-white\/5 flex flex-col/g;
      if(regex5.test(c)) {
         c = c.replace(regex5, 'bg-white/5 backdrop-blur-sm shadow-xl border border-white/10 flex flex-col');
         modified = true;
      }
      
      const regex6 = /className="flex items-center gap-4 bg-slate-900 border border-white\/5 p-2 rounded-2xl"/g;
      if(regex6.test(c)) {
         c = c.replace(regex6, 'className="flex items-center gap-4 bg-white/5 backdrop-blur-sm shadow-xl border border-white/10 p-2 rounded-2xl"');
         modified = true;
      }

      // Check for specific bg-slate-900 border border-white/5 in all files
      if (c.includes('bg-slate-900 border border-white/5')) {
          c = c.replace(/bg-slate-900 border border-white\/5/g, 'bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl');
          modified = true;
      }

      if (modified) {
        fs.writeFileSync(p, c);
      }
    }
  });
}

walk('src/pages');
walk('src/components');
