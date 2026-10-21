const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const regexRoot = /:root \{[\s\S]*?\}/;
const replacementRoot = `:root {
  --bg-app: #ecfccb;
  --bg-card: #f7fee7;
  --bg-input: #d9f99d;
  --text-primary: #1a2e05;
  --text-secondary: #3f6212;
  --text-muted: #4d7c0f;
  --border-color: #bef264;
  --border-light: #d9f99d;
  --table-border: #84cc16;
}`;

const regexDark = /\.dark \{[\s\S]*?\}/;
const replacementDark = `.dark {
  --bg-app: #1a2e05;
  --bg-card: #2a3d13;
  --bg-input: #3f6212;
  --text-primary: #ecfccb;
  --text-secondary: #d9f99d;
  --text-muted: #a3e635;
  --border-color: #4d7c0f;
  --border-light: #3f6212;
  --table-border: #65a30d;
}`;

code = code.replace(regexRoot, replacementRoot);
code = code.replace(regexDark, replacementDark);
fs.writeFileSync('src/index.css', code, 'utf8');
console.log("Replaced colors");
