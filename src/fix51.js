import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('ውጤቱን መዝግብ (Save Grade Results)')) {
    // lines[i] is span, lines[i+1] is </button>, lines[i+2] is </form>
    // We want to insert </div> before </form> (which is lines[i+2])
    if (lines[i+2] && lines[i+2].includes('</form>')) {
      lines.splice(i+2, 0, '                                 </div>');
      console.log('Inserted missing </div> before </form> at line', i+2);
      break;
    }
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Saved fix51.js');
