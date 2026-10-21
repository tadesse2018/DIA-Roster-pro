const fs = require('fs');

let fileContent = fs.readFileSync('src/App.tsx', 'utf8');

const regexMap = [
  { search: /\{tx\("የተማሪዎች ምዝገባ"\)\}/g, replace: '{tx("የተማሪዎች ምዝገባ (Students Registration)")}' },
  { search: /"\\n                    ይህ ፕላትፎርም የአንደኛ እና ሁለተኛ ደረጃ ትምህርት ቤቶችን አስተዳደር፣ የተማሪዎች ምዝገባ፣ የውጤት አሰጣጥ፣ የተሰብሳቢዎች ክትትል እና የሪፖርት ካርድ ማተሚያ ስራዎችን በዲጂታል መንገድ ሙሉ በሙሉ በራስ-ሰር የሚያስተዳድር ዘመናዊ መፍትሄ ነው።\\n                  "/g, replace: 'tx("\\n                    ይህ ፕላትፎርም የአንደኛ እና ሁለተኛ ደረጃ ትምህርት ቤቶችን አስተዳደር፣ የተማሪዎች ምዝገባ፣ የውጤት አሰጣጥ፣ የተሰብሳቢዎች ክትትል እና የሪፖርት ካርድ ማተሚያ ስራዎችን በዲጂታል መንገድ ሙሉ በሙሉ በራስ-ሰር የሚያስተዳድር ዘመናዊ መፍትሄ ነው። (This platform is a modern, fully automated digital solution for managing primary and secondary schools, including student registration, grading, attendance tracking, and report card printing.)\\n                  ")' },
];

regexMap.forEach(item => {
  fileContent = fileContent.replace(item.search, item.replace);
});

fs.writeFileSync('src/App.tsx', fileContent);
