const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /setWlLogoType\(schoolConfig.logoType\);/,
  "setWlLogoType(schoolConfig.logoType);\n    setWlLogoImage(schoolConfig.logoImage);"
);

content = content.replace(
  /setWlLogoType\(parsed.schoolConfig.logoType \|\| 'graduation'\);/,
  "setWlLogoType(parsed.schoolConfig.logoType || 'graduation');\n          setWlLogoImage(parsed.schoolConfig.logoImage || undefined);"
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Fixed sync issues in App.tsx');
