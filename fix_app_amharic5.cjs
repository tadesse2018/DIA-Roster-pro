const fs = require('fs');

let fileContent = fs.readFileSync('src/App.tsx', 'utf8');

const regexMap = [
  { search: /\{tx\(" ዓመት\\n                                              "\)\}/g, replace: '{tx(" ዓመት (years)\\n                                              ")}' },
];

regexMap.forEach(item => {
  fileContent = fileContent.replace(item.search, item.replace);
});

fs.writeFileSync('src/App.tsx', fileContent);
