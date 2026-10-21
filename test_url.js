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
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(JSON.stringify({
  longUrl: 'https://ais-dev-5q7s4p2e6h6jv2n4ihpsav-19825547759.europe-west2.run.app/?school=diligent',
  schoolId: 'diligent'
}));
req.end();
