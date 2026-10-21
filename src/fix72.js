import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  አስቀምጥ (Save Changes)
                </button>
            </form>`,
  `                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  አስቀምጥ (Save Changes)
                </button>
              </div>
            </form>`
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Saved fix72.js');
