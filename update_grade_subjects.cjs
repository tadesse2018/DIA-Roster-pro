const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add subjectsByGrade to initial state if it doesn't exist
const configToSeedMatch = code.match(/subjects:\s*\[[^\]]+\]\s*,/);
if (configToSeedMatch && !code.includes("subjectsByGrade: {}")) {
    code = code.replace(configToSeedMatch[0], configToSeedMatch[0] + "\n      subjectsByGrade: {},");
}

// 2. Add wlSubjectsByGrade state
const wlSubjectsState = `const [wlSubjects, setWlSubjects] = useState<string[]>(schoolConfig.subjects);`;
if (!code.includes("wlSubjectsByGrade")) {
    code = code.replace(wlSubjectsState, wlSubjectsState + `\n  const [wlSubjectsByGrade, setWlSubjectsByGrade] = useState<Record<string, string[]>>(schoolConfig.subjectsByGrade || {});`);
}

// 3. Add wlSelectedGradeForSubjects state
if (!code.includes("wlSelectedGradeForSubjects")) {
    code = code.replace(wlSubjectsState, `const [wlSelectedGradeForSubjects, setWlSelectedGradeForSubjects] = useState<string>('Grade 1');\n  ` + wlSubjectsState);
}

// 4. Update the reset logic in handleDiscardConfigChanges
const wlSubjectsReset = `setWlSubjects(schoolConfig.subjects);`;
if (code.includes(wlSubjectsReset) && !code.includes("setWlSubjectsByGrade(schoolConfig.subjectsByGrade")) {
    code = code.replace(wlSubjectsReset, wlSubjectsReset + `\n    setWlSubjectsByGrade(schoolConfig.subjectsByGrade || {});`);
}

// 5. Update the update config function
const parsedSchoolConfigSubjects = `setWlSubjects(parsed.schoolConfig.subjects || []);`;
if (code.includes(parsedSchoolConfigSubjects) && !code.includes("setWlSubjectsByGrade(parsed.schoolConfig.subjectsByGrade")) {
    code = code.replace(parsedSchoolConfigSubjects, parsedSchoolConfigSubjects + `\n          setWlSubjectsByGrade(parsed.schoolConfig.subjectsByGrade || {});`);
}

// 6. Update the handleSaveConfig function
const saveSubjects = `subjects: wlSubjects,`;
if (code.includes(saveSubjects) && !code.includes("subjectsByGrade: wlSubjectsByGrade,")) {
    code = code.replace(saveSubjects, saveSubjects + `\n        subjectsByGrade: wlSubjectsByGrade,`);
}

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Updated state & default configs.");
