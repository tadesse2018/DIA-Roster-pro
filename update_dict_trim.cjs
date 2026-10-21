const fs = require('fs');

let contextCode = fs.readFileSync('src/components/LanguageContext.tsx', 'utf8');

// I will parse the dictionary, trim all the keys, and write it back.
// Actually, it's easier to just write a simple script that cleans up TRANSLATION_DICTIONARY keys.
const dictRegex = /const TRANSLATION_DICTIONARY: Record<string, { am: string; en: string }> = \{([\s\S]*?)\};/;
const existingMatch = contextCode.match(dictRegex);

if (existingMatch) {
    let dictBody = existingMatch[1];
    
    // a quick and dirty way to parse it: eval it in a safe context
    const evalCode = `(function() { return {${dictBody}}; })()`;
    try {
        const dictObj = eval(evalCode);
        const newDict = {};
        for (let k in dictObj) {
            newDict[k.trim().replace(/\\n/g, '')] = dictObj[k];
        }
        
        let newDictString = 'const TRANSLATION_DICTIONARY: Record<string, { am: string; en: string }> = {\n';
        for (let k in newDict) {
            if (!k) continue;
            newDictString += `  ${JSON.stringify(k)}: { am: ${JSON.stringify(newDict[k].am)}, en: ${JSON.stringify(newDict[k].en)} },\n`;
        }
        newDictString += '};';
        
        contextCode = contextCode.replace(dictRegex, newDictString);
        fs.writeFileSync('src/components/LanguageContext.tsx', contextCode);
        console.log("Trimmed all keys in dictionary.");
    } catch (e) {
        console.log("Error evaluating:", e);
    }
}
