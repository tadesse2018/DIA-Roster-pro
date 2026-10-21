import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Insert </AnimatePresence> after the principal sub-tabs AnimatePresence children
let target = `                          </motion.div>\n                        )}\n            \n                    </div>`;
let replacement = `                          </motion.div>\n                        )}\n                      </AnimatePresence>\n            \n                    </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Successfully added missing </AnimatePresence> in fix38.js');
} else {
  console.log('Target not found for fix38.js');
}
