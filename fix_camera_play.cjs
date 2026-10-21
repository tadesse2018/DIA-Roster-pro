const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /if \(newStudentVideoRef.current\) {\s+newStudentVideoRef.current.srcObject = stream;\s+}/g,
  `if (newStudentVideoRef.current) {
          newStudentVideoRef.current.srcObject = stream;
          newStudentVideoRef.current.setAttribute('playsinline', 'true');
          newStudentVideoRef.current.play().catch(() => {});
        }`
);

code = code.replace(
  /if \(editStudentVideoRef.current\) {\s+editStudentVideoRef.current.srcObject = stream;\s+}/g,
  `if (editStudentVideoRef.current) {
          editStudentVideoRef.current.srcObject = stream;
          editStudentVideoRef.current.setAttribute('playsinline', 'true');
          editStudentVideoRef.current.play().catch(() => {});
        }`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed camera play');
