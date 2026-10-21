import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  Users, 
  BookOpen, 
  Layers, 
  ArrowUpRight, 
  Sparkles,
  BarChart3,
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { Student, Grade } from '../schoolData';
import { playInteractiveSound } from './AudioEngine';
import { useLanguage } from './LanguageContext';

interface PrincipalAnalyticsProps {
  students: Student[];
  grades: Grade[];
  schoolConfig: any;
  classes: any[];
}

export const PrincipalAnalytics: React.FC<PrincipalAnalyticsProps> = ({
  students,
  grades,
  schoolConfig,
  classes
}) => {
  const { tx } = useLanguage();
  // Available terms list based on evaluationMode
  const isSemester = schoolConfig?.evaluationMode === 'semester';
  const termsList = useMemo(() => {
    return isSemester ? [1, 2] : [1, 2, 3, 4];
  }, [isSemester]);

  // Available subjects
  const subjectsList = useMemo(() => {
    return schoolConfig?.subjects || ['Mathematics', 'English', 'Amharic', 'Science', 'Social Studies'];
  }, [schoolConfig]);

  // States for filtering
  const [selectedTerm, setSelectedTerm] = useState<number | 'annual'>('annual');
  const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'grades' | 'ranges' | 'sections'>('grades');
  const [selectedGradeForSectionCompare, setSelectedGradeForSectionCompare] = useState<string>('');

  // Auto-select initial grade for section comparison
  const gradeOptions = useMemo(() => {
    const gradesSet = new Set<string>();
    students.forEach(s => {
      if (s.grade) gradesSet.add(s.grade);
    });
    return Array.from(gradesSet).sort((a, b) => {
      const aNum = parseInt(a.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.replace(/\D/g, '')) || 0;
      return aNum - bNum;
    });
  }, [students]);

  React.useEffect(() => {
    if (gradeOptions.length > 0 && (!selectedGradeForSectionCompare || !gradeOptions.includes(selectedGradeForSectionCompare))) {
      setSelectedGradeForSectionCompare(gradeOptions[0]);
    }
  }, [gradeOptions, selectedGradeForSectionCompare]);

  // Filter grades list based on selectedTerm and selectedSubject
  const filteredGrades = useMemo(() => {
    return grades.filter(g => {
      const termMatch = selectedTerm === 'annual' ? true : (g.term || 1) === selectedTerm;
      const subjectMatch = selectedSubject === 'all' ? true : g.subject === selectedSubject;
      return termMatch && subjectMatch;
    });
  }, [grades, selectedTerm, selectedSubject]);

  // 1. Calculate Average Scores by Grade Level
  const gradePerformanceData = useMemo(() => {
    const gradeSums: { [grade: string]: { sum: number; count: number } } = {};
    
    // Group grades by student to get individual student average first
    const studentAverages: { [studentId: string]: { sum: number; count: number; student: Student } } = {};
    
    filteredGrades.forEach(g => {
      const student = students.find(s => s.id === g.studentId);
      if (student && student.grade) {
        if (!studentAverages[g.studentId]) {
          studentAverages[g.studentId] = { sum: 0, count: 0, student };
        }
        studentAverages[g.studentId].sum += g.total;
        studentAverages[g.studentId].count += 1;
      }
    });

    // Group student averages by Grade
    Object.values(studentAverages).forEach(item => {
      const studentAvg = item.sum / item.count;
      const grade = item.student.grade;
      if (!gradeSums[grade]) {
        gradeSums[grade] = { sum: 0, count: 0 };
      }
      gradeSums[grade].sum += studentAvg;
      gradeSums[grade].count += 1;
    });

    // Build chart dataset
    return gradeOptions.map(grade => {
      const data = gradeSums[grade];
      const avg = data && data.count > 0 ? Math.round(data.sum / data.count) : 0;
      return {
        name: grade,
        አማካይ_ውጤት: avg, // Amharic label for tooltips and charts
        avgScore: avg,
        studentsCount: data ? data.count : 0
      };
    });
  }, [filteredGrades, students, gradeOptions]);

  // 2. Score Range Distribution Dataset
  const scoreRangeData = useMemo(() => {
    // A: 90-100%, B: 80-89%, C: 70-79%, D: 60-69%, F: <60%
    let aCount = 0;
    let bCount = 0;
    let cCount = 0;
    let dCount = 0;
    let fCount = 0;

    // Calculate student overall averages for the filters
    const studentTotals: { [studentId: string]: { sum: number; count: number } } = {};
    
    filteredGrades.forEach(g => {
      if (!studentTotals[g.studentId]) {
        studentTotals[g.studentId] = { sum: 0, count: 0 };
      }
      studentTotals[g.studentId].sum += g.total;
      studentTotals[g.studentId].count += 1;
    });

    Object.entries(studentTotals).forEach(([studentId, data]) => {
      const avg = data.sum / data.count;
      if (avg >= 90) aCount++;
      else if (avg >= 80) bCount++;
      else if (avg >= 70) cCount++;
      else if (avg >= 60) dCount++;
      else fCount++;
    });

    return [
      { name: 'A (90-100%)', የተማሪዎች_ብዛት: aCount, range: '90-100%', color: '#10b981' },
      { name: 'B (80-89%)', የተማሪዎች_ብዛት: bCount, range: '80-89%', color: '#3b82f6' },
      { name: 'C (70-79%)', የተማሪዎች_ብዛት: cCount, range: '70-79%', color: '#f59e0b' },
      { name: 'D (60-69%)', የተማሪዎች_ብዛት: dCount, range: '60-69%', color: '#ec4899' },
      { name: 'F (<60%)', የተማሪዎች_ብዛት: fCount, range: '<60%', color: '#ef4444' }
    ];
  }, [filteredGrades]);

  // 3. Section Performance dataset for a selected Grade
  const sectionPerformanceData = useMemo(() => {
    if (!selectedGradeForSectionCompare) return [];

    const sectionSums: { [section: string]: { sum: number; count: number } } = {};
    const gradeStudents = students.filter(s => s.grade === selectedGradeForSectionCompare);
    const gradeStudentIds = new Set(gradeStudents.map(s => s.id));

    const gradeFilteredGrades = filteredGrades.filter(g => gradeStudentIds.has(g.studentId));

    // Student average totals first
    const studentAverages: { [studentId: string]: { sum: number; count: number; student: Student } } = {};
    gradeFilteredGrades.forEach(g => {
      const student = gradeStudents.find(s => s.id === g.studentId);
      if (student) {
        if (!studentAverages[g.studentId]) {
          studentAverages[g.studentId] = { sum: 0, count: 0, student };
        }
        studentAverages[g.studentId].sum += g.total;
        studentAverages[g.studentId].count += 1;
      }
    });

    Object.values(studentAverages).forEach(item => {
      const avg = item.sum / item.count;
      const section = item.student.section || 'A';
      if (!sectionSums[section]) {
        sectionSums[section] = { sum: 0, count: 0 };
      }
      sectionSums[section].sum += avg;
      sectionSums[section].count += 1;
    });

    const sections = ['A', 'B', 'C', 'D'].filter(sec => 
      gradeStudents.some(s => s.section === sec)
    );

    return sections.map(sec => {
      const data = sectionSums[sec];
      const avg = data && data.count > 0 ? Math.round(data.sum / data.count) : 0;
      return {
        name: `Section ${sec}`,
        አማካይ_ውጤት: avg,
        avgScore: avg,
        studentsCount: gradeStudents.filter(s => s.section === sec).length
      };
    });
  }, [filteredGrades, students, selectedGradeForSectionCompare]);

  // Quick school overall metrics calculated
  const overallAverages = useMemo(() => {
    if (filteredGrades.length === 0) return { avg: 0, passed: 0, failed: 0, passRate: 0 };
    
    // Group by student to see overall pass/fail status (passing score is usually >= 50 or 60, let's use >= 50%)
    const studentScores: { [id: string]: { sum: number; count: number } } = {};
    filteredGrades.forEach(g => {
      if (!studentScores[g.studentId]) {
        studentScores[g.studentId] = { sum: 0, count: 0 };
      }
      studentScores[g.studentId].sum += g.total;
      studentScores[g.studentId].count += 1;
    });

    let totalSum = 0;
    let totalCount = 0;
    let passed = 0;
    let failed = 0;

    Object.values(studentScores).forEach(sc => {
      const avg = sc.sum / sc.count;
      totalSum += avg;
      totalCount++;
      if (avg >= 50) passed++;
      else failed++;
    });

    const avg = totalCount > 0 ? Math.round(totalSum / totalCount) : 0;
    const passRate = totalCount > 0 ? Math.round((passed / totalCount) * 100) : 0;

    return { avg, passed, failed, passRate };
  }, [filteredGrades]);

  // Find top grade and struggling grade
  const gradeRankings = useMemo(() => {
    const sorted = [...gradePerformanceData]
      .filter(g => g.studentsCount > 0)
      .sort((a, b) => b.avgScore - a.avgScore);
    
    return {
      topGrade: sorted[0] || null,
      strugglingGrade: sorted[sorted.length - 1] && sorted.length > 1 ? sorted[sorted.length - 1] : null
    };
  }, [gradePerformanceData]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/60 shadow-sm space-y-6">

      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-extrabold text-[10px] rounded-lg uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/30">{tx(
              "\n              📊 ትንተና እና ማጠቃለያ (School Performance Analytics)\n            "
            )}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />{tx(" የትምህርት ውጤት አጠቃላይ ግራፍ ማሳያ\n          ")}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{tx(
            "\n            በተቋሙ ውስጥ የሚገኙ ተማሪዎች የትምህርት ውጤት ሁኔታን በተለያዩ አመልካቾች የሚገመግም የማጠቃለያ ክፍል\n          "
          )}</p>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Term Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-3xs">
            <span className="text-[10px] font-black text-slate-400 uppercase">{tx("ወርሐዊ/ሴሚስተር (Term)፡")}</span>
            <select
              value={selectedTerm}
              onChange={(e) => {
                playInteractiveSound('click');
                const val = e.target.value;
                setSelectedTerm(val === 'annual' ? 'annual' : parseInt(val));
              }}
              className="text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-transparent outline-none cursor-pointer"
            >
              <option value="annual">{tx("📊 ዓመታዊ አማካይ (Annual Avg)")}</option>
              {termsList.map(t => (
                <option key={t} value={t}>
                  {isSemester ? `ሴሚስተር ${t} (Semester ${t})` : `ሩብ ዓመት ${t} (Quarter ${t})`}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-3xs">
            <span className="text-[10px] font-black text-slate-400 uppercase">{tx("ትምህርት (Subject)፡")}</span>
            <select
              value={selectedSubject}
              onChange={(e) => {
                playInteractiveSound('click');
                setSelectedSubject(e.target.value);
              }}
              className="text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-transparent outline-none cursor-pointer max-w-[150px]"
            >
              <option value="all">{tx("📚 ሁሉንም ትምህርቶች (All Subjects)")}</option>
              {subjectsList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Score Cards Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Active Analyzed Grades Count */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/60 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tx("የተተነተኑ ውጤቶች (Analyzed Records)")}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-850 dark:text-slate-100">{filteredGrades.length}</span>
              <span className="text-xs text-slate-500 font-medium">{tx("ውጤቶች")}</span>
            </div>
            <span className="text-[10px] text-indigo-650 dark:text-indigo-400 font-bold block">{tx("\n              📊 በጥናቱ የተካተቱ ጠቅላላ ውጤቶች\n            ")}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layers className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* KPI 2: Overall Academic Average */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/60 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tx("አጠቃላይ የውጤት አማካይ (School Avg)")}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{overallAverages.avg}%</span>
              <span className="text-xs text-slate-500 font-medium">GPA</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">{tx("\n              📈 የሁሉም ክፍሎች እና ትምህርቶች አማካይ\n            ")}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* KPI 3: School Pass Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/60 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tx("የማለፍ ምጣኔ (Overall Pass Rate)")}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">{overallAverages.passRate}%</span>
              <span className="text-xs text-slate-500 font-medium">{tx("ማለፍ (50%+)")}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold block">{tx("\n              🎉 ያለፉ ተማሪዎች፡ ")}{overallAverages.passed}{tx(" | ያላለፉ፡ ")}{overallAverages.failed}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* KPI 4: Top Performing Grade */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/60 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tx("ከፍተኛ ውጤት ያለው ክፍል (Top Grade)")}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                {gradeRankings.topGrade ? gradeRankings.topGrade.name : '-'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({gradeRankings.topGrade ? gradeRankings.topGrade.avgScore : 0}%)
              </span>
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold block">{tx("\n              🏆 ከፍተኛ አፈጻጸም ያስመዘገበ ክፍል\n            ")}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Award className="w-4.5 h-4.5" />
          </div>
        </div>

      </div>

      {/* Main Graph Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Graph Area: Column Span 8 */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          
          {/* Internal sub-tabs for graph toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 dark:border-slate-800 pb-3">
            <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => { playInteractiveSound('click'); setActiveTab('grades'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'grades'
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-3xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
                }`}
              >{tx("\n                🏫 የክፍሎች ማወዳደሪያ (Compare Grades)\n              ")}</button>
              <button
                type="button"
                onClick={() => { playInteractiveSound('click'); setActiveTab('ranges'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'ranges'
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-3xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
                }`}
              >{tx("\n                📊 የደረጃ ስርጭት (Grade Ranges)\n              ")}</button>
              <button
                type="button"
                onClick={() => { playInteractiveSound('click'); setActiveTab('sections'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'sections'
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-3xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
                }`}
              >{tx("\n                ⚡ የሴክሽኖች ማወዳደሪያ (Sections Compare)\n              ")}</button>
            </div>

            {/* Contextual control for sections compare */}
            {activeTab === 'sections' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase">{tx("ለንጽጽር የተመረጠ ክፍል፡")}</span>
                <select
                  value={selectedGradeForSectionCompare}
                  onChange={(e) => {
                    playInteractiveSound('click');
                    setSelectedGradeForSectionCompare(e.target.value);
                  }}
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 outline-none cursor-pointer"
                >
                  {gradeOptions.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Actual Recharts Bar Chart Implementation */}
          <div className="h-[280px] w-full mt-2 font-semibold text-xs">
            {activeTab === 'grades' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={gradePerformanceData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#78716c', fontSize: 11, fontWeight: '700' }} 
                    axisLine={{ stroke: '#e7e5e4' }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fill: '#78716c', fontSize: 11 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1c1917', 
                      borderRadius: '12px', 
                      color: '#fff', 
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    labelStyle={{ fontWeight: 'black', color: '#a8a29e', marginBottom: '4px' }}
                  />
                  <Bar 
                    dataKey={tx("አማካይ_ውጤት")} 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={45}
                  >
                    {gradePerformanceData.map((entry, index) => {
                      // Color code depending on performance score
                      let color = '#6366f1'; // Indigo default
                      if (entry.avgScore >= 80) color = '#10b981'; // Emerald (top)
                      else if (entry.avgScore < 50) color = '#ef4444'; // Red (struggling)
                      else if (entry.avgScore < 65) color = '#f59e0b'; // Amber (warning)
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'ranges' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={scoreRangeData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#78716c', fontSize: 11, fontWeight: '700' }} 
                    axisLine={{ stroke: '#e7e5e4' }}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fill: '#78716c', fontSize: 11 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1c1917', 
                      borderRadius: '12px', 
                      color: '#fff', 
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    labelStyle={{ fontWeight: 'black', color: '#a8a29e', marginBottom: '4px' }}
                  />
                  <Bar 
                    dataKey={tx("የተማሪዎች_ብዛት")} 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={50}
                  >
                    {scoreRangeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'sections' && (
              sectionPerformanceData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-center gap-2">
                  <span>{tx("ℹ️ በዚህ ክፍል ውስጥ ለተመረጡት ማጣሪያዎች ምንም የውጤት መረጃ አልተገኘም።")}</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sectionPerformanceData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#78716c', fontSize: 11, fontWeight: '700' }} 
                      axisLine={{ stroke: '#e7e5e4' }}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fill: '#78716c', fontSize: 11 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1c1917', 
                        borderRadius: '12px', 
                        color: '#fff', 
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                      labelStyle={{ fontWeight: 'black', color: '#a8a29e', marginBottom: '4px' }}
                    />
                    <Bar 
                      dataKey={tx("አማካይ_ውጤት")} 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={50}
                    >
                      {sectionPerformanceData.map((entry, index) => {
                        const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            )}
          </div>

          {/* Mini Legend Description */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-extrabold text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
            {activeTab === 'grades' && (
              <>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />{tx(" ከፍተኛ ውጤት (≥80%)")}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-xs" />{tx(" መካከለኛ ውጤት (65-79%)")}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-xs" />{tx(" ማስጠንቀቂያ (50-64%)")}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-xs" /> {tx("ማሻሻል የሚሻ (<50%)")}</span>
              </>
            )}
            {activeTab === 'ranges' && (
              <>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />{tx(" A ደረጃ ተማሪዎች")}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-xs" />{tx(" B ደረጃ ተማሪዎች")}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-xs" />{tx(" C ደረጃ ተማሪዎች")}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-pink-500 rounded-xs" />{tx(" D ደረጃ ተማሪዎች")}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-xs" />{tx(" F (ደካማ) ተማሪዎች")}</span>
              </>
            )}
            {activeTab === 'sections' && (
              <span className="text-center italic font-medium">{tx("በተመረጠው የክፍል ደረጃ ስር የሚገኙ ሴክሽኖች አማካይ ውጤት ንጽጽር")}</span>
            )}
          </div>
        </div>

        {/* Actionable Insights Panel: Column Span 4 */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />{tx(" በርዕሰ መምህሩ ጠቃሚ ታዛቢዎች (Insights)\n            ")}</h3>

            {/* List of insights */}
            <div className="space-y-3.5 text-xs">
              
              {/* Insight 1: School Overall Avg comment */}
              <div className="flex gap-2.5 items-start">
                <span className="text-lg leading-none">💡</span>
                <div className="space-y-0.5">
                  <h4 className="font-black text-slate-800 dark:text-slate-200">{tx("አጠቃላይ አፈጻጸም ግምገማ")}</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{tx("\n                    በአሁኑ ሰዓት የተማሪዎች አጠቃላይ ማለፍ ምጣኔ ")}<span className="font-bold text-indigo-650 dark:text-indigo-400">{overallAverages.passRate}%</span>{tx(" ሲሆን አማካይ ውጤት ደግሞ ")}<span className="font-bold text-slate-700 dark:text-slate-300">{overallAverages.avg}%</span>{tx(" ነው።\n                  ")}</p>
                </div>
              </div>

              {/* Insight 2: Top Class Recognition */}
              {gradeRankings.topGrade && (
                <div className="flex gap-2.5 items-start">
                  <span className="text-lg leading-none">🏆</span>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-slate-800 dark:text-slate-200">{tx("ምርጥ ውጤት ያለው ክፍል")}</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{tx("\n                      በከፍተኛ ውጤት እየመራ የሚገኘው ክፍል ")}<span className="font-bold text-emerald-650 dark:text-emerald-400">{gradeRankings.topGrade.name}</span>{tx(" በአማካይ ")}<span className="font-bold text-emerald-600 dark:text-emerald-400">{gradeRankings.topGrade.avgScore}%</span>{tx(" በማስመዝገብ ነው።\n                    ")}</p>
                  </div>
                </div>
              )}

              {/* Insight 3: Struggles Advice */}
              {gradeRankings.strugglingGrade && (
                <div className="flex gap-2.5 items-start">
                  <span className="text-lg leading-none">⚠️</span>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-rose-800 dark:text-rose-400">{tx("ልዩ እገዛ የሚፈልግ ክፍል")}</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{tx("\n                      አንጻራዊ ዝቅተኛ አማካይ ውጤት ያለው ")}<span className="font-semibold text-rose-700 dark:text-rose-400">{gradeRankings.strugglingGrade.name}</span>{tx(" ሲሆን አማካዩ ")}<span className="font-bold text-rose-600">{gradeRankings.strugglingGrade.avgScore}%</span>{tx(" ነው። ልዩ ድጋፍ ያስፈልገዋል።\n                    ")}</p>
                  </div>
                </div>
              )}

              {/* Insight 4: General standard info */}
              <div className="flex gap-2.5 items-start">
                <span className="text-lg leading-none">💡</span>
                <div className="space-y-0.5">
                  <h4 className="font-black text-slate-800 dark:text-slate-200">{tx("ርምጃ መውሰጃ")}</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{tx(
                    "\n                    ከላይ ማጣሪያዎችን በመጠቀም ትምህርቶችን ለይተው መፈተሽ ይችላሉ። ውጤታቸው ዝቅተኛ የሆኑ ክፍሎችን በመለየት ከተግባር መምህራን ጋር ምክክር ያድርጉ።\n                  "
                  )}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Visual Indicator of complete data analysis */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-black text-slate-400">
            <span className="flex items-center gap-1 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />{tx(" እውነተኛ የውጤት ትንተና\n            ")}</span>
            <span className="font-mono">Smart School App</span>
          </div>
        </div>

      </div>

    </div>
  );
};
