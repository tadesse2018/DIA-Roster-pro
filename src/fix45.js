import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('</form>') && lines[i-1].includes('</button>')) {
    // Insert </div> before </form>
    lines.splice(i, 0, '                                 </div>');
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Inserted missing </div> in fix45.js');
