import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Let's find where `parentSearched ? (` starts
let targetStart = "AnimatePresence mode=\"wait\">\n                         {parentSearched ? (";
if (!content.includes(targetStart)) {
  targetStart = "AnimatePresence mode=\"wait\">\n                           {parentSearched ? (";
}

let idx = content.indexOf(targetStart);
console.log("parentSearched start index:", idx);

if (idx !== -1) {
  // Let's replace the entire block from `parentSearched ? (` to `</AnimatePresence>` with correctly nested ternaries.
  // First, let's find the closing of AnimatePresence for parent search results.
  let searchResultsEnd = content.indexOf("</AnimatePresence>", idx);
  console.log("searchResultsEnd:", searchResultsEnd);
  
  if (searchResultsEnd !== -1) {
    let blockToReplace = content.substring(idx, searchResultsEnd + "</AnimatePresence>".length);
    
    let replacement = `AnimatePresence mode=\"wait\">
                           {parentSearched ? (
                             <motion.div
                               key={searchId}
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -10 }}
                               className="space-y-6"
                             >
                               {foundStudent ? (
                                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">` + 
                                  // Keep everything up to history list and tabs
                                  // Wait, let's do a more robust approach: find where `) : (` was incorrectly placed at line 6060.
    console.log("Found block length:", blockToReplace.length);
  }
}
