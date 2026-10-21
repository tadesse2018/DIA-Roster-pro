with open('src/App.tsx', 'r') as f:
    content = f.read()

old_logic = """                      (schoolConfig.subjectsByGrade?.[foundStudent?.grade || ''] && schoolConfig.subjectsByGrade[foundStudent?.grade || ''].length > 0 ? schoolConfig.subjectsByGrade[foundStudent?.grade || ''] : schoolConfig.subjects).forEach(sub => {
                        const annual = getSubjectAnnualAvg(sub);
                        if (annual !== null) {
                          totalSum += annual;
                          subjectCount++;
                        }
                      });
                      const averageScore = subjectCount > 0 ? Math.round(totalSum / subjectCount) : 0;
                      const cardPass = averageScore >= 50;"""

new_logic = """                      let passedCommonSubjects = true;
                      (schoolConfig.subjectsByGrade?.[foundStudent?.grade || ''] && schoolConfig.subjectsByGrade[foundStudent?.grade || ''].length > 0 ? schoolConfig.subjectsByGrade[foundStudent?.grade || ''] : schoolConfig.subjects).forEach(sub => {
                        const annual = getSubjectAnnualAvg(sub);
                        if (annual !== null) {
                          totalSum += annual;
                          subjectCount++;
                          const k = sub.name.toLowerCase();
                          if (k === 'amharic' || k === 'አማርኛ' || k === 'mathematics' || k === 'math' || k === 'maths' || k === 'ሒሳብ' || k === 'english' || k === 'እንግሊዝኛ') {
                            if (annual < 50) passedCommonSubjects = false;
                          }
                        }
                      });
                      const averageScore = subjectCount > 0 ? Math.round(totalSum / subjectCount) : 0;
                      const cardPass = averageScore >= 50 && passedCommonSubjects;"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Patched App.tsx successfully")
else:
    print("Could not find old_logic in App.tsx")
