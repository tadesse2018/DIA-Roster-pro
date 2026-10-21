const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const selectCSS = `
/* Select Element Styling & Padding Fix */
select {
  padding-right: 2.5rem !important;
  text-overflow: ellipsis !important;
  overflow: hidden !important;
  white-space: nowrap !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") !important;
  background-position: right 0.5rem center !important;
  background-repeat: no-repeat !important;
  background-size: 1.5em 1.5em !important;
}

.dark select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") !important;
}
`;

css = css.replace('/* Select Element Padding Fix */\nselect {\n  padding-right: 2.5rem !important;\n  text-overflow: ellipsis !important;\n  overflow: hidden !important;\n  white-space: nowrap !important;\n}', selectCSS);

fs.writeFileSync('src/index.css', css, 'utf8');
console.log('Fixed select styles.');
