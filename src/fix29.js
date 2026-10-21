import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
let lines = content.split('\n');

let idx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('ተማሪው አልተገኘም (Student Not Found)')) {
    idx = i;
    break;
  }
}

if (idx !== -1) {
  let insertion = [
    '                          ) : (',
    '                            <div className="text-center py-16 text-stone-400">',
    '                              <p className="font-extrabold text-sm text-stone-600">እባክዎን ከላይ ካሉት ልጆችዎ አንዱን ይምረጡ</p>',
    '                            </div>',
    '                          )'
  ];
  
  lines.splice(idx + 7, 0, ...insertion);
  fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
  console.log('Successfully inserted parentSearched false branch via fix29.js');
} else {
  console.log('Index not found');
}
