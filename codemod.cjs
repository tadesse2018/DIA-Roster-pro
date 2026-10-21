module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let changed = false;

  const amharicRegex = /[\u1200-\u137F]/;

  // 1. Transform JSXText nodes
  root.find(j.JSXText).forEach(path => {
    const text = path.value.value;
    if (amharicRegex.test(text)) {
      // Don't wrap if it's purely whitespace
      if (!text.trim()) return;
      
      // Replace with {tx("text")}
      path.replace(
        j.jsxExpressionContainer(
          j.callExpression(j.identifier('tx'), [j.stringLiteral(text)])
        )
      );
      changed = true;
    }
  });

  // 2. Transform JSX attributes (e.g. placeholder="...")
  root.find(j.JSXAttribute).forEach(path => {
    const value = path.node.value;
    if (value && value.type === 'StringLiteral' && amharicRegex.test(value.value)) {
      path.node.value = j.jsxExpressionContainer(
        j.callExpression(j.identifier('tx'), [j.stringLiteral(value.value)])
      );
      changed = true;
    }
  });

  // 3. Transform literal strings in general?
  // Be careful, we don't want to transform inside tx() or t() or imports.
  // We can look at CallExpressions. If it's not 'tx' or 't', and it's a string containing Amharic, wrap it?
  // Let's just do StringLiterals that are inside JSXExpressions or other places, but exclude if parent is tx/t.
  root.find(j.StringLiteral).forEach(path => {
    const text = path.value.value;
    if (amharicRegex.test(text)) {
      const parent = path.parent.node;
      
      // If it's already an argument to tx or t, skip
      if (parent.type === 'CallExpression' && 
          parent.callee.type === 'Identifier' && 
          (parent.callee.name === 'tx' || parent.callee.name === 't')) {
        return;
      }
      
      // If it's a JSXAttribute value, we already handled it above (as it's replaced).
      // Wait, if it's already a StringLiteral, we can just replace it with tx("...") if it's in a JS context.
      // But we shouldn't replace object keys!
      if (parent.type === 'Property' && parent.key === path.node) {
        return;
      }
      
      // It's safe to wrap it with tx()
      path.replace(j.callExpression(j.identifier('tx'), [j.stringLiteral(text)]));
      changed = true;
    }
  });

  return changed ? root.toSource() : null;
};
