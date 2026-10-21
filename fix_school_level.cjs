const fs = require('fs');
const file = 'src/App.tsx';

if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(
    /onClick=\{\(\) => \{ playInteractiveSound\('click'\); setWlSchoolLevel\('primary'\); \}\}/g,
    "onClick={() => { playInteractiveSound('click'); setWlSchoolLevel('primary'); setWlSelectedGradeForSubjects('Grade 1'); }}"
  );
  
  content = content.replace(
    /onClick=\{\(\) => \{ playInteractiveSound\('click'\); setWlSchoolLevel\('secondary'\); \}\}/g,
    "onClick={() => { playInteractiveSound('click'); setWlSchoolLevel('secondary'); setWlSelectedGradeForSubjects('Grade 9'); }}"
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated school level click handlers');
}
