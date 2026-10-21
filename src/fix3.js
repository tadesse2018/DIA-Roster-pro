import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

let target = `                       })()}

                   )}`;

let replacement = `                       })()}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Successfully removed extra )} via fix3.js');
} else {
  console.log('Target not found in fix3.js, trying normalized replacement');
  // Normalize newlines
  let normContent = content.replace(/\r\n/g, '\n');
  let normTarget = target.replace(/\r\n/g, '\n');
  if (normContent.includes(normTarget)) {
    normContent = normContent.replace(normTarget, replacement);
    fs.writeFileSync('src/App.tsx', normContent, 'utf8');
    console.log('Successfully removed extra )} with normalized newlines');
  } else {
    console.log('Still not found');
  }
}
