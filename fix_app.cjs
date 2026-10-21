const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  { s: /tx\("የተማሪ ስም"\)/g, r: 'tx("የተማሪ ስም (Student Name)")' },
  { s: /tx\("መታወቂያ"\)/g, r: 'tx("መታወቂያ (ID)")' },
  { s: /tx\("ክፍል እና ሴክሽን"\)/g, r: 'tx("ክፍል እና ሴክሽን (Grade & Section)")' },
  { s: /tx\("ጾታ"\)/g, r: 'tx("ጾታ (Gender)")' },
  { s: /tx\("ዕድሜ"\)/g, r: 'tx("ዕድሜ (Age)")' },
  { s: /tx\("እርምጃዎች"\)/g, r: 'tx("እርምጃዎች (Actions)")' },
  { s: /tx\("ውጤት እና ሮስተር"\)/g, r: 'tx("ውጤት እና ሮስተር (Grades & Roster)")' },
  { s: /tx\("ዕለታዊ የክፍል ክትትል"\)/g, r: 'tx("ዕለታዊ የክፍል ክትትል (Daily Attendance)")' },
  { s: /tx\("የውጤት ማሳሰቢያ"\)/g, r: 'tx("የውጤት ማሳሰቢያ (Grade Reminder)")' },
  { s: /tx\("የየዕለት ማስታወሻ ደብተር"\)/g, r: 'tx("የየዕለት ማስታወሻ ደብተር (Daily Diary)")' },
  { s: /tx\("ውጤትና ሪፖርት"\)/g, r: 'tx("ውጤትና ሪፖርት (Grades & Report)")' },
  { s: /tx\("የዕለተ_ማስታወሻ"\)/g, r: 'tx("የዕለተ_ማስታወሻ (Diary)")' },
];

replacements.forEach(({s, r}) => {
  content = content.replace(s, r);
});
fs.writeFileSync('src/App.tsx', content);
