const fs = require('fs');
const files = ['src/App.tsx', 'src/components/ClassSetupSection.tsx', 'src/components/GradeTrackerSection.tsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if there are <input ... bg-white ... > that lack dark:bg-*
    content = content.replace(/<input([^>]*?)className="([^"]*?)bg-white([^"]*?)"/g, (match, p1, p2, p3) => {
       if (p2.includes('dark:bg-') || p3.includes('dark:bg-')) return match;
       return `<input${p1}className="${p2}bg-white dark:bg-slate-800 dark:text-white${p3}"`;
    });
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated inputs in ${file}`);
  }
});
