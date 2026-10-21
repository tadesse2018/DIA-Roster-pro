import fs from 'fs';
import * as babel from '@babel/parser';

let code = fs.readFileSync('src/App.tsx', 'utf8');

let maxIterations = 1000;
let it = 0;
while (it < maxIterations) {
  it++;
  try {
    babel.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });
    console.log("No syntax errors found by Babel.");
    break;
  } catch (err) {
    if (err.message.includes('Unexpected token')) {
       let lines = code.split('\n');
       let lineIdx = err.loc.line - 1;
       let fixed = false;
       for(let i = lineIdx; i >= Math.max(0, lineIdx - 10); i--) {
          if (/[}"'\)]\s*$/.test(lines[i])) {
             lines[i] = lines[i].replace(/\s*$/, '>');
             code = lines.join('\n');
             fixed = true;
             break;
          }
       }
       if (!fixed) {
           console.log("Could not fix at", lineIdx);
           break;
       }
    } else {
       console.log("Unhandled error:", err.message, "at", err.loc.line);
       break;
    }
  }
}
fs.writeFileSync('src/App.tsx', code);
console.log("Ran", it, "iterations");
