const fs = require('fs');

function replaceInFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Replace in config setup
  code = code.replace(/nameAmh: 'ስማርት ስኩል አፕ'/g, "nameAmh: 'ደሊጀንት አካዳሚ'");
  code = code.replace(/nameEng: 'Smart School App'/g, "nameEng: 'Diligent Academy'");
  
  // Replace default overrides
  code = code.replace(/parsed\.nameAmh = 'ስማርት ስኩል አፕ'/g, "parsed.nameAmh = 'ደሊጀንት አካዳሚ'");
  code = code.replace(/parsed\.nameEng = 'Smart School App'/g, "parsed.nameEng = 'Diligent Academy'");
  
  // Replace fallback texts
  code = code.replace(/ክብር መካከለኛ ደረጃ ትምህርት ቤት/g, "ደሊጀንት አካዳሚ");
  code = code.replace(/ክብር/g, "ደሊጀንት");
  code = code.replace(/Kibr Middle School/g, "Diligent Academy");
  code = code.replace(/KIBR MIDDLE SCHOOL/g, "DILIGENT ACADEMY");
  code = code.replace(/KIBR SCHOOL/g, "DILIGENT ACADEMY");
  code = code.replace(/Kibr/g, "Diligent");
  code = code.replace(/kibr/g, "diligent");
  code = code.replace(/KIBR/g, "DILIGENT");
  
  fs.writeFileSync(filePath, code);
}

replaceInFile('src/App.tsx');
replaceInFile('src/components/GradeTrackerSection.tsx');
replaceInFile('src/components/SimulatedEmailOutbox.tsx');
replaceInFile('src/lib/notificationService.ts');

console.log('School name replaced.');
