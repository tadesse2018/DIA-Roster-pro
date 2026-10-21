import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Let's locate the student not found block
let target = `                              ) : (
                                  <div className="text-center p-8 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
                                    <span className="text-3xl block">🔍❌</span>
                                    <h4 className="font-extrabold text-rose-950 text-sm">ተማሪው አልተገኘም (Student Not Found)</h4>
                                    <p className="text-stone-500 text-xs leading-relaxed max-w-sm mx-auto">
                                      ያስገቡት መታወቂያ ቁጥር በስርዓቱ ውስጥ አልተገኘም።
                                    </p>
                                  </div>
                              )}`;

let replacement = `                              ) : (
                                  <div className="text-center p-8 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
                                    <span className="text-3xl block">🔍❌</span>
                                    <h4 className="font-extrabold text-rose-950 text-sm">ተማሪው አልተገኘም (Student Not Found)</h4>
                                    <p className="text-stone-500 text-xs leading-relaxed max-w-sm mx-auto">
                                      ያስገቡት መታወቂያ ቁጥር በስርዓቱ ውስጥ አልተገኘም።
                                    </p>
                                  </div>
                              )}
                            </motion.div>
                          ) : (
                            <div className="text-center py-16 text-stone-400">
                              <p className="font-extrabold text-sm text-stone-600">እባክዎን ከላይ ካሉት ልጆችዎ አንዱን ይምረጡ</p>
                            </div>
                          )}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Successfully fixed parentSearched ternary in fix28.js');
} else {
  console.log('Target not found for fix28.js');
}
