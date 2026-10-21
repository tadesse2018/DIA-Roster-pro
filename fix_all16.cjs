const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace 5 closing divs with 4 closing divs
content = content.replace(
`                        <div className="text-center w-1/2">
                          <span className="text-[8px] text-stone-500 block uppercase font-bold">ክፍል (Class)</span>
                          <span className="font-bold text-stone-900 text-xs truncate block px-1">{student.grade} - {student.section}</span>
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
                  </div>`
);

fs.writeFileSync('src/App.tsx', content);
