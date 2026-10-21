const fs = require('fs');
let content = fs.readFileSync('src/components/ClassSetupSection.tsx', 'utf8');

const effectBlock = `  // Keep dropdown states valid when activeGradesList changes
  React.useEffect(() => {
    if (!activeGradesList.includes(grade)) {
      setGrade(activeGradesList[0]);
    }
    if (!activeGradesList.includes(editGrade) && editGrade !== '') {
      setEditGrade(activeGradesList[0]);
    }
  }, [activeGradesList, grade, editGrade]);`;

content = content.replace(effectBlock + '\n\n', '');
content = content.replace(effectBlock + '\n', '');
content = content.replace(effectBlock, '');

// Place it AFTER the states
const targetAfterStates = `  const [editSection, setEditSection] = useState('A');
  const [editStream, setEditStream] = useState('General');
  const [editSubjects, setEditSubjects] = useState<string[]>([]);`;

content = content.replace(targetAfterStates, targetAfterStates + '\n\n' + effectBlock);

fs.writeFileSync('src/components/ClassSetupSection.tsx', content, 'utf8');
console.log('Fixed TDZ issue in ClassSetupSection.tsx');
