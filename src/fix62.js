import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove stray </AnimatePresence> around line 7306
content = content.replace(
  /          \}\)\)\}\n\n        <\/AnimatePresence>/g,
  '          })\()\n        '
);

// Also let's do a direct line-based fix if regex is tricky
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '</AnimatePresence>' && i > 7295 && i < 7315) {
    // Check if this is indeed the stray one
    let prevFew = lines.slice(i-3, i).join('\n');
    if (prevFew.includes('motion.div')) {
      lines[i] = '';
      console.log('Removed stray </AnimatePresence> at line', i+1);
    }
  }

  // 2. Fix Honor Roll IIFE ternary around line 8926-8930
  if (lines[i] && lines[i].includes('return averageScore >= 90 ? (') && i > 8915 && i < 8935) {
    // Find where `); })()` is
    for (let j = i; j < i + 10; j++) {
      if (lines[j] && lines[j].includes('); })()')) {
        lines[j] = '                      ) : null;\n                    })()}';
        console.log('Fixed Honor Roll IIFE ternary at line', j+1);
        break;
      }
    }
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix62.js');
