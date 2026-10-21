import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

# I will find `{/* Bottom Info Badges */}` section and ensure there is an extra `</div>` after it for the card.
# Currently it is:
#                     {/* Bottom Info Badges */}
#                     <div className="w-full mt-auto pt-2 z-10 pb-1">
#                       <div className="flex justify-between items-center bg-stone-50 border border-stone-200 rounded-xl p-1.5">
#                         <div className="text-center w-1/2 border-r border-stone-200">
#                           <span className="text-[8px] text-stone-500 block uppercase font-bold">መታወቂያ (ID)</span>
#                           <span className="font-mono font-black text-stone-900 text-xs">{student.id}</span>
#                         </div>
#                         <div className="text-center w-1/2">
#                           <span className="text-[8px] text-stone-500 block uppercase font-bold">ክፍል (Class)</span>
#                           <span className="font-bold text-stone-900 text-xs truncate block px-1">{student.grade} - {student.section}</span>
#                         </div>
#                       </div>
#                     </div>

# If there's NO `</div>` immediately following it before `{/* BACK CARD */}` or `{/* Modal Controls`, I will add it.
# Actually, the simplest is to replace `</div>\n                    </div>\n                          </div>` with `</div>\n                    </div>\n</div>\n                          </div>` NO wait.

# Let's just fix it by looking at the missing `</div>` for the student-id-card.

code = code.replace(
'''                    {/* Bottom Info Badges */}
                    <div className="w-full mt-auto pt-2 z-10 pb-1">
                      <div className="flex justify-between items-center bg-stone-50 border border-stone-200 rounded-xl p-1.5">
                        <div className="text-center w-1/2 border-r border-stone-200">
                          <span className="text-[8px] text-stone-500 block uppercase font-bold">መታወቂያ (ID)</span>
                          <span className="font-mono font-black text-stone-900 text-xs">{student.id}</span>
                        </div>
                        <div className="text-center w-1/2">
                          <span className="text-[8px] text-stone-500 block uppercase font-bold">ክፍል (Class)</span>
                          <span className="font-bold text-stone-900 text-xs truncate block px-1">{student.grade} - {student.section}</span>
                        </div>
                      </div>
                    </div>''',
'''                    {/* Bottom Info Badges */}
                    <div className="w-full mt-auto pt-2 z-10 pb-1">
                      <div className="flex justify-between items-center bg-stone-50 border border-stone-200 rounded-xl p-1.5">
                        <div className="text-center w-1/2 border-r border-stone-200">
                          <span className="text-[8px] text-stone-500 block uppercase font-bold">መታወቂያ (ID)</span>
                          <span className="font-mono font-black text-stone-900 text-xs">{student.id}</span>
                        </div>
                        <div className="text-center w-1/2">
                          <span className="text-[8px] text-stone-500 block uppercase font-bold">ክፍል (Class)</span>
                          <span className="font-bold text-stone-900 text-xs truncate block px-1">{student.grade} - {student.section}</span>
                        </div>
                      </div>
                    </div>
                  </div>'''
)

code = code.replace(
'''                    {/* Bottom Info Badges */}
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
                    </div>''',
'''                    {/* Bottom Info Badges */}
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
                  </div>'''
)

# And for back cards
code = code.replace(
'''                         <span className="text-[7.5px] text-stone-500 font-black uppercase tracking-widest">
                           የርዕሰ መምህር ፊርማ (Principal Signature)
                         </span>
                       </div>
                    </div>''',
'''                         <span className="text-[7.5px] text-stone-500 font-black uppercase tracking-widest">
                           የርዕሰ መምህር ፊርማ (Principal Signature)
                         </span>
                       </div>
                    </div>
                  </div>'''
)

with open('src/App.tsx', 'w') as f:
    f.write(code)

