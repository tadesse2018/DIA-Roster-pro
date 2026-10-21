const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('const [wlLogoImage, setWlLogoImage]')) {
  // Add state
  content = content.replace(
    /const \[wlLogoType, setWlLogoType\] = useState\(schoolConfig.logoType\);/,
    "const [wlLogoType, setWlLogoType] = useState(schoolConfig.logoType);\n  const [wlLogoImage, setWlLogoImage] = useState(schoolConfig.logoImage);"
  );
  
  // Add to payload
  content = content.replace(
    /logoType: wlLogoType,/,
    "logoType: wlLogoType,\n        logoImage: wlLogoImage,"
  );
  
  fs.writeFileSync('src/App.tsx', content, 'utf8');
}
