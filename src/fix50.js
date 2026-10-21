import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

let target = `                                    })()}



                                 <button`;

let replacement = `                                    })()}
                                 </div>



                                 <button`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  console.log('Inserted missing closing div for assessment container');
} else {
  console.log('Target not found for fix50');
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Saved fix50.js');
