const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [editWsNameEng, setEditWsNameEng] = useState('');",
  "const [editWsNameEng, setEditWsNameEng] = useState('');\n  const [editWsId, setEditWsId] = useState('');"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched editWsId state');
