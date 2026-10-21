const parenRegex = /^([^(]+)\(([^)]+)\)$/;
const prefixRegex = /^([\u2300-\u23FF\u2B00-\u2BFF\u2100-\u219F\u2600-\u26FF\uD83C-\uDBFF\uDC00-\uDFFF\s]+)(.*)$/;

const tx = (rawText, lang) => {
  if (!rawText) return rawText;
  
  const text = rawText.trim();
  
  const match = text.match(parenRegex);
  if (match) {
    const amPart = match[1].trim();
    const enPart = match[2].trim();
    return lang === 'am' ? amPart : enPart;
  }

  const prefixMatch = text.match(prefixRegex);
  if (prefixMatch) {
    const icon = prefixMatch[1];
    const rest = prefixMatch[2].trim();
    
    const restMatch = rest.match(parenRegex);
    if (restMatch) {
      const amPart = restMatch[1].trim();
      const enPart = restMatch[2].trim();
      return lang === 'am' ? `${icon}${amPart}` : `${icon}${enPart}`;
    }
  }

  return text;
}

console.log(tx("\n                      🏫 የትምህርት ቤቱ ስም - በአማርኛ (School Name - Amharic)\n                    ", 'en'));
console.log(tx("\n                      🏫 የትምህርት ቤቱ ስም - በአማርኛ (School Name - Amharic)\n                    ", 'am'));
