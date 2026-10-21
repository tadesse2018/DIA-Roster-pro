import fs from 'fs';

let content = fs.readFileSync('src/components/LanguageContext.tsx', 'utf8');

content = content.replace(
  `  ""ካርዱን በPDF አውርድ" የሚለው ካልሰራ፣": { am: ""ካርዱን በPDF አውርድ" የሚለው ካልሰራ፣", en: ""ካርዱን በPDF አውርድ" የሚለው ካልሰራ፣" },`,
  `  "\\"ካርዱን በPDF አውርድ\\" የሚለው ካልሰራ፣": { am: "\\"ካርዱን በPDF አውርድ\\" የሚለው ካልሰራ፣", en: "If \\"Download Card as PDF\\" does not work," },`
);

fs.writeFileSync('src/components/LanguageContext.tsx', content);
