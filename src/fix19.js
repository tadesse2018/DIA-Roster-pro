import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

let targetStart = `                                   {parentSubView === 'attendance' && (
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">`;

let replacementStart = `                                   {parentSubView === 'attendance' && (
                                     <>
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">`;

let targetEnd = `                                        })()
                                    </div>`;

let replacementEnd = `                                        })()
                                     </>
                                    </div>`;

if (content.includes(targetStart) && content.includes(targetEnd)) {
  content = content.replace(targetStart, replacementStart);
  content = content.replace(targetEnd, replacementEnd);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Wrapped parentSubView attendance in fragment via fix19.js');
} else {
  console.log('Targets not found for fix19.js');
}
