const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                                          <td className="p-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {student.age ? (
                                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200/40 dark:border-slate-700/50">
                                                {student.age} ዓመት
                                              </span>
                                            ) : '-'}
                                          </td>`;

const replacement = `                                          <td className="p-3 text-xs font-black bg-white !text-black dark:bg-white dark:!text-black">
                                            {student.age ? (
                                              <span className="px-2 py-0.5 bg-white text-black rounded border border-slate-300">
                                                {student.age} ዓመት
                                              </span>
                                            ) : '-'}
                                          </td>`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code, 'utf8');
    console.log("Successfully replaced");
} else {
    console.log("Not found exact match");
}
