const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Location 1: Sidebar top logo
const sidebarLogoOld = `                            {schoolConfig.logoType === 'graduation' && <GraduationCap className="w-8 h-8 stroke-[1.75]" />}
                            {schoolConfig.logoType === 'book' && <BookOpen className="w-8 h-8 stroke-[1.75]" />}
                            {schoolConfig.logoType === 'shield' && <ShieldCheck className="w-8 h-8 stroke-[1.75]" />}
                            {schoolConfig.logoType === 'award' && <Award className="w-8 h-8 stroke-[1.75]" />}
                            {!['graduation', 'book', 'shield', 'award'].includes(schoolConfig.logoType || '') && (
                              <GraduationCap className="w-8 h-8 stroke-[1.75]" />
                            )}`;
const sidebarLogoNew = `                            {schoolConfig.logoImage ? (
                              <img src={schoolConfig.logoImage} alt="Logo" className="w-8 h-8 object-contain" />
                            ) : (
                              <GraduationCap className="w-8 h-8 stroke-[1.75]" />
                            )}`;
content = content.replace(sidebarLogoOld, sidebarLogoNew);

// Function to replace other standard logo blocks
function replaceLogoBlock(oldBlock, imgClass, iconClass) {
  if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, `                        {schoolConfig.logoImage ? (
                          <img src={schoolConfig.logoImage} alt="Logo" className="${imgClass}" />
                        ) : schoolConfig.logoType === 'graduation' ? (
                          <GraduationCap className="${iconClass}" />
                        ) : schoolConfig.logoType === 'book' ? (
                          <BookOpen className="${iconClass}" />
                        ) : schoolConfig.logoType === 'shield' ? (
                          <Shield className="${iconClass}" />
                        ) : (
                          <Award className="${iconClass}" />
                        )}`);
  }
}

// 8721 - 8727
replaceLogoBlock(`                        {schoolConfig.logoType === 'graduation' ? (
                          <GraduationCap className="w-6 h-6 text-indigo-700" />
                        ) : schoolConfig.logoType === 'book' ? (
                          <BookOpen className="w-6 h-6 text-indigo-700" />
                        ) : schoolConfig.logoType === 'shield' ? (
                          <Shield className="w-6 h-6 text-indigo-700" />
                        ) : (
                          <Award className="w-6 h-6 text-indigo-700" />
                        )}`, "w-8 h-8 object-contain", "w-6 h-6 text-indigo-700");

// 9068 - 9074
replaceLogoBlock(`                          {schoolConfig.logoType === 'graduation' ? (
                            <GraduationCap className="w-6 h-6 text-indigo-700" />
                          ) : schoolConfig.logoType === 'book' ? (
                            <BookOpen className="w-6 h-6 text-indigo-700" />
                          ) : schoolConfig.logoType === 'shield' ? (
                            <Shield className="w-6 h-6 text-indigo-700" />
                          ) : (
                            <Award className="w-6 h-6 text-indigo-700" />
                          )}`, "w-8 h-8 object-contain", "w-6 h-6 text-indigo-700");

// 9302 - 9308
replaceLogoBlock(`      {schoolConfig.logoType === 'graduation' ? (
        <GraduationCap className="w-5 h-5 text-indigo-700" />
      ) : schoolConfig.logoType === 'book' ? (
        <BookOpen className="w-5 h-5 text-indigo-700" />
      ) : schoolConfig.logoType === 'shield' ? (
        <Shield className="w-5 h-5 text-indigo-700" />
      ) : (
        <Award className="w-5 h-5 text-indigo-700" />
      )}`, "w-6 h-6 object-contain", "w-5 h-5 text-indigo-700");

// Watermark
const watermarkOld = `                      {schoolConfig.logoType === 'graduation' && <GraduationCap className="w-80 h-80 text-amber-900" />}
                      {schoolConfig.logoType === 'book' && <BookOpen className="w-80 h-80 text-amber-900" />}
                      {schoolConfig.logoType === 'shield' && <ShieldCheck className="w-80 h-80 text-amber-900" />}
                      {schoolConfig.logoType === 'award' && <Award className="w-80 h-80 text-amber-900" />}`;
const watermarkNew = `                      {schoolConfig.logoImage ? (
                        <img src={schoolConfig.logoImage} alt="" className="w-80 h-80 object-contain opacity-20 grayscale" />
                      ) : (
                        <GraduationCap className="w-80 h-80 text-amber-900" />
                      )}`;
content = content.replace(watermarkOld, watermarkNew);

// Report Header
const reportHeaderOld = `                          {schoolConfig.logoType === 'graduation' && <GraduationCap className="w-10 h-10 text-slate-800" />}
                          {schoolConfig.logoType === 'book' && <BookOpen className="w-10 h-10 text-slate-800" />}
                          {schoolConfig.logoType === 'shield' && <ShieldCheck className="w-10 h-10 text-slate-800" />}
                          {schoolConfig.logoType === 'award' && <Award className="w-10 h-10 text-slate-800" />}`;
const reportHeaderNew = `                          {schoolConfig.logoImage ? (
                            <img src={schoolConfig.logoImage} alt="Logo" className="w-10 h-10 object-contain" />
                          ) : (
                            <GraduationCap className="w-10 h-10 text-slate-800" />
                          )}`;
content = content.replace(reportHeaderOld, reportHeaderNew);

// Print Header
const printHeaderOld = `                {schoolConfig.logoType === 'graduation' && <GraduationCap className="w-12 h-12 text-slate-800" />}
                {schoolConfig.logoType === 'book' && <BookOpen className="w-12 h-12 text-slate-800" />}
                {schoolConfig.logoType === 'shield' && <ShieldCheck className="w-12 h-12 text-slate-800" />}
                {schoolConfig.logoType === 'award' && <Award className="w-12 h-12 text-slate-800" />}`;
const printHeaderNew = `                {schoolConfig.logoImage ? (
                  <img src={schoolConfig.logoImage} alt="Logo" className="w-12 h-12 object-contain" />
                ) : (
                  <GraduationCap className="w-12 h-12 text-slate-800" />
                )}`;
content = content.replace(printHeaderOld, printHeaderNew);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Logos updated.');
