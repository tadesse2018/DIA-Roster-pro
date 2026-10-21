import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix quickViewCategory average block where </div> was after )}
let target1 = `                  })()}

               )}
            </div>`;

let replacement1 = `                  })()}
                </div>
              )}
            </div>`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  console.log('Fixed quickViewCategory average block');
} else {
  console.log('Target 1 not found exactly');
}

// Fix extra )} at line 5605 if present
let target2 = `                       })()}

                   )}`;

let replacement2 = `                       })()}
                  )}`;

if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
  console.log('Fixed quick-entry IIFE ending');
} else {
  console.log('Target 2 not found exactly');
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Done fixing App.tsx');
