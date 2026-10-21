fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://tinyurl.com/api-create.php?url=https://google.com'))
  .then(res => res.json())
  .then(data => console.log(data.contents))
  .catch(console.error);
