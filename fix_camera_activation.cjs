const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const startNewStudentCamera = async \(mode: 'user' \| 'environment' = newStudentCameraFacing\) => {[\s\S]*?try {[\s\S]*?playInteractiveSound\('click'\);/,
  `const startNewStudentCamera = async (mode: 'user' | 'environment' = newStudentCameraFacing) => {
    setNewStudentCameraError(null);
    setIsNewStudentCameraActive(true);
    try {
      playInteractiveSound('click');`
);

code = code.replace(
  /const stream = await navigator\.mediaDevices\.getUserMedia\(\{ \n        video: \{ facingMode: \{ ideal: mode \} \} \n      \}\);\n      setNewStudentCameraStream\(stream\);\n      setIsNewStudentCameraActive\(true\);/,
  `const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: mode } } 
      });
      setNewStudentCameraStream(stream);`
);


code = code.replace(
  /const startEditStudentCamera = async \(mode: 'user' \| 'environment' = editStudentCameraFacing\) => {[\s\S]*?try {[\s\S]*?playInteractiveSound\('click'\);/,
  `const startEditStudentCamera = async (mode: 'user' | 'environment' = editStudentCameraFacing) => {
    setEditStudentCameraError(null);
    setIsEditStudentCameraActive(true);
    try {
      playInteractiveSound('click');`
);

code = code.replace(
  /const stream = await navigator\.mediaDevices\.getUserMedia\(\{ \n        video: \{ facingMode: \{ ideal: mode \} \} \n      \}\);\n      setEditStudentCameraStream\(stream\);\n      setIsEditStudentCameraActive\(true\);/,
  `const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: mode } } 
      });
      setEditStudentCameraStream(stream);`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed camera activation');
