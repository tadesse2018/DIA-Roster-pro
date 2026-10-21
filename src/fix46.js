import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('</div>') && lines[i-1].includes('</button>') && lines[i+1].includes('</form>')) {
    console.log('Found extra div at line', i+1);
    lines.splice(i, 1);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Removed extra div in fix46.js');
