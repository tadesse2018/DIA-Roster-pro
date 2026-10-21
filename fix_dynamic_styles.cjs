const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const dynamicStyles = useMemo\(\(\) => \{[\s\S]*?\}, \[currentUser, themeMode\]\);/;
const replacement = `const dynamicStyles = useMemo(() => {
    return {};
  }, [currentUser, themeMode]);`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/App.tsx', code, 'utf8');
    console.log("Successfully replaced dynamic styles");
} else {
    console.log("Not found exact match for dynamic styles");
}
