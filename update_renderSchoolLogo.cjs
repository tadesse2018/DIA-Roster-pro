const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldFunc = `  const renderSchoolLogo = (type: string, className = "w-10 h-10") => {
    switch(type) {
      case 'book': return <BookOpen className={className} />;
      case 'shield': return <ShieldCheck className={className} />;
      case 'award': return <Award className={className} />;
      case 'graduation':
      default: return <GraduationCap className={className} />;
    }
  };`;

const newFunc = `  const renderSchoolLogo = (type: string, className = "w-10 h-10", image?: string) => {
    if (image) {
      return <img src={image} alt="Logo" className={\`\${className} object-contain\`} />;
    }
    switch(type) {
      case 'book': return <BookOpen className={className} />;
      case 'shield': return <ShieldCheck className={className} />;
      case 'award': return <Award className={className} />;
      case 'graduation':
      default: return <GraduationCap className={className} />;
    }
  };`;

content = content.replace(oldFunc, newFunc);

const oldCall = `{renderSchoolLogo(schoolConfig.logoType, "w-3.5 h-3.5")}`;
const newCall = `{renderSchoolLogo(schoolConfig.logoType, "w-4 h-4 rounded-full", schoolConfig.logoImage)}`;
content = content.replace(oldCall, newCall);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Fixed renderSchoolLogo in App.tsx');
