const fs = require('fs');

let content = fs.readFileSync('src/components/LanguageContext.tsx', 'utf8');

const replacements = {
  "በጥናቱ የተካተቱ ጠቅላላ ውጤቶች": "Total Grades Included in Study",
  "የሁሉም ክፍሎች እና ትምህርቶች አማካይ": "Average of All Classes and Subjects",
  "ያለፉ ተማሪዎች፡": "Passed Students:",
  "ከፍተኛ አፈጻጸም ያስመዘገበ ክፍል": "Highest Performing Class",
  "የወላጅ ኢሜል ማሳወቂያ ሲሙሌተር": "Parent Email Notification Simulator",
};

for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(`"${key}": \\{ am: "${key}", en: "${key}" \\}`, 'g');
  content = content.replace(regex, `"${key}": { am: "${key}", en: "${value}" }`);
}

fs.writeFileSync('src/components/LanguageContext.tsx', content);
