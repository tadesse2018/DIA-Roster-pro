import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                        </AnimatePresence>
                      </div>

                      {/* TAB 1.5:`,
  `                        </AnimatePresence>
                      </div>
                    </motion.div>

                      {/* TAB 1.5:`
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Saved fix74.js');
