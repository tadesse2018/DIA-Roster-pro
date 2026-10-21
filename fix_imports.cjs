const fs = require('fs');

const files = [
  'src/components/PerformanceDashboard.tsx',
  'src/components/PrincipalAnalytics.tsx',
  'src/components/QRScannerModal.tsx',
  'src/components/SchoolInfoModal.tsx',
  'src/components/SimulatedEmailOutbox.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Add import
  if (!content.includes('useLanguage')) {
    // find last import
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, endOfLastImport + 1) + 
              "import { useLanguage } from './LanguageContext';\n" + 
              content.slice(endOfLastImport + 1);
  }
  
  // 2. Add const { tx } = useLanguage(); inside the main component function
  // We'll look for "export const ComponentName"
  const componentMatch = content.match(/export const ([A-Za-z0-9_]+)\s*:\s*React\.FC<[^>]*>\s*=\s*\([^)]*\)\s*=>\s*{/);
  if (!componentMatch) {
    const fnMatch = content.match(/export function ([A-Za-z0-9_]+)\s*\([^)]*\)\s*{/);
    if (fnMatch) {
      const idx = fnMatch.index + fnMatch[0].length;
      content = content.slice(0, idx) + "\n  const { tx } = useLanguage();" + content.slice(idx);
    } else {
      const compMatch2 = content.match(/export const ([A-Za-z0-9_]+)\s*=\s*\([^)]*\)\s*=>\s*{/);
      if (compMatch2) {
        const idx = compMatch2.index + compMatch2[0].length;
        content = content.slice(0, idx) + "\n  const { tx } = useLanguage();" + content.slice(idx);
      }
    }
  } else {
    const idx = componentMatch.index + componentMatch[0].length;
    content = content.slice(0, idx) + "\n  const { tx } = useLanguage();" + content.slice(idx);
  }
  
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
