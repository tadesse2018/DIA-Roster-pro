import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

let target = `                              )}
                           </motion.div>
                         </AnimatePresence>
                     </div>
                ) : null}
                       </div>`;

let replacement = `                              )}
                           </motion.div>
                         </AnimatePresence>
                     </div>
                       </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Removed ) : null} via fix9.js');
} else {
  console.log('Target not found for fix9.js');
}
