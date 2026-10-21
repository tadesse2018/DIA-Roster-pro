const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

function checkBalance(start, end) {
  const slice = content.split('\n').slice(start-1, end).join('\n');
  const re = /<(?:motion\.)?div(?:\s+[\s\S]*?)?>|<\/(?:motion\.)?div\s*>/g;
  let balance = 0;
  let match;
  while ((match = re.exec(slice)) !== null) {
    if (match[0].endsWith('/>')) continue;
    if (match[0].startsWith('</')) balance--;
    else balance++;
  }
  return balance;
}

console.log('4177-5214:', checkBalance(4177, 5214));
console.log('4177-4500:', checkBalance(4177, 4500));
console.log('4501-4900:', checkBalance(4501, 4900));
console.log('4901-5214:', checkBalance(4901, 5214));
console.log('4177-4300:', checkBalance(4177, 4300));
console.log('4301-4400:', checkBalance(4301, 4400));
console.log('4401-4500:', checkBalance(4401, 4500));
console.log('4177-4220:', checkBalance(4177, 4220));
console.log('4221-4250:', checkBalance(4221, 4250));
console.log('4251-4300:', checkBalance(4251, 4300));
