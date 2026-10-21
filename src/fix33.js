import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace `<>\n                {quickViewCategory === 'students' && (` with `{quickViewCategory === 'students' && (`
content = content.replace("             <div className=\"space-y-3.5 text-xs py-1\">\n               <>", "             <div className=\"space-y-3.5 text-xs py-1\">");

// Replace `               )}\n               </>` with `               )}`
content = content.replace("               )}\n               </>", "               )}");

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Successfully removed stray fragment in fix33.js');
