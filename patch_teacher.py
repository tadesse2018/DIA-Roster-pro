import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

teacher_re = re.compile(r'<div className="qr-card-container.*?<div className="mt-3 flex flex-col items-center justify-center">.*?የርዕሰ መምህር ፊርማ \(Principal Signature\).*?</span>\s*</div>\s*</div>\s*</div>\s*</div>', re.DOTALL)

replacement = """<div className="qr-card-container w-[240px] h-[380px] bg-white rounded-2xl relative overflow-hidden text-center mx-auto border border-stone-200 shadow-xl flex flex-col p-3 shrink-0" style={{ margin: 'auto' }}>
  {/* Header Strip */}
  <div className="bg-gradient-to-r from-blue-700 to-indigo-900 absolute top-0 left-0 right-0 h-[100px] rounded-b-[2rem] z-0 shadow-sm" />

  {/* Header Content */}
  <div className="space-y-1.5 z-10 flex flex-col items-center mt-1">
    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-indigo-100 z-10 mb-0.5">
      {schoolConfig.logoType === 'graduation' ? (
        <GraduationCap className="w-5 h-5 text-indigo-700" />
      ) : schoolConfig.logoType === 'book' ? (
        <BookOpen className="w-5 h-5 text-indigo-700" />
      ) : schoolConfig.logoType === 'shield' ? (
        <Shield className="w-5 h-5 text-indigo-700" />
      ) : (
        <Award className="w-5 h-5 text-indigo-700" />
      )}
    </div>
    
    <div className="flex flex-col items-center justify-center w-full px-2">
      <span className="font-sans font-black text-[9px] uppercase tracking-wider text-amber-300 block text-center leading-none">
        {schoolConfig.nameEng || "DILIGENT SCHOOL"}
      </span>
      <h4 className="text-[12px] font-black text-white tracking-wide text-center leading-tight mt-1">
        {schoolConfig.nameAmh || "የደሊጀነት ት/ቤት"}
      </h4>
    </div>
  </div>

  {/* Middle Profile & QR */}
  <div className="flex flex-col items-center justify-center z-10 mt-3 flex-1">
    <div className="text-center w-full px-2 mb-3">
      <h3 className="text-[14px] font-black text-stone-900 leading-tight truncate">{selectedQRTeacher.name}</h3>
      <span className="inline-block mt-1 px-3 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 font-black text-[9px] rounded-full uppercase tracking-wider">
        TEACHER (መምህር)
      </span>
    </div>

    <div className="bg-white p-1.5 rounded-xl shadow-sm border border-stone-200">
      <img 
        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedQRTeacher.id)}`} 
        alt={`QR code for teacher ${selectedQRTeacher.id}`}
        className="w-24 h-24"
        referrerPolicy="no-referrer"
      />
    </div>
  </div>

  {/* Bottom Info Badges & Signature */}
  <div className="w-full mt-auto pt-2 z-10 pb-1">
    <div className="flex justify-between items-center bg-stone-50 border border-stone-200 rounded-xl p-1.5 mb-2">
      <div className="text-center w-1/2 border-r border-stone-200">
        <span className="text-[7.5px] text-stone-500 block uppercase font-bold">መታወቂያ (ID)</span>
        <span className="font-mono font-black text-stone-900 text-xs">{selectedQRTeacher.id}</span>
      </div>
      <div className="text-center w-1/2">
        <span className="text-[7.5px] text-stone-500 block uppercase font-bold">ስልክ (Phone)</span>
        <span className="font-bold text-stone-900 text-xs truncate block px-1">{selectedQRTeacher.phone}</span>
      </div>
    </div>
    
    <div className="flex flex-col items-center justify-center">
      <div className="w-32 h-px border-t border-dashed border-stone-400 mb-1"></div>
      <span className="text-[7px] text-stone-500 font-black uppercase tracking-widest">
        የርዕሰ መምህር ፊርማ (Principal Signature)
      </span>
    </div>
  </div>
</div>"""

if not teacher_re.search(code):
    print("Could not find teacher card to replace!")
else:
    code = teacher_re.sub(replacement, code)
    print("Replaced teacher card.")
    
with open('src/App.tsx', 'w') as f:
    f.write(code)
