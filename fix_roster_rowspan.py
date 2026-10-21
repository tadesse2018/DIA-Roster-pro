with open('src/components/GradeTrackerSection.tsx', 'r') as f:
    content = f.read()

old_code = """                            return (
                              <tr key={student.id + '-' + row.id} className={'border-b border-slate-300 text-slate-900 ' + rowBgClass + ' ' + printRowClass} style={rowBgStyle}>
                                {/* No., Name, Sex, and Age Columns - Pseudo Vertical merging (fixing Chrome Print bug with rowspan) */}
                                <td 
                                  className={`p-1 border border-slate-950 text-center font-bold text-xs bg-white text-slate-950 font-mono student-info-cell ${mergedCellClass}`}
                                  style={{ verticalAlign: 'middle', borderColor: '#000000', borderBottom: isLastRow ? '3.5px solid #000000' : 'none', borderTop: isFirstRow ? undefined : 'none' }}
                                >
                                  {isMiddleRow ? (sIdx + 1) : null}
                                </td>
                                <td 
                                  className={`p-1.5 border border-slate-950 font-black text-xs text-slate-950 min-w-[150px] bg-white student-info-cell-name ${mergedCellClass}`}
                                  style={{ verticalAlign: 'middle', textAlign: 'left', borderColor: '#000000', borderBottom: isLastRow ? '3.5px solid #000000' : 'none', borderTop: isFirstRow ? undefined : 'none' }}
                                >
                                  {isMiddleRow ? student.name : null}
                                </td>
                                <td 
                                  className={`p-1 border border-slate-950 text-center font-bold text-xs bg-white text-slate-950 student-info-cell ${mergedCellClass}`}
                                  style={{ verticalAlign: 'middle', borderColor: '#000000', borderBottom: isLastRow ? '3.5px solid #000000' : 'none', borderTop: isFirstRow ? undefined : 'none' }}
                                >
                                  {isMiddleRow ? ((student.gender === 'Female' || student.gender === 'F') ? 'F' : 'M') : null}
                                </td>
                                <td 
                                  className={`p-1 border border-slate-950 text-center font-bold text-xs bg-white text-slate-950 font-mono student-info-cell ${mergedCellClass}`}
                                  style={{ verticalAlign: 'middle', borderColor: '#000000', borderBottom: isLastRow ? '3.5px solid #000000' : 'none', borderTop: isFirstRow ? undefined : 'none' }}
                                >
                                  {isMiddleRow ? getStudentAge(student) : null}
                                </td>"""

new_code = """                            return (
                              <tr key={student.id + '-' + row.id} className={'border-b border-slate-300 text-slate-900 ' + rowBgClass + ' ' + printRowClass} style={rowBgStyle}>
                                {/* No., Name, Sex, and Age Columns - Proper Vertical merging using rowSpan */}
                                {isFirstRow && (
                                  <>
                                    <td 
                                      rowSpan={rowsToRender.length}
                                      className="p-1 border border-slate-950 text-center font-bold text-xs bg-white text-slate-950 font-mono student-info-cell"
                                      style={{ verticalAlign: 'middle', borderColor: '#000000', borderBottom: '3.5px solid #000000' }}
                                    >
                                      {sIdx + 1}
                                    </td>
                                    <td 
                                      rowSpan={rowsToRender.length}
                                      className="p-1.5 border border-slate-950 font-black text-xs text-slate-950 min-w-[150px] bg-white student-info-cell-name"
                                      style={{ verticalAlign: 'middle', textAlign: 'left', borderColor: '#000000', borderBottom: '3.5px solid #000000' }}
                                    >
                                      {student.name}
                                    </td>
                                    <td 
                                      rowSpan={rowsToRender.length}
                                      className="p-1 border border-slate-950 text-center font-bold text-xs bg-white text-slate-950 student-info-cell"
                                      style={{ verticalAlign: 'middle', borderColor: '#000000', borderBottom: '3.5px solid #000000' }}
                                    >
                                      {(student.gender === 'Female' || student.gender === 'F') ? 'F' : 'M'}
                                    </td>
                                    <td 
                                      rowSpan={rowsToRender.length}
                                      className="p-1 border border-slate-950 text-center font-bold text-xs bg-white text-slate-950 font-mono student-info-cell"
                                      style={{ verticalAlign: 'middle', borderColor: '#000000', borderBottom: '3.5px solid #000000' }}
                                    >
                                      {getStudentAge(student)}
                                    </td>
                                  </>
                                )}"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open('src/components/GradeTrackerSection.tsx', 'w') as f:
        f.write(content)
    print("Reverted to standard rowSpan successfully!")
else:
    print("Could not find old_code in GradeTrackerSection.tsx")
