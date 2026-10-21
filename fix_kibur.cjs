const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove the hardcoded rename block
content = content.replace(
`          let updated = false;
          if (parsed.nameAmh && parsed.nameAmh.includes('ክቡር')) {
            parsed.nameAmh = parsed.nameAmh.replace(/ክቡር/g, 'ደሊጀንት');
            updated = true;
          }
          if (parsed.nameEng && parsed.nameEng.toLowerCase().includes('kibur')) {
            parsed.nameEng = parsed.nameEng.replace(/kibur/gi, 'Diligent');
            updated = true;
          }
          if (updated) {
            localStorage.setItem(\`schoolConfig_\${schoolWorkspaceId}\`, JSON.stringify(parsed));
          }`,
`          // No forced school name replacements`
);

fs.writeFileSync('src/App.tsx', content);
