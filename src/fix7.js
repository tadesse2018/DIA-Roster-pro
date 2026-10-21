import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Close lg:col-span-4 card before lg:col-span-8 search results canvas
let target1 = `                                 <p className="text-stone-500 italic">ከእርስዎ የኢሜል አድራሻ ጋር የተገናኘ ተማሪ የለም። እባክዎን ርዕሰ መምህሩን ያነጋግሩ። (No student is linked to your email address.)</p>
                               );
                             }
                           })()}



                       {/* Parent search results canvas */}`;

let replacement1 = `                                 <p className="text-stone-500 italic">ከእርስዎ የኢሜል አድራሻ ጋር የተገናኘ ተማሪ የለም። እባክዎን ርዕሰ መምህሩን ያነጋግሩ። (No student is linked to your email address.)</p>
                               );
                             }
                           })()}
                         </div>



                       {/* Parent search results canvas */}`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  console.log('Added closing div for lg:col-span-4');
} else {
  console.log('Target 1 not found exactly, trying alternative');
  // fallback search
  content = content.replace('No student is linked to your email address.)</p>\n                               );\n                             }\n                           })()', 'No student is linked to your email address.)</p>\n                               );\n                             }\n                           })()}\n                         </div>');
}

// 2. Remove dangling ) : null} at line 6369
let target2 = `                      </div>
                ) : null}
                       </div>`;

let replacement2 = `                      </div>
                       </div>`;

if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
  console.log('Removed dangling ) : null}');
} else {
  console.log('Target 2 not found');
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Done fix7.js');
