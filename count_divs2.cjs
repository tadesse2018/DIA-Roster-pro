const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

function analyze(label, patternStart, patternEnd) {
    let start = content.indexOf(patternStart);
    let end = content.indexOf(patternEnd, start);
    let block = content.substring(start, end);
    let open = (block.match(/<div/g) || []).length;
    let close = (block.match(/<\/div>/g) || []).length;
    console.log(label, open, close, 'Diff:', open - close);
}

analyze('Front card (print all)', '{/* Printable ID Card */}', '{/* BACK CARD */}');
analyze('Back card (print all)', '{/* BACK CARD */}', '</React.Fragment>');
analyze('Front card (modal)', 'id="student-id-card"', '{/* BACK CARD */}');
analyze('Back card (modal)', '{/* BACK CARD */}', '{/* Modal Controls');
analyze('Teacher card (modal)', 'className="qr-card-container', '{/* Modal Controls');
