const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the specific unbalanced block in the print all loop
content = content.replace(
`                           የርዕሰ መምህር ፊርማ (Principal Signature)
                         </span>
                       </div>
                    </div>
                  </div>
                        </div>
                        </React.Fragment>`,
`                           የርዕሰ መምህር ፊርማ (Principal Signature)
                         </span>
                       </div>
                    </div>
                        </div>
                        </React.Fragment>`
);

// Also let's check the front card of print all loop:
content = content.replace(
`                        <div className="text-center w-1/2">
                          <span className="text-[8px] text-stone-500 block uppercase font-bold">ክፍል (Class)</span>
                          <span className="font-bold text-stone-900 text-xs truncate block px-1">{student.grade} - {student.section}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                          </div>
                        </div>`,
`                        <div className="text-center w-1/2">
                          <span className="text-[8px] text-stone-500 block uppercase font-bold">ክፍል (Class)</span>
                          <span className="font-bold text-stone-900 text-xs truncate block px-1">{student.grade} - {student.section}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                        </div>`
);

fs.writeFileSync('src/App.tsx', content);
