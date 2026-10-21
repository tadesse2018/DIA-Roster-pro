const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `                                  setEditingWorkspaceId(item.id);
                                  setEditWsNameAmh(item.nameAmh);
                                  setEditWsNameEng(item.nameEng);`;

const rep1 = `                                  setEditingWorkspaceId(item.id);
                                  setEditWsId(item.id);
                                  setEditWsNameAmh(item.nameAmh);
                                  setEditWsNameEng(item.nameEng);`;

code = code.replace(target1, rep1);

const target2 = `                              <div>
                                <label className="block text-[10px] font-bold text-stone-500 mb-1">ስም በአማርኛ (Name - Amharic):</label>`;

const rep2 = `                              <div>
                                <label className="block text-[10px] font-bold text-stone-500 mb-1">የትምህርት ቤት መለያ (School ID):</label>
                                <input
                                  type="text"
                                  value={editWsId}
                                  onChange={(e) => setEditWsId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                                  className="w-full p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none mb-3"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-500 mb-1">ስም በአማርኛ (Name - Amharic):</label>`;

code = code.replace(target2, rep2);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched modal UI');
