import fs from 'fs';

let content = fs.readFileSync('src/components/LanguageContext.tsx', 'utf8');

// I'll replace the exact line
content = content.replace(
  `"\\\\"ፒዲኤፍ አውርድ\\\\"": { am: "\\\\"ፒዲኤፍ አውርድ\\\\"", en: "\\\\"ፒዲኤፍ አውርድ\\\\"" },`,
  `"\\"ፒዲኤፍ አውርድ\\"": { am: "\\"ፒዲኤፍ አውርድ\\"", en: "Download PDF" },`
);

fs.writeFileSync('src/components/LanguageContext.tsx', content);
