fetch('https://tinyurl.com/api-create.php?url=https://google.com')
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
