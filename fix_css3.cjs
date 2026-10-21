const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/\/\* Force Tables to be White with Dark Text even in Dark Mode \*\/[\s\S]*?(?=\/\* Ensure buttons inside the table still look somewhat okay \*\/)/, '');

css = css.replace(/\/\* Ensure buttons inside the table still look somewhat okay \*\/[\s\S]*?(?=\/\* Force background colors to respect the theme \*\/)/, '');

fs.writeFileSync('src/index.css', css, 'utf8');
console.log("Removed forced white table rules");
