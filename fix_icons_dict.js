import fs from 'fs';

let content = fs.readFileSync('src/components/LanguageContext.tsx', 'utf8');

const prefixRegex = /^([\u2300-\u23FF\u2B00-\u2BFF\u2100-\u219F\u2600-\u26FF\uD83C-\uDBFF\uDC00-\uDFFF]+)\s*(.*)$/;

let fixedContent = content.replace(/  "(.*?)"\s*:\s*\{\s*am\s*:\s*"(.*?)"\s*,\s*en\s*:\s*"(.*?)"\s*\}/g, (match, key, am, en) => {
    let cleanKey = key;
    const matchIcon = cleanKey.match(prefixRegex);
    if (matchIcon) {
       cleanKey = matchIcon[2].trim();
    }
    
    // Also remove any icons from the translations themselves (am and en) if they match the icon we removed? 
    // Wait, the tx function prepends the icon:
    // return lang === 'am' ? `${icon}${dict.am}` : `${icon}${dict.en}`;
    // So the dictionary translations should ALSO not have the icon!
    
    let cleanAm = am;
    let cleanEn = en;
    const amIcon = cleanAm.match(prefixRegex);
    if (amIcon) cleanAm = amIcon[2].trim();
    const enIcon = cleanEn.match(prefixRegex);
    if (enIcon) cleanEn = enIcon[2].trim();
    
    return `  "${cleanKey}": { am: "${cleanAm}", en: "${cleanEn}" }`;
});

fs.writeFileSync('src/components/LanguageContext.tsx', fixedContent);
