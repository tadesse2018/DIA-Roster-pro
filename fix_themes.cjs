const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "appBg: 'bg-gradient-to-br from-indigo-50/70 via-slate-50/90 to-indigo-100/30'",
  "appBg: 'bg-gradient-to-br from-indigo-100 via-white to-purple-100 bg-[length:200%_200%] animate-gradient-slow'"
);

content = content.replace(
  "appBg: 'bg-gradient-to-br from-emerald-50/70 via-slate-50/90 to-teal-50/40'",
  "appBg: 'bg-gradient-to-br from-emerald-100 via-white to-teal-100 bg-[length:200%_200%] animate-gradient-slow'"
);

content = content.replace(
  "appBg: 'bg-gradient-to-br from-violet-50/70 via-slate-50/90 to-violet-100/30'",
  "appBg: 'bg-gradient-to-br from-violet-100 via-white to-fuchsia-100 bg-[length:200%_200%] animate-gradient-slow'"
);

content = content.replace(
  "appBg: 'bg-gradient-to-br from-rose-50/70 via-slate-50/90 to-orange-50/30'",
  "appBg: 'bg-gradient-to-br from-rose-100 via-white to-orange-100 bg-[length:200%_200%] animate-gradient-slow'"
);

content = content.replace(
  "appBg: 'bg-gradient-to-br from-amber-50/60 via-slate-50/90 to-yellow-50/30'",
  "appBg: 'bg-gradient-to-br from-amber-100 via-white to-orange-100 bg-[length:200%_200%] animate-gradient-slow'"
);

content = content.replace(
  "appBg: 'bg-gradient-to-br from-slate-100/70 via-slate-50/90 to-zinc-100/40'",
  "appBg: 'bg-gradient-to-br from-slate-200 via-slate-50 to-zinc-200 bg-[length:200%_200%] animate-gradient-slow'"
);

fs.writeFileSync('src/App.tsx', content);
