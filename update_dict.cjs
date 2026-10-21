const fs = require('fs');

const missingStrings = JSON.parse(fs.readFileSync('missing_translations.json', 'utf8'));

let translationEntries = [];

// Naive dictionary to map the common ones
const translations = {
  "አጠቃላይ አፈጻጸም ግምገማ": "Overall Performance Review",
  "ምርጥ ውጤት ያለው ክፍል": "Best Performing Class",
  "ልዩ እገዛ የሚፈልግ ክፍል": "Class Requiring Special Support",
  "ርምጃ መውሰጃ": "Actionable Insights",
  "እውነተኛ የውጤት ትንተና": "Actual Grade Analysis",
  "የመምህራን ጠቃሚ ታዛቢዎች (Insights)": "Teachers' Key Insights",
  "የትምህርት ውጤት አጠቃላይ ግራፍ ማሳያ": "Overall Grade Analytics Chart",
  "በጥናቱ የተካተቱ ጠቅላላ ውጤቶች": "Total Analyzed Results",
  "የሁሉም ክፍሎች እና ትምህርቶች አማካይ": "Average of All Classes & Subjects",
  "ያለፉ ተማሪዎች፡": "Passed Students:",
  "| ያላለፉ፡": "| Failed:",
  "ከፍተኛ አፈጻጸም ያስመዘገበ ክፍል": "Top Performing Class",
  "ለንጽጽር የተመረጠ ክፍል፡": "Class Selected for Comparison:",
  "አማካይ_ውጤት": "Average Grade",
  "የተማሪዎች_ብዛት": "Total Students",
  "️ በዚህ ክፍል ውስጥ ለተመረጡት ማጣሪያዎች ምንም የውጤት መረጃ አልተገኘም።": "No grade data found for the selected filters in this class.",
  "A ደረጃ ተማሪዎች": "Grade A Students",
  "B ደረጃ ተማሪዎች": "Grade B Students",
  "C ደረጃ ተማሪዎች": "Grade C Students",
  "D ደረጃ ተማሪዎች": "Grade D Students",
  "በተመረጠው የክፍል ደረጃ ስር የሚገኙ ሴክሽኖች አማካይ ውጤት ንጽጽር": "Average grade comparison of sections under selected grade level",
  "በአሁኑ ሰዓት የተማሪዎች አጠቃላይ ማለፍ ምጣኔ": "Currently, the overall student pass rate is",
  "ሲሆን አማካይ ውጤት ደግሞ": "and the average grade is",
  "ነው።": ".",
  "በከፍተኛ ውጤት እየመራ የሚገኘው ክፍል": "The leading class with highest grades is",
  "በአማካይ": "with an average of",
  "በማስመዝገብ ነው።": ".",
  "አንጻራዊ ዝቅተኛ አማካይ ውጤት ያለው": "Relatively the lowest average grade is in",
  "ሲሆን አማካዩ": "where the average is",
  "ነው። ልዩ ድጋፍ ያስፈልገዋል።": ". Needs special support.",
  "ውጤቶች": "Grades",
  "መምህር": "Teacher",
  "ወላጅ/ተማሪ": "Parent/Student",
  "ወላጅ / ተማሪ": "Parent / Student",
  "መግቢያ ፖርታል": "Login Portal",
  "ግባ": "Login",
  "ይቅር": "Cancel",
  "አረጋግጥ": "Confirm",
  "እኔ ሮቦት አይደለሁም": "I am not a robot",
  "የሲስተም ደህንነት ማዕከል": "System Security Center",
  "ደህንነት ማዕከል ዝጋ": "Close Security Center",
  "የሙከራ አውቶ-ፊል": "Demo Auto-fill",
  "የሰውነት ማረጋገጫ": "Human Verification",
  "ባለ ሁለት ደረጃ": "Two-Factor Auth",
  "የቅርብ መግቢያ ታሪኮች": "Recent Login History",
  "ስልክ ቁጥር ወይም ኢሜል": "Phone or Email",
  "የይለፍ ቃል": "Password",
  "የደህንነት ማረጋገጫ ኮድ ወደ መለያዎ ተልኳል።": "A security verification code has been sent to your account.",
  "የማሳያ ሲሙሌተር ኮድ": "Demo Simulator Code",
  "የማረጋገጫ ኮድ": "Verification Code",
  "የአስተዳደር ቦርድ": "Admin Dashboard",
  "የመምህራን ክፍል": "Teachers Room",
  "የወላጅ ፖርታል": "Parent Portal",
  "ማስታወቂያዎች": "Announcements",
  "ክፍሎች ማዋቀሪያ": "Classes Setup",
  "የይለፍ ቃል ቀይር": "Change Password",
  "ከሲስተሙ ውጣ": "Logout",
  "ከሲስተሙ መውጫ": "System Logout",
  "1 ተማሪ": "1 Student",
  "የተማሪዎች ስም፡": "Student Names:",
  "በዚህ ደረጃ ውስጥ ያለ ተማሪ የለም": "No students in this grade level",
  "የሁሉም ክፍሎች": "All Classes",
  "ምዘና፡": "Assessment:",
  "የትምህርት አይነት:": "Subject:",
  "የክፍሉ አማካይ": "Class Average",
  "የክፍሉ አጠቃላይ የውጤት ድምር": "Class Total Score",
  "የማለፊያ ምጣኔ": "Pass Rate",
  "ተማሪ አልፏል": "Students Passed",
  "ከፍተኛ ውጤት": "Highest Score",
  "የላቀ ውጤት ያስመዘገበ ተማሪ": "Top Scoring Student",
  "ዝቅተኛ ውጤት": "Lowest Score",
  "ደካማ የክፍል ውስጥ ውጤት": "Lowest Score in Class",
  "የተገመገሙ": "Evaluated",
  "ውጤት የተመዘገበላቸው ተማሪዎች": "Students with Recorded Grades",
  "የውጤት ስርጭት ግራፍ (": "Grade Distribution Graph (",
  "ለዚህ ትምህርት አይነትና የክፍለ ጊዜ ውጤት አልተመዘገበም": "No grades recorded for this subject and term",
  "እባክዎን ከላይ ሌላ ሩብ አመት ወይም ትምህርት ይምረጡ": "Please select another term or subject from above",
  "የሁሉም ትምህርቶች አማካይ ንፅፅር": "Average Comparison of All Subjects",
  "እባክዎን የውጤት እድገት ሁኔታውን ለማየት ተማሪ ይምረጡ።": "Please select a student to see their grade progress.",
  "የውጤት ትንተና ማሳሰቢያ፡": "Grade Analysis Note:",
  "የዚህ ተማሪ የ": "This student's",
  "ውጤት ከመጀመሪያው ምዘና ወደ መጨረሻው ምዘና ሲታይ": "grade from the first assessment to the last assessment",
  "ምንም ለውጥ አላሳየም": "showed no change",
  "ማሻሻል የታየበት": "Improvement Shown",
  "ድጋፍ የሚፈልግ": "Needs Support",
  "የተረጋጋ": "Stable",
  "% እድገት": "% Growth",
  "ሁሉም ተማሪዎች ማለፊያ ነጥብ ላይ ናቸው!": "All students have passing grades!",
  "ከ 50% በታች የሆነ አማካይ ውጤት አልተገኘም።": "No average grade below 50% was found.",
  "አማካይ፡": "Average:",
  "ት/ት የወደቀ": "Failed subject",
  "የተማሪዎች ውጤት ትንታኔ ሪፖርት በተሳካ ሁኔታ ተዘጋጅቷል!": "Student grade analysis report generated successfully!",
  "ካሜራውን ለመክፈት ፍቃድ እየጠየቅን ነው...": "Requesting permission to access the camera...",
  "ወላጅ": "Parent",
  "የወላጅ ኢሜል ማሳወቂያ ሲሙሌተር": "Parent Email Notification Simulator",
  "እስካሁን የተላከ የኢሜል ማሳወቂያ የለም": "No email notifications sent yet",
  "ወደ:": "To:",
  "ሌላ መምህር": "Another Teacher",
  "አዲስ መምህር መመዝገቢያ ፎርም": "New Teacher Registration Form",
  "አቶ በቀለ አስማማው": "Ato Bekele Asmamaw",
  "ምንም ነጻ ክፍል የለም": "No free class",
  "ምንም ነጻ ሴክሽን የለም": "No free section",
  "በሲስተሙ የተመዘገቡ መምህራን ዝርዝር": "List of Teachers Registered in the System",
  "የት/ት ደረጃ": "Education Level",
  "ስልክ ቁጥር": "Phone Number",
  "ጾታ እና ዕድሜ": "Gender and Age",
  "የመምህር ስም": "Teacher Name",
  "የትምህርት ደረጃ:": "Education Level:",
  "የክፍል አላፊ/ተጠሪ መምህር:": "Homeroom/Lead Teacher:",
  "የመምህር መዝገብ ማጥፊያ ማስጠንቀቂያ": "Teacher Record Deletion Warning",
  "የክፍሎች ማወዳደሪያ (Compare Grades)": "Compare Grades",
  "የደረጃ ስርጭት (Grade Ranges)": "Grade Ranges",
  "የሴክሽኖች ማወዳደሪያ (Sections Compare)": "Sections Compare",
  "የመምህራን ምዝገባ": "Teacher Registration",
  "የክፍል ትምህርት ምዝገባ": "Class Subject Registration",
  "ማስታወቂያ መልእክቶች": "Announcement Messages",
  "ትክክለኛ እና ማጠቃለያ (SCHOOL PERFORMANCE ANALYTICS)": "School Performance Analytics",
  "ወርሐዊ/ሴሚስተር (TERM):": "Monthly/Semester (TERM):",
  "ዓመታዊ አማካይ (Annual Avg)": "Annual Average",
  "ትምህርት (SUBJECT):": "Subject:",
  "ሁሉም ትምህርቶች...": "All Subjects...",
  "የቅርብ ጊዜ ማስታወቂያዎች": "Latest Announcements",
  "ስለ አጠቃቀሙ መመሪያ": "Usage Guide"
};

