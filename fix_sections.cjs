const fs = require('fs');
let content = fs.readFileSync('src/components/TeacherSection.tsx', 'utf8');

content = content.replace(/\['A', 'B', 'C', 'D'\]/g, "['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']");

fs.writeFileSync('src/components/TeacherSection.tsx', content, 'utf8');
console.log('Fixed sections in TeacherSection.');
