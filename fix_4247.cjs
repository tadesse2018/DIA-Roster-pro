const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const replacement = `                              <div 
                                className="h-full bg-indigo-600 rounded-full" 
                                style={{ 
                                  width: \`\${filteredGradesForSchool.length > 0 
                                    ? Math.round(filteredGradesForSchool.reduce((sum, g) => sum + g.total, 0) / filteredGradesForSchool.length) 
                                    : 0}%\` 
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <span className="text-lg font-black">📈</span>
                          </div>
                        </div>
                      </div>
                      </div>
                      
                      {/* Principal academic performance analytics bar chart */}
                      <div className="print:hidden">
                        <PrincipalAnalytics 
                          students={filteredStudentsForSchool} 
                          grades={filteredGradesForSchool} 
                          schoolConfig={schoolConfig}
                          classes={filteredClassesForSchool}
                        />
                      </div>`;

lines.splice(4246, 21, ...replacement.split('\n'));
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
