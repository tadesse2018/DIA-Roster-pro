import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix quick-entry IIFE end
let target1 = `                           </div>
                          )}`;

let replacement1 = `                           </div>
                         );
                       })()}`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  console.log('Replaced quick-entry IIFE end');
} else {
  console.log('quick-entry target1 not found');
}

// 2. Fix attendance IIFE end
let target2 = `                                             ) : (
                                               <p className="text-xs text-stone-400 italic">እስካሁን የተመዘገበ የእለት አቴንዳንስ መዝገብ የለም። (No daily attendance records found.)</p>
                          })`;

let replacement2 = `                                             ) : (
                                               <p className="text-xs text-stone-400 italic">እስካሁን የተመዘገበ የእለት አቴንዳንስ መዝገብ የለም። (No daily attendance records found.)</p>
                                             );
                                           })()}`;

if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
  console.log('Replaced attendance IIFE end');
} else {
  console.log('attendance target2 not found');
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Saved fix49.js');
