const fs = require('fs');

let content = fs.readFileSync('src/components/LanguageContext.tsx', 'utf8');

const dictRegex = /const TRANSLATION_DICTIONARY: Record<string, { am: string; en: string }> = \{([\s\S]*?)\};/;
const existingMatch = content.match(dictRegex);

if (existingMatch) {
    let dictBody = existingMatch[1];
    
    // We can't eval easily if there are duplicate keys because in strict mode or whatever it might throw?
    // Let's use a regex to extract all key-value pairs, keeping the LAST one seen.
    const pairRegex = /"((?:\\.|[^"\\])*)"\s*:\s*\{\s*am\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*en\s*:\s*"((?:\\.|[^"\\])*)"\s*\}/g;
    
    let match;
    const map = new Map();
    while ((match = pairRegex.exec(dictBody)) !== null) {
        map.set(match[1], { am: match[2], en: match[3] });
    }
    
    let newDictString = 'const TRANSLATION_DICTIONARY: Record<string, { am: string; en: string }> = {\n';
    for (let [k, v] of map.entries()) {
        newDictString += `  "${k}": { am: "${v.am}", en: "${v.en}" },\n`;
    }
    newDictString += '};';
    
    content = content.replace(dictRegex, newDictString);
    fs.writeFileSync('src/components/LanguageContext.tsx', content);
    console.log("Removed duplicates.");
}
