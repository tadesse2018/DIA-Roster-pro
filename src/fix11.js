import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

let target = `                                             )}
                                            </div>
                                       );
                                        })()
                           <button
                             onClick={() => {
                               playInteractiveSound('click');
                               setSelectedQRStudent(foundStudent);
                             }}
                            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            title="QR ካርድ አትም"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            አትም (Print ID Card)
                          </button>`;

let replacement = `                                             )}
                                            </div>
                                            <button
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

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Moved button inside IIFE return div via fix11.js');
} else {
  console.log('Target not found for fix11.js, trying normalized');
}
