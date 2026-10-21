const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');
const sourceFile = ts.createSourceFile('App.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function visit(node) {
  if (ts.isJsxExpression(node)) {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    if (line + 1 === 3666) {
      console.log('Ternary at 3666 ends at:', sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1);
    }
  }
  ts.forEachChild(node, visit);
}

visit(sourceFile);
