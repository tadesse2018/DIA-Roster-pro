const fs = require('fs');

let fileContent = fs.readFileSync('src/App.tsx', 'utf8');

const regexMap = [
  { search: /\{tx\("የወላጅ ኢሜል \(Parent Email\):"\)\}/g, replace: '{tx("የወላጅ ኢሜል (Parent Email):")}' },
  { search: /\{tx\("የወላጅ ስልክ \(Parent Phone\):"\)\}/g, replace: '{tx("የወላጅ ስልክ (Parent Phone):")}' },
  { search: /\{tx\("አድራሻ \(Address - Optional\):"\)\}/g, replace: '{tx("አድራሻ (Address - Optional):")}' },
  { search: /placeholder=\{tx\("አዲስ አበባ፣ ኢትዮጵያ"\)\}/g, replace: 'placeholder={tx("አዲስ አበባ፣ ኢትዮጵያ (Addis Ababa, Ethiopia)")}' },
  { search: /\{tx\("የፋይዳ መታወቂያ \(Student FAN\/FIN - Optional\):"\)\}/g, replace: '{tx("የፋይዳ መታወቂያ (Student FAN/FIN - Optional):")}' },
  { search: /\{tx\("የተማሪው ዲጂታል መለያ ቁጥር \(ባይሞላም ያሳልፋል\)"\)\}/g, replace: '{tx("የተማሪው ዲጂታል መለያ ቁጥር (Student Digital ID - Optional)")}' },
  { search: /\{tx\("ካሜራ ቀይር \(Switch Camera\)"\)\}/g, replace: '{tx("ካሜራ ቀይር (Switch Camera)")}' },
  { search: /\{tx\(" ቀይር\\n      "\)\}/g, replace: '{tx(" ቀይር (Switch)\\n      ")}' },
  { search: /\{tx\(" ፎቶ አንሳ \(Capture\)\\n      "\)\}/g, replace: '{tx(" ፎቶ አንሳ (Capture)\\n      ")}' },
  { search: /\{tx\(" ዝጋ \(Cancel\)\\n                      "\)\}/g, replace: '{tx(" ዝጋ (Cancel)\\n                      ")}' },
  { search: /\{tx\("ፎቶ ቀይር \(Change Photo\)"\)\}/g, replace: '{tx("ፎቶ ቀይር (Change Photo)")}' },
  { search: /\{tx\("ካሜራ ክፈት \(Open Camera\)"\)\}/g, replace: '{tx("ካሜራ ክፈት (Open Camera)")}' },
  { search: /\{tx\("\\n                \\n                  ይቅር \(Cancel\)\\n                "\)\}/g, replace: '{tx("\\n                \\n                  ይቅር (Cancel)\\n                ")}' },
  { search: /\{tx\("ተማሪውን ከሲስተሙ መሰረዝ ይፈልጋሉ\?"\)\}/g, replace: '{tx("ተማሪውን ከሲስተሙ መሰረዝ ይፈልጋሉ? (Are you sure you want to delete this student?)")}' },
  { search: /\{tx\("\\n              \\n                ይቅር \(Cancel\)\\n              "\)\}/g, replace: '{tx("\\n              \\n                ይቅር (Cancel)\\n              ")}' },
  { search: /\{tx\("\\n              \\n                አዎ፣ ሰርዝ \(Yes, Delete\)\\n              "\)\}/g, replace: '{tx("\\n              \\n                አዎ፣ ሰርዝ (Yes, Delete)\\n              ")}' },
  { search: /tx\("የተማሪዎች ስታቲስቲክስ \(Students Stats\)"\)/g, replace: 'tx("የተማሪዎች ስታቲስቲክስ (Students Stats)")' },
  { search: /tx\("የውጤቶች ስታቲስቲክስ \(Grades Stats\)"\)/g, replace: 'tx("የውጤቶች ስታቲስቲክስ (Grades Stats)")' },
  { search: /tx\("የመምህራን ስታቲስቲክስ \(Teachers Stats\)"\)/g, replace: 'tx("የመምህራን ስታቲስቲክስ (Teachers Stats)")' },
  { search: /tx\("አጠቃላይ አማካይ \(General Average\)"\)/g, replace: 'tx("አጠቃላይ አማካይ (General Average)")' },
  { search: /tx\("👫 ጾታ ምጣኔ \(Gender Distribution\)"\)/g, replace: 'tx("👫 ጾታ ምጣኔ (Gender Distribution)")' },
  { search: /\{tx\("ወንድ \(Male\)"\)\}/g, replace: '{tx("ወንድ (Male)")}' },
  { search: /\{tx\(" ተማሪዎች"\)\}/g, replace: '{tx(" ተማሪዎች (Students)")}' },
  { search: /\{tx\("ሴት \(Female\)"\)\}/g, replace: '{tx("ሴት (Female)")}' },
  { search: /tx\("🆕 የቅርብ ጊዜ ተማሪዎች \(Recent Registrations\)"\)/g, replace: 'tx("🆕 የቅርብ ጊዜ ተማሪዎች (Recent Registrations)")' },
  { search: /tx\("📊 የውጤቶች ደረጃ ክፍፍል \(Grade Performance Ranges\)"\)/g, replace: 'tx("📊 የውጤቶች ደረጃ ክፍፍል (Grade Performance Ranges)")' },
  { search: /tx\("ያልጸደቁ \(Pending\)"\)/g, replace: 'tx("ያልጸደቁ (Pending)")' },
  { search: /tx\("የጸደቁ \(Verified\)"\)/g, replace: 'tx("የጸደቁ (Verified)")' },
  { search: /tx\("የክፍል ኃላፊዎች \(Homeroom\)"\)/g, replace: 'tx("የክፍል ኃላፊዎች (Homeroom)")' },
  { search: /tx\("ሌሎች መምህራን \(Regular\)"\)/g, replace: 'tx("ሌሎች መምህራን (Regular)")' },
  { search: /tx\("📚 መምህራን የሚያስተምሯቸው ክፍሎች \(Assigned Grades\)"\)/g, replace: 'tx("📚 መምህራን የሚያስተምሯቸው ክፍሎች (Assigned Grades)")' },
  { search: /tx\("🎓 የትምህርት ደረጃ ክፍፍል \(Education Levels\)"\)/g, replace: 'tx("🎓 የትምህርት ደረጃ ክፍፍል (Education Levels)")' },
  { search: /\{tx\(" መምህራን"\)\}/g, replace: '{tx(" መምህራን (Teachers)")}' },
  { search: /tx\("አጠቃላይ የማለፍ ምጣኔ \(Passing Rate\)"\)/g, replace: 'tx("አጠቃላይ የማለፍ ምጣኔ (Passing Rate)")' },
  { search: /tx\("ከ 100% ውስጥ 50% እና ከዚያ በላይ ያመጡ ተማሪዎች"\)/g, replace: 'tx("ከ 100% ውስጥ 50% እና ከዚያ በላይ ያመጡ ተማሪዎች (Students scoring 50% and above)")' },
  { search: /tx\("ከፍተኛው ውጤት \(Max Score\)"\)/g, replace: 'tx("ከፍተኛው ውጤት (Max Score)")' },
  { search: /tx\("አጠቃላይ ተመዝጋቢ \(Total Graded\)"\)/g, replace: 'tx("አጠቃላይ ተመዝጋቢ (Total Graded)")' },
  { search: /\{tx\(" ውጤቶች\\n                      "\)\}/g, replace: '{tx(" ውጤቶች (Grades)\\n                      ")}' },
  { search: /\{tx\("\\n              \\n                እሺ ተረዳሁ \(Close View\)\\n              "\)\}/g, replace: '{tx("\\n              \\n                እሺ ተረዳሁ (Close View)\\n              ")}' },
  { search: /\{tx\("📥 ፒዲኤፍ ለማውረድ ተዘጋጅቷል!"\)\}/g, replace: '{tx("📥 ፒዲኤፍ ለማውረድ ተዘጋጅቷል! (PDF Ready to Download!)")}' },
  { search: /\{tx\(" ፒዲኤፍ አውርድ \(Click to Download\)\\n              "\)\}/g, replace: '{tx(" ፒዲኤፍ አውርድ (Click to Download)\\n              ")}' },
  { search: /\{tx\("\\n              \\n                ዝጋ \(Close\)\\n              "\)\}/g, replace: '{tx("\\n              \\n                ዝጋ (Close)\\n              ")}' },
];

regexMap.forEach(item => {
  fileContent = fileContent.replace(item.search, item.replace);
});

fs.writeFileSync('src/App.tsx', fileContent);
