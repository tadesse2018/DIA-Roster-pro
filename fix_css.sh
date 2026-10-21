sed -i 's/--bg-app: #0f172a;/--bg-app: #0e0f11;/g' src/index.css
sed -i 's/--bg-card: #1e293b;/--bg-card: #18191b;/g' src/index.css
sed -i 's/--bg-input: #0b1120;/--bg-input: #141517;/g' src/index.css
sed -i 's/--text-primary: #f8fafc;/--text-primary: #ededed;/g' src/index.css
sed -i 's/--text-secondary: #e2e8f0;/--text-secondary: #a1a1aa;/g' src/index.css
sed -i 's/--text-muted: #94a3b8;/--text-muted: #71717a;/g' src/index.css
sed -i 's/--border-color: #334155;/--border-color: #27272a;/g' src/index.css
sed -i 's/--border-light: #475569;/--border-light: #1f1f22;/g' src/index.css
sed -i 's/--table-border: #475569;/--table-border: #27272a;/g' src/index.css

sed -i 's/color: #ffffff !important;/color: var(--text-primary) !important;/g' src/index.css

sed -i '/\.dark \.text-stone-600/,/color: var(--text-primary) !important;/c\
.dark .text-stone-600,\
.dark .text-stone-500,\
.dark .text-slate-600,\
.dark .text-slate-500,\
.dark .text-gray-600,\
.dark .text-gray-500 {\
  color: var(--text-muted) !important;\
}' src/index.css

sed -i '/\.dark \.text-stone-400/,/color: var(--text-primary) !important;/c\
.dark .text-stone-400,\
.dark .text-stone-300,\
.dark .text-slate-400,\
.dark .text-slate-300,\
.dark .text-gray-400,\
.dark .text-gray-300 {\
  color: var(--text-secondary) !important;\
}' src/index.css

