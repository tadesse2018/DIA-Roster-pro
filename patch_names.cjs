const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// replace occurrences of 'ደሊጀንት አካዳሚ' with 'ደሊጀንት ት/ቤት'
code = code.replace(/'ደሊጀንት አካዳሚ'/g, "'ደሊጀንት ት/ቤት'");
// replace occurrences of 'Diligent Academy' with 'Diligent School'
code = code.replace(/'Diligent Academy'/g, "'Diligent School'");
// remove ' አፕ' and ' App' from default placeholders if any
code = code.replace(/'ስማርት ስኩል አፕ'/g, "'ስማርት ስኩል'");
code = code.replace(/'Smart School App'/g, "'Smart School'");

fs.writeFileSync('src/App.tsx', code);
console.log('patched names');
