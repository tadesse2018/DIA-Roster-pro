import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the pattern
let target = `                                       );
                                        })()


                                 </div>`;

let replacement = `                                       );
                                        })()}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Fixed via fix6.js');
} else {
  // Let's do regex replacement for `\s*</div>\s*` after `})()`
  let newContent = content.replace(/(\}\)\(\))\s*<\/div>/g, '$1');
  if (newContent !== content) {
    fs.writeFileSync('src/App.tsx', newContent, 'utf8');
    console.log('Fixed via regex in fix6.js');
  } else {
    console.log('Regex did not match');
  }
}
