import fs from 'fs';
import * as babel from '@babel/parser';

let code = fs.readFileSync('src/App.tsx', 'utf8');

try {
  babel.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  });
  console.log("No syntax errors found by Babel.");
} catch (err) {
  console.error("Syntax Error at line", err.loc.line, "col", err.loc.column);
  console.error(err.message);
  let lines = code.split('\n');
  for(let i = err.loc.line - 5; i <= err.loc.line + 5; i++) {
     console.log(i + 1 + ": " + lines[i]);
  }
}
