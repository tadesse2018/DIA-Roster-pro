const fs = require('fs');

function buildFrontCardContent(isStudent, itemVar) {
  // itemVar is 'student' or 'selectedQRStudent' or 'selectedQRTeacher'
  const isSelected = itemVar.startsWith('selected');
  const roleAmh = isStudent ? 'ተማሪ' : 'መምህር';
  const roleEng = isStudent ? 'STUDENT' : 'TEACHER';
  
  return `
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
                          DILIGENT SCHOOL
                        </span>
                        <h4 className="text-[13px] font-black text-white tracking-wide text-center leading-tight mt-1">
                          የደሊጀነት ት/ቤት
                        </h4>
                        <p className="text-[7.5px] italic text-indigo-100 font-bold mt-1.5 text-center">
                          {schoolConfig.mottoAmh || schoolConfig.mottoEng || 'ለመማር እንነሳ!'}
                        </p>
                      </div>
                    </div>

                    {/* Photo & Name */}
                    <div className="flex flex-col items-center justify-center z-10 mt-3 flex-1">
                      {${itemVar}.photo ? (
                        <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-white shadow-md bg-stone-100 shrink-0">
                          <img 
                            src={${itemVar}.photo} 
                            alt={${itemVar}.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full border-[3px] border-white shadow-md bg-stone-200 flex items-center justify-center text-2xl font-black text-stone-500 shrink-0">
                          {(${itemVar}.name || 'ST').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      
                      <div className="text-center mt-2.5 w-full px-2">
                        <h3 className="text-[15px] font-black text-stone-900 leading-tight truncate">{${itemVar}.name}</h3>
                        <span className="inline-block mt-1 px-3 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 font-black text-[9px] rounded-full uppercase tracking-wider">
                          ${roleEng} (${roleAmh})
                        </span>
                      </div>
                    </div>

                    {/* Bottom Info Badges */}
                    <div className="w-full mt-auto pt-2 z-10 pb-1">
                      <div className="flex justify-between items-center bg-stone-50 border border-stone-200 rounded-xl p-1.5">
                        <div className="text-center w-1/2 border-r border-stone-200">
                          <span className="text-[8px] text-stone-500 block uppercase font-bold">መታወቂያ (ID)</span>
                          <span className="font-mono font-black text-stone-900 text-xs">{${itemVar}.id}</span>
                        </div>
                        <div className="text-center w-1/2">
                          <span className="text-[8px] text-stone-500 block uppercase font-bold">${isStudent ? 'ክፍል (Class)' : 'ስልክ (Phone)'}</span>
                          <span className="font-bold text-stone-900 text-xs truncate block px-1">${isStudent ? `{${itemVar}.grade} - {${itemVar}.section}` : `{${itemVar}.phone}`}</span>
                        </div>
                      </div>
                    </div>`;
}

function buildBackCardContent(itemVar) {
  return `
                    <div className="pt-3 z-10 flex flex-col items-center">
                       <p className="text-[9px] text-stone-500 font-black uppercase tracking-widest mb-0.5">Property of</p>
                       <h4 className="text-[13px] font-black text-stone-900 tracking-wide text-center">DILIGENT SCHOOL</h4>
                       <h4 className="text-[13px] font-black text-stone-900 tracking-wide text-center mt-0.5">የደሊጀነት ት/ቤት</h4>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center space-y-4 my-auto z-10">
                       <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-stone-200 inline-block">
                         <img 
                           src={\`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=\${encodeURIComponent(${itemVar}.id)}\`} 
                           alt={\`QR code for \${${itemVar}.id}\`}
                           className="w-32 h-32"
                           referrerPolicy="no-referrer"
                         />
                       </div>

                       {${itemVar}.digitalId && (
                         <div className="bg-stone-100 border border-stone-200 py-1.5 px-6 rounded-xl text-center">
                           <span className="text-[8px] text-stone-500 block uppercase font-bold tracking-wider">ፋይዳ (FIN / FAN)</span>
                           <span className="font-mono font-black text-stone-900 text-sm tracking-widest">{${itemVar}.digitalId}</span>
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
                    </div>`;
}

// Write this logic to a string replacement script instead
