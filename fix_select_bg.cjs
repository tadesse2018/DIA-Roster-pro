const fs = require('fs');
const files = ['src/App.tsx', 'src/components/ClassSetupSection.tsx', 'src/components/GradeTrackerSection.tsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace bg-white in selects
    content = content.replace(/<select([^>]*?)bg-white/g, '<select$1bg-white dark:bg-slate-800 dark:text-white');
    
    // Also remove bg-white from inputs where it might cause issue? 
    // Wait, the user specifically mentioned "የክፍል መምርጫው ድሮብ ዳወን ሁሉም ቦታ ላይ ይስራ የማይሰራ አለ". 
    // So "The class selection dropdown should work everywhere, some of them don't work".
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
