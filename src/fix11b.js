import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

// Wrap lines 6133 to 6144 with <> and </>
if (lines[6132] && lines[6132].includes('})()')) {
  lines.splice(6133, 0, '<>');
  // Find the button closing </button> around line 6144+1
  for (let i = 6134; i < lines.length; i++) {
    if (lines[i].includes('</button>')) {
      lines.splice(i + 1, 0, '</>');
      break;
    }
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Done fix11b.js');
