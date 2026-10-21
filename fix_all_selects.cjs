const fs = require('fs');
const files = ['src/App.tsx', 'src/components/ClassSetupSection.tsx', 'src/components/GradeTrackerSection.tsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // For every select, if it doesn't have dark:bg, add dark styles
    content = content.replace(/<select\b([^>]*?)className="([^"]*?)"([^>]*?)>/g, (match, p1, p2, p3) => {
      if (p2.includes('dark:bg-')) return match; // Already has dark background
      
      let newClass = p2;
      if (!newClass.includes('dark:bg-')) newClass += ' dark:bg-slate-800';
      if (!newClass.includes('dark:text-')) newClass += ' dark:text-slate-100';
      if (!newClass.includes('dark:border-')) newClass += ' dark:border-slate-700';
      
      return `<select${p1}className="${newClass}"${p3}>`;
    });
    
    content = content.replace(/<input\b([^>]*?)className="([^"]*?)"([^>]*?)>/g, (match, p1, p2, p3) => {
      // ignore checkboxes/radios if you want, but adding dark classes to them is fine or harmless usually
      if (p1.includes('type="checkbox"') || p1.includes('type="radio"')) return match;
      if (p2.includes('dark:bg-')) return match; 
      
      let newClass = p2;
      if (p2.includes('bg-white') || p2.includes('bg-slate-50')) {
          if (!newClass.includes('dark:bg-')) newClass += ' dark:bg-slate-800';
          if (!newClass.includes('dark:text-')) newClass += ' dark:text-slate-100';
          if (!newClass.includes('dark:border-')) newClass += ' dark:border-slate-700';
      }
      
      return `<input${p1}className="${newClass}"${p3}>`;
    });
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
