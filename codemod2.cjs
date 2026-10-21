module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let changed = false;

  const amharicRegex = /[\u1200-\u137F]/;

  // Transform JSXText nodes
  root.find(j.JSXText).forEach(path => {
    const text = path.value.value;
    if (amharicRegex.test(text)) {
      if (!text.trim()) return;
      path.replace(
        j.jsxExpressionContainer(
          j.callExpression(j.identifier('tx'), [j.stringLiteral(text)])
        )
      );
      changed = true;
    }
  });

  // Transform JSX attributes
  root.find(j.JSXAttribute).forEach(path => {
    const value = path.node.value;
    if (value && value.type === 'StringLiteral' && amharicRegex.test(value.value)) {
      path.node.value = j.jsxExpressionContainer(
        j.callExpression(j.identifier('tx'), [j.stringLiteral(value.value)])
      );
      changed = true;
    }
  });

  // Transform literal strings
  root.find(j.StringLiteral).forEach(path => {
    const text = path.value.value;
    if (amharicRegex.test(text)) {
      const parent = path.parent.node;
      
      // Skip if already inside tx or t
      if (parent.type === 'CallExpression' && 
          parent.callee.type === 'Identifier' && 
          (parent.callee.name === 'tx' || parent.callee.name === 't')) {
        return;
      }
      
      // Skip Object keys (Property / ObjectProperty)
      if ((parent.type === 'Property' || parent.type === 'ObjectProperty') && parent.key === path.node) {
        return;
      }
      
      path.replace(j.callExpression(j.identifier('tx'), [j.stringLiteral(text)]));
      changed = true;
    }
  });

  return changed ? root.toSource() : null;
};
