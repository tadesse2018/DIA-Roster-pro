const fs = require('fs');

let fileContent = fs.readFileSync('src/App.tsx', 'utf8');

const regexMap = [
  { search: /\{student\.age \? `\$\{student\.age\} ዓመት` : '-'\}/g, replace: '{student.age ? `${student.age} ${tx("ዓመት (years)")}` : \'-\'}' },
];

regexMap.forEach(item => {
  fileContent = fileContent.replace(item.search, item.replace);
});

fs.writeFileSync('src/App.tsx', fileContent);
