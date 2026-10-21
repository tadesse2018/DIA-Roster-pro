import http from 'http';

const req = http.request('http://localhost:3000', (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('Length:', data.length));
});
req.on('error', e => console.error(e));
req.end();
