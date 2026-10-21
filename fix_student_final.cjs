const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

let startStr = '{selectedQRStudent && (';
let startIdx = code.indexOf(startStr);
let endStr = '{/* Teacher QR Card Modal for Save / Print */}';
let endIdx = code.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
    console.log("Could not find bounds");
    process.exit(1);
}

let modalContent = `            {selectedQRStudent && (
              <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 overflow-y-auto" id="print-qr-modal">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedQRStudent(null)}
                className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs no-print"
              />

              {/* Dynamic print-specific styles */}
              <style dangerouslySetInnerHTML={{__html: \`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 0 !important;
                  }
                  body {
                    background: white !important;
                    color: black !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  /* Hide all elements during print except the modal card */
                  #root, body > :not(#print-qr-modal) {
                    display: none !important;
                    visibility: hidden !important;
                  }
                  #print-qr-modal {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100vh !important;
                    background: white !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    overflow: visible !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    z-index: 9999999 !important;
                  }
                  #student-id-card {
                    background: white !important;
                    border: 1px solid #e5e7eb !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              \`}} />

              {/* Modal Card wrapper */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-stone-950 border border-stone-800 text-white w-full max-w-3xl p-6 rounded-3xl shadow-2xl z-10 space-y-6 max-h-[95vh] overflow-y-auto print-card-box"
              >
                {/* Modal Header (No-Print) */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-800 no-print">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-stone-200">የQR መታወቂያ ካርድ (QR ID Card)</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedQRStudent(null)}
                    className="p-1 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer animate-fade-in"
                    title="ዝጋ (Close)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Printable ID Card */}
                <div className="flex justify-center py-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                    
                    <div 
                      id="student-id-card"
                      className="w-[240px] h-[380px] rounded-2xl p-3 flex flex-col relative overflow-hidden border border-stone-200 shadow-2xl text-center select-none bg-white shrink-0"
                    >
                      {/* Header Strip */}
                      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 absolute top-0 left-0 right-0 h-[105px] rounded-b-[2rem] z-0 shadow-sm" />
                      
                      {/* School Logo & Branding Header */}
                      <div className="space-y-1.5 z-10 flex flex-col items-center mt-1">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-indigo-100 z-10 mb-0.5">
                          {schoolConfig.logoType === 'graduation' ? (
                            <GraduationCap className="w-6 h-6 text-indigo-700" />
                          ) : schoolConfig.logoType === 'book' ? (
                            <BookOpen className="w-6 h-6 text-indigo-700" />
                          ) : schoolConfig.logoType === 'shield' ? (
                            <Shield className="w-6 h-6 text-indigo-700" />
                          ) : (
                            <Award className="w-6 h-6 text-indigo-700" />
                          )}
                        </div>
                        
                        <div className="flex flex-col items-center justify-center w-full px-2">
                          <span className="font-sans font-black text-[10px] uppercase tracking-wider text-amber-300 block text-center leading-none">
                            {schoolConfig.nameEng || "DILIGENT SCHOOL"}
                          </span>
                          <h4 className="text-[13px] font-black text-white tracking-wide text-center leading-tight mt-1">
                            {schoolConfig.nameAmh || "የደሊጀነት ት/ቤት"}
                          </h4>
                          <p className="text-[7.5px] italic text-indigo-100 font-bold mt-1.5 text-center">
                            {schoolConfig.mottoAmh || schoolConfig.mottoEng || 'ለመማር እንነሳ!'}
                          </p>
                        </div>
                      </div>

                      {/* Photo & Name */}
                      <div className="flex flex-col items-center justify-center z-10 mt-3 flex-1">
                        {selectedQRStudent.photo ? (
                          <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-white shadow-md bg-stone-100 shrink-0">
                            <img 
                              src={selectedQRStudent.photo} 
                              alt={selectedQRStudent.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-full border-[3px] border-white shadow-md bg-stone-200 flex items-center justify-center text-2xl font-black text-stone-500 shrink-0">
                            {(selectedQRStudent.name || 'ST').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        
                        <div className="text-center mt-2 w-full px-2">
                          <h3 className="text-[14px] font-black text-stone-900 leading-tight truncate">{selectedQRStudent.name}</h3>
                          <span className="inline-block mt-1 px-3 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 font-black text-[9px] rounded-full uppercase tracking-wider">
                            STUDENT (ተማሪ)
                          </span>
                        </div>
                      </div>

                      {/* Bottom Info Badges */}
                      <div className="w-full mt-auto pt-2 z-10 pb-1">
                        <div className="flex justify-between items-center bg-stone-50 border border-stone-200 rounded-xl p-1.5">
                          <div className="text-center w-1/2 border-r border-stone-200">
                            <span className="text-[8px] text-stone-500 block uppercase font-bold">መታወቂያ (ID)</span>
                            <span className="font-mono font-black text-stone-900 text-xs">{selectedQRStudent.id}</span>
                          </div>
                          <div className="text-center w-1/2">
                            <span className="text-[8px] text-stone-500 block uppercase font-bold">ክፍል (Class)</span>
                            <span className="font-bold text-stone-900 text-xs truncate block px-1">{selectedQRStudent.grade} - {selectedQRStudent.section}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* BACK CARD */}
                    <div className="w-[240px] h-[380px] shrink-0 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden border border-stone-300 shadow-2xl text-center select-none bg-white">
                      <div className="pt-3 z-10 flex flex-col items-center">
                         <p className="text-[9px] text-stone-500 font-black uppercase tracking-widest mb-0.5">Property of</p>
                         <h4 className="text-[13px] font-black text-stone-900 tracking-wide text-center">{schoolConfig.nameEng || "DILIGENT SCHOOL"}</h4>
                         <h4 className="text-[13px] font-black text-stone-900 tracking-wide text-center mt-0.5">{schoolConfig.nameAmh || "የደሊጀነት ት/ቤት"}</h4>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center space-y-4 my-auto z-10">
                         <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-stone-200 inline-block">
                           <img 
                             src={\`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=\${encodeURIComponent(selectedQRStudent.id)}\`} 
                             alt={\`QR code for \${selectedQRStudent.id}\`}
                             className="w-32 h-32"
                             referrerPolicy="no-referrer"
                           />
                         </div>

                         {selectedQRStudent.digitalId && (
                           <div className="bg-stone-100 border border-stone-200 py-1.5 px-6 rounded-xl text-center">
                             <span className="text-[8px] text-stone-500 block uppercase font-bold tracking-wider">ፋይዳ (FIN / FAN)</span>
                             <span className="font-mono font-black text-stone-900 text-sm tracking-widest">{selectedQRStudent.digitalId}</span>
                           </div>
                         )}
                      </div>

                      <div className="z-10 pb-2">
                         <p className="text-[9px] text-stone-600 leading-snug max-w-[210px] mx-auto font-bold text-center mb-5">
                           ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።
                         </p>
                         <div className="flex flex-col items-center justify-center">
                           <div className="w-40 h-px border-t border-dashed border-stone-400 mb-1.5"></div>
                           <span className="text-[7.5px] text-stone-500 font-black uppercase tracking-widest">
                             የርዕሰ መምህር ፊርማ (Principal Signature)
                           </span>
                         </div>
                      </div>
                    </div>
                    
                  </div>
                </div>

                {/* Modal Controls (No-Print) */}
                <div className="flex flex-col gap-2 pt-3 border-t border-stone-800 no-print">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={async () => {
                        playInteractiveSound('click');
                        try {
                          const url = \`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=\${encodeURIComponent(selectedQRStudent.id)}\`;
                          const response = await fetch(url);
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = \`QR_Code_Student_\${selectedQRStudent.id}_\${selectedQRStudent.name.replace(/\\s+/g, '_')}.png\`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(blobUrl);
                          playInteractiveSound('success');
                        } catch (error) {
                          console.error('Failed programmatically downloading QR code:', error);
                          window.open(\`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=\${encodeURIComponent(selectedQRStudent.id)}\`, '_blank');
                        }
                      }}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> ፒዲኤፍ አውርድ (Click to Download)
                    </button>
                    <button
                      onClick={() => {
                        playInteractiveSound('click');
                        window.print();
                      }}
                      className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> ፕሪንት አድርግ (Print Card)
                    </button>
                  </div>
                </div>
              </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

        `;

code = code.substring(0, startIdx) + modalContent + code.substring(endIdx);
fs.writeFileSync('src/App.tsx', code);
