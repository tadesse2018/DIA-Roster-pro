const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetContainer = `<div className="flex justify-center py-4">
                  <div 
                    id="student-id-card"
                    className="w-[285px] h-[485px] rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden border border-blue-500/30 shadow-2xl text-center select-none bg-gradient-to-br from-blue-600 via-blue-800 to-indigo-950"
                  >`;

const replContainer = `<div className="flex flex-col md:flex-row justify-center items-center gap-4 py-4">
                  <div 
                    id="student-id-card"
                    className="w-[285px] h-[485px] shrink-0 rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden border border-blue-500/30 shadow-2xl text-center select-none bg-gradient-to-br from-blue-600 via-blue-800 to-indigo-950"
                  >`;

if (code.indexOf(targetContainer) !== -1) {
  code = code.replace(targetContainer, replContainer);
  console.log("Patched container");
} else {
  console.log("targetContainer not found");
}

fs.writeFileSync('src/App.tsx', code);
