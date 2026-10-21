const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `const shortenUrl = async (longUrl: string, schoolName?: string): Promise<string> => {
  const params = new URLSearchParams(longUrl.split('?')[1] || '');
  const schoolId = params.get('school') || 'diligent';
  return \`https://tadesse.link/\${schoolId}\`;
};`;

const replacement = `const shortenUrl = async (longUrl: string, schoolName?: string): Promise<string> => {
  try {
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ longUrl })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.shortUrl) return data.shortUrl;
    }
  } catch (err) {
    console.error('Proxy shorten error:', err);
  }
  
  // Fallback if the proxy or API fails
  return longUrl;
};`;

if (content.includes(target)) {
  fs.writeFileSync('src/App.tsx', content.replace(target, replacement));
  console.log('Success');
} else {
  console.log('Target not found');
}
