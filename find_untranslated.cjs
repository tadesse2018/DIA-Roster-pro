const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles('src');
const amharicRegex = /[\u1200-\u137F]/;

const missing = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (amharicRegex.test(line)) {
      const hasTx = line.includes('tx(');
      
      if (hasTx) {
        // Look for tx("AmharicOnly") or tx('AmharicOnly')
        const match = line.match(/tx\(['"]([^()]+)['"]\)/);
        if (match && amharicRegex.test(match[1])) {
           missing.push(`${file}:${i+1}: ${line.trim()}`);
        }
      } else {
        if (line.trim().startsWith('//')) return;
        if (file.includes('LanguageContext.tsx')) return;
        missing.push(`${file}:${i+1}: (RAW) ${line.trim()}`);
      }
    }
  });
});

fs.writeFileSync('missing.txt', missing.join('\n'));
console.log("Missing count:", missing.length);
