const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');
const sourceFile = ts.createSourceFile('App.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function visit(node) {
  if (ts.isJsxElement(node)) {
    const openName = node.openingElement.tagName.getText();
    const closeName = node.closingElement.tagName.getText();
    if (openName !== closeName) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.openingElement.getStart());
      console.log(`Mismatch: <${openName}> at line ${line + 1} is closed by </${closeName}>`);
    }
  }
  
  // Also check if any element has missing closing tags internally (JSX attributes that consume things etc)
  
  ts.forEachChild(node, visit);
}

visit(sourceFile);
