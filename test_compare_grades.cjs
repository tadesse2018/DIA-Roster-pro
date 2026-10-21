const rawText = "\n                🏫 የክፍሎች ማወዳደሪያ (Compare Grades)\n              ";

const text = rawText.trim();
const prefixRegex = /^([\u2300-\u23FF\u2B00-\u2BFF\u2100-\u219F\u2600-\u26FF\uD83C-\uDBFF\uDC00-\uDFFF]+)(.*)$/;
let icon = "";
let rest = text;

const prefixMatch = text.match(prefixRegex);
if (prefixMatch) {
  icon = prefixMatch[1] + " ";
  rest = prefixMatch[2].trim();
}

const parenRegex = /^([^(]+)\(([^)]+)\)([\s\S]*)$/;
const match = rest.match(parenRegex);
console.log("Rest:", rest);
console.log("Match:", match);
if (match) {
  const amPart = match[1].trim();
  const enPart = match[2].trim();
  const trail = match[3];
  console.log("EN:", `${icon}${enPart}${trail}`);
} else {
  console.log("No match");
}
