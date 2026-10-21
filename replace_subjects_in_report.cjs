const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace all usages of `schoolConfig.subjects.forEach` and `schoolConfig.subjects.map` 
// when they are used to render or calculate a student's grades.
const replacement = `(schoolConfig.subjectsByGrade?.[foundStudent?.grade || ''] && schoolConfig.subjectsByGrade[foundStudent?.grade || ''].length > 0 ? schoolConfig.subjectsByGrade[foundStudent?.grade || ''] : schoolConfig.subjects)`;

// There are a few places where schoolConfig.subjects is used, let's replace them carefully.

code = code.replace(/schoolConfig\.subjects\.forEach/g, replacement + '.forEach');
code = code.replace(/schoolConfig\.subjects\.map/g, replacement + '.map');
code = code.replace(/schoolConfig\.subjects\.length/g, replacement + '.length');

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Successfully replaced subjects loops");
