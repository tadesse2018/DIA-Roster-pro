import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove <> and </>
content = content.replace('<>\n', '');
content = content.replace('</>\n', '');

// Let's wrap lines 6048 (return (...) ) and button inside a parent div or fragment
// Or let's place the button inside the return div of the IIFE
// Let's find where the IIFE starts around line 6048
let target = `                                         return (
                                           <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-4 md:col-span-2 shadow-xs">`;

let replacement = `                                         return (
                                           <div className="space-y-4">
                                           <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-4 md:col-span-2 shadow-xs">`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  // And also include the button right before the closing div of that wrapper
  // Let's find the end of the IIFE and add the button inside the wrapper div
  let targetEnd = `                                       );
                                        })()`;
  
  let buttonHtml = `                                         <button
                                           onClick={() => {
                                             playInteractiveSound('click');
                                             setSelectedQRStudent(foundStudent);
                                           }}
                                           className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                           title="QR ካርድ አትም"
                                         >
                                           <Printer className="w-3.5 h-3.5" />
                                           አትም (Print ID Card)
                                         </button>
                                       </div>
                                       );
                                        })()`;

  content = content.replace(targetEnd, buttonHtml);
}

// Remove the old standalone button lines
content = content.replace(`                           <button
                             onClick={() => {
                               playInteractiveSound('click');
                               setSelectedQRStudent(foundStudent);
                             }}
                            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            title="QR ካርድ አትም"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            አትም (Print ID Card)
                          </button>`, '');

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Done fix12.js');
