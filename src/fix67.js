import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Find where selectedDefect modal starts around line 7188
let startIndex = -1;
let endIndex = -1;

for (let i = 7180; i < 7205; i++) {
  if (lines[i] && (lines[i].includes('selectedDefect &&') || lines[i].includes('Detailed overlay modal'))) {
    startIndex = i;
    break;
  }
}

// Find where closing div of modal is around line 7300
for (let i = 7290; i < 7310; i++) {
  if (lines[i] && lines[i].includes('</AnimatePresence>')) {
    endIndex = i;
    break;
  }
}

console.log('startIndex:', startIndex, 'endIndex:', endIndex);

if (startIndex !== -1) {
  // Let's replace the entire block from startIndex - 1 to endIndex with a clean AnimatePresence + selectedDefect block
  let cleanBlock = [
    '              <AnimatePresence>',
    '                {selectedDefect && (',
    '                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="defect-modal">',
    '                    <motion.div ',
    '                      initial={{ opacity: 0 }}',
    '                      animate={{ opacity: 1 }}',
    '                      exit={{ opacity: 0 }}',
    '                      onClick={() => setSelectedDefect(null)}',
    '                      className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"',
    '                    />',
    '',
    '                    <motion.div ',
    '                      initial={{ opacity: 0, scale: 0.95 }}',
    '                      animate={{ opacity: 1, scale: 1 }}',
    '                      exit={{ opacity: 0, scale: 0.95 }}',
    '                      className="relative bg-white border border-stone-200 w-full max-w-3xl p-6 md:p-8 rounded-3xl shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto"',
    '                    >',
    '                      <button ',
    '                        onClick={() => setSelectedDefect(null)}',
    '                        className="p-2 absolute right-4 top-4 hover:bg-stone-100 text-stone-400 hover:text-stone-700 rounded-full transition-colors"',
    '                      >',
    '                        <X className="w-5 h-5" />',
    '                      </button>',
    '',
    '                      <div className="space-y-2">',
    '                        <div className="flex items-center gap-2">',
    '                          <span className={`px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider rounded-md ${',
    '                            selectedDefect.severity === \'Critical\' ',
    '                              ? \'bg-rose-50 text-rose-800 border border-rose-100\' ',
    '                              : \'bg-amber-50 text-amber-800 border border-amber-100\'',
    '                          }`}>',
    '                            {selectedDefect.severity} Severity Bug',
    '                          </span>',
    '                        </div>',
    '                        <h2 className="text-xl md:text-2xl font-black text-stone-900 leading-snug">',
    '                          {selectedDefect.titleAmh}',
    '                        </h2>',
    '                        <p className="text-xs font-mono text-stone-400">{selectedDefect.titleEng}</p>',
    '                      </div>',
    '',
    '                      {/* Explanation details */}',
    '                      <div className="space-y-3">',
    '                        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/50 text-sm text-stone-700 leading-relaxed space-y-2">',
    '                          <strong className="text-stone-900 font-semibold block flex items-center gap-1">',
    '                            <Info className="w-4 h-4 text-amber-500" /> የስህተቱ ዝርዝር መግለጫ (Description):',
    '                          </strong>',
    '                          <p>{selectedDefect.descriptionAmh}</p>',
    '                          <p className="text-xs text-stone-500 italic border-t border-stone-200/40 pt-2">{selectedDefect.descriptionEng}</p>',
    '                        </div>',
    '',
    '                        <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-200/40 text-sm text-emerald-950 leading-relaxed">',
    '                          <strong className="text-emerald-900 font-semibold block mb-1">💡 እንዴት አስተካከልነው (Resolution applied in React Prototype):</strong>',
    '                          <p>{selectedDefect.explanationAmh}</p>',
    '                        </div>',
    '                      </div>',
    '',
    '                      {/* Code comparison grid */}',
    '                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">',
    '                        ',
    '                        {/* Buggy Code block */}',
    '                        <div className="border border-rose-100 rounded-2xl overflow-hidden shadow-xs">',
    '                          <div className="bg-rose-50 p-3 border-b border-rose-100 flex justify-between items-center text-xs text-rose-900 font-bold">',
    '                            <span>🚨 የነበረው ስህተት (Buggy Code)</span>',
    '                          </div>',
    '                          <div className="relative">',
    '                            <pre className="p-4 bg-stone-950 text-rose-400 font-mono text-[11px] leading-relaxed overflow-x-auto h-48 rounded-b-2xl">',
    '                              <code>{selectedDefect.buggyCode}</code>',
    '                            </pre>',
    '                            <button',
    '                              onClick={() => handleCopyCode(selectedDefect.buggyCode, \'bug\')}',
    '                              className="absolute top-2 right-2 p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-all text-[10px] flex items-center gap-1"',
    '                            >',
    '                              <Copy className="w-3.5 h-3.5" />',
    '                              <span>{copiedId === \'bug\' ? \'Copied!\' : \'Copy\'}</span>',
    '                            </button>',
    '                          </div>',
    '                        </div>',
    '',
    '                        {/* Fixed Code block */}',
    '                        <div className="border border-emerald-100 rounded-2xl overflow-hidden shadow-xs">',
    '                          <div className="bg-emerald-50 p-3 border-b border-emerald-100 flex justify-between items-center text-xs text-emerald-900 font-bold">',
    '                            <span>✅ የተስተካከለው ኮድ (Fixed Code)</span>',
    '                          </div>',
    '                          <div className="relative">',
    '                            <pre className="p-4 bg-stone-950 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto h-48 rounded-b-2xl">',
    '                              <code>{selectedDefect.fixedCode}</code>',
    '                            </pre>',
    '                            <button',
    '                              onClick={() => handleCopyCode(selectedDefect.fixedCode, \'fix\')}',
    '                              className="absolute top-2 right-2 p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-all text-[10px] flex items-center gap-1"',
    '                            >',
    '                              <Copy className="w-3.5 h-3.5" />',
    '                              <span>{copiedId === \'fix\' ? \'Copied!\' : \'Copy\'}</span>',
    '                            </button>',
    '                          </div>',
    '                        </div>',
    '',
    '                      </div>',
    '',
    '                      <div className="pt-2 flex justify-end">',
    '                        <button',
    '                          onClick={() => setSelectedDefect(null)}',
    '                          className="px-6 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-semibold rounded-xl text-sm transition-all',
    '                        >',
    '                          ዝጋ (Close Analysis)',
    '                        </button>',
    '                      </div>',
    '',
    '                    </motion.div>',
    '                  </div>',
    '                )}',
    '              </AnimatePresence>'
  ];

  // Replace from startIndex-1 to endIndex
  lines.splice(startIndex - 1, (endIndex - startIndex) + 2, ...cleanBlock);
  console.log('Replaced modal block successfully.');
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix67.js');
