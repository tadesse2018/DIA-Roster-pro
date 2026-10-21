import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  // Find 2FA form submit button
  if (lines[i].includes('አረጋግጥ (Verify & Enter)')) {
    // Check if next line is </button> and line after that does NOT have </div> before </form>
    if (lines[i+1] && lines[i+1].includes('</button>')) {
      if (lines[i+2] && lines[i+2].includes('</form>')) {
        // Insert </div> right before </form>
        lines.splice(i+2, 0, '                         </div>');
        console.log('Inserted missing </div> in 2FA form');
        break;
      }
    }
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Processed fix48.js');
