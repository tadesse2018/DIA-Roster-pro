with open('src/App.tsx', 'r') as f:
    content = f.read()

old_logic = "const k = sub.name.toLowerCase();"
new_logic = "const k = typeof sub === 'string' ? sub.toLowerCase() : (sub.name || '').toLowerCase();"

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Patched App.tsx sub type successfully")
else:
    print("Could not find old_logic in App.tsx")
