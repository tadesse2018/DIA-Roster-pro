const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const modalStartIdx = code.indexOf('id="student-id-card"');
if(modalStartIdx === -1) throw new Error("not found");

const flexContainerStart = code.lastIndexOf('<div className="flex justify-center py-4">', modalStartIdx);
if(flexContainerStart === -1) throw new Error("not found container");

code = code.substring(0, flexContainerStart) + 
       '<div className="flex flex-col md:flex-row gap-4 items-center justify-center py-4">' + 
       code.substring(flexContainerStart + '<div className="flex justify-center py-4">'.length);

const qrCodeStart = code.indexOf('{/* Dynamic High-Contrast QR Code Wrapper */}', modalStartIdx);
const endOfCard = code.indexOf('</div>\n                </div>\n                {/* Modal Controls (No-Print) */}', qrCodeStart);

if(qrCodeStart === -1 || endOfCard === -1) throw new Error("qr section not found");

// replace from qrCodeStart up to endOfCard
const replacement = `                    {/* Bottom Metadata Badges */}
                    <div className="space-y-1.5 z-10">
                      <div className="grid grid-cols-2 gap-1.5 text-[9px] text-stone-300">
                        <div className="bg-black/30 border border-white/5 py-1 px-1.5 rounded-xl">
                          <span className="text-[7px] text-indigo-200 block uppercase font-bold">መታወቂያ (ID)</span>
                          <span className="font-mono font-black text-indigo-300">{selectedQRStudent.id}</span>
                        </div>
                        <div className="bg-black/30 border border-white/5 py-1 px-1.5 rounded-xl">
                          <span className="text-[7px] text-indigo-200 block uppercase font-bold">ክፍል (Class)</span>
                          <span className="font-bold text-stone-200">{selectedQRStudent.grade} - {selectedQRStudent.section}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BACK CARD */}
                  <div 
                    className="w-[285px] h-[485px] shrink-0 rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden border border-stone-300 shadow-2xl text-center select-none bg-stone-50"
                  >
                    <div className="pt-2 z-10 flex flex-col items-center">
                       <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mb-1">Property of</p>
                       <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">{schoolConfig.nameEng}</h4>
                       <h4 className="text-[11px] font-black text-stone-800 tracking-wide text-center">{schoolConfig.nameAmh}</h4>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center space-y-5 my-auto z-10">
                       <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-200 inline-block">
                         <img 
                           src={\`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=\${encodeURIComponent(selectedQRStudent.id)}\`} 
                           alt={\`QR code for student \${selectedQRStudent.id}\`}
                           className="w-36 h-36"
                           referrerPolicy="no-referrer"
                         />
                       </div>

                       {selectedQRStudent.digitalId && (
                         <div className="bg-stone-200/50 border border-stone-300 py-1.5 px-6 rounded-xl text-center">
                           <span className="text-[7.5px] text-stone-500 block uppercase font-black tracking-wider">ፋይዳ (FIN / FAN)</span>
                           <span className="font-mono font-black text-stone-800 text-sm tracking-widest">{selectedQRStudent.digitalId}</span>
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
                  </div>`;

code = code.substring(0, qrCodeStart) + replacement + code.substring(endOfCard);
fs.writeFileSync('src/App.tsx', code);
console.log('Single student patched');
