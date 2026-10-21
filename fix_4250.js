const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
lines[4251] = '                                 style={{';
lines[4252] = '                                   width: `${filteredGradesForSchool.length > 0 ? Math.round(filteredGradesForSchool.reduce((sum, g) => sum + g.total, 0) / filteredGradesForSchool.length) : 0}%`';
lines[4253] = '                                 }}';
lines.splice(4254, 1);
fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
