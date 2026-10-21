const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

lines[4271] = '                      {/* Principal Sub-tabs menu bar */}';
lines[4272] = '                      <div className="flex overflow-x-auto gap-2 bg-stone-100/80 dark:bg-stone-900/40 p-2 rounded-2xl border border-stone-200/50 dark:border-stone-800/40 print:hidden shadow-xs">';
lines[4273] = '                        <button';
lines[4274] = '                          onClick={() => { playInteractiveSound(\'click\'); setPrincipalSubTab(\'students\'); }}';

lines.splice(4275, 2); // remove garbage lines
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