missingStrings.forEach(s => {
  const cleanStr = s.replace(/\\n/g, '').trim();
  if (!cleanStr) return;
  const en = translations[cleanStr] || cleanStr; // fallback to same if missing
  
  // We'll just generate the JSON
  translationEntries.push(`  "${s.trim().replace(/"/g, '\\"')}": {\n    am: "${cleanStr.replace(/"/g, '\\"')}",\n    en: "${en.replace(/"/g, '\\"')}"\n  }`);
});

const dictString = `const TRANSLATION_DICTIONARY: Record<string, { am: string; en: string }> = {\n` + translationEntries.join(',\n') + `\n};`;

console.log(dictString.slice(0, 500) + '...');

// We need to rewrite LanguageContext.tsx TRANSLATION_DICTIONARY
let contextCode = fs.readFileSync('src/components/LanguageContext.tsx', 'utf8');
const dictRegex = /const TRANSLATION_DICTIONARY: Record<string, { am: string; en: string }> = \{([\s\S]*?)\};/;
const existingMatch = contextCode.match(dictRegex);

if (existingMatch) {
    // combine them. 
    // Wait, it's safer to just let the script replace it entirely or just append
    let newContent = contextCode.replace(dictRegex, `const TRANSLATION_DICTIONARY: Record<string, { am: string; en: string }> = {${existingMatch[1]},\n` + translationEntries.join(',\n') + `\n};`);
    fs.writeFileSync('src/components/LanguageContext.tsx', newContent);
    console.log("Updated LanguageContext.tsx successfully.");
}
