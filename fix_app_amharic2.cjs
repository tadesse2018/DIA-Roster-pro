const fs = require('fs');

let fileContent = fs.readFileSync('src/components/TeacherSection.tsx', 'utf8');

const regexMap = [
  { search: /\{teacher\.age \? `\$\{teacher\.age\} ዓመት` : '-'\}/g, replace: '{teacher.age ? `${teacher.age} ${tx("ዓመት (years)")}` : \'-\'}' },
  { search: /tx\("\\n                  የክፍልና ሴክሽን ምደባ \(Class & Section Allocations\):\\n                "\)/g, replace: 'tx("\\n                  የክፍልና ሴክሽን ምደባ (Class & Section Allocations):\\n                ")' },
  { search: /tx\("የክፍል አላፊ ከአንድ ሴክሽን በላይ መመደብ አይችልም! \(Homeroom teacher cannot be assigned to > 1 section!\)"\)/g, replace: 'tx("የክፍል አላፊ ከአንድ ሴክሽን በላይ መመደብ አይችልም! (Homeroom teacher cannot be assigned to > 1 section!)")' },
  { search: /tx\("\\n                    ለዚህ ክፍል የሚያስተምሩት የትምህርት ዓይነት \(Subjects taught in this class\):\\n                  "\)/g, replace: 'tx("\\n                    ለዚህ ክፍል የሚያስተምሩት የትምህርት ዓይነት (Subjects taught in this class):\\n                  ")' },
  { search: /tx\("⚠️ እባክዎን አስቀድመው መምህሩ የሚያስተምረውን የትምህርት አይነት ከላይ ይምረጡ \(Please select teacher's subjects above first\)"\)/g, replace: 'tx("⚠️ እባክዎን አስቀድመው መምህሩ የሚያስተምረውን የትምህርት አይነት ከላይ ይምረጡ (Please select teacher\'s subjects above first)")' },
  { search: /tx\("የክፍል አላፊ ከአንድ ሴክሽን በላይ መመደብ አይቻልም \(A homeroom teacher cannot be assigned to more than one section\)"\)/g, replace: 'tx("የክፍል አላፊ ከአንድ ሴክሽን በላይ መመደብ አይቻልም (A homeroom teacher cannot be assigned to more than one section)")' },
  { search: /tx\("እባክዎን ለዚህ ክፍል ቢያንስ አንድ የትምህርት አይነት ይምረጡ \(Please select at least one subject for this class\)"\)/g, replace: 'tx("እባክዎን ለዚህ ክፍል ቢያንስ አንድ የትምህርት አይነት ይምረጡ (Please select at least one subject for this class)")' },
  { search: /tx\("⚠️ የክፍል አላፊ ከአንድ ሴክሽን በላይ መመደብ አይችልም! እባክዎን የክፍል ምደባዎችን ወደ አንድ ያሳንሱ። \(A homeroom teacher cannot be assigned to more than one section!\)"\)/g, replace: 'tx("⚠️ የክፍል አላፊ ከአንድ ሴክሽን በላይ መመደብ አይችልም! እባክዎን የክፍል ምደባዎችን ወደ አንድ ያሳንሱ። (A homeroom teacher cannot be assigned to more than one section!)")' },
  { search: /tx\("\\n                ይህንን መምህር ሲያጠፉ ተያያዥነት ያላቸው መዛግብቶች በሙሉ ከዳታቤዝ ይሰረዛሉ። ይህ ተግባር ወደ ነበረበት ሊመለስ አይችልም።\\n              "\)/g, replace: 'tx("\\n                ይህንን መምህር ሲያጠፉ ተያያዥነት ያላቸው መዛግብቶች በሙሉ ከዳታቤዝ ይሰረዛሉ። ይህ ተግባር ወደ ነበረበት ሊመለስ አይችልም። (Deleting this teacher will permanently erase all associated records. This cannot be undone.)\\n              ")' }
];

regexMap.forEach(item => {
  fileContent = fileContent.replace(item.search, item.replace);
});

fs.writeFileSync('src/components/TeacherSection.tsx', fileContent);
