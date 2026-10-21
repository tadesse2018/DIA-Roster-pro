const parenRegex = /^([^(]+)\(([^)]+)\)([\s\S]*)$/;

function txTest(rawText, lang) {
  if (!rawText) return rawText;
  const text = rawText.trim();
  const prefixRegex = /^([\u2300-\u23FF\u2B00-\u2BFF\u2100-\u219F\u2600-\u26FF\uD83C-\uDBFF\uDC00-\uDFFF]+)\s*(.*)$/;
  let icon = "";
  let rest = text;
  
  const prefixMatch = text.match(prefixRegex);
  if (prefixMatch) {
    icon = prefixMatch[1] + " ";
    rest = prefixMatch[2].trim();
  }

  const match = rest.match(parenRegex);
  if (match) {
    const amPart = match[1].trim();
    const enPart = match[2].trim();
    const trail = match[3]; 
    return lang === 'am' ? `${icon}${amPart}${trail}` : `${icon}${enPart}${trail}`;
  }
  return text;
}
