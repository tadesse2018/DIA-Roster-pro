const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx').concat(glob.sync('src/**/*.ts'));

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('tx(')) {
    // Check if 'const { tx' or 'tx =' or 'const tx' or similar is in the file
    // But actually, it's possible the file has multiple components, and only ONE of them has `tx` defined,
    // while ANOTHER component in the same file uses `tx` but doesn't have it defined!
    // Or it's used in a helper function outside a component.
    
    // We can count 'useLanguage' calls vs 'tx(' calls roughly, but it's easier to just search for `tx(` and see what scope it's in.
    
    // Let's just print files that have `tx(`
    console.log("File:", file);
    // Is it in a non-component?
  }
});
