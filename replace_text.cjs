const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = "ለገበያ ምቹና ተለዋዋጭ (Dynamic White-Label SaaS) ተደርጎ የተዘጋጀ።";
const replacer1 = "ለተጠቃሚ ምቹና ተለዋዋጭ (Dynamic White-Label SaaS) ተደርጎ የተዘጋጀ።";

const target2 = "ይህ ሲስተም ለገበያ ሲቀርብ ያለ ምንም የመረጃ መጥፋት ስጋት በነጻነት መስራት እንዲችል የሀገር ውስጥ ትምህርት ቤቶችን ፍላጎት መሰረት ባደረገ መልኩ <strong>ከኢንተርኔት ነጻ (Offline-First)</strong> ሆኖ የተገነባ ነው።";
const replacer2 = "ይህ ሲስተም ለተጠቃሚ ሲቀርብ ያለ ምንም የመረጃ መጥፋት ስጋት በነጻነት መስራት እንዲችል የሀገር ውስጥ ትምህርት ቤቶችን ፍላጎት መሰረት ባደረገ መልኩ <strong>ከኢንተርኔት ነጻ (Offline-First)</strong> ሆኖ የተገነባ ነው።";

content = content.replace(target1, replacer1);
content = content.replace(target2, replacer2);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Text replaced successfully');
