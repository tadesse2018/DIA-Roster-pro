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

const amharicRegex = /[\u1200-\u137F]/;
const allFiles = getAllFiles('src');

allFiles.forEach(file => {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (amharicRegex.test(line) && !line.includes('tx(') && !line.includes('t(') && !line.includes('TRANSLATION_DICTIONARY')) {
      console.log(`${file}:${index + 1}: ${line.trim()}`);
    }
  });
});
