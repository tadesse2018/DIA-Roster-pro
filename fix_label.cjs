const fs = require('fs');
let content = fs.readFileSync('src/components/GradeTrackerSection.tsx', 'utf8');
content = content.replace('<የወላጅ ኢሜል (Parent Email - Optional):</label>', '<label className="block text-xs font-bold uppercase text-slate-600 mb-1">የወላጅ ኢሜል (Parent Email - Optional):</label>');
fs.writeFileSync('src/components/GradeTrackerSection.tsx', content, 'utf8');
console.log('Fixed label.');
