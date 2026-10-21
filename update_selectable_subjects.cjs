const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldSelectable = `  const selectableTeacherSubjects = React.useMemo(() => {
    if (currentUser?.role === 'teacher' && currentTeacher) {
      const teacherSubjectsSet = new Set<string>();
      if (Array.isArray(currentTeacher.subjects)) {
        currentTeacher.subjects.forEach((s: string) => teacherSubjectsSet.add(s));
      }
      if (Array.isArray(currentTeacher.classAllocations)) {
        currentTeacher.classAllocations.forEach((alloc: any) => {
          if (Array.isArray(alloc.subjects)) {
            alloc.subjects.forEach((s: string) => teacherSubjectsSet.add(s));
          }
        });
      }
      if (teacherSubjectsSet.size > 0) {
        return Array.from(teacherSubjectsSet);
      }
      return [];
    }
    return schoolConfig.subjects;
  }, [currentUser, currentTeacher, schoolConfig.subjects]);`;

const newSelectable = `  const selectableTeacherSubjects = React.useMemo(() => {
    if (currentUser?.role === 'teacher' && currentTeacher) {
      const teacherSubjectsSet = new Set<string>();
      if (Array.isArray(currentTeacher.subjects)) {
        currentTeacher.subjects.forEach((s: string) => teacherSubjectsSet.add(s));
      }
      if (Array.isArray(currentTeacher.classAllocations)) {
        currentTeacher.classAllocations.forEach((alloc: any) => {
          if (Array.isArray(alloc.subjects)) {
            alloc.subjects.forEach((s: string) => teacherSubjectsSet.add(s));
          }
        });
      }
      if (teacherSubjectsSet.size > 0) {
        return Array.from(teacherSubjectsSet);
      }
      return [];
    }
    
    if (selectedStudentId) {
      const student = students.find(s => s.id === selectedStudentId);
      if (student && schoolConfig.subjectsByGrade?.[student.grade] && schoolConfig.subjectsByGrade[student.grade].length > 0) {
         return schoolConfig.subjectsByGrade[student.grade];
      }
    }

    return schoolConfig.subjects;
  }, [currentUser, currentTeacher, schoolConfig.subjects, schoolConfig.subjectsByGrade, selectedStudentId, students]);`;

if (code.includes('const selectableTeacherSubjects = React.useMemo(() => {')) {
    code = code.replace(oldSelectable, newSelectable);
    fs.writeFileSync('src/App.tsx', code, 'utf8');
    console.log("Replaced selectableTeacherSubjects");
} else {
    console.log("Could not find selectableTeacherSubjects");
}
