cat << 'INNEREOF' > id_replacement.txt
                    {/* BACK CARD */}
                    <div className="w-[240px] h-[380px] shrink-0 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden border-4 border-indigo-600/20 shadow-2xl text-center select-none bg-white">
                      <div className="pt-2 z-10 flex flex-col items-center">
                         <h4 className="text-[12px] font-black text-stone-900 tracking-wide text-center">{schoolConfig.nameAmh || "የደሊጀነት ት/ቤት"}</h4>
                      </div>
                      
                      {/* Details List */}
                      <div className="flex flex-col gap-1.5 mt-2 z-10 text-left px-2">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-stone-500">የተማሪ ሙሉ ስም (Student Name)</span>
                            <span className="text-[11px] font-black text-stone-900 border-b border-stone-300 pb-0.5">{selectedQRStudent.name}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-stone-500">የወላጅ ስልክ ቁጥር (Parent Phone)</span>
                            <span className="text-[11px] font-black text-stone-900 border-b border-stone-300 pb-0.5">{selectedQRStudent.parentPhone || '__________________'}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-stone-500">ቀበሌ / ወረዳ (Kebele / Woreda)</span>
                            <span className="text-[11px] font-black text-stone-900 border-b border-stone-300 pb-0.5">__________________</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-stone-500">የወላጅ ሙያ (Parent Occupation)</span>
                            <span className="text-[11px] font-black text-stone-900 border-b border-stone-300 pb-0.5">__________________</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-stone-500">አድራሻ / የቤት ቁ. (Address / House No)</span>
                            <span className="text-[11px] font-black text-stone-900 border-b border-stone-300 pb-0.5">__________________</span>
                         </div>
                      </div>
                      
                      <div className="flex justify-between items-center px-2 mt-auto pb-2 z-10">
                         {selectedQRStudent.digitalId && (
                           <div className="bg-stone-100 border border-stone-200 py-1 px-3 rounded-lg text-center flex-1 mr-2 flex flex-col justify-center">
                             <span className="text-[7px] text-stone-500 block uppercase font-bold tracking-wider">ፋይዳ (FIN / FAN)</span>
                             <span className="font-mono font-black text-stone-900 text-[10px] tracking-widest">{selectedQRStudent.digitalId}</span>
                           </div>
                         )}
                         <div className="bg-white p-1 rounded-xl shadow-sm border border-stone-200 ml-auto flex-shrink-0">
                           <img 
                             src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(selectedQRStudent.id)}`} 
                             alt={`QR code for ${selectedQRStudent.id}`}
                             className="w-[45px] h-[45px]"
                             referrerPolicy="no-referrer"
                           />
                         </div>
                      </div>
                      <div className="w-full flex justify-center pb-2 z-10">
                         <div className="w-32 h-[2px] bg-stone-300 rounded-full"></div>
                      </div>
                    </div>
INNEREOF

# Replace lines 9122 to 9161 with our new block
sed -i -e '9122,9161c\' -e "$(cat id_replacement.txt)" src/App.tsx

