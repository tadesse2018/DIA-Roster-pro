const fs = require('fs');
let content = fs.readFileSync('src/components/ClassSetupSection.tsx', 'utf8');

const searchTarget = `  // Registration states
  const [grade, setGrade] = useState(activeGradesList[0] || 'Grade 1');`;

if (content.includes(searchTarget)) {
  const replacement = `  // Keep dropdown states valid when activeGradesList changes
  useEffect(() => {
    if (!activeGradesList.includes(grade)) {
      setGrade(activeGradesList[0]);
    }
  }, [activeGradesList, grade]);

  // Registration states
  const [grade, setGrade] = useState(activeGradesList[0] || 'Grade 1');`;
  
  // wait, we need to import useEffect if not imported, but it's probably using React.useEffect or already imported. 
  // Let's use React.useEffect to be safe.
  const saferReplacement = `  // Keep dropdown states valid when activeGradesList changes
  React.useEffect(() => {
    if (!activeGradesList.includes(grade)) {
      setGrade(activeGradesList[0]);
    }
    if (!activeGradesList.includes(editGrade) && editGrade !== '') {
      setEditGrade(activeGradesList[0]);
    }
  }, [activeGradesList, grade, editGrade]);

  // Registration states
  const [grade, setGrade] = useState(activeGradesList[0] || 'Grade 1');`;
  
  content = content.replace(searchTarget, saferReplacement);
  fs.writeFileSync('src/components/ClassSetupSection.tsx', content, 'utf8');
  console.log('Fixed grade states in ClassSetupSection.tsx');
}
