const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Increase gradient height
content = content.replace(/h-\[105px\]/g, 'h-[130px]');
content = content.replace(/h-\[100px\]/g, 'h-[130px]');

// Add 2017 ዓ.ም and add border
content = content.replace(/የተማሪዎች መታወቂያ ካርድ<br\/>STUDENT ID CARD/g, 'የተማሪዎች መታወቂያ ካርድ (2017 ዓ.ም)<br/>STUDENT ID CARD');
content = content.replace(/የተማሪዎች መታወቂያ ካርድ <br\/> STUDENT ID CARD/g, 'የተማሪዎች መታወቂያ ካርድ (2017 ዓ.ም)<br/>STUDENT ID CARD');

content = content.replace(/የመምህራን መታወቂያ ካርድ<br\/>TEACHER ID CARD/g, 'የመምህራን መታወቂያ ካርድ (2017 ዓ.ም)<br/>TEACHER ID CARD');

// Fix border of the cards
content = content.replace(/className="w-\[240px\] h-\[380px\] shrink-0 rounded-2xl p-3 flex flex-col relative overflow-hidden border border-stone-200 shadow-xl text-center select-none bg-white"/g, 'className="w-[240px] h-[380px] shrink-0 rounded-2xl p-3 flex flex-col relative overflow-hidden border-4 border-indigo-600/20 shadow-xl text-center select-none bg-white"');

content = content.replace(/className="w-\[240px\] h-\[380px\] rounded-2xl p-3 flex flex-col relative overflow-hidden border border-stone-200 shadow-2xl text-center select-none bg-white shrink-0"/g, 'className="w-[240px] h-[380px] rounded-2xl p-3 flex flex-col relative overflow-hidden border-4 border-indigo-600/20 shadow-2xl text-center select-none bg-white shrink-0"');

content = content.replace(/className="qr-card-container w-\[240px\] h-\[380px\] bg-white rounded-2xl relative overflow-hidden text-center mx-auto border border-stone-200 shadow-xl flex flex-col p-3 shrink-0"/g, 'className="qr-card-container w-[240px] h-[380px] bg-white rounded-2xl relative overflow-hidden text-center mx-auto border-4 border-indigo-600/20 shadow-xl flex flex-col p-3 shrink-0"');

fs.writeFileSync('src/App.tsx', content);
console.log("Done");
