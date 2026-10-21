const regex = /^([^(]+)\(([^)]+)\)([\s\S]*)$/;

function txTest(rawText, lang) {
  if (!rawText) return rawText;
  const text = rawText.trim();
  
  // check for icons
  const prefixRegex = /^([\u2300-\u23FF\u2B00-\u2BFF\u2100-\u219F\u2600-\u26FF\uD83C-\uDBFF\uDC00-\uDFFF]+)(.*)$/;
  let icon = "";
  let rest = text;
  
  const prefixMatch = text.match(prefixRegex);
  if (prefixMatch) {
    icon = prefixMatch[1] + " ";
    rest = prefixMatch[2].trim();
  }

  const match = rest.match(regex);
  if (match) {
    const amPart = match[1].trim();
    const enPart = match[2].trim();
    const trail = match[3]; // Any punctuation after the closing parenthesis
    
    return lang === 'am' ? `${icon}${amPart}${trail}` : `${icon}${enPart}${trail}`;
  }
  
  return text; // fallback
}

const samples = [
  "ትምህርት ቤት (School)፡",
  "📱 ስልክ ቁጥር ወይም ኢሜል (Phone or Email):",
  "🔑 የይለፍ ቃል (Password):",
  "የተማሪ QR ስካነር (Scan QR)",
  "🏫 የትምህርት ቤቱ ስም - በአማርኛ (School Name - Amharic)",
  "አማካይ (Average) "
];

samples.forEach(s => {
  console.log(s);
  console.log("  EN:", txTest(s, 'en'));
  console.log("  AM:", txTest(s, 'am'));
});
