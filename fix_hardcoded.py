import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

code = code.replace(
    'DILIGENT SCHOOL',
    '{schoolConfig.nameEng || "DILIGENT SCHOOL"}'
)

code = code.replace(
    'የደሊጀነት ት/ቤት',
    '{schoolConfig.nameAmh || "የደሊጀነት ት/ቤት"}'
)

# wait, we already did it for teacher card as `{schoolConfig.nameEng || "DILIGENT SCHOOL"}`, doing this replacement globally might nest it like `{schoolConfig.nameEng || "{schoolConfig.nameEng || "DILIGENT SCHOOL"}"}`
# Let me undo and be careful.
