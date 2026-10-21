import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

let iifeLineNums = [5522, 5926, 8924, 9124, 9216, 9408];

for (let lineNum of iifeLineNums) {
  let idx = lineNum - 1;
  if (lines[idx]) {
    // If it ends with })() but doesn't have );
    if (lines[idx].trim() === '})()') {
      lines[idx] = '                                   );';
      // insert })() on the next line or check if next line has it
      if (!lines[idx+1] || !lines[idx+1].trim().startsWith('})()')) {
        // We can put }); on lineNum and })() on lineNum+1 or combine
        lines[idx] = '                                   );';
        // check if next line is already })()
        if (lines[idx+1].trim() !== '})()') {
          // insert })()
          lines.splice(idx+1, 0, '                                   })()');
        }
      }
    }
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Fixed IIFEs in fix41.js');
