const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// We found an extra </div> at line 8682 (index 8681).
// Let's print lines 8678 to 8685 to be sure
console.log('Before fix:');
for (let i = 8677; i < 8685; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}

// Remove the line 8682
if (lines[8681].trim() === '</div>') {
    lines.splice(8681, 1);
    console.log('Removed line 8682');
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
