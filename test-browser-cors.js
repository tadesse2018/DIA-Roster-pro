fetch('https://tinyurl.com/api-create.php?url=https://google.com', {
  headers: {
    'Origin': 'https://example.com'
  }
})
  .then(res => res.headers.get('access-control-allow-origin'))
  .then(console.log)
  .catch(console.error);
