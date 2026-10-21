const fs = require('fs');
let code = fs.readFileSync('src/components/SimulatedEmailOutbox.tsx', 'utf8');

// Update container
code = code.replace(
  'bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 border border-indigo-100 rounded-2xl p-6 shadow-xs',
  'bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl'
);
code = code.replace('text-slate-900', 'text-[var(--text-primary)] font-black');
code = code.replace('text-slate-500 mt-1', 'text-[var(--text-secondary)] font-bold mt-1');
code = code.replace('border-indigo-100 pb-4', 'border-[var(--border-color)] pb-4');

// Empty state
code = code.replace(
  'border-2 border-dashed border-indigo-100 rounded-xl bg-white/60',
  'border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-app)]/50'
);
code = code.replace('text-slate-700', 'text-[var(--text-primary)] font-black');
code = code.replace('text-slate-400 max-w-md mt-1.5 leading-relaxed', 'text-[var(--text-secondary)] font-bold max-w-md mt-1.5 leading-relaxed');

// Warning badge
code = code.replace(
  'text-[10px] text-indigo-600 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100/40',
  'text-xs text-[var(--text-primary)] bg-[var(--bg-card)] px-3 py-1.5 rounded-lg border border-[var(--border-color)] font-bold shadow-sm'
);

// Email list items
code = code.replace(/bg-white/g, 'bg-[var(--bg-card)]');
code = code.replace(/text-slate-150/g, 'border-[var(--border-color)]');
code = code.replace(/border-slate-150/g, 'border-[var(--border-color)]');
code = code.replace(/text-slate-400/g, 'text-[var(--text-secondary)] font-bold');
code = code.replace(/text-slate-500/g, 'text-[var(--text-secondary)] font-bold');
code = code.replace(/text-slate-600/g, 'text-[var(--text-secondary)] font-bold');
code = code.replace(/text-slate-700/g, 'text-[var(--text-primary)] font-black');
code = code.replace(/text-slate-800/g, 'text-[var(--text-primary)] font-black');
code = code.replace(/text-slate-900/g, 'text-[var(--text-primary)] font-black');
code = code.replace(/bg-slate-50/g, 'bg-[var(--bg-input)]');
code = code.replace(/bg-slate-100/g, 'bg-[var(--bg-input)]');
code = code.replace(/border-slate-200/g, 'border-[var(--border-color)]');
code = code.replace(/border-slate-100/g, 'border-[var(--border-color)]');

fs.writeFileSync('src/components/SimulatedEmailOutbox.tsx', code, 'utf8');
console.log("Updated SimulatedEmailOutbox colors");
