import fs from 'fs';

let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  // 1. In 2FA form, before </form>, if previous line is </button> and no </div>, add </div>
  if (lines[i].includes('</form>') && lines[i-1].includes('አረጋግጥ') || (lines[i].includes('</form>') && lines[i-1].includes('</button>') && lines[i-2].includes('አረጋግጥ'))) {
    // Check if </div> is missing
    let hasDivBefore = false;
    for (let j = i - 1; j >= i - 3; j--) {
      if (lines[j] && lines[j].includes('</div>')) hasDivBefore = true;
    }
    if (!hasDivBefore) {
      lines.splice(i, 0, '                         </div>');
      console.log('Added closing </div> to 2FA form at line', i);
    }
  }
}

// 2. Remove orphan </div> right before </form> for login form
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('</form>') && lines[i-1].includes('</div>') && lines[i-2].includes('</button>')) {
    console.log('Removing orphan </div> at line', i);
    lines.splice(i - 1, 1);
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('Processed fix47.js');
