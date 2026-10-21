const fs = require('fs');
let content = fs.readFileSync('src/components/GradeTrackerSection.tsx', 'utf8');

const toMove = `  // Available options defined early
  const gradeOptions = useMemo(() => {
    if (currentTeacher) {
      if (currentTeacher.classAllocations && currentTeacher.classAllocations.length > 0) {
        return Array.from(new Set(currentTeacher.classAllocations.map(alloc => alloc.grade)));
      }
      return [currentTeacher.assignedClass];
    }
    if (schoolConfig?.schoolLevel === 'secondary') {
      return ['All', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    }
    return ['All', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
  }, [schoolConfig?.schoolLevel, currentTeacher]);

  const sectionOptions = useMemo(() => {
    if (currentTeacher) {
      if (currentTeacher.classAllocations && currentTeacher.classAllocations.length > 0) {
        return currentTeacher.classAllocations
          .filter(alloc => alloc.grade === selectedGrade)
          .map(alloc => alloc.section);
      }
      return [currentTeacher.assignedSection];
    }
    return ['A', 'B', 'C', 'D'];
  }, [currentTeacher, selectedGrade]);`;

content = content.replace(toMove, '');

const targetLocation = `  const [selectedGrade, setSelectedGrade] = useState('All');`;
content = content.replace(targetLocation, toMove + '\n\n' + targetLocation);

fs.writeFileSync('src/components/GradeTrackerSection.tsx', content, 'utf8');
console.log('Fixed gradeOptions location.');
