const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const darkThemeOld = /\.dark \{[\s\S]*?--table-border: #334155;\n\}/;
const darkThemeNew = `.dark {
  --bg-app: #020617;
  --bg-card: #0f172a;
  --bg-input: #1e293b;
  --text-primary: #ffffff;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --border-color: #1e293b;
  --border-light: #334155;
  --table-border: #1e293b;
}`;

if (css.match(darkThemeOld)) {
  css = css.replace(darkThemeOld, darkThemeNew);
  fs.writeFileSync('src/index.css', css, 'utf8');
  console.log("Updated dark mode to rich dark blue");
} else {
  console.log("Could not find the dark theme block to replace.");
}
