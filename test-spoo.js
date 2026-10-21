const http = require('http');
fetch('https://spoo.me/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  },
  body: 'url=https://example.com'
}).then(r => r.json()).then(console.log).catch(console.error);
