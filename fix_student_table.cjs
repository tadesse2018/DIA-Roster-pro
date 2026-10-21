const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Table Header
const oldHeaderTr = '<tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">';
const newHeaderTr = '<tr className="bg-black text-white uppercase text-[10px] tracking-wider font-extrabold">';
code = code.replace(oldHeaderTr, newHeaderTr);

// Header THs
const oldIdTh = '<th className="p-3 text-slate-600 dark:text-slate-300">መታወቂያ ID</th>';
const newIdTh = '<th className="p-3 text-white">መታወቂያ ID</th>';
code = code.replace(oldIdTh, newIdTh);

const oldNameTh = '<th className="p-3 text-slate-600 dark:text-slate-300">የተማሪ ስም</th>';
const newNameTh = '<th className="p-3 text-white">የተማሪ ስም</th>';
code = code.replace(oldNameTh, newNameTh);

const oldClassTh = '<th className="p-3 text-slate-600 dark:text-slate-300">ክፍል እና ሴክሽን</th>';
const newClassTh = '<th className="p-3 text-white">ክፍል እና ሴክሽን</th>';
code = code.replace(oldClassTh, newClassTh);

const oldGenderTh = '<th className="p-3 text-slate-600 dark:text-slate-300">ጾታ</th>';
const newGenderTh = '<th className="p-3 text-white">ጾታ</th>';
code = code.replace(oldGenderTh, newGenderTh);

const oldAgeTh = '<th className="p-3 text-black dark:text-black bg-white dark:bg-white font-black">ዕድሜ</th>';
const newAgeTh = '<th className="p-3 text-white">ዕድሜ</th>';
code = code.replace(oldAgeTh, newAgeTh);

const oldActionTh = '<th className="p-3 text-center text-slate-600 dark:text-slate-300">እርምጃዎች</th>';
const newActionTh = '<th className="p-3 text-center text-white">እርምጃዎች</th>';
code = code.replace(oldActionTh, newActionTh);

// 2. Age Cell
const oldAgeTd = '<td className="p-3 text-xs font-black bg-white !text-black dark:bg-white dark:!text-black">';
const newAgeTd = '<td className="p-3 text-xs font-black">';
code = code.replace(oldAgeTd, newAgeTd);

const oldAgeSpan = '<span className="px-2 py-0.5 bg-white text-black rounded border border-slate-300">';
const newAgeSpan = '<span className="px-2 py-0.5 text-white bg-slate-800 rounded border border-slate-700">';
code = code.replace(oldAgeSpan, newAgeSpan);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Updated student table UI");
