const fs = require('fs');

let fileContent = fs.readFileSync('src/components/TeacherSection.tsx', 'utf8');

const regexMap = [
  { search: /\{teacher\.gender === 'Female' \? tx\("👩 ሴት"\) : tx\("👨 ወንድ"\)\} \{teacher\.age \? `• \$\{teacher\.age\} ዓመት` : ''\}/g, replace: '{teacher.gender === \'Female\' ? tx("👩 ሴት (Female)") : tx("👨 ወንድ (Male)")} {teacher.age ? `• ${teacher.age} ${tx("ዓመት (years)")}` : \'\'}' },
];

regexMap.forEach(item => {
  fileContent = fileContent.replace(item.search, item.replace);
});

fs.writeFileSync('src/components/TeacherSection.tsx', fileContent);
