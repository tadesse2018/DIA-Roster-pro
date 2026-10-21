const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');
const sourceFile = ts.createSourceFile('App.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function visit(node) {
  if (ts.isJsxElement(node)) {
    const openName = node.openingElement.tagName.getText();
    const closeName = node.closingElement.tagName.getText();
    if (openName !== closeName) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.openingElement.getStart());
      const { line: closeLine, character: closeChar } = sourceFile.getLineAndCharacterOfPosition(node.closingElement.getStart());
      console.log(`Mismatch: <${openName}> at line ${line + 1} is closed by </${closeName}> at line ${closeLine + 1}`);
    }
  }
  
  ts.forEachChild(node, visit);
}

visit(sourceFile);
