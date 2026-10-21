const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Find activeGradesList definition
const searchTarget = `  const activeGradesList = React.useMemo(() => {
    if (schoolConfig.schoolLevel === 'secondary') {
      return ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    }
    return ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
  }, [schoolConfig.schoolLevel]);`;

if (content.includes(searchTarget)) {
  const replacement = searchTarget + `

  // Keep dropdown states valid when school level changes
  React.useEffect(() => {
    if (!activeGradesList.includes(newStudentGrade)) {
      setNewStudentGrade(activeGradesList[0]);
    }
    if (!activeGradesList.includes(editStudentMainGrade)) {
      setEditStudentMainGrade(activeGradesList[0]);
    }
  }, [activeGradesList, newStudentGrade, editStudentMainGrade]);
`;
  content = content.replace(searchTarget, replacement);
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Fixed grade states in App.tsx');
} else {
  console.log('Could not find activeGradesList in App.tsx');
}
