let text = `
<div className="bg-white p-4">
  <span className="text-[10px]">ጠቅላላ ተማሪዎች (Total Students)</span>
  <p>የተማሪዎች ቁጥር: {count}</p>
  <input placeholder="ስም አስገባ (Enter Name)" />
  {tx('This is already wrapped')}
  <p>
    Some newlines
    and አማሪኛ
  </p>
</div>
`;

// 1. Replace JSX text nodes containing Amharic
text = text.replace(/>([^<]*[\u1200-\u137F]+[^<]*)</g, (match, p1) => {
  // If it's just whitespace, ignore (shouldn't happen because of [\u1200-\u137F]+)
  // If it already has tx, ignore (though > tx(...) < is not valid JSX text)
  let trimmed = p1.trim();
  if (!trimmed) return match;
  
  // Escape backticks or use JSON.stringify
  let escaped = p1.replace(/`/g, '\\`');
  // Return the original tags but wrap the inner text in {tx(`...`)}
  return `>{tx(\`${escaped}\`)}<`;
});

// 2. Replace attributes containing Amharic (like placeholder, title)
text = text.replace(/(\w+)=["']([^"']*[\u1200-\u137F]+[^"']*)["']/g, (match, p1, p2) => {
  let escaped = p2.replace(/`/g, '\\`');
  return `${p1}={tx(\`${escaped}\`)}`;
});

console.log(text);
