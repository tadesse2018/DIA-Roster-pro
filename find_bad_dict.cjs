const fs = require('fs');

const content = fs.readFileSync('src/components/LanguageContext.tsx', 'utf8');

const regex = /"([^"]+)":\s*\{\s*am:\s*"([^"]+)",\s*en:\s*"([^"]+)"\s*\}/g;

let match;
while ((match = regex.exec(content)) !== null) {
  if (match[2] === match[3]) {
    console.log(match[1]);
  }
}
