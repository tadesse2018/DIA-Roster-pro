const fs = require('fs');

// 1. Fix ClassSetupSection.tsx
let classSetup = fs.readFileSync('src/components/ClassSetupSection.tsx', 'utf8');
classSetup = classSetup.replace(
  /tx\("ሰኞ"\)/, '"ሰኞ"'
).replace(
  /tx\("ማክሰኞ"\)/, '"ማክሰኞ"'
).replace(
  /tx\("ረቡዕ"\)/, '"ረቡዕ"'
).replace(
  /tx\("ሐሙስ"\)/, '"ሐሙስ"'
).replace(
  /tx\("አርብ"\)/, '"አርብ"'
);
fs.writeFileSync('src/components/ClassSetupSection.tsx', classSetup);

// 2. Fix GradeTrackerSection.tsx
let gradeTracker = fs.readFileSync('src/components/GradeTrackerSection.tsx', 'utf8');

// ETHIOPIAN_MONTHS
gradeTracker = gradeTracker.replace(
  /tx\("መስከረም"\)/g, '"መስከረም"'
).replace(
  /tx\("ጥቅምት"\)/g, '"ጥቅምት"'
).replace(
  /tx\("ህዳር"\)/g, '"ህዳር"'
).replace(
  /tx\("ታኅሣሥ"\)/g, '"ታኅሣሥ"'
).replace(
  /tx\("ጥር"\)/g, '"ጥር"'
).replace(
  /tx\("የካቲት"\)/g, '"የካቲት"'
).replace(
  /tx\("መጋቢት"\)/g, '"መጋቢት"'
).replace(
  /tx\("ሚያዝያ"\)/g, '"ሚያዝያ"'
).replace(
  /tx\("ግንቦት"\)/g, '"ግንቦት"'
).replace(
  /tx\("ሰኔ"\)/g, '"ሰኔ"'
).replace(
  /tx\("ሐምሌ"\)/g, '"ሐምሌ"'
).replace(
  /tx\("ነሐሴ"\)/g, '"ነሐሴ"'
).replace(
  /tx\("ጳጉሜ"\)/g, '"ጳጉሜ"'
);

// DAYS_OF_WEEK in GradeTrackerSection
gradeTracker = gradeTracker.replace(
  /tx\("ሰኞ"\)/, '"ሰኞ"'
).replace(
  /tx\("ማክሰኞ"\)/, '"ማክሰኞ"'
).replace(
  /tx\("ረቡዕ"\)/, '"ረቡዕ"'
).replace(
  /tx\("ሐሙስ"\)/, '"ሐሙስ"'
).replace(
  /tx\("አርብ"\)/, '"አርብ"'
);

// Add useLanguage inside SignaturePad
gradeTracker = gradeTracker.replace(
  /const SignaturePad = \(\{ onSave, title \}: \{ onSave: \(dataUrl: string\) => void; title: string \}\) => \{/,
  `const SignaturePad = ({ onSave, title }: { onSave: (dataUrl: string) => void; title: string }) => {\n  const { tx } = useLanguage();`
);

fs.writeFileSync('src/components/GradeTrackerSection.tsx', gradeTracker);

console.log("Fixed tx scoping issues");
