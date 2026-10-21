const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx','utf8').split('\n');
let activeTabCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('activeTab === \'report\'')) {
    console.log('Report Tab start:', i + 1);
  }
}
