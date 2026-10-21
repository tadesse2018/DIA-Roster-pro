const fs = require('fs');
let content = fs.readFileSync('src/components/GradeTrackerSection.tsx', 'utf8');

const effectBlock = `  // Keep selectedGrade valid
  React.useEffect(() => {
    if (currentUserRole === 'principal') {
      if (!gradeOptions.includes(selectedGrade) && selectedGrade !== 'All') {
        setSelectedGrade('All');
      }
    } else {
      if (!gradeOptions.includes(selectedGrade) && gradeOptions.length > 0) {
        setSelectedGrade(gradeOptions[0]);
      }
    }
  }, [gradeOptions, selectedGrade, currentUserRole]);`;

const targetAfterStates = `  const [selectedSection, setSelectedSection] = useState('A');`;

if (content.includes(targetAfterStates)) {
  content = content.replace(targetAfterStates, targetAfterStates + '\n\n' + effectBlock);
  fs.writeFileSync('src/components/GradeTrackerSection.tsx', content, 'utf8');
  console.log('Fixed selectedGrade consistency in GradeTrackerSection.tsx');
}
