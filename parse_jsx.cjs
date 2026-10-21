const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');
let stack = [];
let lines = content.split('\n');

// A very naive JSX tag stack counter (just to find roughly where it breaks)
let inString = false;
let inComment = false;

for (let i = 8500; i < 8800; i++) {
    let line = lines[i];
    if (!line) continue;
    
    // count `<div` vs `</div` and `<React.Fragment` vs `</React.Fragment`
    let openDivs = (line.match(/<div(\s|>)/g) || []).length;
    let closeDivs = (line.match(/<\/div>/g) || []).length;
    
    let openFrag = (line.match(/<React.Fragment/g) || []).length;
    let closeFrag = (line.match(/<\/React.Fragment>/g) || []).length;
    
    if (openDivs !== closeDivs || openFrag !== closeFrag) {
        console.log(`${i+1}: +div:${openDivs} -div:${closeDivs} | +frag:${openFrag} -frag:${closeFrag} | ${line.trim()}`);
    }
}
