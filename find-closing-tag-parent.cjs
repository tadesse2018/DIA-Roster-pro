const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');
const sourceFile = ts.createSourceFile('App.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function visit(node) {
  if (ts.isJsxElement(node)) {
    const { line: openLine } = sourceFile.getLineAndCharacterOfPosition(node.openingElement.getStart());
    if (openLine + 1 === 5613 || openLine + 1 === 5701) {
      const { line: closeLine } = sourceFile.getLineAndCharacterOfPosition(node.closingElement.getStart());
      console.log(`Tag at ${openLine + 1} is closed at ${closeLine + 1}`);
    }
  }
  ts.forEachChild(node, visit);
}

visit(sourceFile);
