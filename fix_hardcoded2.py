import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

# I want to replace EXACTLY the text node `DILIGENT SCHOOL` inside the JSX blocks.
# In my previous python script I wrote:
# <span className="font-sans font-black text-[10px] uppercase tracking-wider text-amber-300 block text-center leading-none">
#   DILIGENT SCHOOL
# </span>
# <h4 className="text-[13px] font-black text-white tracking-wide text-center leading-tight mt-1">
#   የደሊጀነት ት/ቤት
# </h4>

code = re.sub(
    r'>\s*DILIGENT SCHOOL\s*<',
    r'>{schoolConfig.nameEng || "DILIGENT SCHOOL"}<',
    code
)

code = re.sub(
    r'>\s*የደሊጀነት ት/ቤት\s*<',
    r'>{schoolConfig.nameAmh || "የደሊጀነት ት/ቤት"}<',
    code
)

with open('src/App.tsx', 'w') as f:
    f.write(code)

