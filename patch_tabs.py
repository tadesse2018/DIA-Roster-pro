with open('src/components/GradeTrackerSection.tsx', 'r') as f:
    content = f.read()

# Make the tab buttons bordered
content = content.replace(
    "activeSubTab === 'marklist' ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700' : 'text-slate-500 hover:text-teal-700 hover:bg-teal-50/50'",
    "activeSubTab === 'marklist' ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700 border border-teal-600' : 'text-slate-500 hover:text-teal-700 hover:bg-teal-50/50 border border-slate-200'"
)

content = content.replace(
    "activeSubTab === 'roster' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'",
    "activeSubTab === 'roster' ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200'"
)

content = content.replace(
    "activeSubTab === 'attendance' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'",
    "activeSubTab === 'attendance' ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200'"
)

content = content.replace(
    "activeSubTab === 'performance' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'",
    "activeSubTab === 'performance' ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200'"
)

content = content.replace(
    "activeSubTab === 'student-registration' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'",
    "activeSubTab === 'student-registration' ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200'"
)

# And also let's wrap the flex container with a border just in case they meant the group
content = content.replace(
    '<div className="flex gap-2">',
    '<div className="flex flex-wrap gap-2 p-1.5 border border-slate-200 rounded-2xl bg-white/50 w-fit items-center">'
)

with open('src/components/GradeTrackerSection.tsx', 'w') as f:
    f.write(content)
print("Tabs patched.")
