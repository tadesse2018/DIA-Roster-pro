const fs = require('fs');
let content = fs.readFileSync('src/components/GradeTrackerSection.tsx', 'utf8');

const effectBlock = `  // Keep selectedGrade valid
  React.useEffect(() => {
    if (currentUserRole === 'principal') {
      if (!gradeOptions.includes(selectedGrade) && selectedGrade !== 'All') {
        setSelectedGrade('All');
      }
    } else {
      if (!gradeOptions.includes(selectedGrade)) {
        setSelectedGrade(gradeOptions[0] || 'Grade 1');
      }
    }
  }, [gradeOptions, selectedGrade, currentUserRole]);`;

// Need to insert this after `const [selectedGrade, setSelectedGrade] = ...`
const targetAfterStates = `const [selectedSection, setSelectedSection] = useState<string>('All');`;

if (content.includes(targetAfterStates)) {
  content = content.replace(targetAfterStates, targetAfterStates + '\n\n' + effectBlock);
  fs.writeFileSync('src/components/GradeTrackerSection.tsx', content, 'utf8');
  console.log('Fixed selectedGrade consistency in GradeTrackerSection.tsx');
}
