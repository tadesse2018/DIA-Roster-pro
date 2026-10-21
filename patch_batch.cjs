const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// target to chunk by 2
const chunkTarget = `                  const chunks = [];
                  for (let i = 0; i < filtered.length; i += 4) {
                    chunks.push(filtered.slice(i, i + 4));
                  }`;
const chunkRepl = `                  const chunks = [];
                  for (let i = 0; i < filtered.length; i += 2) {
                    chunks.push(filtered.slice(i, i + 2));
                  }`;
code = code.replace(chunkTarget, chunkRepl);

// target loop map
const mapTargetStart = `                      {pageStudents.map(student => (
                        <div 
                          key={student.id}
                          className="w-[285px] h-[485px] shrink-0 rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden border border-blue-500/30 shadow-xl text-center select-none bg-gradient-to-br from-blue-600 via-blue-800 to-indigo-950"
                        >`;
const qrCodeTargetInBatch = `{/* Dynamic High-Contrast QR Code Wrapper */}
                          <div className="flex justify-center z-10">
                            <div className="bg-white p-2 rounded-2xl shadow-lg border border-indigo-500/20">
                              <img 
                                src={\`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=\${encodeURIComponent(student.id)}\`} 
                                alt={\`QR code for student \${student.id}\`}
                                className="w-28 h-28"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>

                          {/* Bottom Metadata Badges */}
                          <div className="space-y-1.5 z-10">
                            {student.digitalId && (
                              <div className="bg-black/40 border border-indigo-500/30 py-1 px-2 rounded-xl text-center">
                                <span className="text-[7px] text-indigo-300 block uppercase font-black tracking-wider">ፋይዳ (FIN / FAN)</span>
                                <span className="font-mono font-black text-amber-400 text-xs">{student.digitalId}</span>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-1.5 text-[9px] text-stone-300">
                              <div className="bg-black/30 border border-white/5 py-1 px-1.5 rounded-xl">
                                <span className="text-[7px] text-indigo-200 block uppercase font-bold">መታወቂያ (ID)</span>
                                <span className="font-mono font-black text-indigo-300">{student.id}</span>
                              </div>
                              <div className="bg-black/30 border border-white/5 py-1 px-1.5 rounded-xl">
                                <span className="text-[7px] text-indigo-200 block uppercase font-bold">ክፍል (Class)</span>
                                <span className="font-bold text-stone-200">{student.grade} - {student.section}</span>
                              </div>
                            </div>
                            
                            <p className="text-[6px] text-white/40 mt-1 uppercase tracking-wider text-center max-w-[90%] mx-auto leading-tight">
                              ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።
                            </p>
                            
                            <div className="mt-1 flex flex-col items-center justify-center">
                              <div className="w-16 h-px border-t border-dashed border-white/40 mb-0.5"></div>
                              <span className="text-[4px] text-white/50 font-bold uppercase tracking-widest">
                                የርዕሰ መምህር ፊርማ (Principal Signature)
                              </span>
                            </div>
                          </div>
                        </div>`;

const mapReplStart = `                      {pageStudents.map(student => (
                        <React.Fragment key={student.id}>
                        <div 
                          className="w-[285px] h-[485px] shrink-0 rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden border border-blue-500/30 shadow-xl text-center select-none bg-gradient-to-br from-blue-600 via-blue-800 to-indigo-950"
                        >`;

const mapReplEnd = `                          {/* Bottom Metadata Badges */}
                          <div className="space-y-1.5 z-10">
                            <div className="grid grid-cols-2 gap-1.5 text-[9px] text-stone-300">
                              <div className="bg-black/30 border border-white/5 py-1 px-1.5 rounded-xl">
                                <span className="text-[7px] text-indigo-200 block uppercase font-bold">መታወቂያ (ID)</span>
                                <span className="font-mono font-black text-indigo-300">{student.id}</span>
                              </div>
                              <div className="bg-black/30 border border-white/5 py-1 px-1.5 rounded-xl">
                                <span className="text-[7px] text-indigo-200 block uppercase font-bold">ክፍል (Class)</span>
                                <span className="font-bold text-stone-200">{student.grade} - {student.section}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* BACK CARD */}
                        <div 
                          className="w-[285px] h-[485px] shrink-0 rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden border border-stone-300 shadow-xl text-center select-none bg-stone-50"
                        >
                          <div className="pt-2 z-10 flex flex-col items-center">
                             <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mb-1">Property of</p>
                             <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">{schoolConfig.nameEng}</h4>
                             <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">{schoolConfig.nameAmh}</h4>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center space-y-5 my-auto z-10">
                             <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-200 inline-block">
                               <img 
                                 src={\`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=\${encodeURIComponent(student.id)}\`} 
                                 alt={\`QR code for student \${student.id}\`}
                                 className="w-36 h-36"
                                 referrerPolicy="no-referrer"
                               />
                             </div>

                             {student.digitalId && (
                               <div className="bg-stone-200/50 border border-stone-300 py-1.5 px-6 rounded-xl text-center">
                                 <span className="text-[7.5px] text-stone-500 block uppercase font-black tracking-wider">ፋይዳ (FIN / FAN)</span>
                                 <span className="font-mono font-black text-stone-800 text-sm tracking-widest">{student.digitalId}</span>
                               </div>
                             )}
                          </div>

                          <div className="z-10 pb-2">
                             <p className="text-[8px] text-stone-500 leading-snug max-w-[200px] mx-auto font-medium text-center mb-6">
                               ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።
                             </p>
                             <div className="flex flex-col items-center justify-center">
                               <div className="w-32 h-px border-t border-dashed border-stone-400 mb-1"></div>
                               <span className="text-[6px] text-stone-500 font-bold uppercase tracking-widest">
                                 የርዕሰ መምህር ፊርማ (Principal Signature)
                               </span>
                             </div>
                          </div>
                        </div>
                        </React.Fragment>`;

if(code.indexOf(mapTargetStart) !== -1) {
  code = code.replace(mapTargetStart, mapReplStart);
  if(code.indexOf(qrCodeTargetInBatch) !== -1) {
    code = code.replace(qrCodeTargetInBatch, mapReplEnd);
    console.log("Patched batch loop");
  } else {
    console.log("Could not find batch end target");
  }
} else {
  console.log("Could not find batch start target");
}

fs.writeFileSync('src/App.tsx', code);
