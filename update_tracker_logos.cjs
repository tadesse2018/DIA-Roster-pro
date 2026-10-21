const fs = require('fs');
let content = fs.readFileSync('src/components/GradeTrackerSection.tsx', 'utf8');

const watermarkOld1 = `                {schoolConfig?.logoType === 'graduation' && <GraduationCap className="w-96 h-96 text-slate-900" />}
                {schoolConfig?.logoType === 'book' && <BookOpen className="w-96 h-96 text-slate-900" />}
                {schoolConfig?.logoType === 'shield' && <ShieldCheck className="w-96 h-96 text-slate-900" />}
                {schoolConfig?.logoType === 'award' && <Award className="w-96 h-96 text-slate-900" />}`;
const watermarkNew1 = `                {schoolConfig?.logoImage ? (
                  <img src={schoolConfig.logoImage} alt="" className="w-96 h-96 object-contain opacity-10 grayscale" />
                ) : (
                  <GraduationCap className="w-96 h-96 text-slate-900" />
                )}`;
content = content.replace(watermarkOld1, watermarkNew1);

const watermarkOld2 = `                        {schoolConfig?.logoType === 'graduation' && <GraduationCap className="w-64 h-64 text-amber-900" />}
                        {schoolConfig?.logoType === 'book' && <BookOpen className="w-64 h-64 text-amber-900" />}
                        {schoolConfig?.logoType === 'shield' && <ShieldCheck className="w-64 h-64 text-amber-900" />}
                        {schoolConfig?.logoType === 'award' && <Award className="w-64 h-64 text-amber-900" />}`;
const watermarkNew2 = `                        {schoolConfig?.logoImage ? (
                          <img src={schoolConfig.logoImage} alt="" className="w-64 h-64 object-contain opacity-20 grayscale" />
                        ) : (
                          <GraduationCap className="w-64 h-64 text-amber-900" />
                        )}`;
content = content.replace(watermarkOld2, watermarkNew2);

fs.writeFileSync('src/components/GradeTrackerSection.tsx', content, 'utf8');
console.log('Logos updated in GradeTrackerSection.');
