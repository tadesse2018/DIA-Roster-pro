const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                       </div>
                    </div>
                  </div>
                </div>

                {/* Modal Controls (No-Print) */}`;

const repl = `                       </div>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Modal Controls (No-Print) */}`;

if(code.indexOf(target) !== -1) {
  code = code.replace(target, repl);
  console.log("Fixed div!");
} else {
  console.log("Target not found!");
}
fs.writeFileSync('src/App.tsx', code);
