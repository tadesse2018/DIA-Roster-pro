const fs = require('fs');

let fileContent = fs.readFileSync('src/lib/notificationService.ts', 'utf8');

fileContent = fileContent.replace(
  /body:\s*`ሰላም ጤና ይስጥልን፣[\\s\\S]*?Administration`,/,
  `body: \`Dear Parent,\n\nYour child \${studentName} (\${grade} - \${section}) is missing grades for \${termName}.\n\n📌 Missing Subjects:\n• \${subjectsListEng}\n\nWe will notify you when all grades are posted.\n\nBest regards,\n\${schoolName} Administration\`,`
);

fileContent = fileContent.replace(
  /subject:\s*`⚠️ የውጤት መግለጫ ማሳሰቢያ \(Grade Submission Reminder\) - \${studentName}`,/,
  `subject: \`⚠️ Grade Submission Reminder - \${studentName}\`,`
);

fileContent = fileContent.replace(
  /body:\s*`ውድ ወላጅ፣[\\s\\S]*?Office`,/,
  `body: \`Dear Parent,\n\nYour child \${studentName} has been successfully registered at Smart School App.\n\n📌 Registered Student Information:\n• Name: \${studentName}\n• Student ID: \${studentId}\n• Grade & Section: \${grade} - \${section}\n\nYou can use this Student ID to access the Parent Portal and track your child's grades, conduct, and attendance.\n\nBest regards,\nSmart School App Office\`,`
);

fileContent = fileContent.replace(
  /subject:\s*`🎉 እንኳን ደህና መጡ! የተማሪ ምዝገባ ማረጋገጫ \(Registration Confirmation\) - \${studentName}`,/,
  `subject: \`🎉 Welcome! Registration Confirmation - \${studentName}\`,`
);

fs.writeFileSync('src/lib/notificationService.ts', fileContent);

let schoolData = fs.readFileSync('src/schoolData.ts', 'utf8');
schoolData = schoolData.replace(/name:\s*'ዮናስ ካሳሁን'/g, `name: 'Yonas Kassahun'`);
schoolData = schoolData.replace(/name:\s*'ሂወት ገበያ'/g, `name: 'Hiwot Gebeya'`);
schoolData = schoolData.replace(/name:\s*'አቤል ተስፋዬ'/g, `name: 'Abel Tesfaye'`);
schoolData = schoolData.replace(/name:\s*'ሰላማዊት ደምሴ'/g, `name: 'Selamawit Demisse'`);
schoolData = schoolData.replace(/name:\s*'በረከት አስማረ'/g, `name: 'Bereket Asmare'`);
schoolData = schoolData.replace(/name:\s*'ሊዲያ ዮሐንስ'/g, `name: 'Lydia Yohannes'`);
schoolData = schoolData.replace(/name:\s*'ዮሴፍ አልማዝ'/g, `name: 'Yosef Almaz'`);
schoolData = schoolData.replace(/name:\s*'ሰብለወንጌል ተሾመ'/g, `name: 'Seblewongel Teshome'`);
schoolData = schoolData.replace(/name:\s*'ግርማ በቀለ'/g, `name: 'Girma Bekele'`);
schoolData = schoolData.replace(/name:\s*'ዘነበች አበራ'/g, `name: 'Zenebech Abera'`);
schoolData = schoolData.replace(/name:\s*'ኃይሌ ወልደጻድቅ'/g, `name: 'Haile Woldetsadik'`);

schoolData = schoolData.replace(/studentName:\s*'ዮናስ ካሳሁን'/g, `studentName: 'Yonas Kassahun'`);
schoolData = schoolData.replace(/studentName:\s*'ሂወት ገበያ'/g, `studentName: 'Hiwot Gebeya'`);
schoolData = schoolData.replace(/studentName:\s*'አቤል ተስፋዬ'/g, `studentName: 'Abel Tesfaye'`);
schoolData = schoolData.replace(/studentName:\s*'ሰላማዊት ደምሴ'/g, `studentName: 'Selamawit Demisse'`);
schoolData = schoolData.replace(/studentName:\s*'በረከት አስማረ'/g, `studentName: 'Bereket Asmare'`);
schoolData = schoolData.replace(/studentName:\s*'ሊዲያ ዮሐንስ'/g, `studentName: 'Lydia Yohannes'`);
schoolData = schoolData.replace(/studentName:\s*'ዮሴፍ አልማዝ'/g, `studentName: 'Yosef Almaz'`);
schoolData = schoolData.replace(/studentName:\s*'ሰብለወንጌል ተሾመ'/g, `studentName: 'Seblewongel Teshome'`);
schoolData = schoolData.replace(/studentName:\s*'ግርማ በቀለ'/g, `studentName: 'Girma Bekele'`);
schoolData = schoolData.replace(/studentName:\s*'ዘነበች አበራ'/g, `studentName: 'Zenebech Abera'`);
schoolData = schoolData.replace(/studentName:\s*'ኃይሌ ወልደጻድቅ'/g, `studentName: 'Haile Woldetsadik'`);

schoolData = schoolData.replace(/title:\s*'የወላጆች ስብሰባ ጥሪ \(Parents Meeting\)',/, `title: 'Parents Meeting',`);
schoolData = schoolData.replace(/content:\s*'የፊታችን እሁድ ሰኔ 28 ቀን ከጠዋቱ 2:30 ጀምሮ ጠቅላላ የወላጆች ስብሰባ በትምህርት ቤቱ አዳራሽ ስለሚካሄድ ወላጆች ሳይረፍዱ እንዲገኙ እናሳስባለን።',/, `content: 'General parents meeting will be held on Sunday morning. Please arrive on time.',`);
schoolData = schoolData.replace(/title:\s*'የፈተና ወረቀት አረምና ማርክ ሰብሚሽን \(Grade Submission Deadline\)',/, `title: 'Grade Submission Deadline',`);
schoolData = schoolData.replace(/content:\s*'የመምህራን በሙሉ፡ የ2ኛው ኩዋርተር ማጠቃለያ ፈተና ውጤት እስከ ሐምሌ 5 ቀን ድረስ በሲስተሙ ላይ መሞላት እንዳለበት እናሳስባለን።',/, `content: 'To all teachers: Q2 final exam grades must be submitted in the system by July 5th.',`);

schoolData = schoolData.replace(/2018 ዓ.ም/g, `2025/2026`);
schoolData = schoolData.replace(/titleAmh:/g, `title:`);
schoolData = schoolData.replace(/descriptionAmh:/g, `description:`);
schoolData = schoolData.replace(/explanationAmh:/g, `explanation:`);

fs.writeFileSync('src/schoolData.ts', schoolData);
