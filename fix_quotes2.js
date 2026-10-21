import fs from 'fs';

let content = fs.readFileSync('src/components/LanguageContext.tsx', 'utf8');

content = content.replace(
  `"\\\\"PDF አውርድ\\\\"": { am: "\\\\"PDF አውርድ\\\\"", en: "\\\\"PDF አውርድ\\\\"" },`,
  `"\\"PDF አውርድ\\"": { am: "\\"PDF አውርድ\\"", en: "Download PDF" },`
);
content = content.replace(
  `"\\\\"ካርዱን በPDF አውርድ\\\\"": { am: "\\\\"ካርዱን በPDF አውርድ\\\\"", en: "\\\\"ካርዱን በPDF አውርድ\\\\"" },`,
  `"\\"ካርዱን በPDF አውርድ\\"": { am: "\\"ካርዱን በPDF አውርድ\\"", en: "Download Card as PDF" },`
);

fs.writeFileSync('src/components/LanguageContext.tsx', content);
