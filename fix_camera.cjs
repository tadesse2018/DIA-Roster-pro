const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /onClick=\{startNewStudentCamera\}/g,
  "onClick={() => startNewStudentCamera(newStudentCameraFacing)}"
);

code = code.replace(
  /onClick=\{startEditStudentCamera\}/g,
  "onClick={() => startEditStudentCamera(editStudentCameraFacing)}"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed camera onclick');
