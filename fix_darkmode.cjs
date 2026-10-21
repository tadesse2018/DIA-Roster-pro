const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const darkThemeOld = /\.dark \{[\s\S]*?--table-border: #65a30d;\n\}/;
const darkThemeNew = `.dark {
  --bg-app: #0f172a;
  --bg-card: #1e293b;
  --bg-input: #334155;
  --text-primary: #ffffff;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --border-color: #334155;
  --border-light: #475569;
  --table-border: #334155;
}`;

css = css.replace(darkThemeOld, darkThemeNew);
fs.writeFileSync('src/index.css', css, 'utf8');
