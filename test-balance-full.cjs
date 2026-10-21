const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// parse from the start of the file or just use standard parsing?
// Better to just run Babel and let it tell us where the first syntax error is.
