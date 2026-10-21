const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\{!newStudentCameraError && \(\s+<button[\s\S]*?onClick=\{toggleNewStudentCameraFacing\}[\s\S]*?<\/button>\s+<button[\s\S]*?onClick=\{captureNewStudentPhoto\}[\s\S]*?<\/button>\s+\)}/,
  `{!newStudentCameraError && (
    <>
      <button
        type="button"
        onClick={toggleNewStudentCameraFacing}
        className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        title="ካሜራ ቀይር (Switch Camera)"
      >
        <RefreshCw className="w-3.5 h-3.5" /> ቀይር
      </button>
      <button
        type="button"
        onClick={captureNewStudentPhoto}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
      >
        <Camera className="w-3.5 h-3.5" /> ፎቶ አንሳ (Capture)
      </button>
    </>
  )}`
);

code = code.replace(
  /\{!editStudentCameraError && \(\s+<button[\s\S]*?onClick=\{toggleEditStudentCameraFacing\}[\s\S]*?<\/button>\s+<button[\s\S]*?onClick=\{captureEditStudentPhoto\}[\s\S]*?<\/button>\s+\)}/,
  `{!editStudentCameraError && (
    <>
      <button
        type="button"
        onClick={toggleEditStudentCameraFacing}
        className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        title="ካሜራ ቀይር (Switch Camera)"
      >
        <RefreshCw className="w-3.5 h-3.5" /> ቀይር
      </button>
      <button
        type="button"
        onClick={captureEditStudentPhoto}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
      >
        <Camera className="w-3.5 h-3.5" /> ፎቶ አንሳ (Capture)
      </button>
    </>
  )}`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed JSX');
