import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/shorten',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`problem: ${e.message}`);
});

req.write(JSON.stringify({
  longUrl: 'https://ais-dev-5q7s4p2e6h6jv2n4ihpsav-19825547759.europe-west2.run.app/?school=diligent',
}));
req.end();
