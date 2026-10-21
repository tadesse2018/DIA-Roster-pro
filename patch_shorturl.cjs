const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `const shortenUrl = async (longUrl: string, schoolName?: string): Promise<string> => {
  const params = new URLSearchParams(longUrl.split('?')[1] || '');
  const schoolId = params.get('school') || 'diligent';
  return \`https://tadesse.link/\${schoolId}\`;
};`;

const replacement = `const shortenUrl = async (longUrl: string, schoolName?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(1000000 * Math.random());
    const script = document.createElement('script');
    
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      if (data && data.shorturl) {
        resolve(data.shorturl);
      } else {
        resolve(longUrl); // fallback
      }
    };
    
    script.src = \`https://is.gd/create.php?format=json&url=\${encodeURIComponent(longUrl)}&callback=\${callbackName}\`;
    script.onerror = () => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      resolve(longUrl); // fallback
    };
    
    document.body.appendChild(script);
  });
};`;

if (content.includes(target)) {
  fs.writeFileSync('src/App.tsx', content.replace(target, replacement));
  console.log('Success');
} else {
  console.log('Target not found');
}
