with open('src/components/GradeTrackerSection.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
in_sticky = False
for i, line in enumerate(lines):
    if '/* Sticky columns styling for on-screen scrollable tables */' in line:
        new_lines.append(line)
        new_lines.append('            @media (min-width: 640px) {\n')
        in_sticky = True
        continue
    
    if in_sticky and line.strip() == '`}} />':
        new_lines.append('            }\n')
        in_sticky = False
    
    if in_sticky:
        new_lines.append('  ' + line)
    else:
        new_lines.append(line)

with open('src/components/GradeTrackerSection.tsx', 'w') as f:
    f.writelines(new_lines)
