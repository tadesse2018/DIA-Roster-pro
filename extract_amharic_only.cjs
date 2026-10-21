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

const allTsxFiles = getAllFiles('src');
let uniqueStrings = new Set();

const parenRegex = /^([^(]+)\(([^)]+)\)([\s\S]*)$/;

allTsxFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/tx\(['"`]([\s\S]*?)['"`]\)/g)];
  
  matches.forEach(m => {
    let str = m[1].trim();
    if (!str) return;
    
    // strip icons
    const prefixRegex = /^([\u2300-\u23FF\u2B00-\u2BFF\u2100-\u219F\u2600-\u26FF\uD83C-\uDBFF\uDC00-\uDFFF]+)(.*)$/;
    let icon = "";
    let rest = str;
    const prefixMatch = str.match(prefixRegex);
    if (prefixMatch) {
      icon = prefixMatch[1] + " ";
      rest = prefixMatch[2].trim();
    }
    
    // Check if it already has English in parens
    if (!parenRegex.test(rest)) {
      uniqueStrings.add(rest);
    }
  });
});

console.log(JSON.stringify(Array.from(uniqueStrings), null, 2));
