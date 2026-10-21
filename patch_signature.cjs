const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const t1 = `                            <p className="text-[6px] text-white/40 mt-1 uppercase tracking-wider text-center max-w-[90%] mx-auto leading-tight">
                              ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ));`;
const r1 = `                            <p className="text-[6px] text-white/40 mt-1 uppercase tracking-wider text-center max-w-[90%] mx-auto leading-tight">
                              ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።
                            </p>
                            
                            <div className="mt-2.5 flex flex-col items-center justify-center">
                              <div className="w-16 h-px border-t border-dashed border-white/40 mb-0.5"></div>
                              <span className="text-[4px] text-white/50 font-bold uppercase tracking-widest">
                                የርዕሰ መምህር ፊርማ (Principal Signature)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ));`;

const t2 = `                      <p className="text-[8px] text-white/80 leading-snug max-w-[260px] mx-auto font-medium text-center">
                        ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Controls (No-Print) */}`;
const r2 = `                      <p className="text-[8px] text-white/80 leading-snug max-w-[260px] mx-auto font-medium text-center">
                        ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።
                      </p>
                      
                      <div className="mt-5 mb-1 flex flex-col items-center justify-center">
                        <div className="w-24 h-px border-t border-dashed border-white/40 mb-1"></div>
                        <span className="text-[6px] text-white/50 font-bold uppercase tracking-widest">
                          የርዕሰ መምህር ፊርማ (Principal Signature)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Controls (No-Print) */}`;

const t3 = `                      <p className="text-[7px] text-stone-500 leading-tight max-w-[220px] mx-auto">
                        ይህ መታወቂያ መምህራን በQR ስካነር በፍጥነት ወደ መምህር ገጻቸው ለመግባት የሚያገለግል ነው።
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Controls (No-Print) */}`;
const r3 = `                      <p className="text-[7px] text-stone-500 leading-tight max-w-[220px] mx-auto">
                        ይህ መታወቂያ መምህራን በQR ስካነር በፍጥነት ወደ መምህር ገጻቸው ለመግባት የሚያገለግል ነው።
                      </p>
                      
                      <div className="mt-4 flex flex-col items-center justify-center">
                        <div className="w-24 h-px border-t border-dashed border-stone-600/40 mb-1"></div>
                        <span className="text-[6px] text-stone-500/70 font-bold uppercase tracking-widest">
                          የርዕሰ መምህር ፊርማ (Principal Signature)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Controls (No-Print) */}`;


if (code.includes(t1)) code = code.replace(t1, r1); else console.log('T1 not found');
if (code.includes(t2)) code = code.replace(t2, r2); else console.log('T2 not found');
if (code.includes(t3)) code = code.replace(t3, r3); else console.log('T3 not found');

fs.writeFileSync('src/App.tsx', code);
console.log('Signature patches applied');
