const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                    <input
                      type="text"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="ቢያንስ 4 ፊደላት ወይም ቁጥሮች..."
                      className={\`w-full bg-white dark:bg-stone-950 border text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-stone-800 dark:text-stone-200 font-black tracking-widest \${
                        themeMode === 'dark' ? 'border-stone-800' : 'border-stone-250'
                      }\`}
                    />
                  </div>`;

const replacement = `                    <input
                      type="text"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="ቢያንስ 4 ፊደላት ወይም ቁጥሮች..."
                      className={\`w-full bg-white dark:bg-stone-950 border text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-stone-800 dark:text-stone-200 font-black tracking-widest \${
                        themeMode === 'dark' ? 'border-stone-800' : 'border-stone-250'
                      }\`}
                    />
                    {newPasswordInput && (() => {
                      let score = 0;
                      const pass = newPasswordInput;
                      if (pass.length >= 6) score += 1;
                      if (pass.length >= 10) score += 1;
                      if (/[A-Z]/.test(pass)) score += 1;
                      if (/[a-z]/.test(pass)) score += 1;
                      if (/[0-9]/.test(pass)) score += 1;
                      if (/[^A-Za-z0-9]/.test(pass)) score += 1;
                      
                      let label = 'በጣም ደካማ (Very Weak)';
                      let colorBg = 'bg-rose-500';
                      let colorText = 'text-rose-500';
                      let widthClass = 'w-[15%]';
                      
                      if (score <= 2) { label = 'ደካማ (Weak)'; colorBg = 'bg-rose-500'; colorText = 'text-rose-500'; widthClass = 'w-[25%]'; }
                      else if (score === 3) { label = 'መካከለኛ (Fair)'; colorBg = 'bg-amber-500'; colorText = 'text-amber-500'; widthClass = 'w-[50%]'; }
                      else if (score === 4) { label = 'ጥሩ (Good)'; colorBg = 'bg-emerald-400'; colorText = 'text-emerald-500'; widthClass = 'w-[75%]'; }
                      else if (score >= 5) { label = 'በጣም ጠንካራ (Strong)'; colorBg = 'bg-emerald-600'; colorText = 'text-emerald-600'; widthClass = 'w-full'; }

                      return (
                        <div className="mt-2.5 animate-fadeIn">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">ጥንካሬ (Strength):</span>
                            <span className={\`text-[9px] font-black \${colorText}\`}>{label}</span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                            <div className={\`h-full \${widthClass} \${colorBg} transition-all duration-300 rounded-full\`} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>`;

if (content.includes(target)) {
  fs.writeFileSync('src/App.tsx', content.replace(target, replacement));
  console.log('Success');
} else {
  console.log('Target not found');
}
