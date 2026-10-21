import React, { useState, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { createPortal } from 'react-dom';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { applyOklchCleanup } from '../lib/pdfUtils';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  GraduationCap, 
  TrendingUp, 
  Users, 
  Award, 
  CheckCircle2, 
  XCircle,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Smile,
  ShieldCheck,
  Edit2,
  Save,
  Lock,
  Unlock,
  FileText,
  Trash2,
  AlertTriangle,
  Search,
  PlusCircle,
  Check,
  List,
  Calendar,
  CalendarDays,
  QrCode,
  Settings
} from 'lucide-react';
import { Student, Grade, Teacher, ClassSetup, DEFAULT_SCHOOL_LOGO } from '../schoolData';
import { playInteractiveSound } from './AudioEngine';
import { PerformanceDashboard } from './PerformanceDashboard';
import { SimulatedEmailOutbox } from './SimulatedEmailOutbox';

const ETHIOPIAN_MONTHS = [
  "መስከረም", "ጥቅምት", "ህዳር", "ታኅሣሥ", "ጥር", "የካቲት",
  "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
];

export function getFormattedDualCalendarDate(date: Date): { gc: string; ec: string } {
  // 1. Gregorian Calendar formatting
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const gcEng = date.toLocaleDateString('en-US', options);

  // 2. Ethiopian Calendar conversion
  const Y = date.getFullYear();

  // Determine if the *current* Gregorian year's upcoming September starts a leap year (Pagume has 6 days in year preceding GC leap year)
  const isLeapPreceding = ((Y + 1) % 4 === 0 && (Y + 1) % 100 !== 0) || ((Y + 1) % 400 === 0);
  const newYearDay = isLeapPreceding ? 12 : 11;
  const newYearDateThisYear = new Date(Y, 8, newYearDay); // Sept is 8

  let ethYear: number;
  let startOfEthYear: Date;

  if (date >= newYearDateThisYear) {
    ethYear = Y - 7;
    startOfEthYear = newYearDateThisYear;
  } else {
    ethYear = Y - 8;
    const prevY = Y - 1;
    const isPrevLeapPreceding = ((prevY + 1) % 4 === 0 && (prevY + 1) % 100 !== 0) || ((prevY + 1) % 400 === 0);
    const prevNewYearDay = isPrevLeapPreceding ? 12 : 11;
    startOfEthYear = new Date(prevY, 8, prevNewYearDay);
  }

  // Calculate day difference safely using UTC timestamps
  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const utcStart = Date.UTC(startOfEthYear.getFullYear(), startOfEthYear.getMonth(), startOfEthYear.getDate());
  const diffDays = Math.floor((utcDate - utcStart) / (1000 * 60 * 60 * 24));

  const ethMonthIndex = Math.floor(diffDays / 30);
  const ethMonth = ETHIOPIAN_MONTHS[ethMonthIndex] || "መስከረም";
  const ethDay = (diffDays % 30) + 1;

  const ecFormatted = `${ethMonth} ${ethDay} ቀን ${ethYear} ዓ.ም`;

  return {
    gc: gcEng,
    ec: ecFormatted
  };
}

interface GradeTrackerSectionProps {
  students: Student[];
  grades: Grade[];
  teachers?: Teacher[];
  classes?: ClassSetup[];
  currentUserEmail?: string;
  schoolConfig?: {
    nameAmh: string;
    nameEng: string;
    mottoAmh: string;
    mottoEng: string;
    phone: string;
    email: string;
    address: string;
    logoType: 'graduation' | 'book' | 'shield' | 'award';
    themeColor: 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate';
    subjects: string[];
    evaluationMode?: 'quarter' | 'semester';
    academicYear?: string;
    subjectAssessments?: any;
  };
  currentUserRole?: 'principal' | 'vice_principal' | 'teacher' | 'parent';
  onSaveGrade?: (grade: Grade) => void;
  onDeleteGrade?: (studentId: string, subject: string, term: number) => void;
  onAddStudent?: (student: Student) => void;
  onEditStudent?: (student: Student) => void;
  onDeleteStudent?: (id: string) => void;
  onRequestManualPdfLink?: (url: string, filename: string, title: string) => void;
  onShowStudentQR?: (student: Student) => void;
  onUpdateSchoolConfig?: (newConfig: any) => void;
  onOpenQRScanner?: () => void;
  initialSubTab?: 'marklist' | 'roster' | 'attendance' | 'performance' | 'student-registration';
}

const getStudentAge = (student: any) => {
  const numMatch = student?.grade?.match(/\d+/);
  if (numMatch) {
    const gradeNum = parseInt(numMatch[0]);
    return 6 + gradeNum;
  }
  return 10;
};

const DAYS_OF_WEEK = [
  { key: 'Monday', amh: "ሰኞ", eng: 'Monday' },
  { key: 'Tuesday', amh: "ማክሰኞ", eng: 'Tuesday' },
  { key: 'Wednesday', amh: "ረቡዕ", eng: 'Wednesday' },
  { key: 'Thursday', amh: "ሐሙስ", eng: 'Thursday' },
  { key: 'Friday', amh: "አርብ", eng: 'Friday' },
];

const STANDARD_PERIODS = [
  { number: 1, time: '8:30 AM - 9:15 AM', localTime: '2:30 - 3:15' },
  { number: 2, time: '9:15 AM - 10:00 AM', localTime: '3:15 - 4:00' },
  { number: 3, time: '10:00 AM - 10:45 AM', localTime: '4:00 - 4:45' },
  { number: 4, time: '11:15 AM - 12:00 PM', localTime: '5:15 - 6:00' },
  { number: 5, time: '12:00 PM - 12:45 PM', localTime: '6:00 - 6:45' },
  { number: 6, time: '2:00 PM - 2:45 PM', localTime: '8:00 - 8:45' },
  { number: 7, time: '2:45 PM - 3:30 PM', localTime: '8:45 - 9:30' },
  { number: 8, time: '3:30 PM - 4:15 PM', localTime: '9:30 - 10:15' },
];

export const GradeTrackerSection: React.FC<GradeTrackerSectionProps> = ({ 
  students, 
  grades, 
  teachers = [],
  classes = [],
  currentUserEmail = '',
  schoolConfig, 
  currentUserRole = 'principal', 
  onSaveGrade,
  onDeleteGrade,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onRequestManualPdfLink,
  onShowStudentQR,
  onUpdateSchoolConfig,
  onOpenQRScanner,
  initialSubTab
}) => {
  const { lang, t, tx } = useLanguage();

  // Find current teacher matching logged in email
  const currentTeacher = useMemo(() => {
    if ((currentUserRole !== 'teacher' && currentUserRole !== 'vice_principal') || !teachers || teachers.length === 0) return null;
    const cleanEmail = (currentUserEmail || '').trim().toLowerCase();
    
    // 1. Direct match by email or fallback generated email
    let found = teachers.find(t => {
      const fallbackEmail = `${t.id.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.com`;
      const teacherEmail = t.email || fallbackEmail;
      return teacherEmail.trim().toLowerCase() === cleanEmail;
    });
    if (found) return found;

    // Special match for vice principal
    if (currentUserRole === 'vice_principal' || cleanEmail.includes('vice')) {
      const vpr = teachers.find(t => 
        (t.email && t.email.toLowerCase().includes('vice')) || 
        t.id.includes('VPR') || 
        t.name.toLowerCase().includes('rahel') || 
        t.name.includes('ራሔል') || 
        t.name.includes('ምክትል')
      );
      if (vpr) return vpr;
    }

    // 2. Smart match by username or name (e.g. tadessemisganaw4 -> Tadesse)
    found = teachers.find(t => {
      const tEmail = (t.email || '').toLowerCase();
      const tName = (t.name || '').toLowerCase();
      return (
        (cleanEmail.includes('tadesse') && (tEmail.includes('tadesse') || tName.includes('tadesse') || tName.includes('ታደሰ'))) ||
        (cleanEmail.includes('girma') && (tEmail.includes('girma') || tName.includes('girma') || tName.includes('ግርማ'))) ||
        (cleanEmail.includes('zenebech') && (tEmail.includes('zenebech') || tName.includes('zenebech') || tName.includes('ዘነበች')))
      );
    });
    if (found) return found;

    return teachers[0] || null;
  }, [currentUserRole, currentUserEmail, teachers]);

  // Robust permission check helper to verify if the teacher is authorized to teach/assess a given subject in a grade & section
  const checkTeacherCanTeachSubject = React.useCallback((subject: string, grade: string, section: string) => {
    if ((currentUserRole !== 'teacher' && currentUserRole !== 'vice_principal') || !currentTeacher) return true; // non-teachers (like principal) have full access

    // Check specific class allocations for this grade & section
    if (Array.isArray(currentTeacher.classAllocations) && currentTeacher.classAllocations.length > 0) {
      const matchingAlloc = currentTeacher.classAllocations.find((alloc: any) => {
        const matchGrade = !alloc.grade || alloc.grade === 'All' || alloc.grade === grade;
        const matchSection = !alloc.section || alloc.section === 'All' || alloc.section === section;
        return matchGrade && matchSection;
      });
      if (matchingAlloc && Array.isArray(matchingAlloc.subjects)) {
        return matchingAlloc.subjects.includes(subject);
      }
    }

    // If teacher is assigned to this class and section
    if (currentTeacher.assignedClass === grade && (!currentTeacher.assignedSection || currentTeacher.assignedSection === section)) {
      if (Array.isArray(currentTeacher.subjects)) {
        return currentTeacher.subjects.includes(subject);
      }
    }

    // If no allocations defined at all, fall back to teacher's general subjects
    if ((!currentTeacher.classAllocations || currentTeacher.classAllocations.length === 0) && Array.isArray(currentTeacher.subjects)) {
      return currentTeacher.subjects.includes(subject);
    }

    return false;
  }, [currentUserRole, currentTeacher]);

  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedSection, setSelectedSection] = useState('A');

  // Available options defined early
  const gradeOptions = useMemo(() => {
    if (currentTeacher && currentUserRole === 'teacher') {
      const gradesSet = new Set<string>();
      if (currentTeacher.assignedClass) gradesSet.add(currentTeacher.assignedClass);
      if (Array.isArray(currentTeacher.classAllocations) && currentTeacher.classAllocations.length > 0) {
        currentTeacher.classAllocations.forEach(alloc => {
          if (alloc.grade && alloc.grade !== 'All') gradesSet.add(alloc.grade);
        });
      }
      if (gradesSet.size > 0) {
        return Array.from(gradesSet);
      }
    } else if (currentTeacher && currentUserRole === 'vice_principal') {
      const gradesSet = new Set<string>();
      if (currentTeacher.assignedClass) gradesSet.add(currentTeacher.assignedClass);
      if (Array.isArray(currentTeacher.classAllocations) && currentTeacher.classAllocations.length > 0) {
        currentTeacher.classAllocations.forEach(alloc => {
          if (alloc.grade && alloc.grade !== 'All') gradesSet.add(alloc.grade);
        });
      }
      const allSchoolGrades = schoolConfig?.schoolLevel === 'secondary'
        ? ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
        : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
      return Array.from(new Set([...Array.from(gradesSet), ...allSchoolGrades]));
    }
    if (schoolConfig?.schoolLevel === 'secondary') {
      return ['All', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    }
    return ['All', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
  }, [schoolConfig?.schoolLevel, currentTeacher, currentUserRole]);

  const sectionOptions = useMemo(() => {
    if (currentTeacher) {
      const sectionsSet = new Set<string>();
      if (Array.isArray(currentTeacher.classAllocations) && currentTeacher.classAllocations.length > 0) {
        currentTeacher.classAllocations
          .filter(alloc => !alloc.grade || alloc.grade === 'All' || alloc.grade === selectedGrade)
          .forEach(alloc => {
            if (alloc.section && alloc.section !== 'All') sectionsSet.add(alloc.section);
          });
      }
      if (selectedGrade === currentTeacher.assignedClass && currentTeacher.assignedSection) {
        sectionsSet.add(currentTeacher.assignedSection);
      }
      if (sectionsSet.size > 0) {
        if (currentUserRole === 'vice_principal') {
          return Array.from(new Set([...Array.from(sectionsSet), 'A', 'B', 'C', 'D']));
        }
        return Array.from(sectionsSet);
      }
      return [currentTeacher.assignedSection || 'A'];
    }
    return ['A', 'B', 'C', 'D'];
  }, [currentTeacher, selectedGrade, currentUserRole]);

  // Keep selectedGrade valid
  React.useEffect(() => {
    if (currentUserRole === 'principal') {
      if (!gradeOptions.includes(selectedGrade) && selectedGrade !== 'All') {
        setSelectedGrade('All');
      }
    } else {
      if (!gradeOptions.includes(selectedGrade) && gradeOptions.length > 0) {
        setSelectedGrade(gradeOptions[0]);
      }
    }
  }, [gradeOptions, selectedGrade, currentUserRole]);

  // Keep selectedSection valid when grade or section options change
  React.useEffect(() => {
    if (sectionOptions.length > 0 && !sectionOptions.includes(selectedSection)) {
      setSelectedSection(sectionOptions[0]);
    }
  }, [sectionOptions, selectedSection]);
  const [activeSubTab, setActiveSubTab] = useState<'marklist' | 'roster' | 'attendance' | 'performance' | 'student-registration'>(() => {
    return initialSubTab || 'marklist';
  });

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const isCurrentHomeroomTeacher = useMemo(() => {
    if (currentUserRole !== 'teacher' || !currentTeacher) return false;
    return !!(
      currentTeacher.isHomeroomTeacher &&
      currentTeacher.assignedClass === selectedGrade &&
      currentTeacher.assignedSection === selectedSection
    );
  }, [currentUserRole, currentTeacher, selectedGrade, selectedSection]);

  const [isPrintAllClassesAttendance, setIsPrintAllClassesAttendance] = useState(false);
  const [principalSearchQuery, setPrincipalSearchQuery] = useState('');
  const [principalStatusFilter, setPrincipalStatusFilter] = useState<'all' | 'taken' | 'nottaken' | 'partial'>('all');

  // Automatically redirect teachers who are not the homeroom teacher of the selected class out of roster/attendance tabs
  React.useEffect(() => {
    if (currentUserRole === 'teacher' && !isCurrentHomeroomTeacher && (activeSubTab === 'attendance' || activeSubTab === 'roster')) {
      setActiveSubTab('marklist');
    }
  }, [isCurrentHomeroomTeacher, activeSubTab, currentUserRole]);

  const currentClassSetup = useMemo(() => {
    return classes.find(c => c.grade === selectedGrade && c.section === selectedSection);
  }, [classes, selectedGrade, selectedSection]);

  const schedule = currentClassSetup?.schedule;
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [tableLayoutSnug, setTableLayoutSnug] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [printScaling, setPrintScaling] = useState(100);
  const [a4Centering, setA4Centering] = useState(true);
  const [customFilename, setCustomFilename] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPdfSuccess, setShowPdfSuccess] = useState(false);
  const [pdfProgressMsg, setPdfProgressMsg] = useState('');
  const [pdfError, setPdfError] = useState<string | null>(null);

  // States for hand-drawn signatures
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [sigTab, setSigTab] = useState<'teacher' | 'principal'>('teacher');
  const [teacherSig, setTeacherSig] = useState<string>(() => localStorage.getItem('school_sig_teacher') || '');
  const [principalSig, setPrincipalSig] = useState<string>(() => localStorage.getItem('school_sig_principal') || '');

  // Helper function to check if student passes based on rules (Amharic, Maths, English >= 50 and Average >= 50)
  const isStudentPassing = React.useCallback((item: any) => {
    if (!item) return false;
    if (item.gradedCount === 0) return false;
    if (item.average < 50) return false;
    
    const subjectsKeys = Object.keys(item.subjectGrades || {});
    const amhKey = subjectsKeys.find(k => k.toLowerCase() === 'amharic' || k === tx("አማርኛ"));
    const mathKey = subjectsKeys.find(k => k.toLowerCase() === 'mathematics' || k.toLowerCase() === 'math' || k.toLowerCase() === 'maths' || k === tx("ሒሳብ"));
    const engKey = subjectsKeys.find(k => k.toLowerCase() === 'english' || k === tx("እንግሊዝኛ"));
    
    if (amhKey && item.subjectGrades[amhKey] !== null) {
      if (item.subjectGrades[amhKey] < 50) return false;
    }
    if (mathKey && item.subjectGrades[mathKey] !== null) {
      if (item.subjectGrades[mathKey] < 50) return false;
    }
    if (engKey && item.subjectGrades[engKey] !== null) {
      if (item.subjectGrades[engKey] < 50) return false;
    }
    
    return true;
  }, []);

  // Local student registration form states
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Male' | 'Female'>('Female');
  const [newStudentParentEmail, setNewStudentParentEmail] = useState('');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState("");
  const [newStudentAddress, setNewStudentAddress] = useState("");
  const [newStudentDigitalId, setNewStudentDigitalId] = useState("");
  const [newStudentAge, setNewStudentAge] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentSection, setNewStudentSection] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);
  
  React.useEffect(() => {
    setNewStudentGrade(selectedGrade === 'All' ? (currentTeacher?.assignedClass || 'Grade 1') : selectedGrade);
    setNewStudentSection(selectedSection === 'All' ? (currentTeacher?.assignedSection || 'A') : selectedSection);
  }, [selectedGrade, selectedSection, currentTeacher]);

  // Student Edit & Delete local states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentGender, setEditStudentGender] = useState<'Male' | 'Female'>('Male');
  const [editStudentAge, setEditStudentAge] = useState('');
  const [editStudentParentEmail, setEditStudentParentEmail] = useState('');
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      playInteractiveSound('wrong');
      alert(tx("እባክዎን የተማሪውን ስም ያስገቡ (Please enter student name)"));
      return;
    }

    if (!onAddStudent) return;

    const targetGrade = selectedGrade === 'All' ? (currentTeacher?.assignedClass || 'Grade 1') : selectedGrade;
    const targetSection = selectedSection;

    const phoneClean = newStudentParentPhone.trim().replace(/[\s-]/g, '');
    if (!phoneClean) {
      alert(tx("እባክዎን የወላጅ/ያሳደጊ ስልክ ቁጥር ያስገቡ (Please enter parent/guardian phone number)"));
      return;
    }
    const isValidPhone = /^(09|07)\d{8}$/.test(phoneClean) || /^(\+251)(9|7)\d{8}$/.test(phoneClean) || /^(251)(9|7)\d{8}$/.test(phoneClean);
    if (!isValidPhone) {
      alert(tx(
        "⚠️ እባክዎን ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ! (ለምሳሌ፡ 0912345678 ወይም 0712345678)\n(Please enter a valid Ethiopian phone number)"
      ));
      return;
    }

    // Check for duplicate student (same name, grade, section)
    const isDuplicate = students.some(
      (s) =>
        s.name.trim().toLowerCase() === newStudentName.trim().toLowerCase() &&
        s.grade === targetGrade &&
        s.section === targetSection
    );

    if (isDuplicate) {
      playInteractiveSound('wrong');
      alert(`⚠️ ተማሪ "${newStudentName.trim()}" ቀደም ሲል በዚህ ክፍል (${targetGrade} ${targetSection}) ውስጥ ተመዝግቧል! (Student "${newStudentName.trim()}" is already registered in ${targetGrade} ${targetSection}!)`);
      return;
    }

    const randomId = 'ID-' + Math.floor(1000 + Math.random() * 9000);
    const ageVal = newStudentAge.trim() ? parseInt(newStudentAge.trim(), 10) : undefined;
    const newStudent: Student = {
      id: randomId,
      name: newStudentName.trim(),
      grade: targetGrade,
      section: targetSection,
      gender: newStudentGender,
      registeredBy: currentUserEmail || 'teacher@school.com',
      timestamp: new Date().toISOString(),
      parentEmail: newStudentParentEmail.trim().toLowerCase() || undefined,
      parentPhone: phoneClean,
      address: newStudentAddress.trim() || undefined,
      digitalId: newStudentDigitalId.trim() || undefined,
      age: ageVal && !isNaN(ageVal) ? ageVal : undefined
    };

    playInteractiveSound('register');
    onAddStudent(newStudent);
    setRegSuccessMsg(`✅ ተማሪው በተሳካ ሁኔታ ተመዝግቧል! መታወቂያው፡ ${randomId} ነው (Student Registered! ID: ${randomId})`);
    setNewStudentName('');
    setNewStudentParentEmail('');
    setNewStudentParentPhone('');
    setNewStudentAddress('');
    setNewStudentDigitalId('');
    setNewStudentAge('');
    setTimeout(() => setRegSuccessMsg(null), 8000);
  };

  const handleOpenEditStudent = (student: Student) => {
    playInteractiveSound('click');
    setEditingStudent(student);
    setEditStudentName(student.name);
    setEditStudentGender(student.gender);
    setEditStudentAge(student.age ? String(student.age) : '');
    setEditStudentParentEmail(student.parentEmail || '');
  };

  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editStudentName.trim()) {
      alert(tx("እባክዎን የተማሪውን ስም ያስገቡ (Please enter student name)"));
      return;
    }

    const ageVal = editStudentAge.trim() ? parseInt(editStudentAge.trim(), 10) : undefined;
    const updated: Student = {
      ...editingStudent,
      name: editStudentName.trim(),
      gender: editStudentGender,
      age: ageVal && !isNaN(ageVal) ? ageVal : undefined,
      parentEmail: editStudentParentEmail.trim().toLowerCase() || undefined
    };

    onEditStudent?.(updated);
    playInteractiveSound('register');
    setEditingStudent(null);
  };

  const handleOpenDeleteStudent = (student: Student) => {
    playInteractiveSound('wrong');
    setDeletingStudent(student);
  };

  const handleDeleteStudentConfirm = () => {
    if (deletingStudent && onDeleteStudent) {
      onDeleteStudent(deletingStudent.id);
      playInteractiveSound('click');
      setDeletingStudent(null);
    }
  };



  // Automatically bind teacher to their assigned class and section and correct tab
  React.useEffect(() => {
    if (currentTeacher) {
      const firstAlloc = currentTeacher.classAllocations?.[0] || { grade: currentTeacher.assignedClass, section: currentTeacher.assignedSection };
      setSelectedGrade(firstAlloc.grade);
      setSelectedSection(firstAlloc.section);
      if (currentTeacher.isHomeroomTeacher) {
        setActiveSubTab('attendance');
      } else {
        setActiveSubTab('marklist');
      }
    }
  }, [currentTeacher]);

  // Sync selectedGrade with schoolLevel gradeOptions changes
  React.useEffect(() => {
    if (!gradeOptions.includes(selectedGrade)) {
      setSelectedGrade(gradeOptions[0] || 'Grade 1');
    }
  }, [gradeOptions, selectedGrade]);

  // Sync selectedSection with sectionOptions changes
  React.useEffect(() => {
    if (sectionOptions.length > 0 && !sectionOptions.includes(selectedSection)) {
      setSelectedSection(sectionOptions[0]);
    }
  }, [sectionOptions, selectedSection]);

  // Extra roster-specific student info: Conduct (ምግባር) and Absents (ቀሪ ቀናት)
  const [studentExtraInfo, setStudentExtraInfo] = useState<Record<string, { conduct: string; absent: number }>>(() => {
    const saved = localStorage.getItem('studentExtraInfo');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      'ID-4021': { conduct: 'A', absent: 2 },
      'ID-1082': { conduct: 'A', absent: 0 },
      'ID-8843': { conduct: 'B', absent: 4 },
      'ID-5531': { conduct: 'A', absent: 1 },
      'ID-9011': { conduct: 'B', absent: 3 },
      'ID-3245': { conduct: 'A+', absent: 0 }
    };
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const local = new Date();
    const offset = local.getTimezoneOffset();
    const adjusted = new Date(local.getTime() - (offset * 60 * 1000));
    return adjusted.toISOString().split('T')[0];
  });

  const [dailyAttendance, setDailyAttendance] = useState<Record<string, Record<string, 'present' | 'absent' | 'excused'>>>(() => {
    const saved = localStorage.getItem('dailyAttendance');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  const allGradeSections = useMemo(() => {
    const combinations: { grade: string; section: string }[] = [];
    if (classes && classes.length > 0) {
      classes.forEach(c => {
        if (!combinations.some(comb => comb.grade === c.grade && comb.section === c.section)) {
          combinations.push({ grade: c.grade, section: c.section });
        }
      });
    }
    if (combinations.length === 0 && students && students.length > 0) {
      students.forEach(s => {
        if (s.grade && s.section && !combinations.some(comb => comb.grade === s.grade && comb.section === s.section)) {
          combinations.push({ grade: s.grade, section: s.section });
        }
      });
    }
    return combinations.sort((a, b) => {
      const aNum = parseInt(a.grade.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.grade.replace(/\D/g, '')) || 0;
      if (aNum !== bNum) return aNum - bNum;
      return a.section.localeCompare(b.section);
    });
  }, [classes, students]);

  const filteredAllGradeSections = useMemo(() => {
    return allGradeSections.filter(comb => {
      const classStudents = students.filter(s => s.grade === comb.grade && s.section === comb.section);
      const dayRecord = dailyAttendance[selectedDateStr] || {};
      let unmarked = 0;
      classStudents.forEach(student => {
        if (!dayRecord[student.id]) unmarked++;
      });

      let status: 'taken' | 'nottaken' | 'partial' = 'nottaken';
      if (classStudents.length > 0) {
        if (unmarked === 0) status = 'taken';
        else if (unmarked < classStudents.length) status = 'partial';
      }

      const hrTeacher = teachers.find(t => t.isHomeroomTeacher && t.assignedClass === comb.grade && t.assignedSection === comb.section);
      const teacherName = hrTeacher ? hrTeacher.name.toLowerCase() : '';
      const classStr = `${comb.grade} ${comb.section}`.toLowerCase();

      const matchesSearch = classStr.includes(principalSearchQuery.toLowerCase()) || teacherName.includes(principalSearchQuery.toLowerCase());
      
      const matchesStatus = 
        principalStatusFilter === 'all' ||
        (principalStatusFilter === 'taken' && status === 'taken') ||
        (principalStatusFilter === 'nottaken' && status === 'nottaken') ||
        (principalStatusFilter === 'partial' && status === 'partial');

      return matchesSearch && matchesStatus;
    });
  }, [allGradeSections, students, dailyAttendance, selectedDateStr, teachers, principalSearchQuery, principalStatusFilter]);

  const handlePrintAllClassesAttendance = () => {
    setPdfError(null);
    playInteractiveSound('success');
    setIsPrintAllClassesAttendance(true);
    setIsPrintPreview(true);
    setTimeout(() => {
      window.print();
    }, 600);
  };

  const handleMarkAttendance = React.useCallback((studentId: string, status: 'present' | 'absent' | 'excused') => {
    if (currentUserRole === 'principal') {
      playInteractiveSound('wrong');
      return;
    }
    setDailyAttendance(prev => {
      const dayRecord = prev[selectedDateStr] || {};
      const prevStatus = dayRecord[studentId];
      
      if (prevStatus === status) return prev;

      const updatedDayRecord = {
        ...dayRecord,
        [studentId]: status
      };

      const updated = {
        ...prev,
        [selectedDateStr]: updatedDayRecord
      };

      localStorage.setItem('dailyAttendance', JSON.stringify(updated));

      let diff = 0;
      if (prevStatus === 'absent' && status !== 'absent') {
        diff = -1;
      } else if (prevStatus !== 'absent' && status === 'absent') {
        diff = 1;
      }

      if (diff !== 0) {
        setStudentExtraInfo(prevExtra => {
          const extra = prevExtra[studentId] || { conduct: 'A', absent: 0 };
          const updatedExtra = {
            ...prevExtra,
            [studentId]: {
              ...extra,
              absent: Math.max(0, extra.absent + diff)
            }
          };
          localStorage.setItem('studentExtraInfo', JSON.stringify(updatedExtra));
          return updatedExtra;
        });
      }

      return updated;
    });
  }, [selectedDateStr]);

  const [selectedCardStudentId, setSelectedCardStudentId] = useState<string | null>(null);
  const [isPdfDownloadPreview, setIsPdfDownloadPreview] = useState(false);
  const [previewViewType, setPreviewViewType] = useState<'card' | 'list'>('card');
  const [selectedTerm, setSelectedTerm] = useState<number | 'annual'>(1);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    type: 'delete' | 'bulk_approve' | 'bulk_clear';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    type: 'delete'
  });

  // Sync selectedTerm with evaluationMode changes and activeSubTab changes
  React.useEffect(() => {
    const isSemester = schoolConfig?.evaluationMode === 'semester';
    if (isSemester && selectedTerm !== 'annual' && selectedTerm > 2) {
      setSelectedTerm(1);
    }
  }, [schoolConfig?.evaluationMode, selectedTerm]);

  React.useEffect(() => {
    if (activeSubTab === 'marklist' && selectedTerm === 'annual') {
      setSelectedTerm(1);
    }
  }, [activeSubTab, selectedTerm]);

  // Edit States
  const [editModeActive, setEditModeActive] = useState(false);
  const [rowEditingStudentId, setRowEditingStudentId] = useState<string | null>(null);
  const [quickEditStudentId, setQuickEditStudentId] = useState<string | null>(null);
  const [quickEditSubject, setQuickEditSubject] = useState<string | null>(null);
  const [quickEditQuiz, setQuickEditQuiz] = useState<number | ''>('');
  const [quickEditCw, setQuickEditCw] = useState<number | ''>('');
  const [quickEditHw, setQuickEditHw] = useState<number | ''>('');
  const [quickEditMid, setQuickEditMid] = useState<number | ''>('');
  const [quickEditFinal, setQuickEditFinal] = useState<number | ''>('');
  const [quickEditError, setQuickEditError] = useState<string | null>(null);

  const activeTheme = useMemo(() => {
    const defaultTheme = {
      primary: 'bg-indigo-600 hover:bg-indigo-700',
      primaryText: 'text-indigo-600',
      lightBg: 'bg-indigo-50',
      border: 'border-indigo-100',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      shadow: 'shadow-indigo-100',
      accentBar: 'bg-indigo-600'
    };

    if (!schoolConfig?.themeColor) return defaultTheme;

    const themes = {
      indigo: defaultTheme,
      emerald: {
        primary: 'bg-emerald-600 hover:bg-emerald-700',
        primaryText: 'text-emerald-600',
        lightBg: 'bg-emerald-50',
        border: 'border-emerald-100',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-100',
        shadow: 'shadow-emerald-100',
        accentBar: 'bg-emerald-500'
      },
      violet: {
        primary: 'bg-violet-600 hover:bg-violet-700',
        primaryText: 'text-violet-600',
        lightBg: 'bg-violet-50',
        border: 'border-violet-100',
        badge: 'bg-violet-50 text-violet-700 border-violet-100',
        shadow: 'shadow-violet-100',
        accentBar: 'bg-violet-600'
      },
      rose: {
        primary: 'bg-rose-600 hover:bg-rose-700',
        primaryText: 'text-rose-600',
        lightBg: 'bg-rose-50',
        border: 'border-rose-100',
        badge: 'bg-rose-50 text-rose-700 border-rose-100',
        shadow: 'shadow-rose-100',
        accentBar: 'bg-rose-500'
      },
      amber: {
        primary: 'bg-amber-600 hover:bg-amber-700',
        primaryText: 'text-amber-600',
        lightBg: 'bg-amber-50',
        border: 'border-amber-100',
        badge: 'bg-amber-50 text-amber-900 border-amber-100',
        shadow: 'shadow-amber-100',
        accentBar: 'bg-amber-500'
      },
      slate: {
        primary: 'bg-slate-700 hover:bg-slate-800',
        primaryText: 'text-slate-700',
        lightBg: 'bg-slate-100',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-800 border-slate-200',
        shadow: 'shadow-slate-100',
        accentBar: 'bg-slate-600'
      }
    };

    return themes[schoolConfig.themeColor as keyof typeof themes] || defaultTheme;
  }, [schoolConfig?.themeColor]);

  // Letter grades and comments helper
  const getLetterGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-emerald-700 bg-emerald-100 border-emerald-200', remark: tx("እጅግ በጣም ከፍተኛ (Outstanding)") };
    if (score >= 85) return { grade: 'A', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', remark: tx("እጅግ በጣም ከፍተኛ (Excellent)") };
    if (score >= 80) return { grade: 'B+', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', remark: tx("በጣም ከፍተኛ (Very Good+)") };
    if (score >= 75) return { grade: 'B', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', remark: tx("በጣም ከፍተኛ (Very Good)") };
    if (score >= 65) return { grade: 'C+', color: 'text-amber-700 bg-amber-50 border-amber-200', remark: tx("ከፍተኛ (Good+)") };
    if (score >= 60) return { grade: 'C', color: 'text-amber-600 bg-amber-50 border-amber-100', remark: tx("ከፍተኛ (Good)") };
    if (score >= 50) return { grade: 'D', color: 'text-orange-600 bg-orange-50 border-orange-100', remark: tx("በቂ (Satisfactory)") };
    return { grade: 'F', color: 'text-rose-600 bg-rose-50 border-rose-100', remark: tx("የማያልፍ (Fail)") };
  };

  // Dynamic subjects from class setup or schoolConfig
  // For homeroom teachers, principals, or when viewing roster/cards/overview, show ALL subjects of the section/school
  const subjects = useMemo(() => {
    // 1. Prioritize class-specific subjects configured for this grade and section
    const matchingClass = classes?.find(c => c.grade === selectedGrade && c.section === selectedSection);
    const baseSubjects = (matchingClass && Array.isArray(matchingClass.subjects) && matchingClass.subjects.length > 0)
      ? matchingClass.subjects
      : (schoolConfig?.subjectsByGrade?.[selectedGrade] && schoolConfig.subjectsByGrade[selectedGrade].length > 0
          ? schoolConfig.subjectsByGrade[selectedGrade]
          : schoolConfig?.subjects || ['Mathematics', 'English', 'Amharic', 'Science', 'Social Studies', 'Information Technology', 'Civics']);

    // If user is a teacher or vice principal but is NOT the homeroom teacher of this class/section, limit to their taught subjects only in subject-specific views
    if ((currentUserRole === 'teacher' || currentUserRole === 'vice_principal') && currentTeacher && !isCurrentHomeroomTeacher) {
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
        return baseSubjects.filter(sub => teacherSubjectsSet.has(sub));
      }
    }
    return baseSubjects;
  }, [classes, selectedGrade, selectedSection, schoolConfig, currentUserRole, currentTeacher, isCurrentHomeroomTeacher]);

  const selectableSubjects = useMemo(() => {
    const allSchoolSubjects = schoolConfig?.subjects || ['Mathematics', 'English', 'Amharic', 'Science', 'Social Studies', 'Information Technology', 'Civics'];
    
    if ((currentUserRole === 'teacher' || currentUserRole === 'vice_principal') && currentTeacher) {
      const classAllocSet = new Set<string>();

      // 1. Subjects specifically allocated to this selected grade & section
      if (Array.isArray(currentTeacher.classAllocations) && currentTeacher.classAllocations.length > 0) {
        currentTeacher.classAllocations.forEach((alloc: any) => {
          const matchGrade = !alloc.grade || alloc.grade === 'All' || alloc.grade === selectedGrade;
          const matchSection = !alloc.section || alloc.section === 'All' || alloc.section === selectedSection;
          if (matchGrade && matchSection && Array.isArray(alloc.subjects)) {
            alloc.subjects.forEach((s: string) => {
              if (s) classAllocSet.add(s);
            });
          }
        });
      }

      // If specific class allocations exist for this class/section, strictly return only those subjects
      if (classAllocSet.size > 0) {
        return Array.from(classAllocSet);
      }

      // If no specific allocation for this grade/section, but teacher is assigned to this class
      if (currentTeacher.assignedClass === selectedGrade && (!currentTeacher.assignedSection || currentTeacher.assignedSection === selectedSection)) {
        if (Array.isArray(currentTeacher.subjects) && currentTeacher.subjects.length > 0) {
          return currentTeacher.subjects;
        }
      }

      // Fallback: If teacher has general subjects and no specific class allocations defined
      if ((!currentTeacher.classAllocations || currentTeacher.classAllocations.length === 0) && Array.isArray(currentTeacher.subjects) && currentTeacher.subjects.length > 0) {
        return currentTeacher.subjects;
      }

      return Array.isArray(currentTeacher.subjects) && currentTeacher.subjects.length > 0 ? currentTeacher.subjects : allSchoolSubjects;
    }
    return subjects.length > 0 ? subjects : allSchoolSubjects;
  }, [currentTeacher, currentUserRole, schoolConfig?.subjects, selectedGrade, selectedSection, subjects]);

  const [selectedSubject, setSelectedSubject] = useState('Mathematics');

  const isTeachingTeacher = useMemo(() => {
    return checkTeacherCanTeachSubject(selectedSubject, selectedGrade, selectedSection);
  }, [checkTeacherCanTeachSubject, selectedSubject, selectedGrade, selectedSection]);

  // Sync selectedSubject with changes in subjects list
  React.useEffect(() => {
    if (selectableSubjects.length > 0 && !selectableSubjects.includes(selectedSubject)) {
      setSelectedSubject(selectableSubjects[0]);
    }
  }, [selectableSubjects, selectedSubject]);

  // Helper to resolve max marks dynamically based on SaaS settings
  const getAssessmentMax = (assessmentId: string, defaultMax: number) => {
    if (!schoolConfig || !schoolConfig.subjectAssessments) return defaultMax;
    const assessments = schoolConfig.subjectAssessments[selectedSubject] || schoolConfig.subjectAssessments['default'] || [];
    const found = assessments.find((a: any) => a.id === assessmentId);
    return found ? found.maxMark : defaultMax;
  };

  const quizMax = getAssessmentMax('quiz', 10);
  const cwMax = getAssessmentMax('cw', 10);
  const hwMax = getAssessmentMax('hw', 10);
  const gwMax = getAssessmentMax('gw', 10);
  const pwMax = getAssessmentMax('pw', 10);
  const cpMax = getAssessmentMax('cp', 10);
  const mexamMax = getAssessmentMax('mid', 20);
  const fexamMax = getAssessmentMax('final', 20);

  // Assessment Weights states for teacher/principal customization
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [weightQuiz, setWeightQuiz] = useState(10);
  const [weightCw, setWeightCw] = useState(10);
  const [weightHw, setWeightHw] = useState(10);
  const [weightGw, setWeightGw] = useState(10);
  const [weightPw, setWeightPw] = useState(10);
  const [weightCp, setWeightCp] = useState(10);
  const [weightMid, setWeightMid] = useState(20);
  const [weightFinal, setWeightFinal] = useState(20);
  const [weightError, setWeightError] = useState<string | null>(null);

  const handleOpenWeightsModal = () => {
    playInteractiveSound('click');
    setWeightQuiz(quizMax);
    setWeightCw(cwMax);
    setWeightHw(hwMax);
    setWeightGw(gwMax);
    setWeightPw(pwMax);
    setWeightCp(cpMax);
    setWeightMid(mexamMax);
    setWeightFinal(fexamMax);
    setWeightError(null);
    setIsWeightModalOpen(true);
  };

  const handleSaveWeights = () => {
    if (!onUpdateSchoolConfig || !schoolConfig) {
      alert(tx("ስህተት፡ በትምህርት ቤቱ መዋቅር ላይ ለውጥ ለማድረግ ፍቃድ የለዎትም።"));
      return;
    }

    const totalWeight = Number(weightQuiz) + Number(weightCw) + Number(weightHw) + Number(weightGw) + Number(weightPw) + Number(weightCp) + Number(weightMid) + Number(weightFinal);
    if (totalWeight !== 100) {
      playInteractiveSound('wrong');
      setWeightError(`⚠️ የክፍፍሉ አጠቃላይ ድምር ${totalWeight}% ነው። እባክዎ ድምሩ በትክክል 100% መሙላቱን ያረጋግጡ። (Total sum is ${totalWeight}%. It must be exactly 100%.)`);
      return;
    }

    const newAssessments = [
      { id: 'quiz', name: tx("ኩዊዝ"), nameEng: 'QUIZ', maxMark: Number(weightQuiz) },
      { id: 'cw', name: tx("የክፍል ሥራ"), nameEng: 'CW', maxMark: Number(weightCw) },
      { id: 'hw', name: tx("የቤት ሥራ"), nameEng: 'HW', maxMark: Number(weightHw) },
      { id: 'gw', name: tx("የቡድን ሥራ"), nameEng: 'GW', maxMark: Number(weightGw) },
      { id: 'pw', name: tx("የፕሮጀክት ሥራ"), nameEng: 'PW', maxMark: Number(weightPw) },
      { id: 'cp', name: tx("የክፍል ተሳትፎ"), nameEng: 'CP', maxMark: Number(weightCp) },
      { id: 'mid', name: tx("ግማሽ ፈተና"), nameEng: 'MEXAM', maxMark: Number(weightMid) },
      { id: 'final', name: tx("ማጠቃለያ ፈተና"), nameEng: 'FEXAM', maxMark: Number(weightFinal) },
    ];

    const currentSubjectAssessments = schoolConfig.subjectAssessments ? { ...schoolConfig.subjectAssessments } : {};
    currentSubjectAssessments[selectedSubject] = newAssessments;

    if (!currentSubjectAssessments['default']) {
      currentSubjectAssessments['default'] = [
        { id: 'quiz', name: tx("ኩዊዝ"), nameEng: 'QUIZ', maxMark: 10 },
        { id: 'cw', name: tx("የክፍል ሥራ"), nameEng: 'CW', maxMark: 10 },
        { id: 'hw', name: tx("የቤት ሥራ"), nameEng: 'HW', maxMark: 10 },
        { id: 'gw', name: tx("የቡድን ሥራ"), nameEng: 'GW', maxMark: 10 },
        { id: 'pw', name: tx("የፕሮጀክት ሥራ"), nameEng: 'PW', maxMark: 10 },
        { id: 'cp', name: tx("የክፍል ተሳትፎ"), nameEng: 'CP', maxMark: 10 },
        { id: 'mid', name: tx("ግማሽ ፈተና"), nameEng: 'MEXAM', maxMark: 20 },
        { id: 'final', name: tx("ማጠቃለያ ፈተና"), nameEng: 'FEXAM', maxMark: 20 },
      ];
    }

    const nextConfig = {
      ...schoolConfig,
      subjectAssessments: currentSubjectAssessments
    };

    onUpdateSchoolConfig(nextConfig);
    playInteractiveSound('success');
    setIsWeightModalOpen(false);
  };

  // Filter students by chosen Grade and Section & search query
  const filteredStudents = useMemo(() => {
    let result = students;
    if (selectedGrade !== 'All') {
      result = result.filter(s => s.grade === selectedGrade);
    }
    result = result.filter(s => s.section === selectedSection);
    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.toLowerCase().trim();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.id.toLowerCase().includes(q)
      );
    }
    // Sort alphabetically by name
    return [...result].sort((a, b) => a.name.localeCompare(b.name, 'am'));
  }, [students, selectedGrade, selectedSection, studentSearchQuery]);

  // Stable alphabetical student list for the selected grade and section to give them a consistent serial number (ተራ ቁጥር)
  const sectionAlphabeticalStudents = useMemo(() => {
    let result = students;
    if (selectedGrade !== 'All') {
      result = result.filter(s => s.grade === selectedGrade);
    }
    result = result.filter(s => s.section === selectedSection);
    return [...result].sort((a, b) => a.name.localeCompare(b.name, 'am'));
  }, [students, selectedGrade, selectedSection]);

  const getStudentRollNumber = React.useCallback((studentId: string) => {
    const idx = sectionAlphabeticalStudents.findIndex(s => s.id === studentId);
    return idx !== -1 ? idx + 1 : '-';
  }, [sectionAlphabeticalStudents]);

  // Map students with their subject-specific grades (sorted alphabetically by student name)
  const studentGradesData = useMemo(() => {
    return filteredStudents.map(student => {
      const termToFilter = selectedTerm === 'annual' ? 1 : selectedTerm;
      const gradeRecord = grades.find(g => g.studentId === student.id && g.subject === selectedSubject && (g.term || 1) === termToFilter);
      return {
        student,
        gradeRecord: gradeRecord || null,
        totalScore: gradeRecord ? gradeRecord.total : 0
      };
    }).sort((a, b) => a.student.name.localeCompare(b.student.name, 'am')); // Sort alphabetically by name
  }, [filteredStudents, grades, selectedSubject, selectedTerm]);

  // Complete Roster data including all subjects, totals, averages, and ranks
  const studentRosterData = useMemo(() => {
    const data = filteredStudents.map(student => {
      const subjectGrades: Record<string, number | null> = {};
      let gradedCount = 0;
      let totalSum = 0;
      
      subjects.forEach(sub => {
        if (selectedTerm === 'annual') {
          const matchingGrades = grades.filter(grade => grade.studentId === student.id && grade.subject === sub);
          if (matchingGrades.length > 0) {
            const avgScore = Math.round(matchingGrades.reduce((acc, curr) => acc + curr.total, 0) / matchingGrades.length);
            subjectGrades[sub] = avgScore;
            totalSum += avgScore;
            gradedCount++;
          } else {
            subjectGrades[sub] = null;
          }
        } else {
          const g = grades.find(grade => grade.studentId === student.id && grade.subject === sub && (grade.term || 1) === selectedTerm);
          if (g) {
            subjectGrades[sub] = g.total;
            totalSum += g.total;
            gradedCount++;
          } else {
            subjectGrades[sub] = null;
          }
        }
      });

      const average = gradedCount > 0 ? Math.round(totalSum / gradedCount) : 0;
      const extra = studentExtraInfo[student.id] || { conduct: 'A', absent: 0 };

      return {
        student,
        subjectGrades,
        totalSum,
        gradedCount,
        average,
        conduct: extra.conduct,
        absent: extra.absent
      };
    });

    // Filter students who have at least one grade to rank them fairly
    const gradedStudents = data.filter(item => item.gradedCount > 0);
    const sortedGraded = [...gradedStudents].sort((a, b) => b.average - a.average);

    return data.map(item => {
      let rank: number | null = null;
      if (item.gradedCount > 0) {
        rank = sortedGraded.findIndex(s => s.student.id === item.student.id) + 1;
      }
      return {
        ...item,
        rank
      };
    }).sort((a, b) => {
      if (a.rank === null) return 1;
      if (b.rank === null) return -1;
      return a.rank - b.rank;
    });
  }, [filteredStudents, grades, subjects, studentExtraInfo, selectedTerm]);

  const handleUpdateExtraInfo = (studentId: string, field: 'conduct' | 'absent', value: any) => {
    // Prevent editing if not teacher, or if not the homeroom teacher of this class
    if (currentUserRole !== 'teacher' || !isCurrentHomeroomTeacher) {
      playInteractiveSound('wrong');
      return;
    }
    setStudentExtraInfo(prev => {
      const updated = {
        ...prev,
        [studentId]: {
          ...(prev[studentId] || { conduct: 'A', absent: 0 }),
          [field]: field === 'absent' ? (parseInt(value) >= 0 ? parseInt(value) : 0) : value
        }
      };
      localStorage.setItem('studentExtraInfo', JSON.stringify(updated));
      return updated;
    });
  };

  // Inline edit handler for Mark List
  const handleInlineGradeChange = (studentId: string, field: 'quiz' | 'cw' | 'hw' | 'gw' | 'pw' | 'cp' | 'mid' | 'final', valueStr: string) => {
    if (!onSaveGrade || !isTeachingTeacher) return;
    
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const activeTermNum = selectedTerm === 'annual' ? 1 : selectedTerm;
    const currentRecord = grades.find(g => g.studentId === studentId && g.subject === selectedSubject && (g.term || 1) === activeTermNum);
    
    // Disable editing if record is already approved
    if (currentRecord && currentRecord.isApproved) {
      playInteractiveSound('wrong');
      return;
    }

    const maxVals = { quiz: 100, cw: 100, hw: 100, gw: 100, pw: 100, cp: 100, mid: 100, final: 100 };
    const max = maxVals[field];
    
    let rawVal = valueStr === '' ? 0 : Number(valueStr);
    if (isNaN(rawVal)) rawVal = 0;
    if (rawVal < 0) rawVal = 0;
    if (rawVal > max) rawVal = max;

    const quiz = field === 'quiz' ? rawVal : (currentRecord?.quiz || 0);
    const cw = field === 'cw' ? rawVal : (currentRecord?.cw || 0);
    const hw = field === 'hw' ? rawVal : (currentRecord?.hw || 0);
    const gw = field === 'gw' ? rawVal : (currentRecord?.gw || 0);
    const pw = field === 'pw' ? rawVal : (currentRecord?.pw || 0);
    const cp = field === 'cp' ? rawVal : (currentRecord?.cp || 0);
    const mid = field === 'mid' ? rawVal : (currentRecord?.mid || 0);
    const final = field === 'final' ? rawVal : (currentRecord?.final || 0);
    
    const total = quiz + cw + hw + gw + pw + cp + mid + final;

    const updatedGrade: Grade = {
      id: currentRecord?.id || 'g-' + Math.floor(1000 + Math.random() * 9000),
      studentId: student.id,
      studentName: student.name,
      subject: selectedSubject,
      quiz,
      cw,
      hw,
      gw,
      pw,
      cp,
      mid,
      final,
      total,
      teacher: currentRecord?.teacher || 'teacher@school.com',
      timestamp: new Date().toISOString(),
      term: activeTermNum,
      isApproved: currentRecord?.isApproved || false
    };

    onSaveGrade(updatedGrade);
  };

  // Toggle approval state for grade record (Primary action for Principal)
  const handleToggleApprove = (studentId: string) => {
    if (!onSaveGrade) return;
    if (currentUserRole !== 'principal') {
      playInteractiveSound('wrong');
      return;
    }
    const activeTermNum = selectedTerm === 'annual' ? 1 : selectedTerm;
    const currentRecord = grades.find(g => g.studentId === studentId && g.subject === selectedSubject && (g.term || 1) === activeTermNum);
    
    if (currentRecord) {
      onSaveGrade({
        ...currentRecord,
        isApproved: !currentRecord.isApproved
      });
      playInteractiveSound('success');
    } else {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      onSaveGrade({
        id: 'g-' + Math.floor(1000 + Math.random() * 9000),
        studentId: student.id,
        studentName: student.name,
        subject: selectedSubject,
        quiz: 0,
        cw: 0,
        hw: 0,
        gw: 0,
        pw: 0,
        cp: 0,
        mid: 0,
        final: 0,
        total: 0,
        teacher: 'teacher@school.com',
        timestamp: new Date().toISOString(),
        term: activeTermNum,
        isApproved: true
      });
      playInteractiveSound('success');
    }
  };

  // Click handler to trigger single record deletion confirmation
  const handleDeleteClick = (studentId: string, studentName: string, record: Grade | null) => {
    if (!record) return;
    if (!isTeachingTeacher) {
      playInteractiveSound('wrong');
      alert(tx(
        "ውጤት ለመሰረዝ ፍቃድ የለዎትም። ይህንን ማስተማር የሚችለው ያንን የትምህርት አይነት የሚያስተምረው መምህር ብቻ ነው። (You do not have permission to delete this grade. Only the teaching teacher can do this.)"
      ));
      return;
    }
    if (record.isApproved) {
      playInteractiveSound('wrong');
      alert(tx(
        "ውጤቱ የጸደቀ ስለሆነ መሰረዝ አይቻልም። (This grade is approved and locked. It cannot be deleted.)"
      ));
      return;
    }
    playInteractiveSound('wrong');
    setConfirmModal({
      isOpen: true,
      title: tx("የተማሪ ውጤት መሰረዝ (Delete Student Grade)"),
      description: `${studentName} የተባለውን ተማሪ የ${selectedSubject} የክፍለ ጊዜ/ሩብ ዓመት ${selectedTerm === 'annual' ? 1 : selectedTerm} ውጤት በቋሚነት መሰረዝ ይፈልጋሉ? ይህ ድርጊት ከተረጋገጠ በኋላ ወደ ነበረበት መመለስ አይቻልም።`,
      type: 'delete',
      onConfirm: () => {
        if (onDeleteGrade) {
          onDeleteGrade(studentId, selectedSubject, selectedTerm === 'annual' ? 1 : selectedTerm);
          playInteractiveSound('success');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Click handler to trigger bulk approval confirmation
  const handleBulkApproveClick = () => {
    const termToFilter = selectedTerm === 'annual' ? 1 : selectedTerm;
    const unapprovedGrades = studentGradesData.filter(item => item.gradeRecord && !item.gradeRecord.isApproved);
    if (unapprovedGrades.length === 0) {
      playInteractiveSound('wrong');
      return;
    }
    playInteractiveSound('wrong');
    setConfirmModal({
      isOpen: true,
      title: tx("ሁሉንም ውጤቶች በጅምላ ማጽደቅ (Bulk Approve All Grades)"),
      description: `በክፍል ${selectedGrade}-${selectedSection} ውስጥ ለሚገኙ ተማሪዎች በሙሉ የ${selectedSubject} የክፍለ ጊዜ/ሩብ ዓመት ${termToFilter} ውጤቶችን ማጽደቅ ይፈልጋሉ? ይህም መምህራን ውጤቱን እንዳይቀይሩ ይቆልፋል።`,
      type: 'bulk_approve',
      onConfirm: () => {
        if (onSaveGrade) {
          unapprovedGrades.forEach(item => {
            if (item.gradeRecord) {
              onSaveGrade({
                ...item.gradeRecord,
                isApproved: true
              });
            }
          });
          playInteractiveSound('success');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Click handler to trigger bulk clear confirmation
  const handleBulkClearClick = () => {
    if (!isTeachingTeacher) {
      playInteractiveSound('wrong');
      alert(tx(
        "ውጤት ለመሰረዝ ፍቃድ የለዎትም። ይህንን ማስተማር የሚችለው ያንን የትምህርት አይነት የሚያስተምረው መምህር ብቻ ነው። (You do not have permission to delete these grades. Only the teaching teacher can do this.)"
      ));
      return;
    }
    const termToFilter = selectedTerm === 'annual' ? 1 : selectedTerm;
    const recordsToClear = studentGradesData.filter(item => item.gradeRecord);
    // If teacher, make sure we filter out approved records
    const clearableRecords = recordsToClear.filter(item => {
      if (currentUserRole === 'principal') return true;
      return item.gradeRecord && !item.gradeRecord.isApproved;
    });

    if (clearableRecords.length === 0) {
      playInteractiveSound('wrong');
      return;
    }

    playInteractiveSound('wrong');
    setConfirmModal({
      isOpen: true,
      title: tx("የክፍል ውጤቶችን በጅምላ መሰረዝ (Bulk Clear/Delete All Grades)"),
      description: `በክፍል ${selectedGrade}-${selectedSection} ውስጥ ለሚገኙ ተማሪዎች በሙሉ የ${selectedSubject} የክፍለ ጊዜ/ሩብ ዓመት ${termToFilter} ውጤቶችን መሰረዝ/ማጥፋት ይፈልጋሉ? ይህ ድርጊት ወደኋላ የማይመለስ እና ሁሉንም የክፍሉን ውጤቶች የሚያጠፋ ነው።`,
      type: 'bulk_clear',
      onConfirm: () => {
        if (onDeleteGrade) {
          clearableRecords.forEach(item => {
            onDeleteGrade(item.student.id, selectedSubject, termToFilter);
          });
          playInteractiveSound('success');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Quick edit for Roster cells
  const handleOpenQuickEdit = (student: Student, subject: string) => {
    if (!checkTeacherCanTeachSubject(subject, student.grade, student.section)) {
      playInteractiveSound('wrong');
      alert(tx(
        "ውጤት ለማስገባት/ለማስተካከል ፍቃድ የለዎትም። ይህንን ማስተማር የሚችለው ያንን የትምህርት አይነት የሚያስተምረው መምህር ብቻ ነው። (You do not have permission to edit/save. Only the teaching teacher can do this.)"
      ));
      return;
    }
    playInteractiveSound('click');
    const activeTermNum = selectedTerm === 'annual' ? 1 : selectedTerm;
    const r = grades.find(g => g.studentId === student.id && g.subject === subject && (g.term || 1) === activeTermNum);
    setQuickEditStudentId(student.id);
    setQuickEditSubject(subject);
    setQuickEditQuiz(r ? r.quiz : 0);
    setQuickEditCw(r ? r.cw : 0);
    setQuickEditHw(r ? r.hw : 0);
    setQuickEditMid(r ? r.mid : 0);
    setQuickEditFinal(r ? r.final : 0);
    setQuickEditError(null);
  };

  const handleSaveQuickEdit = () => {
    if (!onSaveGrade || !quickEditStudentId || !quickEditSubject) return;

    const student = students.find(s => s.id === quickEditStudentId);
    if (!student) return;

    if (!checkTeacherCanTeachSubject(quickEditSubject, student.grade, student.section)) {
      playInteractiveSound('wrong');
      setQuickEditError(tx(
        "ውጤት ለማስገባት/ለማስተካከል ፍቃድ የለዎትም። ይህንን ማስተማር የሚችለው ያንን የትምህርት አይነት የሚያስተምረው መምህር ብቻ ነው። (You do not have permission to edit/save. Only the teaching teacher can do this.)"
      ));
      return;
    }

    const q = Number(quickEditQuiz);
    const c = Number(quickEditCw);
    const h = Number(quickEditHw);
    const m = Number(quickEditMid);
    const f = Number(quickEditFinal);

    const isInvalid = (val: number, max: number) => isNaN(val) || val < 0 || val > max;

    if (isInvalid(q, 100) || isInvalid(c, 100) || isInvalid(h, 100) || isInvalid(m, 100) || isInvalid(f, 100)) {
      playInteractiveSound('wrong');
      setQuickEditError(tx(
        "እባክዎን ትክክለኛ ውጤት ያስገቡ! (Quiz: 0-100, CW: 0-100, HW: 0-100, Mid: 0-100, Final: 0-100)"
      ));
      return;
    }

    const activeTermNum = selectedTerm === 'annual' ? 1 : selectedTerm;
    const currentRecord = grades.find(g => g.studentId === quickEditStudentId && g.subject === quickEditSubject && (g.term || 1) === activeTermNum);

    if (currentRecord && currentRecord.isApproved) {
      playInteractiveSound('wrong');
      setQuickEditError(tx(
        "❌ ይህ ውጤት የጸደቀ ስለሆነ ማሻሻል አይቻልም። (This grade is approved and locked. It cannot be edited.)"
      ));
      return;
    }

    const total = q + c + h + m + f;

    const updatedGrade: Grade = {
      id: currentRecord?.id || 'g-' + Math.floor(1000 + Math.random() * 9000),
      studentId: student.id,
      studentName: student.name,
      subject: quickEditSubject,
      quiz: q,
      cw: c,
      hw: h,
      mid: m,
      final: f,
      total,
      teacher: currentRecord?.teacher || 'teacher@school.com',
      timestamp: new Date().toISOString(),
      term: activeTermNum,
      isApproved: currentRecord?.isApproved || false
    };

    playInteractiveSound('success');
    onSaveGrade(updatedGrade);
    
    // Close modal
    setQuickEditStudentId(null);
    setQuickEditSubject(null);
  };

  // Calculate stats for the selected class/section
  const classStats = useMemo(() => {
    if (activeSubTab === 'roster') {
      const scoredStudents = studentRosterData.filter(item => item.gradedCount > 0);
      const count = scoredStudents.length;
      if (count === 0) return { avg: 0, highest: 0, passRate: 0, passCount: 0 };

      const totalSum = scoredStudents.reduce((sum, item) => sum + item.average, 0);
      const highest = Math.max(...scoredStudents.map(item => item.average));
      const passCount = scoredStudents.filter(item => isStudentPassing(item)).length;
      const passRate = Math.round((passCount / count) * 100);

      return {
        avg: Math.round(totalSum / count),
        highest,
        passRate,
        passCount
      };
    } else {
      const scoredStudents = studentGradesData.filter(item => item.gradeRecord !== null);
      const count = scoredStudents.length;
      if (count === 0) return { avg: 0, highest: 0, passRate: 0, passCount: 0 };

      const totalSum = scoredStudents.reduce((sum, item) => sum + (item.gradeRecord?.total || 0), 0);
      const highest = Math.max(...scoredStudents.map(item => item.gradeRecord?.total || 0));
      const passCount = scoredStudents.filter(item => (item.gradeRecord?.total || 0) >= 50).length;
      const passRate = Math.round((passCount / count) * 100);

      return {
        avg: Math.round(totalSum / count),
        highest,
        passRate,
        passCount
      };
    }
  }, [studentGradesData, studentRosterData, activeSubTab]);

  // Export CSV function (የዳታቤዝ ማውረጃ)
  const handleDownloadCSV = () => {
    playInteractiveSound('success');
    
    let csvString = "";
    
    if (activeSubTab === 'marklist') {
      csvString += `Subject: ${selectedSubject},Grade: ${selectedGrade},Section: ${selectedSection}\n`;
      csvString += "Student ID,Student Name,Quiz (10),Classwork (10),Homework (10),Midterm (20),Final (50),Total (100)\n";
      studentGradesData.forEach(item => {
        const r = item.gradeRecord;
        csvString += `${item.student.id},"${item.student.name.replace(/"/g, '""')},${r ? r.quiz : '-'},${r ? r.cw : '-'},${r ? r.hw : '-'},${r ? r.mid : '-'},${r ? r.final : '-'},${r ? r.total + '%' : '-'}\n`;
      });
    } else {
      csvString += `Class Roster: Grade ${selectedGrade}, Section ${selectedSection}\n`;
      csvString += "Rank,Student ID,Student Name," + subjects.join(',') + ",Total,Average,Conduct,Absent,Status\n";
      studentRosterData.forEach((item) => {
        const subjectScores = subjects.map(sub => item.subjectGrades[sub] !== null ? `${item.subjectGrades[sub]}` : '-').join(',');
        const status = item.gradedCount > 0 ? (isStudentPassing(item) ? tx("PASS (አልፏል)") : tx("FAIL (ወድቋል)")) : 'No Grade';
        csvString += `${item.rank !== null ? item.rank : '-'},${item.student.id},"${item.student.name.replace(/"/g, '""')},${subjectScores},${item.totalSum},${item.average}%,${item.conduct},${item.absent},${status}\n`;
      });
    }

    // Add UTF-8 BOM to make sure Amharic displays perfectly in Excel
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedGrade}_Section_${selectedSection}_${activeSubTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Trigger Print (ማተሚያ)
  const handlePrint = () => {
    setPdfError(null);
    playInteractiveSound('success');
    window.print();
  };

  // Direct Roster Print/PDF Save with automatic browser layout setup
  const handleDirectRosterPrint = () => {
    setPdfError(null);
    playInteractiveSound('success');
    setActiveSubTab('roster');
    setIsPrintPreview(true);
    // Let layout render the print dialog with correct parameters after a tiny delay
    setTimeout(() => {
      window.print();
    }, 600);
  };

  // Convert and Download PDF using html2canvas & jsPDF directly
  const exportElementToPDF = (elementId: string, filename: string, orientation: 'portrait' | 'landscape') => {
    playInteractiveSound('success');
    setIsGeneratingPDF(true);
    setPdfError(null);
    setPdfProgressMsg(tx(
      "ፒዲኤፍ ፋይሉ በመዘጋጀት ላይ ነው... እባክዎ ጥቂት ሰኮንዶች ይጠብቁ (Generating high-resolution PDF... Please wait)"
    ));

    const originalViewType = previewViewType;
    if (elementId === 'report-card-print-area') {
      setPreviewViewType('card');
    }

    let cleanupContext: any = null;
    try {
      cleanupContext = applyOklchCleanup(document, window);
    } catch (e) {
      console.error('Error starting oklch cleanup', e);
    }

    const restoreAll = () => {
      if (cleanupContext) {
        cleanupContext.restoreAll();
      }
      if (elementId === 'report-card-print-area') {
        setPreviewViewType(originalViewType);
      }
    };

    let isFinished = false;
    
    // Safety fallback timer: If PDF generation gets stuck (e.g. sandbox limits), fall back to native print.
    const safetyTimer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        setIsGeneratingPDF(false);
        restoreAll();
        console.warn('PDF generation exceeded time limit. Falling back to native vector printing.');
        alert(tx(
          "ቀጥታ ፒዲኤፍ ማውረዱ ዘግይቷል፤ ነገር ግን ትክክለኛውንና የተስተካከለውን ፒዲኤፍ ለማግኘት አሁን በሚመጣው የህትመት ገጽ ላይ \"Save as PDF\" (ፒዲኤፍ አድርገህ አስቀምጥ) የሚለውን ይምረጡ። (Direct PDF render timed out. For a perfect high-resolution document, we are opening the native print dialog. Please choose \"Save as PDF\" as the destination.)"
        ));
        
        if (elementId === 'report-card-print-area') {
          // Individual card modal is already open, just trigger native print directly!
          window.print();
        } else {
          // Open print preview mode natively for class roster
          setIsPrintPreview(true);
          setTimeout(() => {
            window.print();
          }, 500);
        }
      }
    }, 15000);

    setTimeout(async () => {
      try {
        if (elementId === 'report-card-print-area') {
          const frontEl = document.getElementById('report-card-print-area-front');
          const backEl = document.getElementById('report-card-print-area-back');

          if (frontEl && backEl) {
            setPdfProgressMsg(tx("የፊት ገጽ በመዘጋጀት ላይ ነው... (Preparing front page...)"));
            const canvasFront = await html2canvas(frontEl, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#faf8f2',
              scrollX: 0,
              scrollY: 0,
              windowWidth: 1200,
              onclone: (clonedDoc: Document) => {
                if (cleanupContext) {
                  cleanupContext.handleClone(clonedDoc, 'report-card-print-area-front');
                }
              }
            });

            setPdfProgressMsg(tx("የጀርባ ገጽ በመዘጋጀት ላይ ነው... (Preparing back page...)"));
            const canvasBack = await html2canvas(backEl, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#faf8f2',
              scrollX: 0,
              scrollY: 0,
              windowWidth: 1200,
              onclone: (clonedDoc: Document) => {
                if (cleanupContext) {
                  cleanupContext.handleClone(clonedDoc, 'report-card-print-area-back');
                }
              }
            });

            const imgDataFront = canvasFront.toDataURL('image/png');
            const imgDataBack = canvasBack.toDataURL('image/png');

            const pdf = new jsPDF({
              orientation: 'landscape',
              unit: 'mm',
              format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const marginX = 0;
            const marginY = 0;
            const imgWidth = pdfWidth;
            const imgHeight = pdfHeight;

            // Page 1: Front
            pdf.addImage(imgDataFront, 'PNG', marginX, marginY, imgWidth, imgHeight);

            // Add branding watermark across front page
            // Disabled jsPDF text overlay to prevent obscuring student details (HTML template watermark is used instead)

            // Page 2: Back
            pdf.addPage();
            pdf.addImage(imgDataBack, 'PNG', marginX, marginY, imgWidth, imgHeight);

            const finalFilename = `${filename}.pdf`;
            try {
              pdf.save(finalFilename);
            } catch (saveErr) {
              console.warn('Standard PDF save failed inside iframe', saveErr);
            }

            // Generate secure Blob URL for manual click download fallback
            const pdfBlob = pdf.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            if (onRequestManualPdfLink) {
              onRequestManualPdfLink(blobUrl, finalFilename, `የተማሪ መግለጫ ካርድ (${filename})`);
            }

            isFinished = true;
            clearTimeout(safetyTimer);
            setIsGeneratingPDF(false);
            setShowPdfSuccess(true);
            playInteractiveSound('success');
            setTimeout(() => {
              setShowPdfSuccess(false);
            }, 3000);
            return;
          }
        }

        const element = document.getElementById(elementId);
        if (!element) {
          isFinished = true;
          clearTimeout(safetyTimer);
          setIsGeneratingPDF(false);
          restoreAll();
          setPdfError(tx("ስህተት፡ ሊታተም የሚችለው አካል አልተገኘም (Error: Printable element not found)"));
          alert(tx("ስህተት፡ ሊታተም የሚችለው አካል አልተገኘም (Error: Printable element not found)"));
          return;
        }

        const targetWidth = elementId === 'printable-area' 
          ? 1350 
          : (orientation === 'landscape' ? 1200 : 800);

        const scaleVal = elementId === 'printable-area' ? 1.5 : 2;

        // Render directly with html2canvas (Using layout isolation inside the clone to prevent scroll displacement or clip)
        const canvas = await html2canvas(element, {
          scale: scaleVal,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: targetWidth,
          onclone: (clonedDoc: Document) => {
            try {
              if (cleanupContext) {
                cleanupContext.handleClone(clonedDoc, elementId);
              }
              const clonedElement = clonedDoc.getElementById(elementId);
              if (clonedElement) {
                // Ensure all ancestor elements are fully visible and not overflow-hidden
                let parent = clonedElement.parentElement;
                while (parent && parent !== clonedDoc.body) {
                  parent.style.setProperty('overflow', 'visible', 'important');
                  parent.style.setProperty('display', 'block', 'important');
                  parent = parent.parentElement;
                }

                // Style the cloned element with exact layout bounds
                clonedElement.style.setProperty('max-width', 'none', 'important');
                clonedElement.style.setProperty('width', `${targetWidth}px`, 'important');
                clonedElement.style.setProperty('padding', '20px', 'important');
                clonedElement.style.setProperty('margin', '0', 'important');
                clonedElement.style.setProperty('background-color', '#ffffff', 'important');
                clonedElement.style.setProperty('color', '#0c0a09', 'important');
                clonedElement.style.setProperty('overflow', 'visible', 'important');
                clonedElement.classList.remove('max-w-4xl', 'max-w-5xl', 'max-w-3xl');

                // Force all nested overflow/scroll containers inside the cloned element to be fully expanded
                const scrollContainers = clonedElement.querySelectorAll('.overflow-x-auto, .overflow-y-auto, [class*="overflow-"]');
                scrollContainers.forEach((el: any) => {
                  el.style.setProperty('overflow', 'visible', 'important');
                  el.style.setProperty('max-height', 'none', 'important');
                  el.style.setProperty('max-width', 'none', 'important');
                });

                // Ensure SVG icons inside have readable/correct colors
                const svgIcons = clonedElement.querySelectorAll('svg');
                svgIcons.forEach((svg: any) => {
                  if (svg.classList.contains('text-slate-900') || svg.classList.contains('text-slate-950')) {
                    svg.style.setProperty('color', '#1c1917', 'important');
                  } else {
                    svg.style.setProperty('color', '#44403c', 'important');
                  }
                });

                // Traversal to clean all dark mode text coloring styles inside the sheet
                const allDescendants = clonedElement.getElementsByTagName('*');
                for (let i = 0; i < allDescendants.length; i++) {
                  const desc = allDescendants[i] as HTMLElement;
                  const isHeader = desc.tagName === 'TH';
                  const isTableCell = desc.tagName === 'TD';
                  
                  if (isHeader) {
                    desc.style.setProperty('color', '#ffffff', 'important');
                    desc.style.setProperty('background-color', '#000000', 'important');
                  } else {
                    desc.style.setProperty('color', '#000000', 'important');
                    
                    if (isTableCell) {
                      desc.style.setProperty('font-weight', '800', 'important');
                      desc.style.setProperty('color', '#000000', 'important');
                    }
                    
                    if (desc.classList.contains('bg-white') || desc.classList.contains('bg-slate-50') || desc.classList.contains('bg-slate-50')) {
                      desc.style.setProperty('background-color', '#ffffff', 'important');
                    }
                  }
                }
              }
            } catch (cloneErr) {
              console.error('Error in html2canvas clone style modifier:', cloneErr);
            }
          }
        });

        const imgData = canvas.toDataURL('image/png');

        // Create a jsPDF document representing standard A4 printable sheet
        const pdf = new jsPDF({
          orientation: orientation,
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const marginX = orientation === 'landscape' ? 8 : 12;
        const imgWidth = pdfWidth - (marginX * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Break multi-page automatically if the content overflows
        if (imgHeight > pdfHeight - 20) {
          let heightLeft = imgHeight;
          let position = 10;
          pdf.addImage(imgData, 'PNG', marginX, position, imgWidth, imgHeight);
          heightLeft -= (pdfHeight - 20);

          while (heightLeft > 0) {
            position = heightLeft - imgHeight + 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', marginX, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
          }
        } else {
          const marginY = Math.max(10, (pdfHeight - imgHeight) / 2);
          pdf.addImage(imgData, 'PNG', marginX, marginY, imgWidth, imgHeight);
        }

        const finalFilename = `${filename}.pdf`;

        // Try automatic save
        try {
          pdf.save(finalFilename);
        } catch (saveErr) {
          console.warn('Standard PDF save failed inside iframe', saveErr);
        }

        // Generate secure Blob URL for manual click download fallback
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        if (onRequestManualPdfLink) {
          onRequestManualPdfLink(blobUrl, finalFilename, `የክፍል ሪፖርት / ውጤት ሰሌዳ (${filename})`);
        }

        if (!isFinished) {
          isFinished = true;
          clearTimeout(safetyTimer);
          setIsGeneratingPDF(false);
          setShowPdfSuccess(true);
          playInteractiveSound('success');
          setTimeout(() => {
            setShowPdfSuccess(false);
          }, 3000);
        }
      } catch (err: any) {
        if (!isFinished) {
          isFinished = true;
          clearTimeout(safetyTimer);
          console.error('PDF direct generation error:', err);
          setIsGeneratingPDF(false);
          const errMsg = err?.message || JSON.stringify(err);
          setPdfError(`ፒዲኤፍ ማውረድ አልተቻለም (Could not download PDF): ${errMsg}`);
          alert(tx("ፒዲኤፍ ማውረድ አልተቻለም (Could not download PDF):\n") + errMsg);
        }
      } finally {
        restoreAll();
      }
    }, 600);
  };

  if (isPrintPreview) {
    return createPortal(
      <div className="print-preview-container">
        <div className="print-preview-inner">
          {/* CSS Print Stylesheet injected dynamically */}
          <style dangerouslySetInnerHTML={{__html: `
            /* On screen overlay style */
            .print-preview-container {
              position: fixed !important;
              inset: 0 !important;
              z-index: 999999 !important;
              background-color: rgba(15, 23, 42, 0.75) !important; /* backdrop color */
              backdrop-filter: blur(6px) !important;
              overflow-y: auto !important;
              overflow-x: hidden !important;
              padding: 0.75rem 0.5rem !important;
              display: flex !important;
              justify-content: center !important;
              align-items: flex-start !important;
            }
            @media (min-width: 640px) {
              .print-preview-container {
                padding: 2rem 1rem !important;
              }
            }
            .print-preview-inner {
              background-color: #ffffff !important;
              color: #0c0a09 !important;
              border-radius: 1.25rem !important;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4) !important;
              padding: 1rem !important;
              width: 100% !important;
              max-width: 64rem !important; /* max-w-5xl */
              margin-top: 0.5rem !important;
              margin-bottom: 2rem !important;
              box-sizing: border-box !important;
            }
            @media (min-width: 640px) {
              .print-preview-inner {
                padding: 2rem !important;
                border-radius: 1.5rem !important;
                margin-top: 1rem !important;
              }
            }

            #printable-area {
              width: ${tableLayoutSnug ? 'auto' : '100%'} !important;
              max-width: 100% !important;
              background: white !important;
              box-sizing: border-box !important;
              zoom: ${printScaling / 100} !important;
              ${a4Centering ? 'margin: 0 auto !important;' : ''}
            }

            /* CRITICAL: Force all container divs to have visible overflow so that page breaks and canvas captures work perfectly */
            .print-preview-container div,
            .print-preview-container .overflow-x-auto,
            #printable-area div {
              overflow: visible !important;
              max-width: none !important;
            }

            .avoid-page-break,
            .print-preview-container tbody {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              break-inside: avoid-page !important;
            }

            /* Clean separate border grid layout allowing browser to respect break-inside on tbody */
            .roster-printable-table {
              display: table !important;
              width: ${tableLayoutSnug ? 'auto' : '100%'} !important;
              max-width: 100% !important;
              table-layout: auto !important;
              border-collapse: separate !important;
              border-spacing: 0 !important;
              border-top: 1px solid #000000 !important;
              border-left: 1px solid #000000 !important;
              margin: 0 auto !important;
            }

            .marklist-printable-table {
              display: table !important;
              width: ${tableLayoutSnug ? 'auto' : '100%'} !important;
              max-width: 100% !important;
              table-layout: auto !important;
              border-collapse: collapse !important;
              margin: 0 auto !important;
            }

            #print-target-sheet {
              page-break-inside: auto !important;
              break-inside: auto !important;
            }

            #print-target-sheet table tbody tr {
              border-bottom: 0.5px solid #000000 !important;
            }

            #print-target-sheet table tbody tr td {
              border-bottom: 0.5px solid #000000 !important;
            }

            #print-target-sheet table {
              table-layout: fixed !important;
              width: ${tableLayoutSnug ? 'max-content' : '100%'} !important;
              max-width: 100% !important;
              overflow: hidden !important;
            }

            #print-target-sheet th,
            #print-target-sheet td {
              white-space: normal !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              padding: 5px 6px !important;
              overflow: hidden !important;
              ${tableLayoutSnug ? 'width: max-content !important;' : ''}
            }

            #print-target-sheet td.student-info-cell-name,
            #print-target-sheet td:nth-child(2) {
              white-space: normal !important;
              max-width: 180px !important;
            }

            ${tableLayoutSnug ? `
              .roster-printable-table th,
              .roster-printable-table td:not(.student-info-cell-name),
              .marklist-printable-table th,
              .marklist-printable-table td:not(:nth-child(2)) {
                white-space: nowrap !important;
                padding-left: 6px !important;
                padding-right: 6px !important;
              }
              .roster-printable-table td.student-info-cell-name {
                white-space: normal !important;
                max-width: 180px !important;
              }
              .marklist-printable-table td:nth-child(2) {
                white-space: normal !important;
                max-width: 180px !important;
              }
            ` : ''}

            .roster-printable-table thead {
              display: table-header-group !important;
            }

            .roster-printable-table tbody {
              display: table-row-group !important;
            }

            .roster-printable-table tr {
              display: table-row !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            .roster-printable-table th {
              font-size: 10.5px !important;
              padding: 4px 2.5px !important;
              line-height: 1.2 !important;
              font-weight: 900 !important;
              text-transform: uppercase !important;
              border-right: 1px solid #ffffff !important;
              border-bottom: 1px solid #ffffff !important;
              border-top: 1px solid #ffffff !important;
              border-left: 1px solid #ffffff !important;
              text-align: center !important;
              vertical-align: middle !important;
              color: #ffffff !important;
              background-color: #000000 !important;
            }

            .roster-printable-table td {
              display: table-cell !important;
              font-size: 10px !important;
              padding: 4px 2.5px !important;
              line-height: 1.2 !important;
              font-weight: 800 !important;
              border-right: 1px solid #000000 !important;
              border-bottom: 1px solid #000000 !important;
              border-top: none !important;
              border-left: none !important;
              vertical-align: middle !important;
              color: #000000 !important;
            }

            /* Guarantee perfect vertical pseudo-merged cells without using unstable rowspan attributes */
            .roster-printable-table td.student-info-cell {
              background-color: #ffffff !important;
              font-weight: 900 !important;
              font-size: 10px !important;
              text-align: center !important;
              color: #000000 !important;
              border-bottom: 3.5px solid #000000 !important;
            }
            
            .roster-printable-table td.student-info-cell-name {
              background-color: #ffffff !important;
              font-weight: 950 !important;
              font-size: 10px !important;
              text-align: left !important;
              padding-left: 5px !important;
              color: #000000 !important;
              border-bottom: 3.5px solid #000000 !important;
            }

            .roster-printable-table td.roster-annual-cell {
              border-bottom: 3.5px solid #000000 !important;
            }

            .roster-printable-table td.merged-cell-no-bottom {
              border-bottom: none !important;
            }

            /* FORCE PURE BLACK HEADERS AND WHITE TEXT REGARDLESS OF THE SYSTEM OR UTILITY THEMING */
            #printable-area th,
            #printable-area th *,
            .roster-printable-table th,
            .roster-printable-table th *,
            thead th,
            thead th * {
              background-color: #000000 !important;
              color: #ffffff !important;
              font-weight: 950 !important;
            }

            /* FORCE CRISP SOLID BLACK BORDERS ALWAYS EXCEPT BLACK HEADERS WHOSE BORDERS MUST BE WHITE */
            #printable-area table,
            #printable-area tr,
            #printable-area td,
            .roster-printable-table,
            .roster-printable-table tr,
            .roster-printable-table td {
              border-color: #000000 !important;
            }

            #printable-area th,
            .roster-printable-table th,
            thead th {
              border-color: #ffffff !important;
            }

            /* HIGH SPECIFICITY FORCED LIGHT THEME OVERRIDES FOR BOTH ON-SCREEN AND PRINT IN DARK MODE */
            html.dark .print-preview-container {
              background-color: rgba(28, 25, 23, 0.75) !important; /* Keep backdrop dark on-screen */
            }

            html.dark .print-preview-inner,
            html.dark #printable-area,
            html.dark #printable-area div,
            html.dark #printable-area .bg-white,
            html.dark #printable-area .bg-slate-50,
            html.dark #printable-area .bg-slate-50,
            html.dark #printable-area .bg-slate-100 {
              background-color: #ffffff !important;
              color: #000000 !important;
            }

            /* Make sure text elements inside the sheet render dark charcoal/black in dark mode */
            html.dark #printable-area,
            html.dark #printable-area *,
            html.dark #printable-area span,
            html.dark #printable-area h1,
            html.dark #printable-area h2,
            html.dark #printable-area p,
            html.dark #printable-area td {
              color: #000000 !important;
            }

            /* Prevent dark mode background color leakage inside cells while preserving custom highlighting classes */
            html.dark #printable-area td,
            html.dark #printable-area td * {
              background-color: #ffffff !important;
              color: #000000 !important;
            }

            /* PRESERVE BEAUTIFUL CUSTOM HIGHLIGHTING STYLES IN DARK MODE AND IN PRINT */
            /* Sem1, Sem2, and Annual Row Backgrounds */
            .print-bg-sem1,
            tr.print-bg-sem1,
            tr.print-bg-sem1 td,
            html.dark #printable-area tr.print-bg-sem1,
            html.dark #printable-area tr.print-bg-sem1 td {
              background-color: #f0f9ff !important;
              color: #0c4a6e !important;
            }

            .print-bg-sem2,
            tr.print-bg-sem2,
            tr.print-bg-sem2 td,
            html.dark #printable-area tr.print-bg-sem2,
            html.dark #printable-area tr.print-bg-sem2 td {
              background-color: #ecfdf5 !important;
              color: #064e3b !important;
            }

            .print-bg-annual,
            tr.print-bg-annual,
            tr.print-bg-annual td,
            html.dark #printable-area tr.print-bg-annual,
            html.dark #printable-area tr.print-bg-annual td {
              background-color: #fffbeb !important;
              color: #78350f !important;
            }

            /* Score columns highlights */
            .total-score-cell,
            html.dark #printable-area .total-score-cell {
              background-color: #eff6ff !important;
              color: #1e3a8a !important;
            }

            .passed-score-cell,
            html.dark #printable-area .passed-score-cell {
              background-color: #ecfdf5 !important;
              color: #047857 !important;
            }

            .failed-score-cell,
            html.dark #printable-area .failed-score-cell {
              background-color: #fef2f2 !important;
              color: #991b1b !important;
            }

            .first-place-cell,
            html.dark #printable-area .first-place-cell {
              background-color: #fef3c7 !important;
              color: #92400e !important;
            }

            .normal-rank-cell,
            .conduct-cell,
            html.dark #printable-area .normal-rank-cell,
            html.dark #printable-area .conduct-cell {
              background-color: #f5f3ff !important;
              color: #4c1d95 !important;
            }

            .low-score-cell,
            html.dark #printable-area .low-score-cell {
              color: #dc2626 !important;
            }

            .has-absence-cell,
            html.dark #printable-area .has-absence-cell {
              background-color: #fff1f2 !important;
              color: #9f1239 !important;
            }

            .no-absence-cell,
            html.dark #printable-area .no-absence-cell {
              background-color: #f0fdf4 !important;
              color: #15803d !important;
            }

            /* Protect specific dark mode utility overrides from hiding text inside tables */
            html.dark .print-preview-container [class*="text-slate-"],
            html.dark .print-preview-container [class*="text-slate-"],
            html.dark .print-preview-container [class*="text-gray-"],
            html.dark .print-preview-container [class*="text-indigo-"],
            html.dark .print-preview-container [class*="text-emerald-"],
            html.dark .print-preview-container [class*="text-amber-"],
            html.dark .print-preview-container [class*="text-rose-"],
            html.dark .print-preview-container [class*="text-violet-"] {
              color: #1c1917 !important;
            }

            /* Prevent layout styling overlaps on controls */
            html.dark .print-preview-container button,
            html.dark .print-preview-container button * {
              color: inherit !important;
              background-color: inherit !important;
            }
            html.dark .print-preview-container .bg-emerald-600 {
              background-color: #059669 !important;
              color: #ffffff !important;
            }
            html.dark .print-preview-container .bg-indigo-600 {
              background-color: #4f46e5 !important;
              color: #ffffff !important;
            }
            html.dark .print-preview-container .bg-slate-100 {
              background-color: #f5f5f4 !important;
              color: #44403c !important;
            }

            @media print {
              @page {
                size: A4 ${printOrientation} !important;
                margin: ${a4Centering ? '0mm' : (printOrientation === 'landscape' ? '2.5mm 3.5mm' : '6mm')} !important;
              }
              body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: ${a4Centering ? (printOrientation === 'landscape' ? '5mm 6mm' : '10mm 12mm') : '0'} !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* FORCE COLOR PRINTS IN BROWSER IN ANY SCENARIO */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              /* Hide the entire application root to prevent any leaks/blank space, while preserving the print-preview portal */
              #root {
                display: none !important;
                visibility: hidden !important;
              }

              /* Reset overlay styles for print */
              .print-preview-container {
                position: static !important;
                inset: auto !important;
                z-index: auto !important;
                background: transparent !important;
                backdrop-filter: none !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                display: block !important;
                visibility: visible !important;
              }
              .print-preview-inner {
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                max-height: none !important;
                overflow: visible !important;
                width: 100% !important;
                visibility: visible !important;
              }
              .no-print,
              .no-print * {
                display: none !important;
                visibility: hidden !important;
              }
              #printable-area {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                visibility: visible !important;
                background-color: #ffffff !important;
                color: #000000 !important;
              }

              /* Ensure standard high-contrast black text inside printable elements when printing, overriding dark theme styles */
              #printable-area *:not(th):not(.bg-black) {
                color: #000000 !important;
              }

              /* Maintain pure black header backgrounds with crisp white text */
              #printable-area th,
              #printable-area th *,
              .roster-printable-table th,
              .roster-printable-table th *,
              #printable-area .bg-black,
              #printable-area .bg-black * {
                color: #ffffff !important;
                background-color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              /* Super compact table settings specifically when printing */
              #print-target-sheet .roster-printable-table th,
              #printable-area .roster-printable-table th {
                font-size: 8.5px !important;
                padding: 3.5px 2px !important;
                line-height: 1.1 !important;
              }

              #print-target-sheet .roster-printable-table td,
              #printable-area .roster-printable-table td {
                font-size: 8px !important;
                padding: 2.5px 2px !important;
                line-height: 1.1 !important;
                color: #000000 !important;
                background-color: transparent !important;
              }

              #print-target-sheet .roster-printable-table td.student-info-cell,
              #print-target-sheet .roster-printable-table td.student-info-cell-name,
              #printable-area .roster-printable-table td.student-info-cell,
              #printable-area .roster-printable-table td.student-info-cell-name {
                font-size: 8.5px !important;
                color: #000000 !important;
                border-bottom: 3.5px solid #000000 !important;
                padding: 3px 4px !important;
              }

              #print-target-sheet .roster-printable-table td.roster-annual-cell,
              #printable-area .roster-printable-table td.roster-annual-cell {
                border-bottom: 3.5px solid #000000 !important;
              }

              /* Micro layout compacting for printable area during browser print */
              #printable-area {
                padding: 0 !important;
                margin: 0 !important;
              }

              #print-target-sheet {
                margin: 0 !important;
                padding: 0 !important;
                gap: 6px !important;
              }
              #print-target-sheet > * {
                margin-top: 4px !important;
                margin-bottom: 4px !important;
              }

              /* School Title Header compacting */
              #print-target-sheet .text-center.space-y-2.print\:space-y-1,
              #printable-area .text-center.space-y-2.print\:space-y-1 {
                margin-bottom: 6px !important;
                padding-bottom: 4px !important;
                border-bottom-width: 1.5px !important;
              }
              #print-target-sheet .border-2,
              #printable-area .border-2 {
                padding: 2px 4px !important;
                margin-top: 2px !important;
                border-width: 1.5px !important;
                border-radius: 4px !important;
              }
              #print-target-sheet h1,
              #printable-area h1 {
                font-size: 15px !important;
                line-height: 1.1 !important;
              }
              #print-target-sheet h2,
              #printable-area h2 {
                font-size: 11px !important;
                line-height: 1.1 !important;
              }
              #print-target-sheet .flex,
              #printable-area .flex {
                padding-top: 2px !important;
              }
              #print-target-sheet .flex > div,
              #printable-area .flex > div {
                padding: 1.5px 5px !important;
                font-size: 9px !important;
                border-width: 1px !important;
                border-radius: 4px !important;
              }

              /* Class stats bar compacting */
              #print-target-sheet .grid-cols-4.border-b-2,
              #printable-area .grid-cols-4.border-b-2 {
                gap: 6px !important;
                padding-bottom: 4px !important;
                margin-bottom: 6px !important;
                border-bottom-width: 1.5px !important;
              }
              #print-target-sheet .grid-cols-4.border-b-2 > div,
              #printable-area .grid-cols-4.border-b-2 > div {
                padding: 2.5px 4px !important;
                border-width: 1px !important;
                border-radius: 4px !important;
              }
              #print-target-sheet .grid-cols-4.border-b-2 strong,
              #printable-area .grid-cols-4.border-b-2 strong {
                font-size: 10.5px !important;
              }
              #print-target-sheet .grid-cols-4.border-b-2 span,
              #printable-area .grid-cols-4.border-b-2 span {
                font-size: 8px !important;
              }

              /* Summary counts and Signatures block compacting */
              .avoid-break-inside {
                margin-top: 6px !important;
              }
              .avoid-break-inside .flex.justify-between {
                margin-top: 4px !important;
                padding-top: 4px !important;
              }
              .avoid-break-inside .border {
                border-width: 1.2px !important;
                border-radius: 6px !important;
              }
              .avoid-break-inside .border-r {
                padding: 2px 4px !important;
                font-size: 9px !important;
              }
              .avoid-break-inside .bg-slate-100 {
                padding: 2px 4px !important;
                font-size: 9px !important;
              }
              .avoid-break-inside .w-44 {
                width: 130px !important;
              }
              .avoid-break-inside .h-8 {
                height: 20px !important;
              }
              .avoid-break-inside .text-slate-900.print\:text-\[9\.5px\] {
                font-size: 9px !important;
              }
              .avoid-break-inside .text-\[10px\].print\:text-\[7\.5px\] {
                font-size: 8px !important;
              }

              #printable-area table {
                width: 100% !important;
                min-width: 100% !important;
              }

              /* Ensure student blocks and signature blocks are never split across pages */
              .roster-printable-table tbody,
              .roster-printable-table tr,
              .avoid-break-inside {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `}} />
        {/* Header for print preview */}
        <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-2xl mb-4 print:hidden no-print space-y-4 shadow-3xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-3">
            <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
              <span className="text-xs sm:text-sm font-extrabold text-indigo-950 font-mono flex items-center gap-1.5">{tx(
                "\n                🖨️ የህትመት እይታ እና ቅንብሮች (Print Preview & Page Setup)\n              "
              )}</span>
              {/* Mobile Quick Close Button */}
              <button
                type="button"
                onClick={() => { setIsPrintPreview(false); setIsPrintAllClassesAttendance(false); }}
                className="sm:hidden p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                title={tx("ዝጋ (Close)")}
              >
                <X className="w-4 h-4" />
                <span>{tx("ዝጋ")}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button 
                onClick={() => exportElementToPDF('printable-area', customFilename || (selectedGrade + '_Section_' + selectedSection + '_' + activeSubTab), printOrientation)}
                className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />{tx(" PDF አውርድ\n              ")}</button>
              <button 
                onClick={handlePrint}
                className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />{tx(" አትም\n              ")}</button>
              <button 
                type="button"
                onClick={() => { setIsPrintPreview(false); setIsPrintAllClassesAttendance(false); }}
                className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-300" />
                <span>{tx("ዝጋ (Close)")}</span>
              </button>
            </div>
          </div>

          {/* Dedicated print-specific setup panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-white/75 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            {/* Control 1: Custom Filename */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{tx("የፋይል ስም (File Name)")}</label>
              <input 
                type="text" 
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder={tx("የፋይል ስም (File Name)...")}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-150 outline-none w-full font-semibold"
              />
            </div>

            {/* Control 2: Table Cells Snug Fit Toggle */}
            <div className="flex flex-col gap-1 justify-center">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">{tx("የሰንጠረዥ ህዋሶች (Table Cells Width)")}</span>
              <button
                type="button"
                onClick={() => {
                  playInteractiveSound('click');
                  setTableLayoutSnug(!tableLayoutSnug);
                }}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                  tableLayoutSnug 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {tableLayoutSnug ? tx("✅ መካከለኛ መጠን (Snug)") : tx("❌ ሙሉ ስፋት (Full-width)")}
              </button>
            </div>

            {/* Control 3: Physical A4 Centering & Margins Toggle */}
            <div className="flex flex-col gap-1 justify-center">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">{tx("በA4 መካከል አሰልፍ (A4 Centering)")}</span>
              <button
                type="button"
                onClick={() => {
                  playInteractiveSound('click');
                  setA4Centering(!a4Centering);
                }}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                  a4Centering 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {a4Centering ? tx("✅ ማዕከላዊ አሰላለፍ (Centered)") : tx("❌ ነባሪ አሰላለፍ (Browser default)")}
              </button>
            </div>

            {/* Control 4: Print Orientation Toggle */}
            <div className="flex flex-col gap-1 justify-center">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">{tx("የህትመት አቅጣጫ (Orientation)")}</span>
              <button
                type="button"
                onClick={() => {
                  playInteractiveSound('click');
                  setPrintOrientation(printOrientation === 'portrait' ? 'landscape' : 'portrait');
                }}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                  printOrientation === 'portrait' 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {printOrientation === 'portrait' ? tx("📐 በቁመቱ (Portrait)") : tx("🔲 በጎኑ (Landscape)")}
              </button>
            </div>

            {/* Control 5: Scaling Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{tx("የማጉያ ልኬት (Scale: ")}{printScaling}%)</label>
                <button 
                  onClick={() => setPrintScaling(100)} 
                  className="text-[9px] text-indigo-600 hover:underline font-extrabold"
                >{tx("\n                  መልስ (Reset)\n                ")}</button>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="70" 
                  max="115" 
                  step="5"
                  value={printScaling}
                  onChange={(e) => setPrintScaling(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

            {/* Warning / Guide Box (Hidden when printing) */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-slate-800 text-xs leading-relaxed print:hidden my-2 flex items-start gap-2.5 max-w-4xl mx-auto shadow-xs no-print">
              <span className="text-base">💡</span>
              <div>
                <p className="font-extrabold text-amber-950">{tx("ተግባራዊ መመሪያ (Help Guide):")}</p>
                <p className="mt-1">{tx("\n                  በብሮውዘርዎ ወይም በiframe ገደብ ምክንያት ")}<strong>{tx("\"PDF አውርድ\"")}</strong>{tx(" የሚለው ቁልፍ በቀጥታ ካልሰራ፤ በቀላሉ ")}<strong>{tx("\"አትም\" (Print)")}</strong>{tx(" የሚለውን ቁልፍ ተጭነው፣ በሚመጣው የብሮውዘር ህትመት ሳጥን ውስጥ ")}<strong>"Destination"</strong>{tx(" የሚለውን ")}<strong>{tx("\"Save as PDF\" (ፒዲኤፍ አድርገህ አስቀምጥ)")}</strong>{tx(" በማድረግ ሙሉ ሮስተሩን በከፍተኛ ጥራት ማውረድ/ማስቀመጥ ይችላሉ።\n                ")}</p>
              </div>
            </div>

            {/* Main printable sheet */}
            <div id="printable-area" className="space-y-4 print:space-y-2 print:my-0 max-w-4xl mx-auto bg-white relative p-4 print:p-2">
              <div id="print-target-sheet" className="w-full h-full relative space-y-4 print:space-y-2">
                {/* Background Watermark/Logo pattern in print */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                {schoolConfig?.logoImage ? (
                  <img src={schoolConfig.logoImage} alt="" className="w-96 h-96 object-contain opacity-10 grayscale" />
                ) : (
                  <GraduationCap className="w-96 h-96 text-slate-900" />
                )}
              </div>

              {activeSubTab === 'roster' ? (
                <div className="text-center space-y-2 print:space-y-1 relative mb-4 print:mb-2 border-b-2 border-slate-900 pb-3 print:pb-1 w-full">
                  {/* First Box with Centered School Logo & Titles */}
                  <div className="border-2 border-slate-950 p-3 print:p-1.5 rounded-lg bg-slate-50 w-full flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 print:w-11 print:h-11 rounded-full border-2 border-slate-900 bg-white p-1 shadow-xs flex items-center justify-center overflow-hidden shrink-0 mb-1 print:mb-0.5">
                      <img 
                        src={schoolConfig?.logoImage || DEFAULT_SCHOOL_LOGO} 
                        alt="Logo" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <h1 className="text-xl sm:text-2xl print:text-base font-black text-slate-950 uppercase tracking-wider leading-tight">
                      {schoolConfig?.nameAmh || 'ዲሊጀንት ኢንተሌክቿልስ የትምህርት ተቋም'}
                    </h1>
                    <div className="text-xs print:text-[10px] font-extrabold text-indigo-900 uppercase tracking-wide mt-0.5">
                      {schoolConfig?.nameEng || 'DILIGENT INTELLECTUALS ACADEMY'}
                    </div>
                  </div>
                  {/* Second Box */}
                  <div className="border-2 border-slate-950 p-1.5 print:p-1 rounded-md bg-slate-50 w-full max-w-xl mx-auto mt-2 print:mt-1">
                    <h2 className="text-sm print:text-xs font-black text-slate-900 uppercase tracking-wider">
                      Student Progress Roster ({schoolConfig?.evaluationMode === 'semester' ? 'Semester' : 'Quarter'})
                    </h2>
                  </div>
                  {/* Third Row: Grade & Academic Year */}
                  <div className="flex justify-between items-center w-full pt-1.5 print:pt-1 text-xs font-bold px-1">
                    <div className="border border-slate-950 px-3 py-1 print:py-0.5 rounded-md bg-slate-50 flex items-center gap-1.5">
                      <span className="text-slate-600">Grade:</span>
                      <span className="font-extrabold text-slate-950 text-xs">
                        {selectedGrade === 'All' ? 'All Grades' : selectedGrade} - {selectedSection}
                      </span>
                    </div>
                    <div className="border border-slate-950 px-3 py-1 print:py-0.5 rounded-md bg-slate-50 flex items-center gap-1.5">
                      <span className="text-slate-600">ACADEMIC YEAR:</span>
                      <span className="font-extrabold text-slate-950 text-xs">
                        {schoolConfig?.academicYear || tx("2018 ዓ.ም")}
                      </span>
                    </div>
                  </div>
                </div>
              ) : activeSubTab === 'attendance' ? (
                <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4 relative">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 print:w-10 print:h-10 rounded-full border border-slate-300 bg-white p-0.5 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                      <img 
                        src={schoolConfig?.logoImage || DEFAULT_SCHOOL_LOGO} 
                        alt="Logo" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div className="text-center">
                      <h1 className="text-2xl print:text-lg font-black text-slate-950 uppercase tracking-wide leading-tight">
                        {schoolConfig?.nameAmh || tx("ደሊጀንት አካዳሚ")}
                      </h1>
                      <h2 className="text-base print:text-xs font-black text-slate-700 uppercase">
                        {schoolConfig?.nameEng || 'Diligent Academy'}
                      </h2>
                    </div>
                  </div>
                  <div className="border-2 border-slate-950 p-1.5 rounded-md bg-slate-50 w-full max-w-xl mx-auto mt-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      {isPrintAllClassesAttendance 
                        ? tx(
                        "የሁሉም ክፍሎች ዕለታዊ አቴንዳንስ ማጠቃለያ ሪፖርት / All Classes Daily Attendance Summary Report"
                      )
                        : tx("የተማሪዎች ዕለታዊ አቴንዳንስ ሪፖርት / Student Daily Attendance Report")}
                    </h3>
                  </div>
                  
                  {(() => {
                    const parsedDate = new Date(selectedDateStr + 'T12:00:00');
                    const dualDate = getFormattedDualCalendarDate(parsedDate);
                    return (
                      <div className="flex justify-center gap-4 text-xs font-bold mt-2 flex-wrap">
                        <span className="bg-slate-50 border border-slate-300 px-3 py-1 rounded-md">
                          📅 GC: {dualDate.gc}
                        </span>
                        <span className="bg-slate-50 border border-slate-300 px-3 py-1 rounded-md text-indigo-750">
                          📅 EC: {dualDate.ec}
                        </span>
                        {isPrintAllClassesAttendance ? (
                          <span className="bg-slate-50 border border-slate-300 px-3 py-1 rounded-md">{tx("\n                            ክፍሎች (Total Classes): ")}{allGradeSections.length}
                          </span>
                        ) : (
                          <>
                            <span className="bg-slate-50 border border-slate-300 px-3 py-1 rounded-md">{tx("\n                              ክፍል (Class): ")}{selectedGrade} - {selectedSection}
                            </span>
                            {currentTeacher && (
                              <span className="bg-slate-50 border border-slate-300 px-3 py-1 rounded-md text-emerald-855">{tx("\n                                የክፍል ኃላፊ (Homeroom Teacher): ")}{currentTeacher.name}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4 relative">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 print:w-10 print:h-10 rounded-full border border-slate-300 bg-white p-0.5 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                      <img 
                        src={schoolConfig?.logoImage || DEFAULT_SCHOOL_LOGO} 
                        alt="Logo" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div className="text-center">
                      <h1 className="text-2xl print:text-lg font-black text-slate-950 uppercase tracking-wide leading-tight">
                        {schoolConfig?.nameAmh || tx("ደሊጀንት አካዳሚ")}
                      </h1>
                      <p className="text-sm print:text-xs font-bold text-slate-700">
                        {schoolConfig?.nameEng || 'Diligent Academy'}{tx(" - የማርክ ሊስት (Mark List)")}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    "{schoolConfig?.mottoAmh || tx("ለክህሎትና ለውጤታማነት እንተጋለን!")}"
                  </p>
                  <p className="text-xs text-slate-500 font-mono">Generated Date: {new Date().toLocaleDateString()} | Author: Principal’s Office</p>
                  <div className="flex justify-center gap-4 text-xs font-bold mt-2 flex-wrap">
                    <span className="bg-slate-100 px-3 py-1 rounded-md">{tx("ክፍል (Grade)፡ ")}{selectedGrade === 'All' ? tx("ሁሉም ክፍሎች (All Grades)") : selectedGrade}</span>
                    <span className="bg-slate-100 px-3 py-1 rounded-md">{tx("ሴክሽን (Section)፡ ")}{selectedSection}</span>
                    <span className="bg-slate-100 px-3 py-1 rounded-md text-indigo-700">{tx("ትምህርት (Subject)፡ ")}{selectedSubject}</span>
                  </div>
                </div>
              )}

              {/* Class stats on printed paper */}
              {activeSubTab === 'attendance' ? (!isPrintAllClassesAttendance && (() => {
                const dayRecord = dailyAttendance[selectedDateStr] || {};
                let presentCount = 0;
                let absentCount = 0;
                let excusedCount = 0;
                filteredStudents.forEach(s => {
                  const stat = dayRecord[s.id];
                  if (stat === 'present') presentCount++;
                  else if (stat === 'absent') absentCount++;
                  else if (stat === 'excused') excusedCount++;
                });
                return (
                  <div className="grid grid-cols-4 gap-3 print:gap-1.5 text-center border-b-2 border-slate-950 pb-3 print:pb-2 text-slate-900 w-full">
                    <div className="p-2 print:p-1.5 border border-slate-950 rounded-lg bg-slate-50">
                      <span className="text-[10px] print:text-[8px] text-slate-600 block font-extrabold uppercase tracking-wide">{tx("ጠቅላላ ተማሪዎች / Students")}</span>
                      <strong className="text-lg print:text-sm font-black">{filteredStudents.length}</strong>
                    </div>
                    <div className="p-2 print:p-1.5 border border-slate-950 rounded-lg bg-slate-50">
                      <span className="text-[10px] print:text-[8px] text-emerald-700 block font-extrabold uppercase tracking-wide">{tx("ተገኝተዋል / Present")}</span>
                      <strong className="text-lg print:text-sm font-black text-emerald-800">{presentCount}</strong>
                    </div>
                    <div className="p-2 print:p-1.5 border border-slate-950 rounded-lg bg-slate-50">
                      <span className="text-[10px] print:text-[8px] text-rose-700 block font-extrabold uppercase tracking-wide">{tx("ቀርተዋል / Absent")}</span>
                      <strong className="text-lg print:text-sm font-black text-rose-800">{absentCount}</strong>
                    </div>
                    <div className="p-2 print:p-1.5 border border-slate-950 rounded-lg bg-slate-50">
                      <span className="text-[10px] print:text-[8px] text-amber-700 block font-extrabold uppercase tracking-wide">{tx("በፈቃድ / Excused")}</span>
                      <strong className="text-lg print:text-sm font-black text-amber-800">{excusedCount}</strong>
                    </div>
                  </div>
                );
              })()) : (
                <div className="grid grid-cols-4 gap-3 print:gap-1.5 text-center border-b-2 border-slate-950 pb-3 print:pb-2 text-slate-900 w-full">
                  <div className="p-2 print:p-1.5 border border-slate-950 rounded-lg bg-slate-50">
                    <span className="text-[10px] print:text-[8px] text-slate-600 block font-extrabold uppercase tracking-wide">{tx("ጠቅላላ ተማሪዎች / Students")}</span>
                    <strong className="text-lg print:text-sm font-black">{filteredStudents.length}</strong>
                  </div>
                  <div className="p-2 print:p-1.5 border border-slate-950 rounded-lg bg-slate-50">
                    <span className="text-[10px] print:text-[8px] text-slate-600 block font-extrabold uppercase tracking-wide">{tx("አማካይ ውጤት / Class Avg")}</span>
                    <strong className="text-lg print:text-sm font-black">{classStats.avg}%</strong>
                  </div>
                  <div className="p-2 print:p-1.5 border border-slate-950 rounded-lg bg-slate-50">
                    <span className="text-[10px] print:text-[8px] text-slate-600 block font-extrabold uppercase tracking-wide">{tx("ከፍተኛ ውጤት / Highest Score")}</span>
                    <strong className="text-lg print:text-sm font-black">{classStats.highest}%</strong>
                  </div>
                  <div className="p-2 print:p-1.5 border border-slate-950 rounded-lg bg-slate-50">
                    <span className="text-[10px] print:text-[8px] text-slate-600 block font-extrabold uppercase tracking-wide">{tx("የማለፍ ሪከርድ / Pass Rate")}</span>
                    <strong className="text-lg print:text-sm font-black">{classStats.passRate}%</strong>
                  </div>
                </div>
              )}

              {/* Mark list table / roster table */}
              {activeSubTab === 'marklist' ? (
                <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                  <table className="w-full text-sm text-left border-collapse border border-slate-300 marklist-printable-table min-w-[800px]">
                  <thead>
                    <tr className="bg-black text-white font-bold border-b border-slate-300 text-xs" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      <th className="p-2 border border-slate-300 bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("ተማሪ መታወቂያ")}</th>
                      <th className="p-2 border border-slate-300 bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("የተማሪ ሙሉ ስም")}</th>
                      <th className="p-2 border border-slate-300 text-center bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Quiz (10)</th>
                      <th className="p-2 border border-slate-300 text-center bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>CW (10)</th>
                      <th className="p-2 border border-slate-300 text-center bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>HW (10)</th>
                      <th className="p-2 border border-slate-300 text-center bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Mid (20)</th>
                      <th className="p-2 border border-slate-300 text-center bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Final (50)</th>
                      <th className="p-2 border border-slate-300 text-center font-black bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("ጠቅላላ (100%)")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentGradesData.map((item) => (
                      <tr key={item.student.id} className="border-b border-slate-200 text-xs text-slate-900 even:bg-slate-50">
                        <td className="p-2 font-mono border border-slate-300">{item.student.id}</td>
                        <td className="p-2 font-semibold border border-slate-300">{item.student.name}</td>
                        <td className="p-2 text-center border border-slate-300">{item.gradeRecord ? item.gradeRecord.quiz : '-'}</td>
                        <td className="p-2 text-center border border-slate-300">{item.gradeRecord ? item.gradeRecord.cw : '-'}</td>
                        <td className="p-2 text-center border border-slate-300">{item.gradeRecord ? item.gradeRecord.hw : '-'}</td>
                        <td className="p-2 text-center border border-slate-300">{item.gradeRecord ? item.gradeRecord.mid : '-'}</td>
                        <td className="p-2 text-center border border-slate-300">{item.gradeRecord ? item.gradeRecord.final : '-'}</td>
                        <td className="p-2 text-center border border-slate-300 font-bold">{item.gradeRecord ? item.gradeRecord.total + '%' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : activeSubTab === 'attendance' ? (
                isPrintAllClassesAttendance ? (
                  <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                    <table className="w-full text-sm text-left border-collapse border border-slate-300 marklist-printable-table min-w-[700px]">
                      <thead>
                        <tr className="bg-black text-white font-bold border-b border-slate-300 text-xs" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                          <th className="p-2 border border-slate-300 bg-black text-white text-center w-12" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("ተ.ቁ")}</th>
                          <th className="p-2 border border-slate-300 bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("ክፍል እና ሴክሽን")}</th>
                          <th className="p-2 border border-slate-300 bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("የክፍል ኃላፊ መምህር")}</th>
                          <th className="p-2 border border-slate-300 text-center bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("ጠቅላላ ተማሪዎች")}</th>
                          <th className="p-2 border border-slate-300 text-center bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("የእለቱ ሁኔታ (Status)")}</th>
                          <th className="p-2 border border-slate-300 text-center bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("የመገኘት ሬሾ (P/A/E)")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allGradeSections.map((comb, idx) => {
                          const classStudents = students.filter(s => s.grade === comb.grade && s.section === comb.section);
                          const dayRecord = dailyAttendance[selectedDateStr] || {};
                          let present = 0, absent = 0, excused = 0, unmarked = 0;
                          classStudents.forEach(student => {
                            const status = dayRecord[student.id];
                            if (status === 'present') present++;
                            else if (status === 'absent') absent++;
                            else if (status === 'excused') excused++;
                            else unmarked++;
                          });
                          const hrTeacher = teachers.find(t => t.isHomeroomTeacher && t.assignedClass === comb.grade && t.assignedSection === comb.section);
                          const hrTeacherName = hrTeacher ? hrTeacher.name : tx("ያልተመደበ");

                          let statusText = tx("🔴 ስም አልተጠራም");
                          if (classStudents.length > 0) {
                            if (unmarked === 0) statusText = tx("🟢 ስም ተጠርቷል");
                            else if (unmarked < classStudents.length) statusText = `🟡 በከፊል የተጠራ (${classStudents.length - unmarked}/${classStudents.length})`;
                          } else {
                            statusText = '-';
                          }

                          return (
                            <tr key={comb.grade + '-' + comb.section} className="border-b border-slate-200 text-xs text-slate-900 even:bg-slate-50">
                              <td className="p-2 text-center font-bold border border-slate-300">{idx + 1}</td>
                              <td className="p-2 font-black border border-slate-300">{comb.grade} - {comb.section}</td>
                              <td className="p-2 font-semibold border border-slate-300">{hrTeacherName}</td>
                              <td className="p-2 text-center border border-slate-300 font-mono">{classStudents.length}</td>
                              <td className="p-2 text-center font-bold border border-slate-300">{statusText}</td>
                              <td className="p-2 text-center font-mono border border-slate-300">{present} / {absent} / {excused}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                    <table className="w-full text-sm text-left border-collapse border border-slate-300 marklist-printable-table min-w-[700px]">
                      <thead>
                        <tr className="bg-black text-white font-bold border-b border-slate-300 text-xs" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                          <th className="p-2 border border-slate-300 bg-black text-white text-center w-12" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("ተ.ቁ (No.)")}</th>
                          <th className="p-2 border border-slate-300 bg-black text-white w-24" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("መታወቂያ (ID)")}</th>
                          <th className="p-2 border border-slate-300 bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("የተማሪ ሙሉ ስም (Student Full Name)")}</th>
                          <th className="p-2 border border-slate-300 text-center bg-black text-white w-16" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("ጾታ (Sex)")}</th>
                          <th className="p-2 border border-slate-300 text-center bg-black text-white w-48" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("የእለቱ ሁኔታ (Daily Status)")}</th>
                          <th className="p-2 border border-slate-300 text-center bg-black text-white w-32" style={{ backgroundColor: '#000000', color: '#ffffff' }}>{tx("ምልክት (Signature/Remark)")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student, idx) => {
                          const todayRecord = dailyAttendance[selectedDateStr] || {};
                          const currentStatus = todayRecord[student.id];
                          return (
                            <tr key={student.id} className="border-b border-slate-200 text-xs text-slate-900 even:bg-slate-50">
                              <td className="p-2 text-center font-bold border border-slate-300">{idx + 1}</td>
                              <td className="p-2 font-mono border border-slate-300">{student.id}</td>
                              <td className="p-2 font-semibold border border-slate-300">{student.name}</td>
                              <td className="p-2 text-center border border-slate-300">{student.gender === 'M' ? tx("ወንድ") : tx("ሴት")}</td>
                              <td className="p-2 text-center border border-slate-300 font-bold">
                                {currentStatus === 'present' && <span className="text-emerald-700">{tx("✓ የመጣ (Present)")}</span>}
                                {currentStatus === 'absent' && <span className="text-rose-700">{tx("✗ የቀረ (Absent)")}</span>}
                                {currentStatus === 'excused' && <span className="text-amber-700">{tx("✏ ፈቃድ (Excused)")}</span>}
                                {!currentStatus && <span className="text-slate-400 italic">{tx("ያልተሞላ (Pending)")}</span>}
                              </td>
                              <td className="p-2 border border-slate-300"></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (() => {
                // Determine whether evaluationMode is semester or quarter
                const isSemester = schoolConfig?.evaluationMode === 'semester';

                // Row definitions per student - dynamically adapts to semester or quarter mode as requested
                const rowsToRender = isSemester ? [
                  { id: 'SEM1', label: 'SEM 1' },
                  { id: 'SEM2', label: 'SEM 2' },
                  { id: 'ANNUAL', label: 'ANNUAL' }
                ] : [
                  { id: 'Q1', label: 'Q1' },
                  { id: 'Q2', label: 'Q2' },
                  { id: 'SEM1_AVG', label: 'SEM 1 AVG' },
                  { id: 'Q3', label: 'Q3' },
                  { id: 'Q4', label: 'Q4' },
                  { id: 'SEM2_AVG', label: 'SEM 2 AVG' },
                  { id: 'ANNUAL', label: 'ANNUAL' }
                ];

                // Helpers to fetch grades for specific term
                const getStudentGradeForTerm = (studentId: string, subject: string, termNum: number) => {
                  const g = grades.find(grade => grade.studentId === studentId && grade.subject === subject && (grade.term || 1) === termNum);
                  return g ? g.total : null;
                };

                const getSubjectSem1Avg = (studentId: string, sub: string) => {
                  const q1 = getStudentGradeForTerm(studentId, sub, 1);
                  const q2 = getStudentGradeForTerm(studentId, sub, 2);
                  if (q1 !== null && q2 !== null) return Math.round(((q1 + q2) / 2) * 100) / 100;
                  if (q1 !== null) return q1;
                  if (q2 !== null) return q2;
                  return null;
                };

                const getSubjectSem2Avg = (studentId: string, sub: string) => {
                  const q3 = getStudentGradeForTerm(studentId, sub, 3);
                  const q4 = getStudentGradeForTerm(studentId, sub, 4);
                  if (q3 !== null && q4 !== null) return Math.round(((q3 + q4) / 2) * 100) / 100;
                  if (q3 !== null) return q3;
                  if (q4 !== null) return q4;
                  return null;
                };

                const getSubjectAnnualAvg = (studentId: string, sub: string) => {
                  const scores = [1, 2, 3, 4].map(t => getStudentGradeForTerm(studentId, sub, t)).filter(s => s !== null) as number[];
                  if (scores.length > 0) {
                    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
                  }
                  return null;
                };

                const getSubjectAnnualAvgSem = (studentId: string, sub: string) => {
                  const scores = [1, 2].map(t => getStudentGradeForTerm(studentId, sub, t)).filter(s => s !== null) as number[];
                  if (scores.length > 0) {
                    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
                  }
                  return null;
                };

                const getTermAverage = (studentId: string, termNum: number) => {
                  let total = 0;
                  let count = 0;
                  subjects.forEach(sub => {
                    const score = getStudentGradeForTerm(studentId, sub, termNum);
                    if (score !== null) {
                      total += score;
                      count++;
                    }
                  });
                  return count > 0 ? Math.round((total / subjects.length) * 100) / 100 : null;
                };

                const getSem1Avg = (studentId: string) => {
                  let total = 0;
                  let count = 0;
                  subjects.forEach(sub => {
                    const val = getSubjectSem1Avg(studentId, sub);
                    if (val !== null) {
                      total += val;
                      count++;
                    }
                  });
                  return count > 0 ? Math.round((total / subjects.length) * 100) / 100 : null;
                };

                const getSem2Avg = (studentId: string) => {
                  let total = 0;
                  let count = 0;
                  subjects.forEach(sub => {
                    const val = getSubjectSem2Avg(studentId, sub);
                    if (val !== null) {
                      total += val;
                      count++;
                    }
                  });
                  return count > 0 ? Math.round((total / subjects.length) * 100) / 100 : null;
                };

                const getAnnualAvg = (studentId: string) => {
                  let total = 0;
                  let count = 0;
                  subjects.forEach(sub => {
                    const val = getSubjectAnnualAvg(studentId, sub);
                    if (val !== null) {
                      total += val;
                      count++;
                    }
                  });
                  return count > 0 ? Math.round((total / subjects.length) * 100) / 100 : null;
                };

                const getAnnualAvgSem = (studentId: string) => {
                  let total = 0;
                  let count = 0;
                  subjects.forEach(sub => {
                    const val = getSubjectAnnualAvgSem(studentId, sub);
                    if (val !== null) {
                      total += val;
                      count++;
                    }
                  });
                  return count > 0 ? Math.round((total / subjects.length) * 100) / 100 : null;
                };

                const getRankForTermType = (studentId: string, type: 'Q1' | 'Q2' | 'SEM1_AVG' | 'Q3' | 'Q4' | 'SEM2_AVG' | 'ANNUAL' | 'SEM1' | 'SEM2') => {
                  const targetGrade = students.find(st => st.id === studentId)?.grade;
                  const classStudents = students.filter(s => s.grade === targetGrade && s.section === selectedSection);
                  
                  const studentAverages = classStudents.map(s => {
                    let avg: number | null = null;
                    if (type === 'Q1') avg = getTermAverage(s.id, 1);
                    else if (type === 'Q2') avg = getTermAverage(s.id, 2);
                    else if (type === 'SEM1_AVG') avg = getSem1Avg(s.id);
                    else if (type === 'Q3') avg = getTermAverage(s.id, 3);
                    else if (type === 'Q4') avg = getTermAverage(s.id, 4);
                    else if (type === 'SEM2_AVG') avg = getSem2Avg(s.id);
                    else if (type === 'ANNUAL') avg = isSemester ? getAnnualAvgSem(s.id) : getAnnualAvg(s.id);
                    else if (type === 'SEM1') avg = getTermAverage(s.id, 1);
                    else if (type === 'SEM2') avg = getTermAverage(s.id, 2);
                    
                    return { studentId: s.id, avg };
                  });

                  const validAverages = studentAverages.filter(item => item.avg !== null) as { studentId: string; avg: number }[];
                  const sorted = [...validAverages].sort((a, b) => b.avg - a.avg);
                  const idx = sorted.findIndex(item => item.studentId === studentId);
                  if (idx !== -1) {
                    return (idx + 1) + '/' + classStudents.length;
                  }
                  return '-';
                };

                return (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-[10px] text-left border-collapse border roster-printable-table min-w-[1200px]" style={{ borderColor: '#000000' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#000000', borderBottom: '2px solid #ffffff' }}>
                          <th className="p-2 border font-bold text-center bg-black text-white" style={{ borderColor: '#ffffff', backgroundColor: '#000000', color: '#ffffff', verticalAlign: 'middle' }}>No.</th>
                          <th className="p-2 border font-bold text-center bg-black text-white" style={{ borderColor: '#ffffff', backgroundColor: '#000000', color: '#ffffff', verticalAlign: 'middle' }}>{tx("Name / ስም")}</th>
                          <th className="p-2 border font-bold text-center bg-black text-white" style={{ borderColor: '#ffffff', backgroundColor: '#000000', color: '#ffffff', verticalAlign: 'middle' }}>Sex</th>
                          <th className="p-2 border font-bold text-center bg-black text-white" style={{ borderColor: '#ffffff', backgroundColor: '#000000', color: '#ffffff', verticalAlign: 'middle' }}>Age</th>
                          <th className="p-2 border font-bold text-center bg-black text-white" style={{ borderColor: '#ffffff', backgroundColor: '#000000', color: '#ffffff', verticalAlign: 'middle' }}>{tx("Term / ክፍል")}</th>
                          
                          {subjects.map(sub => (
                            <th key={sub} className="p-1 border text-center font-bold bg-black text-white" style={{ borderColor: '#ffffff', backgroundColor: '#000000', color: '#ffffff', verticalAlign: 'middle' }}>
                              {sub}
                            </th>
                          ))}
                          
                          {/* Distinctive, Pure Black Header Columns */}
                          <th className="p-2 border text-center font-black text-[10px] bg-black text-white" style={{ backgroundColor: '#000000', borderColor: '#ffffff', color: '#ffffff', verticalAlign: 'middle' }}>{tx("\n                            ድምር")}<br/>Total
                          </th>
                          <th className="p-2 border text-center font-black text-[10px] bg-black text-white" style={{ backgroundColor: '#000000', borderColor: '#ffffff', color: '#ffffff', verticalAlign: 'middle' }}>{tx("\n                            አማካይ")}<br/>Avg
                          </th>
                          <th className="p-2 border text-center font-black text-[10px] bg-black text-white" style={{ backgroundColor: '#000000', borderColor: '#ffffff', color: '#ffffff', verticalAlign: 'middle' }}>{tx("\n                            ደረጃ")}<br/>Rank
                          </th>
                          <th className="p-2 border text-center font-black text-[10px] bg-black text-white" style={{ backgroundColor: '#000000', borderColor: '#ffffff', color: '#ffffff', verticalAlign: 'middle' }}>{tx("\n                            ምግባር")}<br/>Cond.
                          </th>
                          <th className="p-2 border text-center font-black text-[10px] bg-black text-white" style={{ backgroundColor: '#000000', borderColor: '#ffffff', color: '#ffffff', verticalAlign: 'middle' }}>{tx("\n                            ቀሪ")}<br/>Abs.
                          </th>
                        </tr>
                      </thead>
                      {filteredStudents.map((student, sIdx) => (
                        <tbody key={student.id} className="avoid-page-break" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                          {rowsToRender.map((row, rIdx) => {
                            const isFirstRow = rIdx === 0;

                            // Calculate subject scores
                            const subjectScores = subjects.map(sub => {
                              let score: number | null = null;
                              if (row.id === 'Q1') score = getStudentGradeForTerm(student.id, sub, 1);
                              else if (row.id === 'Q2') score = getStudentGradeForTerm(student.id, sub, 2);
                              else if (row.id === 'SEM1_AVG') score = getSubjectSem1Avg(student.id, sub);
                              else if (row.id === 'Q3') score = getStudentGradeForTerm(student.id, sub, 3);
                              else if (row.id === 'Q4') score = getStudentGradeForTerm(student.id, sub, 4);
                              else if (row.id === 'SEM2_AVG') score = getSubjectSem2Avg(student.id, sub);
                              else if (row.id === 'ANNUAL') score = isSemester ? getSubjectAnnualAvgSem(student.id, sub) : getSubjectAnnualAvg(student.id, sub);
                              else if (row.id === 'SEM1') score = getStudentGradeForTerm(student.id, sub, 1);
                              else if (row.id === 'SEM2') score = getStudentGradeForTerm(student.id, sub, 2);
                              return score;
                            });

                            // Calculate row sum and row average
                            const validScores = subjectScores.filter(s => s !== null) as number[];
                            const totalVal = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) * 100) / 100 : null;
                            const avgVal = validScores.length > 0 ? Math.round((validScores.reduce((a, b) => a + b, 0) / subjects.length) * 100) / 100 : null;

                            // Calculate Rank
                            const rankVal = getRankForTermType(student.id, row.id as any);

                            // Get conduct and absent
                            const isTerminal = ['Q1', 'Q2', 'Q3', 'Q4', 'SEM1', 'SEM2'].includes(row.id);
                            const extra = studentExtraInfo[student.id] || { conduct: 'A', absent: 0 };
                            const condVal = isTerminal ? extra.conduct : '--';
                            const absVal = isTerminal ? extra.absent : '--';

                            // Determine classes for screen styling and print class hooks
                            const isSem1Highlight = row.id === 'SEM1_AVG' || row.id === 'SEM1' || row.id === 'Q1' || row.id === 'Q2';
                            const isSem2Highlight = row.id === 'SEM2_AVG' || row.id === 'SEM2' || row.id === 'Q3' || row.id === 'Q4';
                            const isAnnualHighlight = row.id === 'ANNUAL';

                            let rowBgClass = "hover:bg-slate-50";
                            let printRowClass = "";
                            let rowBgStyle = {};
                            if (row.id === 'SEM1_AVG' || row.id === 'SEM1') {
                              rowBgClass = "text-sky-950 font-semibold";
                              rowBgStyle = { backgroundColor: '#f0f9ff', color: '#0c4a6e' };
                              printRowClass = "print-bg-sem1";
                            } else if (row.id === 'SEM2_AVG' || row.id === 'SEM2') {
                              rowBgClass = "text-emerald-950 font-semibold";
                              rowBgStyle = { backgroundColor: '#ecfdf5', color: '#064e3b' };
                              printRowClass = "print-bg-sem2";
                            } else if (row.id === 'ANNUAL') {
                              rowBgClass = "text-amber-950 font-extrabold";
                              rowBgStyle = { backgroundColor: '#fffbeb', color: '#78350f' };
                              printRowClass = "print-bg-annual";
                            }

                            // Distinct styling variables for the 5 metrics columns
                            const isFailed = avgVal !== null && avgVal < 50;
                            const isFirstPlace = rankVal && rankVal.startsWith('1/');
                            const isAConduct = ['A+', 'A', 'A-'].includes(condVal);
                            const absentNum = parseInt(absVal) || 0;
                            const hasAbsence = absentNum > 0;

                            const isLastRow = rIdx === rowsToRender.length - 1;
                            const mergedCellClass = isLastRow ? "" : "merged-cell-no-bottom";
                            const isMiddleRow = rIdx === Math.floor(rowsToRender.length / 2);

                            return (
                              <tr key={student.id + '-' + row.id} className={'border-b border-slate-300 text-slate-900 ' + rowBgClass + ' ' + printRowClass} style={rowBgStyle}>
                                {/* No., Name, Sex, and Age Columns - Proper Vertical merging using rowSpan */}
                                {isFirstRow && (
                                  <>
                                    <td 
                                      rowSpan={rowsToRender.length}
                                      className="p-1 border border-slate-950 text-center font-bold text-xs bg-white text-slate-950 font-mono student-info-cell"
                                      style={{ verticalAlign: 'middle', borderColor: '#000000', borderBottom: '3.5px solid #000000' }}
                                    >
                                      {sIdx + 1}
                                    </td>
                                    <td 
                                      rowSpan={rowsToRender.length}
                                      className="p-1.5 border border-slate-950 font-black text-xs text-slate-950 min-w-[150px] bg-white student-info-cell-name"
                                      style={{ verticalAlign: 'middle', textAlign: 'left', borderColor: '#000000', borderBottom: '3.5px solid #000000' }}
                                    >
                                      {student.name}
                                    </td>
                                    <td 
                                      rowSpan={rowsToRender.length}
                                      className="p-1 border border-slate-950 text-center font-bold text-xs bg-white text-slate-950 student-info-cell"
                                      style={{ verticalAlign: 'middle', borderColor: '#000000', borderBottom: '3.5px solid #000000' }}
                                    >
                                      {(student.gender === 'Female' || student.gender === 'F') ? 'F' : 'M'}
                                    </td>
                                    <td 
                                      rowSpan={rowsToRender.length}
                                      className="p-1 border border-slate-950 text-center font-bold text-xs bg-white text-slate-950 font-mono student-info-cell"
                                      style={{ verticalAlign: 'middle', borderColor: '#000000', borderBottom: '3.5px solid #000000' }}
                                    >
                                      {getStudentAge(student)}
                                    </td>
                                  </>
                                )}
                                
                                <td 
                                  className={`p-1 border border-slate-950 text-center text-[10px] font-black uppercase text-slate-900 student-info-cell ${row.id === 'ANNUAL' ? 'roster-annual-cell' : ''}`}
                                  style={{ borderBottom: row.id === 'ANNUAL' ? '3.5px solid #000000' : undefined, borderColor: '#000000' }}
                                >
                                  {row.label}
                                </td>

                                {subjectScores.map((score, idx) => {
                                  const isLow = score !== null && score < 50;
                                  return (
                                    <td 
                                      key={idx} 
                                      className={`p-1 border border-slate-950 text-center font-bold text-xs font-mono score-cell ${isLow ? 'low-score-cell' : ''} ${row.id === 'ANNUAL' ? 'roster-annual-cell' : ''}`}
                                      style={{ 
                                        color: score === null ? '#a8a29e' : isLow ? '#dc2626' : '#1c1917',
                                        borderBottom: row.id === 'ANNUAL' ? '3.5px solid #000000' : undefined,
                                        borderColor: '#000000'
                                      }}
                                    >
                                      {score !== null ? (score % 1 === 0 ? score.toFixed(1) : score.toFixed(2)) : '0.0'}
                                    </td>
                                  );
                                })}

                                {/* Total Score with rich custom styling */}
                                <td 
                                  className={`p-1 border border-slate-950 text-center font-black text-xs font-mono total-score-cell ${row.id === 'ANNUAL' ? 'roster-annual-cell' : ''}`}
                                  style={{ backgroundColor: '#eff6ff', color: '#1e3a8a', borderBottom: row.id === 'ANNUAL' ? '3.5px solid #000000' : undefined, borderColor: '#000000' }}
                                >
                                  {totalVal !== null ? totalVal.toFixed(1) : '0.0'}
                                </td>

                                {/* Average Score with clear indicator for failing/passing */}
                                <td 
                                  className={`p-1 border border-slate-950 text-center font-black text-xs font-mono avg-score-cell ${isFailed ? 'failed-score-cell' : 'passed-score-cell'} ${row.id === 'ANNUAL' ? 'roster-annual-cell' : ''}`}
                                  style={{ 
                                    backgroundColor: isFailed ? '#fef2f2' : '#ecfdf5', 
                                    color: isFailed ? '#991b1b' : '#047857',
                                    borderBottom: row.id === 'ANNUAL' ? '3.5px solid #000000' : undefined,
                                    borderColor: '#000000'
                                  }}
                                >
                                  {avgVal !== null ? avgVal.toFixed(1) : '0.0'}
                                </td>

                                {/* Rank Column with dynamic gold styling for 1st place */}
                                <td 
                                  className={`p-1 border border-slate-950 text-center font-black text-xs font-mono rank-score-cell ${isFirstPlace ? 'first-place-cell' : 'normal-rank-cell'} ${row.id === 'ANNUAL' ? 'roster-annual-cell' : ''}`}
                                  style={{ 
                                    backgroundColor: isFirstPlace ? '#fef3c7' : '#f5f3ff', 
                                    color: isFirstPlace ? '#92400e' : '#4c1d95',
                                    borderBottom: row.id === 'ANNUAL' ? '3.5px solid #000000' : undefined,
                                    borderColor: '#000000'
                                  }}
                                >
                                  {rankVal}
                                </td>

                                {/* Conduct/Behavior grade style */}
                                <td 
                                  className={`p-1 border border-slate-950 text-center font-black text-xs conduct-cell ${row.id === 'ANNUAL' ? 'roster-annual-cell' : ''}`}
                                  style={{ 
                                    backgroundColor: '#f5f3ff', 
                                    color: isAConduct ? '#065f46' : '#701a75',
                                    borderBottom: row.id === 'ANNUAL' ? '3.5px solid #000000' : undefined,
                                    borderColor: '#000000'
                                  }}
                                >
                                  {condVal}
                                </td>

                                {/* Absence tracker style: red alerts for non-zero absences */}
                                <td 
                                  className={`p-1 border border-slate-950 text-center font-black text-xs font-mono absence-cell ${hasAbsence ? 'has-absence-cell' : 'no-absence-cell'} ${row.id === 'ANNUAL' ? 'roster-annual-cell' : ''}`}
                                  style={{ 
                                    backgroundColor: hasAbsence ? '#fff1f2' : '#f0fdf4', 
                                    color: hasAbsence ? '#9f1239' : '#15803d',
                                    borderBottom: row.id === 'ANNUAL' ? '3.5px solid #000000' : undefined,
                                    borderColor: '#000000'
                                  }}
                                >
                                  {absVal}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      ))}
                    </table>

                    {/* Official Signatures & Seal Section */}
                    {activeSubTab !== 'roster' && (
                      <div className="grid grid-cols-3 gap-6 pt-16 items-center text-slate-900">
                        <div className="text-center flex flex-col items-center">
                          <div className="h-10 w-4/5 border-b border-slate-400 flex items-end justify-center pb-1">
                            {/* Removed for physical signing/fingerprinting */}
                          </div>
                          <p className="font-black text-[10px] text-slate-700 mt-1">{tx("የክፍሉ መምህር ፊርማ (Homeroom Teacher)")}</p>
                        </div>

                        <div className="flex justify-center select-none">
                          {/* Circular Official Seal of School on printed sheet */}
                          <div className="relative w-24 h-24 rounded-full border-4 border-double border-blue-600/75 flex flex-col items-center justify-center p-1.5 text-center rotate-[-4deg] bg-blue-50/10 shrink-0 font-sans shadow-xs scale-90">
                            <div className="absolute inset-1 rounded-full border border-dashed border-blue-600/70"></div>
                            <span className="text-[5px] font-black uppercase tracking-wider text-blue-600/85 leading-none">{tx("ኪብር መካከለኛ ደረጃ ትምህርት ቤት")}</span>
                            <span className="text-[5px] font-bold text-blue-600/60 my-0.5">★ OFFICIAL ★</span>
                            <span className="text-[6px] font-extrabold text-blue-600/85 tracking-widest leading-none border border-blue-600/60 px-1 py-0.5 rounded-xs bg-white/40">APPROVED</span>
                            <span className="text-[5px] font-black text-blue-600/70 uppercase tracking-widest mt-0.5">Addis Ababa, ET</span>
                            {/* Removed name overlay for physical signing/fingerprinting */}
                          </div>
                        </div>

                        <div className="text-center flex flex-col items-center">
                          <div className="h-10 w-4/5 border-b border-slate-400 flex items-end justify-center pb-1">
                            {/* Removed for physical signing/fingerprinting */}
                          </div>
                          <p className="font-black text-[10px] text-slate-700 mt-1">{tx("የርዕሰ መምህር ማህተምና ፊርማ (Principal Sign-off)")}</p>
                        </div>
                      </div>
                    )}

                    {activeSubTab === 'roster' && (() => {
                      const maleCount = filteredStudents.filter(s => s.gender === 'Male' || s.gender === 'M').length;
                      const femaleCount = filteredStudents.filter(s => s.gender === 'Female' || s.gender === 'F').length;
                      const totalCount = filteredStudents.length;
                      return (
                        <div className="w-full mt-2 print:mt-1">
                          <div className="flex justify-between items-end gap-6 print:gap-4 text-slate-900 pt-2 print:pt-1 font-sans w-full">
                            {/* Sex Count table */}
                            <div className="border border-slate-950 rounded-lg overflow-hidden text-xs print:text-[9.5px] bg-white flex font-sans shadow-sm shrink-0 print:shadow-none">
                              <div className="px-3.5 print:px-2 py-1 print:py-0.5 bg-slate-50 border-r border-slate-950 flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-600">{tx("🙋‍♂️ ወንድ (Male):")}</span>
                                <span className="font-black text-indigo-700">{maleCount}</span>
                              </div>
                              <div className="px-3.5 print:px-2 py-1 print:py-0.5 bg-slate-50 border-r border-slate-950 flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-600">{tx("🙋‍♀️ ሴት (Female):")}</span>
                                <span className="font-black text-rose-600">{femaleCount}</span>
                              </div>
                              <div className="px-3.5 print:px-2 py-1 print:py-0.5 bg-slate-100 flex items-center gap-1.5 font-extrabold">
                                <span className="text-slate-900">{tx("📊 ድምር (Total):")}</span>
                                <span className="text-slate-950 font-black">{totalCount}</span>
                              </div>
                            </div>

                            {/* Teacher / Director Signatures - Stretched & Wider across the page */}
                            <div className="flex gap-20 print:gap-16 text-center text-xs print:text-[10px] font-black pb-0.5">
                              <div className="flex flex-col items-center w-88 print:w-80">
                                <div className="border-b-2 border-slate-950 w-full h-8 print:h-5 mb-1 flex items-end justify-center font-serif italic text-slate-600 text-sm print:text-xs">
                                  {/* Removed for physical signing/fingerprinting */}
                                </div>
                                <div className="font-extrabold text-slate-900 print:text-[10.5px]">Teacher's Signature</div>
                                <div className="text-[10px] print:text-[8px] text-slate-500 font-bold -mt-0.5">{tx("የመምህሩ ፊርማ")}</div>
                              </div>
                              <div className="flex flex-col items-center w-88 print:w-80">
                                <div className="border-b-2 border-slate-950 w-full h-8 print:h-5 mb-1 flex items-end justify-center font-serif italic text-slate-600 text-sm print:text-xs">
                                  {/* Removed for physical signing/fingerprinting */}
                                </div>
                                <div className="font-extrabold text-slate-900 print:text-[10.5px]">Director's Signature</div>
                                <div className="text-[10px] print:text-[8px] text-slate-500 font-bold -mt-0.5">{tx("የዳይሬክተሩ ፊርማ")}</div>
                              </div>
                            </div>
                          </div>

                          {/* Footer of Print Pane */}
                          <div className="border-t border-slate-200 pt-4 mt-8 text-center text-[10px] text-slate-400 font-semibold print:hidden flex justify-between">
                            <span>© 2026 Diligent School Management System</span>
                            <span>{tx("ልዩ ህትመት ማኔጅመንት ፖርታል")}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
        })()}
              </div> {/* closes #print-target-sheet */}
      </div> {/* closes #printable-area */}
    </div> {/* closes .print-preview-inner */}
  </div>,
  document.body
);
}

      return (
        <div className="space-y-6 grade-tracker-section-container">
          <style dangerouslySetInnerHTML={{__html: `
            /* On-screen tables styling overrides to ensure they don't stretch excessively */
            .grade-tracker-section-container table:not(.no-snug-override) {
              width: auto !important;
              max-width: 100% !important;
              margin-left: auto !important;
              margin-right: auto !important;
              table-layout: auto !important;
              border-collapse: separate !important;
              border-spacing: 0 !important;
              border-top: 1px solid #e7e5e4 !important;
              border-left: 1px solid #e7e5e4 !important;
            }
            .dark .grade-tracker-section-container table:not(.no-snug-override),
            html.dark .grade-tracker-section-container table:not(.no-snug-override) {
              border-top: 1px solid #44403c !important;
              border-left: 1px solid #44403c !important;
            }
            
            .grade-tracker-section-container table:not(.no-snug-override) th,
            .grade-tracker-section-container table:not(.no-snug-override) td {
              white-space: nowrap !important;
              padding-left: 12px !important;
              padding-right: 12px !important;
              border-bottom: 1px solid #e7e5e4 !important;
              border-right: 1px solid #e7e5e4 !important;
            }
            .dark .grade-tracker-section-container table:not(.no-snug-override) th,
            .dark .grade-tracker-section-container table:not(.no-snug-override) td,
            html.dark .grade-tracker-section-container table:not(.no-snug-override) th,
            html.dark .grade-tracker-section-container table:not(.no-snug-override) td {
              border-bottom: 1px solid #44403c !important;
              border-right: 1px solid #44403c !important;
            }

            /* Allow student name and ID column or specific wrapping cells to wrap beautifully */
            .grade-tracker-section-container table:not(.no-snug-override) td.student-name-cell,
            .grade-tracker-section-container table:not(.no-snug-override) th.student-name-cell {
              white-space: normal !important;
              min-width: 160px !important;
              max-width: 220px !important;
            }
            
            /* Custom styling to keep specific tables like attendance compact and scrollable in all 4 directions */
            .grade-tracker-section-container .overflow-x-auto {
              width: 100%;
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch;
            }
            
            /* Sticky columns styling for on-screen scrollable tables */
            @media (min-width: 640px) {
              .sticky-col-0 {
                position: sticky !important;
                left: 0 !important;
                z-index: 10 !important;
                box-shadow: 2px 0 5px -2px rgba(0,0,0,0.08);
              }
              .sticky-col-1 {
                position: sticky !important;
                left: 48px !important;
                z-index: 10 !important;
                box-shadow: 2px 0 5px -2px rgba(0,0,0,0.08);
              }
              .sticky-col-2 {
                position: sticky !important;
                left: 128px !important;
                z-index: 10 !important;
                box-shadow: 2px 0 5px -2px rgba(0,0,0,0.08);
              }
              /* Headers need higher z-index and header-specific background */
              th.sticky-col-0,
              th.sticky-col-1,
              th.sticky-col-2 {
                z-index: 20 !important;
                background-color: var(--bg-card) !important;
              }
              
              /* Sticky columns default backgrounds using theme variables */
              .grade-tracker-section-container tr:nth-child(even) td.sticky-col-0,
              .grade-tracker-section-container tr:nth-child(even) td.sticky-col-1,
              .grade-tracker-section-container tr:nth-child(even) td.sticky-col-2 {
                background-color: var(--bg-app) !important;
              }
              .grade-tracker-section-container tr:nth-child(odd) td.sticky-col-0,
              .grade-tracker-section-container tr:nth-child(odd) td.sticky-col-1,
              .grade-tracker-section-container tr:nth-child(odd) td.sticky-col-2 {
                background-color: var(--bg-card) !important;
              }
              
              /* Specific backgrounds for approved rows in sticky cells */
              .grade-tracker-section-container tr.approved-row td.sticky-col-0,
              .grade-tracker-section-container tr.approved-row td.sticky-col-1 {
                background-color: #ecfdf5 !important; /* light mode emerald-50 */
              }
              .dark .grade-tracker-section-container tr.approved-row td.sticky-col-0,
              .dark .grade-tracker-section-container tr.approved-row td.sticky-col-1,
              html.dark .grade-tracker-section-container tr.approved-row td.sticky-col-0,
              html.dark .grade-tracker-section-container tr.approved-row td.sticky-col-1 {
                background-color: #064e3b !important; /* dark mode emerald-950 */
              }
  
              /* Row hover effect for sticky cells */
              .grade-tracker-section-container tr:hover td.sticky-col-0,
              .grade-tracker-section-container tr:hover td.sticky-col-1,
              .grade-tracker-section-container tr:hover td.sticky-col-2 {
                background-color: var(--bg-input) !important;
              }
            }
          `}} />
          {/* Main Panel View */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-indigo-600 w-5.5 h-5.5" />{tx(" ክፍል-ተኮር ውጤት መከታተያ (Grade & Rank Analyzer)\n          ")}</h3>
              <p className="text-slate-400 text-xs mt-0.5">Filter grades, generate mark lists and official class rosters</p>
            </div>

            {/* CONTROLS: CLASS, SECTION & SUBJECT DROPDOWN BUTTONS (በሴክሽን፣ በክፍል እናበትምህርት አይነት ድሮፕ ዳውን በተን) */}
            <div className="flex items-center gap-2 flex-wrap">
              {activeSubTab === 'marklist' && (
                <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl shadow-xs">
                  <span className="text-[10px] font-black text-teal-800 uppercase tracking-wide">{tx("ትምህርት (Subject):")}</span>
                  <select
                    value={selectedSubject}
                    onChange={(e) => { playInteractiveSound('click'); setSelectedSubject(e.target.value); }}
                    className="text-xs font-black text-teal-950 bg-transparent outline-none cursor-pointer pr-1"
                  >
                    {selectableSubjects.map(sub => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{tx("ክፍል:")}</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => { playInteractiveSound('click'); setSelectedGrade(e.target.value); }}
                  className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                >
                  {gradeOptions.map(opt => (
                    <option key={opt} value={opt}>
                      {opt === 'All' ? tx("ሁሉም ክፍሎች (All)") : opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{tx("ሴክሽን:")}</span>
                <select
                  value={selectedSection}
                  onChange={(e) => { playInteractiveSound('click'); setSelectedSection(e.target.value); }}
                  className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                >
                  {sectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Search Bar Input for Student Name or ID */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-full sm:w-64 shadow-2xs">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder={tx("ተማሪ በስም ወይም መታወቂያ ፈልግ... (Search Name or ID)")}
                  className="text-xs font-bold text-slate-800 bg-transparent outline-none w-full placeholder-slate-400"
                />
                {studentSearchQuery && (
                  <button 
                    type="button" 
                    onClick={() => { playInteractiveSound('click'); setStudentSearchQuery(''); }} 
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Subject Switching Pills for Teachers (የሚያስተምሩትን ትምህርት በተራ መምረጫ አዝራሮች) */}
            {activeSubTab === 'marklist' && selectableSubjects.length > 1 && (
              <div className="w-full pt-2 flex items-center gap-1.5 flex-wrap border-t border-slate-100">
                <span className="text-[11px] font-extrabold text-teal-800 mr-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span>
                  {tx("የሚያስተምሯቸው የትምህርት ዓይነቶች:")}
                </span>
                {selectableSubjects.map(sub => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      playInteractiveSound('click');
                      setSelectedSubject(sub);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedSubject === sub
                        ? 'bg-teal-700 text-white shadow-xs ring-2 ring-teal-600/30 scale-102'
                        : 'bg-teal-50/80 text-teal-900 border border-teal-200/80 hover:bg-teal-100 hover:border-teal-300'
                    }`}
                  >
                    <span>{sub}</span>
                    {selectedSubject === sub && <Check className="w-3.5 h-3.5 text-teal-200" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mini Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-indigo-50/20 border border-indigo-100/40 p-4 rounded-2xl">
            <div className="text-center md:text-left">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">{tx("በክፍሉ ያሉ ተማሪዎች")}</span>
              <strong className="text-xl font-black text-slate-900">{filteredStudents.length}{tx(" ተማሪ")}</strong>
            </div>
            <div className="text-center md:text-left">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">{tx("የማለፍ መጠን (Pass Rate)")}</span>
              <strong className="text-xl font-black text-indigo-700">{classStats.passRate}%</strong>
            </div>
            <div className="text-center md:text-left">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">{tx("አማካይ ውጤት (Average)")}</span>
              <strong className="text-xl font-black text-emerald-700">{classStats.avg}%</strong>
            </div>
            <div className="text-center md:text-left">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">{tx("ከፍተኛ ውጤት (Top Score)")}</span>
              <strong className="text-xl font-black text-amber-600">{classStats.highest}%</strong>
            </div>
          </div>

          {/* Role-Based Permissions & Edit Mode Banner */}
          <div className="p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-200 text-slate-700">
            <div className="flex items-center gap-2.5">
              {isTeachingTeacher ? (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Unlock className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
              )}
              <div>
                <h4 className="text-xs font-black uppercase">
                  {isTeachingTeacher 
                    ? `የ${selectedSubject} መምህር - የውጤት መሙያ እና ማስተካከያ ፍቃድ` 
                    : currentUserRole === 'teacher' 
                      ? tx("መምህር - የውጤት መመልከቻ ብቻ (ያስተምሩትን ትምህርት ብቻ ነው ማስተካከል የሚችሉት)") 
                      : tx("ርዕሰ መምህር - የውጤት መመልከቻ ብቻ (Principal Access - Read Only)")}
                </h4>
                <p className="text-[11px] opacity-75 mt-0.5">
                  {isTeachingTeacher 
                    ? tx("የማርክ ሊስት ሰንጠረዥን በቀጥታ እዚህ ላይ መሙላት እና ማስተካከል ይችላሉ።") 
                    : currentUserRole === 'teacher' 
                      ? tx("የዚህን ትምህርት አይነት ስለማያስተምሩ ማየት ብቻ ነው የሚፈቀድልዎ።") 
                      : tx("ውጤቶችን እና ሮስተሩን መመልከት ብቻ ይችላሉ። ማስተካከል አይፈቀድም።")}
                </p>
              </div>
            </div>

            {isTeachingTeacher && (
              <div className="flex flex-wrap gap-2 shrink-0">
                {onUpdateSchoolConfig && (
                  <button
                    onClick={handleOpenWeightsModal}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                    title={tx(
                      "በመምህሩ ፍላጎት እና በት/ቤቱ መመሪያ መሰረት የእያንዳንዱን የውጤት መስክ ከፍተኛ ማርክ ማስተካከያ (Quiz, Mid, Final, etc.)"
                    )}
                  >
                    <Settings className="w-3.5 h-3.5" />{tx(" የማርክ ክፍፍል መመሪያ (Configure Mark Distribution)\n              ")}</button>
                )}
                <button
                  onClick={() => {
                    playInteractiveSound('click');
                    setEditModeActive(prev => !prev);
                  }}
                  className={'px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ' + (editModeActive ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700')}
                >
                  {editModeActive ? (
                    <>
                      <Save className="w-3.5 h-3.5" />{tx(" አርትዖት ሁነታን አጥፋ (Disable Edit)\n                ")}</>
                  ) : (
                    <>
                      <Edit2 className="w-3.5 h-3.5 animate-pulse" />{tx(" በሰንጠረዡ ላይ ሙላ / አስተካክል (Enable Edit)\n                ")}</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sub tabs: Mark List vs Roster */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
            <div className="flex flex-wrap gap-2 p-1.5 border border-slate-200 rounded-2xl bg-white/50 w-fit items-center">
              <button
                onClick={() => { 
                  playInteractiveSound('click'); 
                  setActiveSubTab('marklist'); 
                  setPrintOrientation('portrait');
                }}
                className={'px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ' + (activeSubTab === 'marklist' ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700 border border-teal-600' : 'text-slate-500 hover:text-teal-700 hover:bg-teal-50/50 border border-slate-200')}
              >
                <FileSpreadsheet className="w-4 h-4" />{tx(" የማርክ ሊስት (Mark List)\n          ")}</button>
              
              {/* Roster is shown for Teachers (if Homeroom), Principal, or Parents */}
              {((currentUserRole === 'teacher' && isCurrentHomeroomTeacher) || currentUserRole === 'principal' || currentUserRole === 'parent') && (
                <button
                  onClick={() => { 
                    playInteractiveSound('click'); 
                    setActiveSubTab('roster'); 
                    setPrintOrientation('landscape');
                  }}
                  className={'px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ' + (activeSubTab === 'roster' ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200')}
                >
                  <Award className="w-4 h-4" />{tx(" የክፍል ሮስተር (Roster Table)\n            ")}</button>
              )}

              {/* Attendance is shown for Teachers (if Homeroom) and Principals */}
              {((currentUserRole === 'teacher' && isCurrentHomeroomTeacher) || currentUserRole === 'principal') && (
                <button
                  onClick={() => { playInteractiveSound('click'); setActiveSubTab('attendance'); }}
                  className={'px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ' + (activeSubTab === 'attendance' ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200')}
                >
                  <Users className="w-4 h-4" /> {currentUserRole === 'principal' ? tx("ዕለታዊ አቴንዳንስ መከታተያ ሰሌዳ (Attendance Monitor)") : tx("አቴንዳንስ መሙያ (Attendance)")}
                </button>
              )}

              {/* Performance Dashboard is shown for Teachers and Principals */}
              {(currentUserRole === 'teacher' || currentUserRole === 'principal') && (
                <button
                  onClick={() => { playInteractiveSound('click'); setActiveSubTab('performance'); }}
                  className={'px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ' + (activeSubTab === 'performance' ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200')}
                >
                  <TrendingUp className="w-4 h-4" />{tx(" አፈጻጸም ዳሽቦርድ (Performance)\n            ")}</button>
              )}

              {/* Student Registration is shown for Teachers and Principals */}
              {(currentUserRole === 'teacher' || currentUserRole === 'principal') && (
                <button
                  onClick={() => { playInteractiveSound('click'); setActiveSubTab('student-registration'); }}
                  className={'px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ' + (activeSubTab === 'student-registration' ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200')}
                >
                  <PlusCircle className="w-4 h-4" />{tx(" ተማሪዎች ምዝገባ (Registration)\n            ")}</button>
              )}
            </div>

            {/* PRINT & DOWNLOAD BUTTONS (ማውረጃ እና ማተሚያ) */}
            {(activeSubTab === 'marklist' || activeSubTab === 'roster' || activeSubTab === 'attendance') && (
              <div className="flex flex-wrap items-center gap-2">
                {(activeSubTab === 'marklist' || activeSubTab === 'roster') && (
                  <button
                    onClick={handleDownloadCSV}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Download CSV from database"
                  >
                    <Download className="w-3.5 h-3.5" />{tx(" ዳታቤዝ አውርድ (Download)\n              ")}</button>
                )}
                {activeSubTab === 'roster' ? (
                  <>
                    <button
                      onClick={() => {
                        playInteractiveSound('success');
                        setActiveSubTab('roster');
                        setIsPrintPreview(true);
                        setTimeout(() => {
                          exportElementToPDF('printable-area', `Class_Roster_${selectedGrade}_${selectedSection}.pdf`, 'landscape');
                        }, 500);
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      title={tx("የክፍሉን ሮስተር በPDF ወደ ሎካል ስቶሬጅ ያውርዱ")}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{tx("ሮስተር PDF አውርድ")}</span>
                    </button>
                    <button
                      onClick={handleDirectRosterPrint}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      title="Directly Print and Download the Roster as A4 Landscape PDF"
                    >
                      <Printer className="w-4 h-4 animate-pulse" />{tx(" print Roster (ሮስተር አትም)\n              ")}</button>
                  </>
                ) : activeSubTab === 'attendance' ? (
                  <>
                    <button
                      onClick={() => {
                        playInteractiveSound('success');
                        setIsPrintPreview(true);
                        setTimeout(() => {
                          exportElementToPDF('printable-area', `Attendance_Report_${selectedGrade}_${selectedSection}.pdf`, 'portrait');
                        }, 500);
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      title={tx("የክፍሉን አቴንዳንስ ሪፖርት በPDF ወደ ሎካል ስቶሬጅ ያውርዱ")}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{tx("አቴንዳንስ PDF አውርድ")}</span>
                    </button>
                    <button
                      onClick={() => { playInteractiveSound('click'); setIsPrintPreview(true); }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-850 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      title="Print Daily Attendance Report"
                    >
                      <Printer className="w-4 h-4 animate-pulse" />{tx(" አቴንዳንስ አትም (Print Attendance)\n              ")}</button>
                  </>
                ) : (
                  <button
                    onClick={() => { playInteractiveSound('click'); setIsPrintPreview(true); }}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-indigo-100 cursor-pointer"
                    title="Open printable sheet preview"
                  >
                    <Printer className="w-3.5 h-3.5" />{tx(" ሪፖርት አትም (Print)\n              ")}</button>
                )}
              </div>
            )}
          </div>

          {/* Term/Period Selector Bar */}
          {(activeSubTab === 'marklist' || activeSubTab === 'roster') && (
            <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-extrabold text-[11px] uppercase ml-1.5 flex items-center gap-1">
                  <span className="text-sm">📅</span>{tx(" የምዘና የጊዜ ዑደት (Evaluation Term):\n            ")}</span>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-bold">
                  {(schoolConfig?.evaluationMode || 'quarter') === 'semester' ? tx("ሴሚስተር ሞድ (Semester Mode)") : tx("ሩብ ዓመት ሞድ (Quarter Mode)")}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {(schoolConfig?.evaluationMode || 'quarter') === 'semester' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { playInteractiveSound('click'); setSelectedTerm(1); }}
                      className={'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ' + (selectedTerm === 1 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80')}
                    >{tx("\n                  ሴሚስተር 1 (Semester 1)\n                ")}</button>
                    <button
                      type="button"
                      onClick={() => { playInteractiveSound('click'); setSelectedTerm(2); }}
                      className={'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ' + (selectedTerm === 2 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80')}
                    >{tx("\n                  ሴሚስተር 2 (Semester 2)\n                ")}</button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { playInteractiveSound('click'); setSelectedTerm(1); }}
                      className={'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ' + (selectedTerm === 1 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80')}
                    >{tx("\n                  ሩብ ዓመት 1 (Q1)\n                ")}</button>
                    <button
                      type="button"
                      onClick={() => { playInteractiveSound('click'); setSelectedTerm(2); }}
                      className={'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ' + (selectedTerm === 2 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80')}
                    >{tx("\n                  ሩብ ዓመት 2 (Q2)\n                ")}</button>
                    <button
                      type="button"
                      onClick={() => { playInteractiveSound('click'); setSelectedTerm(3); }}
                      className={'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ' + (selectedTerm === 3 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80')}
                    >{tx("\n                  ሩብ ዓመት 3 (Q3)\n                ")}</button>
                    <button
                      type="button"
                      onClick={() => { playInteractiveSound('click'); setSelectedTerm(4); }}
                      className={'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ' + (selectedTerm === 4 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80')}
                    >{tx("\n                  ሩብ ዓመት 4 (Q4)\n                ")}</button>
                  </>
                )}

                {/* Annual summary view toggle inside Roster only */}
                {activeSubTab === 'roster' && (
                  <button
                    type="button"
                    onClick={() => { playInteractiveSound('click'); setSelectedTerm('annual'); }}
                    className={'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border ' + (selectedTerm === 'annual' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80')}
                  >{tx("\n                📊 ዓመታዊ አማካይ (Annual Avg)\n              ")}</button>
                )}
              </div>
            </div>
          )}

          {/* Table Data display */}
          <div className="w-full">
            {activeSubTab === 'performance' ? (
              <PerformanceDashboard
                students={students}
                grades={grades}
                selectedGrade={selectedGrade}
                selectedSection={selectedSection}
                teachers={teachers}
                schoolConfig={schoolConfig}
                currentUserRole={currentUserRole}
                currentUserEmail={currentUserEmail}
                activeTheme={activeTheme}
              />
            ) : activeSubTab !== 'student-registration' && filteredStudents.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">🔍</span>
                {studentSearchQuery ? (
                  <>
                    <p className="font-bold text-slate-700">{tx("በፍለጋው መሰረት ምንም ተማሪ አልተገኘም (No matching students found)")}</p>
                    <p className="text-xs text-slate-400">“{studentSearchQuery}{tx("” የሚለውን ቃል የሚያሟላ ተማሪ በዚህ ክፍል ውስጥ የለም።")}</p>
                    <button
                      type="button"
                      onClick={() => { playInteractiveSound('click'); setStudentSearchQuery(''); }}
                      className="mt-2 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all shadow-xs border border-indigo-100"
                    >{tx("\n                  ፍለጋውን አጽዳ (Clear Search)\n                ")}</button>
                  </>
                ) : (
                  <span>{tx(
                    "በዚህ ክፍል እና ሴክሽን ውስጥ የተመዘገበ ተማሪ አልተገኘም (No students in this Class & Section yet)"
                  )}</span>
                )}
              </div>
            ) : (
              <>
                {activeSubTab === 'marklist' && (
                  <>
                    {/* Bulk Actions Panel */}
                    <div className="mb-4 bg-slate-50 border border-slate-200/60 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="text-base">⚡</span>
                        <div className="text-left">
                          <span className="font-extrabold text-xs uppercase tracking-wider block">{tx("የጅምላ ተግባራት (Bulk Actions)")}</span>
                          <span className="text-[10px] text-slate-400 block font-medium">{tx("ለሁሉም የክፍሉ ተማሪዎች ተፈጻሚ የሚሆን (Class-wide operations)")}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        {currentUserRole === 'principal' && (
                          <button
                            type="button"
                            onClick={handleBulkApproveClick}
                            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-50 hover:bg-emerald-150/50 text-emerald-800 border border-emerald-150 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-3xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />{tx(" ሁሉንም አጽድቅ (Approve All)\n                      ")}</button>
                        )}
                        {(currentUserRole === 'teacher' || currentUserRole === 'principal') && (
                          <button
                            type="button"
                            onClick={handleBulkClearClick}
                            className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-50 hover:bg-rose-150/50 text-rose-800 border border-rose-150 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-3xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />{tx(" ሁሉንም ውጤት ሰርዝ (Bulk Delete Grades)\n                      ")}</button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto w-full rounded-2xl border border-slate-200/80 bg-white/75 backdrop-blur-md shadow-xs">
                      <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-teal-50/70 text-teal-800 uppercase text-[10px] tracking-wider font-extrabold border-b border-teal-150">
                          <th className="p-3 w-12 text-center sticky-col-0">{tx("ተ.ቁ (No.)")}</th>
                          <th className="p-3 student-name-cell sticky-col-1">{tx("ተማሪ")}</th>
                          <th className="p-3 text-center">QUIZ ({quizMax})</th>
                          <th className="p-3 text-center">CW ({cwMax})</th>
                          <th className="p-3 text-center">HW ({hwMax})</th>
                          <th className="p-3 text-center">GW ({gwMax})</th>
                          <th className="p-3 text-center">PW ({pwMax})</th>
                          <th className="p-3 text-center">CP ({cpMax})</th>
                          <th className="p-3 text-center">MEXAM ({mexamMax})</th>
                          <th className="p-3 text-center">FEXAM ({fexamMax})</th>
                          <th className="p-3 text-center font-bold">{tx("ጠቅላላ (Total %)")}</th>
                          <th className="p-3 text-center">{tx("ማረጋገጫ (Approval)")}</th>
                          <th className="p-3 text-center">{tx("ተግባራት (Actions)")}</th>
                        </tr>
                      </thead>
                    <tbody>
                      {studentGradesData.map((item) => {
                        const r = item.gradeRecord;
                        const isApproved = r && r.isApproved;
                        const isEditDisabled = isApproved || !isTeachingTeacher;
                        const isRowEditable = (editModeActive || rowEditingStudentId === item.student.id) && isTeachingTeacher;
                        
                        return (
                          <tr 
                            key={item.student.id} 
                            className={'border-b border-slate-100 text-slate-800 transition-all duration-200 even:bg-slate-50 ' + (isApproved ? 'approved-row bg-emerald-50/50 border-l-4 border-l-emerald-600 hover:bg-emerald-50/80' : 'hover:bg-teal-50/30')}
                          >
                            <td className="p-3 text-center font-black text-slate-500 font-mono text-xs sticky-col-0">
                              {getStudentRollNumber(item.student.id)}
                            </td>
                            <td className="p-3 student-name-cell sticky-col-1 border-r border-slate-100">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{item.student.name}</span>
                                {isApproved && (
                                  <span className="bg-emerald-100 text-emerald-850 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase">
                                    Verified
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[9px] text-indigo-600 font-bold block">{item.student.id}</span>
                            </td>
                            <td className="p-3 text-center font-medium text-slate-600">
                              {isRowEditable ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={quizMax}
                                  value={r && r.quiz !== undefined ? r.quiz : ''}
                                  disabled={isEditDisabled}
                                  onChange={(e) => handleInlineGradeChange(item.student.id, 'quiz', e.target.value)}
                                  className="w-16 p-1 border border-slate-200 focus:border-indigo-500 rounded text-center text-xs font-bold outline-none bg-slate-50/50 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                  placeholder="0"
                                />
                              ) : (
                                r && r.quiz !== undefined ? r.quiz : '-'
                              )}
                            </td>
                            <td className="p-3 text-center font-medium text-slate-600">
                              {isRowEditable ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={cwMax}
                                  value={r && r.cw !== undefined ? r.cw : ''}
                                  disabled={isEditDisabled}
                                  onChange={(e) => handleInlineGradeChange(item.student.id, 'cw', e.target.value)}
                                  className="w-16 p-1 border border-slate-200 focus:border-indigo-500 rounded text-center text-xs font-bold outline-none bg-slate-50/50 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                  placeholder="0"
                                />
                              ) : (
                                r && r.cw !== undefined ? r.cw : '-'
                              )}
                            </td>
                            <td className="p-3 text-center font-medium text-slate-600">
                              {isRowEditable ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={hwMax}
                                  value={r && r.hw !== undefined ? r.hw : ''}
                                  disabled={isEditDisabled}
                                  onChange={(e) => handleInlineGradeChange(item.student.id, 'hw', e.target.value)}
                                  className="w-16 p-1 border border-slate-200 focus:border-indigo-500 rounded text-center text-xs font-bold outline-none bg-slate-50/50 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                  placeholder="0"
                                />
                              ) : (
                                r && r.hw !== undefined ? r.hw : '-'
                              )}
                            </td>
                            <td className="p-3 text-center font-medium text-slate-600">
                              {isRowEditable ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={gwMax}
                                  value={r && r.gw !== undefined ? r.gw : ''}
                                  disabled={isEditDisabled}
                                  onChange={(e) => handleInlineGradeChange(item.student.id, 'gw', e.target.value)}
                                  className="w-16 p-1 border border-slate-200 focus:border-indigo-500 rounded text-center text-xs font-bold outline-none bg-slate-50/50 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                  placeholder="0"
                                />
                              ) : (
                                r && r.gw !== undefined ? r.gw : '-'
                              )}
                            </td>
                            <td className="p-3 text-center font-medium text-slate-600">
                              {isRowEditable ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={pwMax}
                                  value={r && r.pw !== undefined ? r.pw : ''}
                                  disabled={isEditDisabled}
                                  onChange={(e) => handleInlineGradeChange(item.student.id, 'pw', e.target.value)}
                                  className="w-16 p-1 border border-slate-200 focus:border-indigo-500 rounded text-center text-xs font-bold outline-none bg-slate-50/50 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                  placeholder="0"
                                />
                              ) : (
                                r && r.pw !== undefined ? r.pw : '-'
                              )}
                            </td>
                            <td className="p-3 text-center font-medium text-slate-600">
                              {isRowEditable ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={cpMax}
                                  value={r && r.cp !== undefined ? r.cp : ''}
                                  disabled={isEditDisabled}
                                  onChange={(e) => handleInlineGradeChange(item.student.id, 'cp', e.target.value)}
                                  className="w-16 p-1 border border-slate-200 focus:border-indigo-500 rounded text-center text-xs font-bold outline-none bg-slate-50/50 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                  placeholder="0"
                                />
                              ) : (
                                r && r.cp !== undefined ? r.cp : '-'
                              )}
                            </td>
                            <td className="p-3 text-center font-medium text-slate-600">
                              {isRowEditable ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={mexamMax}
                                  value={r && r.mid !== undefined ? r.mid : ''}
                                  disabled={isEditDisabled}
                                  onChange={(e) => handleInlineGradeChange(item.student.id, 'mid', e.target.value)}
                                  className="w-16 p-1 border border-slate-200 focus:border-indigo-500 rounded text-center text-xs font-bold outline-none bg-slate-50/50 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                  placeholder="0"
                                />
                              ) : (
                                r && r.mid !== undefined ? r.mid : '-'
                              )}
                            </td>
                            <td className="p-3 text-center font-medium text-slate-600">
                              {isRowEditable ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={fexamMax}
                                  value={r && r.final !== undefined ? r.final : ''}
                                  disabled={isEditDisabled}
                                  onChange={(e) => handleInlineGradeChange(item.student.id, 'final', e.target.value)}
                                  className="w-16 p-1 border border-slate-200 focus:border-indigo-500 rounded text-center text-xs font-bold outline-none bg-slate-50/50 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                  placeholder="0"
                                />
                              ) : (
                                r && r.final !== undefined ? r.final : '-'
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {r ? (
                                <span className={'px-2 py-0.5 rounded text-xs font-black ' + (r.total >= 85 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : r.total >= 50 ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' : 'bg-rose-50 text-rose-800 border border-rose-100')}>
                                  {r.total}%
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs italic">{tx("ውጤት አልተሞላም")}</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleApprove(item.student.id)}
                                disabled={currentUserRole !== 'principal'}
                                className={'px-3 py-1.5 rounded-lg text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 mx-auto disabled:opacity-75 disabled:cursor-not-allowed ' + (isApproved ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100' : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 border border-slate-200 hover:border-indigo-300')}
                                title={currentUserRole !== 'principal' ? tx("ርዕሰ መምህሩ ብቻ ናቸው ማጽደቅ የሚችሉት (Only the Principal can approve grades)") : tx("ውጤቱን ለማጽደቅ ወይም ለመሰረዝ ጠቅ ያድርጉ")}
                              >
                                {isApproved ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 animate-bounce" />
                                    <span>{tx("የጸደቀ (Approved)")}</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{tx("አጽድቅ (Approve)")}</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {isTeachingTeacher ? (
                                  <>
                                    {rowEditingStudentId === item.student.id ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          playInteractiveSound('success');
                                          setRowEditingStudentId(null);
                                        }}
                                        className="p-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-3xs cursor-pointer"
                                        title={tx("ለውጦቹን አስቀምጥ (Save changes)")}
                                      >
                                        <Save className="w-3.5 h-3.5" />
                                        <span className="text-[10px] hidden xl:inline">{tx("አስቀምጥ")}</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isApproved) {
                                            playInteractiveSound('wrong');
                                            alert(tx(
                                              "ይህ ውጤት የጸደቀ ስለሆነ ማሻሻል አይቻልም። (This grade is approved and locked. It cannot be edited.)"
                                            ));
                                            return;
                                          }
                                          playInteractiveSound('click');
                                          setRowEditingStudentId(item.student.id);
                                        }}
                                        disabled={isApproved}
                                        className={'p-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ' + (!isApproved ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-750 border border-slate-200 hover:border-indigo-200 bg-white shadow-3xs cursor-pointer' : 'text-slate-300 border border-slate-150 cursor-not-allowed bg-slate-50/10')}
                                        title={isApproved ? tx("ውጤቱ የጸደቀ ስለሆነ ማሻሻል አይቻልም (Locked - Approved)") : tx("ውጤት አስተካክል (Edit Grade)")}
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span className="text-[10px] hidden xl:inline">{tx("አስተካክል")}</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteClick(item.student.id, item.student.name, r)}
                                      disabled={!r || isApproved}
                                      className={'p-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ' + (r && !isApproved ? 'text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 border border-slate-200 hover:border-rose-200 bg-white shadow-3xs cursor-pointer' : 'text-slate-300 border border-slate-150 cursor-not-allowed bg-slate-50/10')}
                                      title={!r ? tx("ምንም ውጤት የለም") : isApproved ? tx("ውጤቱ የጸደቀ ስለሆነ መሰረዝ አይቻልም") : tx("የተማሪውን ውጤት ሰርዝ (Delete Grade)")}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span className="text-[10px] hidden xl:inline">{tx("ሰርዝ")}</span>
                                    </button>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-1 text-slate-400 bg-slate-50 border border-slate-200/50 px-2 py-1 rounded-lg text-[10px] font-bold">
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <span>{tx("እይታ ብቻ (Read Only)")}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                  </>
                )}

                {activeSubTab === 'roster' && (
                  // ROSTER TABLE VIEW WITH DETAILED SUBJECTS, CONDUCT, ABSENT AND REPORT CARD TRIGGER
                  <div className="flex flex-col gap-6">
                    {/* Header Instruction */}
                    <div className="flex flex-col gap-3">
                      <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-xl text-slate-850 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-3xs">
                        <div className="flex-1">
                          <span className="font-extrabold text-amber-800 block mb-1">{tx("💡 ፒዲኤፍ ማውረጃ መመሪያ (PDF Download Guide)፡")}</span>{tx("\n                      በብሮውዘርዎ ወይም በiframe የደህንነት ገደብ ምክንያት ")}<strong>{tx("\"PDF አውርድ\"")}</strong>{tx(" በቀጥታ ካልሰራ፤ እባክዎ መተግበሪያውን \n                      ")}<a href={window.location.href} target="_blank" rel="noopener noreferrer" className="ml-1 px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-200 rounded-md font-black inline-flex items-center gap-1 transition-colors">{tx(
                            "\n                        በአዲስ ታብ ለመክፈት እዚህ ይጫኑ (Open in New Tab) ↗️\n                      "
                          )}</a>{tx("። በአዲስ ታብ ላይ ማውረድ በተሟላ ሁኔታ ይሰራል።\n                    ")}</div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-slate-700 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <span className="font-extrabold text-indigo-700 block mb-1">{tx("💡 መመሪያ (Instructions)፡")}</span>{tx(
                          "\n                      እያንዳንዱ ተማሪ በሁሉም የትምህርት አይነቶች ያመጣው ውጤት ከ100 ተሰልቶ በዝርዝር ቀርቧል። የተማሪውን "
                        )}<span className="font-bold">{tx("ምግባር (Conduct)")}</span>{tx(" እና ")}<span className="font-bold">{tx("ቀሪ ቀናት (Absents)")}</span>{tx(" እዚሁ ሰንጠረዥ ላይ በቀጥታ ማስተካከል ይችላሉ። እንዲሁም ")}<span className="font-bold">{tx("\"የተማሪ ካርድ\" (Generate Card)")}</span>{tx(" በመጫን የተሟላ ውጤት ካርድ ማመንጨት ይቻላል።\n                      ")}<span className="block mt-2 font-black text-emerald-700 animate-pulse">{tx(
                            "➡️ ቀሪ ቀናት (Absents) ኮለመንን ጨምሮ ሙሉውን ሮስተር ለማየት ሰንጠረዡን ወደ ቀኝ ያንሸራትቱት ወይም ያሸብልሉት (Scroll right to see all columns)。"
                          )}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto flex-wrap">
                          <button
                            type="button"
                            onClick={() => { playInteractiveSound('click'); setShowSignatureModal(true); }}
                            className="flex-1 md:flex-none px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                          >{tx(
                            "\n                        ✍️ ፊርማ ማስተካከያ (Signatures Setup)\n                      "
                          )}</button>
                          <button
                            type="button"
                            onClick={handleDirectRosterPrint}
                            className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                          >
                            <Printer className="w-4 h-4 animate-pulse" />{tx(" print Roster (ሮስተር አትም PDF)\n                      ")}</button>
                          <div className="bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-3xs text-[11px] font-black text-indigo-800 shrink-0 text-center">{tx("\n                        ጠቅላላ ትምህርቶች፡ ")}{subjects.length}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-xs">
                      <table className="w-full text-sm text-left border-collapse min-w-[1250px]">
                        <thead>
                          <tr className="bg-slate-50/80 backdrop-blur-xs text-slate-500 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-100">
                            <th className="p-3 w-12 text-center sticky-col-0">{tx("ተ.ቁ (No.)")}</th>
                            <th className="p-3 min-w-[150px] student-name-cell sticky-col-1">{tx("የተማሪ ሙሉ ስም (Student Name)")}</th>
                            <th className="p-3 text-center min-w-[60px]">{tx("ፆታ (Sex)")}</th>
                            <th className="p-3 text-center min-w-[60px]">{tx("ዕድሜ (Age)")}</th>
                            {subjects.map(sub => (
                              <th key={sub} className="p-3 text-center text-[10px] bg-slate-50/30">
                                {sub}
                              </th>
                            ))}
                            <th className="p-3 text-center bg-slate-50 font-bold text-indigo-900">{tx("ድምር (Total)")}</th>
                            <th className="p-3 text-center bg-indigo-50 text-indigo-950 font-extrabold">{tx("አማካይ (Average)")}</th>
                            <th className="p-3 text-center bg-slate-50 font-bold text-indigo-900 w-16">{tx("Rank (ደረጃ)")}</th>
                            <th className="p-3 text-center min-w-[110px]">{tx("ምግባር (Conduct)")}</th>
                            <th className="p-3 text-center min-w-[100px]">{tx("ቀሪ ቀናት (Absents)")}</th>
                            <th className="p-3 text-center">{tx("ሁኔታ (Status)")}</th>
                            <th className="p-3 text-center">{tx("ሪፖርት ካርድ (Report)")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentRosterData.map((item) => {
                            const isPass = isStudentPassing(item);
                            const hasAnyGrades = item.gradedCount > 0;
                            return (
                              <tr key={item.student.id} className="group hover:bg-indigo-50/10 border-b border-slate-100 text-slate-800 transition-colors even:bg-slate-50">
                                {/* Sequence Number */}
                                <td className="p-3 text-center font-black text-slate-500 font-mono text-xs sticky-col-0">
                                  {getStudentRollNumber(item.student.id)}
                                </td>
                                {/* Name & ID */}
                                <td className="p-3 student-name-cell sticky-col-1 border-r border-slate-100">
                                  <div className="font-bold text-slate-900">{item.student.name}</div>
                                  <span className="font-mono text-[9px] text-slate-400 font-semibold block">{item.student.id}</span>
                                </td>
                                {/* Sex */}
                                <td className="p-3 text-center font-bold text-slate-700 text-xs">
                                  {item.student.gender === 'Female' || item.student.gender === 'F' ? 'F' : 'M'}
                                </td>
                                {/* Age */}
                                <td className="p-3 text-center font-bold text-slate-700 text-xs font-mono">
                                  {getStudentAge(item.student)}
                                </td>

                                {/* Dynamic Subject Grades list */}
                                {subjects.map(sub => {
                                  const score = item.subjectGrades[sub];
                                  const isAllowedUser = currentUserRole === 'teacher' || currentUserRole === 'principal';
                                  const isEditable = editModeActive && checkTeacherCanTeachSubject(sub, item.student.grade, item.student.section) && selectedTerm !== 'annual';
                                  return (
                                    <td key={sub} className="p-3 text-center font-bold">
                                      {isEditable ? (
                                        <button
                                          onClick={() => handleOpenQuickEdit(item.student, sub)}
                                          className="px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black hover:bg-indigo-100 transition-all flex items-center gap-1 mx-auto"
                                          title={tx("ውጤት ለማስተካከል ጠቅ ያድርጉ")}
                                        >
                                          <span>{score !== null ? (score + '%') : '0%'}</span>
                                          <Edit2 className="w-3 h-3 text-indigo-500 opacity-80 shrink-0" />
                                        </button>
                                      ) : (
                                        score !== null ? (
                                          <div className="flex items-center justify-center gap-1" title={`${sub}: ${score}/100`}>
                                            <span className={`text-xs font-black ${score >= 50 ? 'text-slate-800' : 'text-rose-600'}`}>
                                              {score}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-normal">/100</span>
                                          </div>
                                        ) : (
                                          <span className="text-slate-300 italic text-[11px] font-normal" title={tx("ውጤት አልተሞላም")}>-</span>
                                        )
                                      )}
                                    </td>
                                  );
                                })}

                                {/* Total Sum */}
                                <td className="p-3 text-center font-extrabold bg-slate-50/30 text-slate-900">
                                  {hasAnyGrades ? item.totalSum : <span className="text-slate-300">-</span>}
                                </td>

                                {/* Average */}
                                <td className="p-3 text-center font-black bg-indigo-50/10 text-indigo-950">
                                  {hasAnyGrades ? (
                                    <span className="text-xs bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                      {item.average}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>

                                {/* Rank Column */}
                                <td className="p-3 text-center bg-slate-50/10">
                                  {hasAnyGrades && item.rank !== null ? (
                                    <span className={'inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ' + (item.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-xs' : item.rank === 2 ? 'bg-slate-100 text-slate-900 border border-slate-200' : item.rank === 3 ? 'bg-orange-100 text-orange-900 border border-orange-200' : 'bg-slate-50 text-slate-600')}>
                                      {item.rank}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-bold">-</span>
                                  )}
                                </td>

                                {/* Conduct Selection (Dropdown) */}
                                <td className="p-3 text-center">
                                  <select
                                    value={item.conduct}
                                    disabled={currentUserRole !== 'teacher' || !isCurrentHomeroomTeacher}
                                    onChange={(e) => handleUpdateExtraInfo(item.student.id, 'conduct', e.target.value)}
                                    className="text-xs font-bold bg-white border border-slate-200 hover:border-indigo-400 rounded-lg p-1 text-center outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <option value="A+">{tx("A+ (እጅግ በጣም ጥሩ)")}</option>
                                    <option value="A">{tx("A (በጣም ጥሩ)")}</option>
                                    <option value="B">{tx("B (ጥሩ)")}</option>
                                    <option value="C">{tx("C (መካከለኛ)")}</option>
                                    <option value="D">{tx("D (ደካማ)")}</option>
                                  </select>
                                </td>

                                {/* Absents Counter Input */}
                                <td className="p-3 text-center">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      disabled={currentUserRole !== 'teacher' || !isCurrentHomeroomTeacher}
                                      onClick={() => handleUpdateExtraInfo(item.student.id, 'absent', Math.max(0, item.absent - 1))}
                                      className="w-5 h-5 bg-slate-100 text-slate-600 rounded-md flex items-center justify-center font-extrabold hover:bg-slate-200 text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      disabled={currentUserRole !== 'teacher' || !isCurrentHomeroomTeacher}
                                      value={item.absent}
                                      onChange={(e) => handleUpdateExtraInfo(item.student.id, 'absent', parseInt(e.target.value) || 0)}
                                      className="w-10 text-center text-xs font-black bg-slate-50/50 border border-slate-200 rounded-md py-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <button
                                      disabled={currentUserRole !== 'teacher' || !isCurrentHomeroomTeacher}
                                      onClick={() => handleUpdateExtraInfo(item.student.id, 'absent', item.absent + 1)}
                                      className="w-5 h-5 bg-indigo-50 text-indigo-700 rounded-md flex items-center justify-center font-extrabold hover:bg-indigo-100 text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="p-3 text-center">
                                  {hasAnyGrades ? (
                                    isPass ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1 rounded-full font-extrabold">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />{tx(" አልፏል\n                                  ")}</span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-800 border border-rose-100 px-2.5 py-1 rounded-full font-extrabold">
                                        <XCircle className="w-3 h-3 text-rose-600" />{tx(" ወድቋል\n                                  ")}</span>
                                    )
                                  ) : (
                                    <span className="text-slate-300 italic text-xs">{tx("ያልተሞላ")}</span>
                                  )}
                                </td>

                                {/* Report Card Button */}
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => {
                                      playInteractiveSound('click');
                                      setSelectedCardStudentId(item.student.id);
                                    }}
                                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-lg transition-colors border border-indigo-100 flex items-center gap-1 mx-auto"
                                  >
                                    <FileText className="w-3.5 h-3.5" />{tx(" ካርድ አውጣ (Card)\n                              ")}</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Roster Footer notes & signatures */}
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-6">
                      <div className="text-xs text-slate-500 space-y-1">
                        <p className="font-black text-slate-700">{tx("📌 ማስታወሻ (Note):")}</p>
                        <p>{tx("1. ለማለፍ የሚያስፈልገው ዝቅተኛ ውጤት 50% ነው።")}</p>
                        <p>{tx("2. ምግባር ከ \"A\" እስከ \"D\" ባሉ ደረጃዎች መሠረት ይመዘገባል።")}</p>
                        <p>{tx("3. ይህ ሰነድ በክፍሉ መምህር እና በፈታኞች ኮሚቴ ተረጋግጦ የጸደቀ ነው።")}</p>
                      </div>
                      
                      {/* Signatures in Roster */}
                      <div className="grid grid-cols-2 gap-4 text-[10px] text-center pt-4 border-t border-slate-200 mt-4 md:mt-0">
                        <div className="flex flex-col items-center">
                          <div className="h-6 w-24 border-b border-slate-300 relative flex items-center justify-center">
                            {/* Removed for physical signing/fingerprinting */}
                          </div>
                          <span className="text-slate-600 font-bold mt-1">{tx("የክፍሉ መምህር (Homeroom Teacher)")}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="h-6 w-24 border-b border-slate-300 relative flex items-center justify-center">
                            {/* Removed for physical signing/fingerprinting */}
                          </div>
                          <span className="text-slate-600 font-bold mt-1">{tx("የኪሊክ ኮሚቴ ሰብሳቢ (Principal)")}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {activeSubTab === 'attendance' && (
                  <div className="flex flex-col gap-6">
                    {/* DUAL CALENDAR DATE CONTROL BAR */}
                    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border border-indigo-100/50">{tx(
                            "\n                        📅 ሲስተም አውቶማቲክ የቀን መቁጠሪያ (Dual Calendar System)\n                      "
                          )}</span>
                          <h4 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 mt-1">
                            <CalendarDays className="w-5 h-5 text-indigo-600" />{tx(" የእለቱ ቀን መረጃ (Selected Attendance Date)\n                      ")}</h4>
                        </div>
                        
                        {/* Gregorian Date Selector */}
                        <div className="flex items-center gap-3">
                          <label className="text-xs font-black text-slate-700 whitespace-nowrap uppercase tracking-wider">{tx("ቀን ይምረጡ (Date):")}</label>
                          <input 
                            type="date"
                            value={selectedDateStr}
                            onChange={(e) => {
                              playInteractiveSound('click');
                              setSelectedDateStr(e.target.value);
                            }}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Dual Calendar Display */}
                      {(() => {
                        const parsedDate = new Date(selectedDateStr + 'T12:00:00');
                        const dualDate = getFormattedDualCalendarDate(parsedDate);
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                            {/* Gregorian Card */}
                            <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-50/10 border border-indigo-100/40 p-4 rounded-xl flex items-center gap-3.5 shadow-2xs">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black shadow-xs">
                                G
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-500">{tx("Gregorian Calendar (አውሮፓውያን)")}</p>
                                <p className="text-sm font-black text-slate-800">{dualDate.gc}</p>
                              </div>
                            </div>

                            {/* Ethiopian Card */}
                            <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-50/10 border border-emerald-100/40 p-4 rounded-xl flex items-center gap-3.5 shadow-2xs">
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-base shadow-xs">{tx("\n                            ኢ\n                          ")}</div>
                              <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">{tx("Ethiopian Calendar (በኢትዮጵያ አቆጣጠር)")}</p>
                                <p className="text-sm font-black text-slate-900">{dualDate.ec}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* PRINCIPAL ALL-CLASSES ATTENDANCE TRACKER BOARD */}
                    {currentUserRole === 'principal' && (
                      <div className="bg-white border border-slate-200/85 p-6 rounded-3xl shadow-xs space-y-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div className="space-y-1">
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border border-indigo-100/50">{tx(
                              "\n                          🕵️‍♂️ የርዕሰ መምህር የክትትል ሰሌዳ (Principal Attendance Monitor)\n                        "
                            )}</span>
                            <h4 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 mt-1">
                              <Users className="w-5 h-5 text-indigo-600" />{tx(" የክፍሎች አቴንዳንስ መከታተያ ሰሌዳ\n                        ")}</h4>
                            <p className="text-slate-400 text-xs font-medium">{tx("\n                          በዕለቱ ")}<span className="font-semibold text-slate-700">({selectedDateStr})</span>{tx(" የእያንዳንዱ ክፍል አቴንዳንስ መሙላቱን መከታተያ ሰሌዳ\n                        ")}</p>
                          </div>

                          {/* Header Actions: Print All classes summary report */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handlePrintAllClassesAttendance}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />{tx(" የሁሉንም ክፍል ሪፖርት አትም (Print Summary)\n                        ")}</button>
                          </div>
                        </div>

                        {/* Filters Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          {/* Search Class/Teacher */}
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-slate-400">🔍</span>
                            <input
                              type="text"
                              value={principalSearchQuery}
                              onChange={(e) => setPrincipalSearchQuery(e.target.value)}
                              placeholder={tx("በክፍል ወይም በኃላፊ መምህር ፈልግ...")}
                              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-extrabold outline-none shadow-3xs text-slate-800"
                            />
                          </div>

                          {/* Status Filter */}
                          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-3xs">
                            <span className="text-[10px] font-black text-slate-400 uppercase whitespace-nowrap">{tx("ሁኔታ (Status)፡")}</span>
                            <select
                              value={principalStatusFilter}
                              onChange={(e) => setPrincipalStatusFilter(e.target.value as any)}
                              className="w-full text-xs font-extrabold text-slate-700 bg-transparent outline-none cursor-pointer"
                            >
                              <option value="all">{tx("ሁሉንም ሁኔታዎች (All Statuses)")}</option>
                              <option value="taken">{tx("✅ ስም የተጠራበት (Complete)")}</option>
                              <option value="partial">{tx("⚠️ በከፊል የተጠራ (Partial)")}</option>
                              <option value="nottaken">{tx("❌ ስም ያልተጠራም (Not Taken)")}</option>
                            </select>
                          </div>

                          {/* Summary quick indicator info */}
                          <div className="flex items-center justify-end px-3 py-1.5 text-xs font-extrabold text-indigo-750 font-mono">{tx("\n                        የተገኙ ክፍሎች፡ ")}{filteredAllGradeSections.length} / {allGradeSections.length}
                          </div>
                        </div>

                        {/* Classes Grid Table */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
                          <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-slate-50/70 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                                <th className="p-3 w-12 text-center">{tx("ተ.ቁ")}</th>
                                <th className="p-3">{tx("ክፍል እና ሴክሽን")}</th>
                                <th className="p-3">{tx("የክፍል ኃላፊ መምህር")}</th>
                                <th className="p-3 text-center">{tx("አጠቃላይ ተማሪዎች")}</th>
                                <th className="p-3 text-center">{tx("ሁኔታ (Daily Status)")}</th>
                                <th className="p-3 text-center">{tx("የመገኘት ሬሾ (Stats)")}</th>
                                <th className="p-3 text-center">{tx("ተግባራት")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredAllGradeSections.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="p-8 text-center text-slate-400 italic text-xs">{tx(
                                    "\n                                🔍 ምንም ክፍል አልተገኘም (No matching classes found)\n                              "
                                  )}</td>
                                </tr>
                              ) : (
                                filteredAllGradeSections.map((comb, idx) => {
                                  const classStudents = students.filter(s => s.grade === comb.grade && s.section === comb.section);
                                  const dayRecord = dailyAttendance[selectedDateStr] || {};
                                  
                                  let present = 0;
                                  let absent = 0;
                                  let excused = 0;
                                  let unmarked = 0;
                                  classStudents.forEach(student => {
                                    const status = dayRecord[student.id];
                                    if (status === 'present') present++;
                                    else if (status === 'absent') absent++;
                                    else if (status === 'excused') excused++;
                                    else unmarked++;
                                  });

                                  const isCurrentSelected = selectedGrade === comb.grade && selectedSection === comb.section;
                                  const hrTeacher = teachers.find(t => t.isHomeroomTeacher && t.assignedClass === comb.grade && t.assignedSection === comb.section);
                                  const hrTeacherName = hrTeacher ? hrTeacher.name : tx("ያልተመደበ");

                                  let badge = (
                                    <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-black border border-rose-100 uppercase tracking-wide inline-flex items-center gap-1 shadow-3xs">{tx(
                                      "\n                                  🔴 ስም አልተጠራም\n                                "
                                    )}</span>
                                  );
                                  if (classStudents.length > 0) {
                                    if (unmarked === 0) {
                                      badge = (
                                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-black border border-emerald-100 uppercase tracking-wide inline-flex items-center gap-1 shadow-3xs">{tx(
                                          "\n                                      🟢 ስም ተጠርቷል\n                                    "
                                        )}</span>
                                      );
                                    } else if (unmarked < classStudents.length) {
                                      badge = (
                                        <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-black border border-amber-100 uppercase tracking-wide inline-flex items-center gap-1 shadow-3xs">{tx("\n                                      🟡 በከፊል የተጠራ (")}{classStudents.length - unmarked}/{classStudents.length})
                                        </span>
                                      );
                                    }
                                  } else {
                                    badge = (
                                      <span className="text-slate-400 italic text-xs">{tx("ምንም ተማሪ የለም")}</span>
                                    );
                                  }

                                  const totalFilled = classStudents.length - unmarked;
                                  const percent = classStudents.length > 0 ? Math.round((totalFilled / classStudents.length) * 100) : 0;

                                  return (
                                    <tr 
                                      key={comb.grade + '-' + comb.section} 
                                      className={`hover:bg-indigo-50/15 transition-all text-slate-850 ${isCurrentSelected ? 'bg-indigo-50/30 font-semibold' : ''}`}
                                    >
                                      <td className="p-3 text-center font-black text-slate-400 text-xs font-mono">{idx + 1}</td>
                                      <td className="p-3 font-extrabold text-slate-900">{comb.grade} - {comb.section}</td>
                                      <td className="p-3 text-xs font-semibold text-slate-600">{hrTeacherName}</td>
                                      <td className="p-3 text-center font-bold text-slate-700 font-mono text-xs">{classStudents.length}</td>
                                      <td className="p-3 text-center">{badge}</td>
                                      <td className="p-3 text-center">
                                        <div className="space-y-1 max-w-[120px] mx-auto">
                                          <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-500 font-mono">
                                            <span>P/A/E</span>
                                            <span>{present}/{absent}/{excused}</span>
                                          </div>
                                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full rounded-full transition-all duration-300 ${percent === 100 ? 'bg-emerald-500' : percent > 0 ? 'bg-amber-500' : 'bg-slate-200'}`}
                                              style={{ width: `${percent}%` }}
                                            />
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            playInteractiveSound('click');
                                            setSelectedGrade(comb.grade);
                                            setSelectedSection(comb.section);
                                          }}
                                          className={`px-3 py-1.5 text-[10px] font-black rounded-lg border transition-all active:scale-95 shadow-3xs cursor-pointer ${
                                            isCurrentSelected 
                                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
                                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300'
                                          }`}
                                        >{tx(
                                          "\n                                      ክፍሉን ይፈትሹ 🔍 (Inspect)\n                                    "
                                        )}</button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* PREMIUM ATTENDANCE STATISTICS DASHBOARD */}
                    {(() => {
                      const dayRecord = dailyAttendance[selectedDateStr] || {};
                      let presentCount = 0;
                      let absentCount = 0;
                      let excusedCount = 0;
                      filteredStudents.forEach(s => {
                        const stat = dayRecord[s.id];
                        if (stat === 'present') presentCount++;
                        else if (stat === 'absent') absentCount++;
                        else if (stat === 'excused') excusedCount++;
                      });
                      const totalCount = filteredStudents.length;
                      const unmarkedCount = totalCount - (presentCount + absentCount + excusedCount);
                      const completionRate = totalCount > 0 ? Math.round(((presentCount + excusedCount) / totalCount) * 100) : 0;

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* CARD 1: Total Students */}
                          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-2xs">
                              <Users className="w-6 h-6" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">{tx("የክፍሉ ተማሪዎች (Total)")}</p>
                              <h3 className="text-2xl font-black text-slate-900 leading-tight">{totalCount} <span className="text-xs font-bold text-slate-500">{tx("ተማሪዎች")}</span></h3>
                              <p className="text-[10px] text-slate-500 font-bold">{tx("ጠቅላላ የተመዘገቡ የክፍሉ ተማሪዎች")}</p>
                            </div>
                          </div>

                          {/* CARD 2: Present Today */}
                          <div className="bg-gradient-to-br from-white to-emerald-50/10 border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-600">{tx("ያሉ (Present)")}</p>
                                <h3 className="text-xl font-black text-emerald-800 leading-none">{presentCount} <span className="text-xs font-bold text-emerald-600">{tx("ተማሪ")}</span></h3>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>{tx("የመገኘት ሬሾ (Attendance Rate)")}</span>
                                <span className="text-emerald-700 font-black">{totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${totalCount > 0 ? (presentCount / totalCount) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* CARD 3: Absent Today */}
                          <div className="bg-gradient-to-br from-white to-rose-50/10 border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-2xs">
                                <XCircle className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-extrabold tracking-wider text-rose-500">{tx("የቀሩ (Absent)")}</p>
                                <h3 className="text-xl font-black text-rose-800 leading-none">{absentCount} <span className="text-xs font-bold text-rose-600">{tx("ተማሪ")}</span></h3>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>{tx("የመቅረት ሬሾ (Absence Rate)")}</span>
                                <span className="text-rose-700 font-black">{totalCount > 0 ? Math.round((absentCount / totalCount) * 100) : 0}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${totalCount > 0 ? (absentCount / totalCount) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* CARD 4: Excused & Pending */}
                          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between h-full">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase font-extrabold tracking-wider text-amber-600">{tx("ፈቃድ (Excused)")}</p>
                                  <h3 className="text-lg font-black text-slate-800 leading-none">{excusedCount} <span className="text-xs font-bold text-slate-500">{tx("ተማሪ")}</span></h3>
                                </div>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-500">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-slate-300"></span>{tx("\n                            ያልተሞላ (Pending): ")}<strong className="text-slate-700 font-black">{unmarkedCount}</strong>
                              </span>
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-black">{tx("\n                            አጠቃላይ ተሳታፊ፡ ")}{completionRate}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* BULK ACTIONS & SEARCH BAR */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-3xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-800 text-xs mr-1 uppercase tracking-wider">{tx("ፈጣን ተግባራት (Bulk Actions):")}</span>
                        <button
                          onClick={() => {
                            playInteractiveSound('success');
                            setDailyAttendance(prev => {
                              const dayRecord = prev[selectedDateStr] || {};
                              const updatedDayRecord = { ...dayRecord };
                              let tempExtra = { ...studentExtraInfo };
                              let extraUpdated = false;

                              filteredStudents.forEach(student => {
                                const prevStatus = updatedDayRecord[student.id];
                                if (prevStatus !== 'present') {
                                  updatedDayRecord[student.id] = 'present';
                                  if (prevStatus === 'absent') {
                                    const extra = tempExtra[student.id] || { conduct: 'A', absent: 0 };
                                    tempExtra[student.id] = {
                                      ...extra,
                                      absent: Math.max(0, extra.absent - 1)
                                    };
                                    extraUpdated = true;
                                  }
                                }
                              });

                              if (extraUpdated) {
                                setStudentExtraInfo(tempExtra);
                                localStorage.setItem('studentExtraInfo', JSON.stringify(tempExtra));
                              }

                              const updated = {
                                ...prev,
                                [selectedDateStr]: updatedDayRecord
                              };
                              localStorage.setItem('dailyAttendance', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-100" />{tx(" ሁሉንም የመጡ አድርግ (Mark All Present)\n                    ")}</button>

                        {/* BULK EXCUSED BUTTON (ሁሉንም በፈቃድ መዝግብ) */}
                        <button
                          onClick={() => {
                            playInteractiveSound('click');
                            setDailyAttendance(prev => {
                              const dayRecord = prev[selectedDateStr] || {};
                              const updatedDayRecord = { ...dayRecord };
                              let tempExtra = { ...studentExtraInfo };
                              let extraUpdated = false;

                              filteredStudents.forEach(student => {
                                const prevStatus = updatedDayRecord[student.id];
                                if (prevStatus !== 'excused') {
                                  updatedDayRecord[student.id] = 'excused';
                                  if (prevStatus === 'absent') {
                                    const extra = tempExtra[student.id] || { conduct: 'A', absent: 0 };
                                    tempExtra[student.id] = {
                                      ...extra,
                                      absent: Math.max(0, extra.absent - 1)
                                    };
                                    extraUpdated = true;
                                  }
                                }
                              });

                              if (extraUpdated) {
                                setStudentExtraInfo(tempExtra);
                                localStorage.setItem('studentExtraInfo', JSON.stringify(tempExtra));
                              }

                              const updated = {
                                ...prev,
                                [selectedDateStr]: updatedDayRecord
                              };
                              localStorage.setItem('dailyAttendance', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-lg transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-100" />{tx(" ሁሉንም በፈቃድ አድርግ (Mark All Excused)\n                    ")}</button>

                        <button
                          onClick={() => {
                            if (confirm(tx(
                              "የዕለቱን የአቴንዳንስ መረጃ ማጽዳት ይፈልጋሉ? (Are you sure you want to clear attendance for this date?)"
                            ))) {
                              playInteractiveSound('success');
                              setDailyAttendance(prev => {
                                const dayRecord = prev[selectedDateStr] || {};
                                let tempExtra = { ...studentExtraInfo };
                                let extraUpdated = false;

                                Object.keys(dayRecord).forEach(studentId => {
                                  if (dayRecord[studentId] === 'absent') {
                                    const extra = tempExtra[studentId] || { conduct: 'A', absent: 0 };
                                    tempExtra[studentId] = {
                                      ...extra,
                                      absent: Math.max(0, extra.absent - 1)
                                    };
                                    extraUpdated = true;
                                  }
                                });

                                if (extraUpdated) {
                                  setStudentExtraInfo(tempExtra);
                                  localStorage.setItem('studentExtraInfo', JSON.stringify(tempExtra));
                                }

                                const updated = { ...prev };
                                delete updated[selectedDateStr];
                                localStorage.setItem('dailyAttendance', JSON.stringify(updated));
                                return updated;
                              });
                            }
                          }}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-extrabold rounded-lg transition-all border border-slate-200 shadow-3xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-slate-500" />{tx(" የዕለቱን መረጃ አጽዳ (Clear Day's Records)\n                    ")}</button>
                      </div>

                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest bg-slate-200/50 px-2.5 py-1 rounded-md">{tx("\n                    ክፍል: ")}{selectedGrade} {selectedSection}
                      </span>
                    </div>

                    {/* THE ATTENDANCE TABLE */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse min-w-[750px]">
                          <thead>
                            <tr className="bg-slate-50/85 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                              <th className="p-4 w-14 text-center sticky-col-0">{tx("ተ.ቁ (No.)")}</th>
                              <th className="p-4 w-28 sticky-col-1">{tx("ID (መታወቂያ)")}</th>
                              <th className="p-4 sticky-col-2">{tx("የተማሪ ሙሉ ስም (Student Full Name)")}</th>
                              <th className="p-4 w-24 text-center">{tx("ጾታ (Gender)")}</th>
                              <th className="p-4 w-44 text-center">{tx("አጠቃላይ ቀሪ / ፈቃድ (Absences / Excused)")}</th>
                              <th className="p-4 w-80 text-center">{tx("የዕለቱ መከታተያ (Daily Status Selector)")}</th>
                              <th className="p-4 w-44 text-center">{tx("የእለቱ ደረጃ (Status Label)")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student, idx) => {
                              const extra = studentExtraInfo[student.id] || { conduct: 'A', absent: 0 };
                              const todayRecord = dailyAttendance[selectedDateStr] || {};
                              const currentStatus = todayRecord[student.id]; // undefined | 'present' | 'absent' | 'excused'

                              // Count student's total excused days across all recorded dates
                              const totalExcusedDays = Object.values(dailyAttendance).filter(
                                dayRec => dayRec && dayRec[student.id] === 'excused'
                              ).length;

                              return (
                                <tr key={student.id} className="group hover:bg-slate-50/50 text-slate-800 transition-colors">
                                  <td className="p-4 text-center font-black text-slate-400 font-mono text-xs sticky-col-0 bg-slate-50/10">
                                    {getStudentRollNumber(student.id)}
                                  </td>
                                  <td className="p-4 font-mono text-xs font-bold text-slate-600 sticky-col-1">{student.id}</td>
                                  <td className="p-4 sticky-col-2 border-r border-slate-100">
                                    <span className="font-extrabold text-slate-900 block font-sans tracking-tight">{student.name}</span>
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Grade {student.grade} • Section {student.section}</span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={'px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide border ' + (
                                      student.gender === 'M' || student.gender === 'Male'
                                        ? 'bg-blue-50 text-blue-700 border-blue-100/50' 
                                        : 'bg-rose-50 text-rose-700 border-rose-100/50'
                                    )}>
                                      {student.gender === 'M' || student.gender === 'Male' ? tx("ወንድ") : tx("ሴት")}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center font-bold">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                                        extra.absent > 0 
                                          ? 'bg-rose-50 text-rose-800 border-rose-200/50' 
                                          : 'bg-slate-50 text-slate-500 border-slate-200'
                                      }`}>
                                        {extra.absent}{tx(" ቀን ቀርቷል")}
                                      </span>
                                      {totalExcusedDays > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200/60">
                                          {totalExcusedDays}{tx(" ቀን ፈቃድ (Excused)")}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* ATTENDANCE INTERACTIVE BUTTONS */}
                                  <td className="p-4 text-center">
                                   <div className="flex items-center justify-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/40 w-fit mx-auto gap-1">
                                     {/* PRESENT BUTTON (✔ ራይ) */}
                                     <button
                                       disabled={currentUserRole !== 'teacher' || !isCurrentHomeroomTeacher}
                                       onClick={() => {
                                         playInteractiveSound('success');
                                         handleMarkAttendance(student.id, 'present');
                                       }}
                                       className={`px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                         currentStatus === 'present'
                                           ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-105 border border-emerald-500'
                                           : 'hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-transparent'
                                       }`}
                                       title={tx("መጥቷል (✔ Present)")}
                                     >
                                       <Check className="w-3.5 h-3.5 font-black" />
                                       <span>{tx("ያለ (✔)")}</span>
                                     </button>

                                     {/* ABSENT BUTTON (✘ ኤክስ) */}
                                     <button
                                       disabled={currentUserRole !== 'teacher' || !isCurrentHomeroomTeacher}
                                       onClick={() => {
                                         playInteractiveSound('wrong');
                                         handleMarkAttendance(student.id, 'absent');
                                       }}
                                       className={`px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                         currentStatus === 'absent'
                                           ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 scale-105 border border-rose-500'
                                           : 'hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-transparent'
                                       }`}
                                       title={tx("ቀርቷል (✘ Absent)")}
                                     >
                                       <X className="w-3.5 h-3.5 font-black" />
                                       <span>{tx("የለለ (✘)")}</span>
                                     </button>

                                     {/* EXCUSED BUTTON (📝 ፈቃድ) */}
                                     <button
                                       disabled={currentUserRole !== 'teacher' || !isCurrentHomeroomTeacher}
                                       onClick={() => {
                                         playInteractiveSound('click');
                                         handleMarkAttendance(student.id, 'excused');
                                       }}
                                       className={`px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                         currentStatus === 'excused'
                                           ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-105 border border-amber-500'
                                           : 'hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-transparent'
                                       }`}
                                       title={tx("ፈቃድ (📝 Excused)")}
                                     >
                                       <FileText className="w-3.5 h-3.5" />
                                       <span>{tx("ፈቃድ (📝)")}</span>
                                     </button>
                                   </div>
                                 </td>

                                  {/* STATUS BADGE/INDICATOR */}
                                  <td className="p-4 text-center">
                                    <span className={`text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 ${
                                      currentStatus === 'present' ? 'text-emerald-600' :
                                      currentStatus === 'absent' ? 'text-rose-600 font-extrabold animate-pulse' :
                                      currentStatus === 'excused' ? 'text-amber-600 font-extrabold' : 'text-slate-400 italic font-bold'
                                    }`}>
                                      {currentStatus === 'present' && (
                                        <>
                                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{tx(
                                          "\n                                      ✓ ያለ (Present)\n                                    "
                                        )}</>
                                      )}
                                      {currentStatus === 'absent' && (
                                        <>
                                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>{tx(
                                          "\n                                      ✗ የለለ (Absent)\n                                    "
                                        )}</>
                                      )}
                                      {currentStatus === 'excused' && (
                                        <>
                                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>{tx(
                                          "\n                                      ✏ ፈቃድ (Excused)\n                                    "
                                        )}</>
                                      )}
                                      {!currentStatus && tx("ያልተሞላ (No Entry)")}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeSubTab === 'student-registration' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Register Student Form */}
                    <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-xs">
                      <div>
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">{tx("የክፍል ኃላፊ መምህር ተግባር")}</span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
                          <PlusCircle className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />{tx(" አዲስ ተማሪ ይመዝግቡ\n                    ")}</h3>
                        <p className="text-slate-400 dark:text-slate-400 text-xs mt-0.5">Register a New Student and Assign Class/Section</p>
                      </div>

                      {regSuccessMsg && (
                        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 text-xs font-semibold rounded-xl animate-pulse">
                          {regSuccessMsg}
                        </div>
                      )}

                      <form onSubmit={handleRegisterStudent} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">{tx("የተማሪው ሙሉ ስም (Student Full Name):")}</label>
                          <input 
                            type="text"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder={tx("መላኩ ገብሬ")}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800 dark:text-white"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">{tx("ክፍል (Grade):")}</label>
                            <select 
                              value={newStudentGrade || (selectedGrade === 'All' ? (currentTeacher?.assignedClass || 'Grade 1') : selectedGrade)}
                              onChange={(e) => setNewStudentGrade(e.target.value)}
                              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                            >
                              {(schoolConfig?.schoolLevel === 'secondary' 
                                  ? ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] 
                                  : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8']).map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">{tx("ሴክሽን (Sec):")}</label>
                            <select 
                              value={newStudentSection || (selectedSection === 'All' ? (currentTeacher?.assignedSection || 'A') : selectedSection)}
                              onChange={(e) => setNewStudentSection(e.target.value)}
                              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                            >
                              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">{tx("ጾታ (Gender):")}</label>
                            <select 
                              value={newStudentGender}
                              onChange={(e) => setNewStudentGender(e.target.value as any)}
                              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                            >
                              <option value="Male">{tx("ወንድ (M)")}</option>
                              <option value="Female">{tx("ሴት (F)")}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">{tx("ዕድሜ (Age):")}</label>
                            <input 
                              type="number"
                              min="4"
                              max="25"
                              value={newStudentAge}
                              onChange={(e) => setNewStudentAge(e.target.value)}
                              placeholder="14"
                              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800 dark:text-white font-medium"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">{tx("የወላጅ ኢሜል (Parent Email - Optional):")}</label>
                            <input 
                              type="email"
                              value={newStudentParentEmail}
                              onChange={(e) => setNewStudentParentEmail(e.target.value)}
                              placeholder="parent@school.com"
                              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">{tx("ይህንን ኢሜል በመጠቀም ወላጅ ሲገባ የልጁን ውጤት ያለምንም መታወቂያ እንዲያይ ይደረጋል።")}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">{tx("የወላጅ ስልክ ቁጥር (Parent Phone - Required):")}</label>
                            <input 
                              type="tel"
                              value={newStudentParentPhone}
                              onChange={(e) => setNewStudentParentPhone(e.target.value)}
                              placeholder="0912345678"
                              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800 dark:text-white font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">{tx("አድራሻ (Address - Optional):")}</label>
                            <input 
                              type="text"
                              value={newStudentAddress}
                              onChange={(e) => setNewStudentAddress(e.target.value)}
                              placeholder={tx("አዲስ አበባ፣ ኢትዮጵያ")}
                              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">{tx("የፋይዳ መታወቂያ (Student FAN/FIN - Optional):")}</label>
                            <input 
                              type="text"
                              value={newStudentDigitalId}
                              onChange={(e) => setNewStudentDigitalId(e.target.value)}
                              placeholder="DIG-12345"
                              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >{tx(
                          "\n                      ➕ ተማሪ መዝግብ (Register Student)\n                    "
                        )}</button>
                      </form>
                    </div>

                    {/* Registered Students List Table */}
                    <div className="lg:col-span-7 bg-white/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-xs">
                      <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                            <Users className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />{tx(" በክፍልዎ የተመዘገቡ ተማሪዎች\n                      ")}</h3>
                          <p className="text-slate-400 dark:text-slate-400 text-xs mt-0.5">Students currently registered in your advisor class</p>
                        </div>
                        <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">{tx("\n                      ጠቅላላ፡ ")}{filteredStudents.length}{tx(" ተማሪዎች\n                    ")}</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-black border-b border-slate-200 dark:border-slate-800">
                              <th className="p-3 w-12 text-center">{tx("ተ.ቁ (No.)")}</th>
                              <th className="p-3">{tx("ተማሪ (Student)")}</th>
                              <th className="p-3 text-center">{tx("ጾታ (Gender)")}</th>
                              <th className="p-3">{tx("ወላጅ ኢሜል (Parent Email)")}</th>
                              <th className="p-3">{tx("መታወቂያ (ID)")}</th>
                              <th className="p-3 text-center">{tx("እርምጃዎች")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredStudents.map((s) => (
                              <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-3 text-center font-black text-slate-500 dark:text-slate-400 font-mono text-xs bg-slate-50/40 dark:bg-slate-800/30">
                                  {getStudentRollNumber(s.id)}
                                </td>
                                <td className="p-3 font-bold text-slate-900 dark:text-white">{s.name}</td>
                                <td className="p-3 text-center">
                                  <span className={'px-2 py-0.5 rounded text-[9px] font-bold ' + (s.gender === 'Male' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' : 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300')}>
                                    {s.gender === 'Male' ? tx("ወንድ") : tx("ሴት")}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[10px]">{s.parentEmail || '-'}</td>
                                <td className="p-3 font-mono font-black text-emerald-700 dark:text-white tracking-wider text-[11px]">{s.id}</td>
                                <td className="p-3 text-center">
                                  <div className="flex justify-center items-center gap-1.5">
                                    {onShowStudentQR && (
                                      <button
                                        onClick={() => {
                                          playInteractiveSound('click');
                                          onShowStudentQR(s);
                                        }}
                                        className="p-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-600 dark:text-amber-400 rounded-lg transition-colors cursor-pointer"
                                        title={tx("የQR መታወቂያ አውጣ (Generate QR Code Card)")}
                                      >
                                        <QrCode className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleOpenEditStudent(s)}
                                      className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                                      title={tx("ማስተካከል (Edit)")}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenDeleteStudent(s)}
                                      className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                      title={tx("ማጥፋት (Delete)")}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                              <tr>
                                <td colSpan={6} className="text-center p-8 text-slate-400 dark:text-slate-500 italic">{tx(
                                  "\n                              በዚህ ክፍል የተመዘገበ ተማሪ የለም (No students registered yet)\n                            "
                                )}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Simulated Parent Email Notification Outbox */}
                    <div className="lg:col-span-12 mt-2">
                      <SimulatedEmailOutbox />
                    </div>
                  </div>
                )}

              </>
            )}
          </div>

          {/* ================= STUDENT REPORT CARD POPUP MODAL ================= */}
          {selectedCardStudentId && (() => {
            const cardStudent = students.find(s => s.id === selectedCardStudentId);
            if (!cardStudent) return null;

            const rosterItem = studentRosterData.find(item => item.student.id === selectedCardStudentId) || {
              student: cardStudent,
              subjectGrades: {},
              totalSum: 0,
              gradedCount: 0,
              average: 0,
              conduct: 'A',
              absent: 0,
              rank: null
            };

            const isHonorRoll = rosterItem.average >= 90;
            const cardPass = isStudentPassing(rosterItem);

            const isSemester = schoolConfig?.evaluationMode === 'semester';

            const getStudentGradeForTerm = (studentId: string, sub: string, termNum: number) => {
              const g = grades.find(grade => grade.studentId === studentId && grade.subject === sub && (grade.term || 1) === termNum);
              return g ? g.total : null;
            };

            const getSubjectSem1Avg = (studentId: string, sub: string) => {
              if (isSemester) {
                return getStudentGradeForTerm(studentId, sub, 1);
              } else {
                const q1 = getStudentGradeForTerm(studentId, sub, 1);
                const q2 = getStudentGradeForTerm(studentId, sub, 2);
                if (q1 !== null && q2 !== null) return Math.round((q1 + q2) / 2);
                if (q1 !== null) return q1;
                if (q2 !== null) return q2;
                return null;
              }
            };

            const getSubjectSem2Avg = (studentId: string, sub: string) => {
              if (isSemester) {
                return getStudentGradeForTerm(studentId, sub, 2);
              } else {
                const q3 = getStudentGradeForTerm(studentId, sub, 3);
                const q4 = getStudentGradeForTerm(studentId, sub, 4);
                if (q3 !== null && q4 !== null) return Math.round((q3 + q4) / 2);
                if (q3 !== null) return q3;
                if (q4 !== null) return q4;
                return null;
              }
            };

            const getSubjectAnnualAvg = (studentId: string, sub: string) => {
              const s1 = getSubjectSem1Avg(studentId, sub);
              const s2 = getSubjectSem2Avg(studentId, sub);
              if (s1 !== null && s2 !== null) return Math.round((s1 + s2) / 2);
              if (s1 !== null) return s1;
              if (s2 !== null) return s2;
              return null;
            };

            const getStudentSem1Average = (studentId: string) => {
              let sum = 0;
              let count = 0;
              subjects.forEach(sub => {
                const val = getSubjectSem1Avg(studentId, sub);
                if (val !== null) {
                  sum += val;
                  count++;
                }
              });
              return count > 0 ? Math.round(sum / count) : null;
            };

            const getStudentSem2Average = (studentId: string) => {
              let sum = 0;
              let count = 0;
              subjects.forEach(sub => {
                const val = getSubjectSem2Avg(studentId, sub);
                if (val !== null) {
                  sum += val;
                  count++;
                }
              });
              return count > 0 ? Math.round(sum / count) : null;
            };

            const classAverageVal = studentRosterData.length > 0
              ? Math.round(studentRosterData.reduce((acc, curr) => acc + curr.average, 0) / studentRosterData.length)
              : 0;

            const getStudentSem1Rank = (studentId: string) => {
              const allAverages = students
                .filter(s => s.grade === cardStudent.grade && s.section === selectedSection)
                .map(s => ({
                  id: s.id,
                  avg: getStudentSem1Average(s.id)
                }))
                .filter(x => x.avg !== null) as { id: string; avg: number }[];
              
              const sorted = [...allAverages].sort((a, b) => b.avg - a.avg);
              const idx = sorted.findIndex(x => x.id === studentId);
              return idx !== -1 ? (idx + 1) : '-';
            };

            const getStudentSem2Rank = (studentId: string) => {
              const allAverages = students
                .filter(s => s.grade === cardStudent.grade && s.section === selectedSection)
                .map(s => ({
                  id: s.id,
                  avg: getStudentSem2Average(s.id)
                }))
                .filter(x => x.avg !== null) as { id: string; avg: number }[];
              
              const sorted = [...allAverages].sort((a, b) => b.avg - a.avg);
              const idx = sorted.findIndex(x => x.id === studentId);
              return idx !== -1 ? (idx + 1) : '-';
            };

            // Function to calculate rank for each subject dynamically based on the term
            const getSubjectRankAndTotalForTerm = (subject: string, studentId: string, term: number | 'annual') => {
              const targetGrade = cardStudent.grade;
              const classGrades = students
                .filter(s => s.grade === targetGrade && s.section === selectedSection)
                .map(s => {
                  if (term === 'annual') {
                    const termScores = grades
                      .filter(g => g.studentId === s.id && g.subject === subject)
                      .map(g => g.total);
                    const avg = termScores.length > 0 ? Math.round(termScores.reduce((a, b) => a + b, 0) / termScores.length) : null;
                    return { studentId: s.id, score: avg };
                  } else {
                    const g = grades.find(g => g.studentId === s.id && g.subject === subject && (g.term || 1) === term);
                    return { studentId: s.id, score: g ? g.total : null };
                  }
                })
                .filter(item => item.score !== null) as { studentId: string; score: number }[];

              const sorted = [...classGrades].sort((a, b) => b.score - a.score);
              const idx = sorted.findIndex(item => item.studentId === studentId);
              return {
                rank: idx !== -1 ? idx + 1 : '-',
                totalInClass: sorted.length
              };
            };

            const getStudentAverageForTerm = (studentId: string, term: number) => {
              let sum = 0;
              let count = 0;
              subjects.forEach(sub => {
                const g = grades.find(g => g.studentId === studentId && g.subject === sub && (g.term || 1) === term);
                if (g) {
                  sum += g.total;
                  count++;
                }
              });
              return count > 0 ? Math.round(sum / count) : null;
            };

            const getTeacherNameAndSigForSubject = (sub: string) => {
              const mapping: { [key: string]: { name: string; sig: string } } = {
                'Mathematics': { name: tx("አቶ ግርማ በየነ (G. Beyene)"), sig: 'Girma_B' },
                'English': { name: tx("ወ/ሮ ዘነበች አበራ (Z. Abera)"), sig: 'Zenebech.A' },
                'Amharic': { name: tx("አቶ ተክሌ ወልዴ (T. Welde)"), sig: 'Tekle_W' },
                'Science': { name: tx("ዶ/ር በረከት አሰፋ (B. Assefa)"), sig: 'Bereket.As' },
                'Social Studies': { name: tx("ወ/ሪት አልማዝ ከበደ (A. Kebede)"), sig: 'Almaz_K' },
                'Citizenship Education': { name: tx("አቶ ሙሉጌታ አዱኛ (M. Adunya)"), sig: 'Mulugeta.A' },
                'ICT': { name: tx("አቶ ዮናስ በቀለ (Y. Bekele)"), sig: 'Yonas_B' }
              };
              return mapping[sub] || { name: tx("መምህር (Subject Teacher)"), sig: 'Signed' };
            };

            return createPortal(
              <div id="print-report-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header Controls */}
                  {isPdfDownloadPreview ? (
                    <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 no-print">
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                          <FileText className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <span className="font-extrabold text-white text-sm block">{tx("የሚወረደው የካርድ ቅድመ-ዕይታ (PDF Download Preview)")}</span>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{tx(
                            "ይህ ገፅ ወደ ፒዲኤፍ የሚቀየረው ትክክለኛው የካርድ ቅጽ ነው። (Exact document view for PDF export)"
                          )}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {pdfError && (
                          <span className="text-rose-400 text-[11px] font-bold bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 mr-2 animate-pulse">
                            ⚠️ {pdfError}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            playInteractiveSound('click');
                            setIsPdfDownloadPreview(false);
                          }}
                          className="px-4 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 text-xs font-black rounded-lg transition-all flex items-center gap-1.5"
                        >
                          <ChevronLeft className="w-4 h-4" />{tx(" ወደ ኋላ ተመለስ (Back)\n                    ")}</button>
                        <button
                          disabled={isGeneratingPDF}
                          onClick={() => {
                            exportElementToPDF('report-card-print-area', 'Student_Report_' + (selectedCardStudentId || 'Card'), 'landscape');
                          }}
                          className={`px-5 py-1.5 text-white text-xs font-black rounded-lg shadow-md flex items-center gap-1.5 border border-transparent transition-all duration-300 ${
                            isGeneratingPDF 
                              ? 'bg-slate-500 cursor-not-allowed opacity-75 animate-pulse' 
                              : showPdfSuccess
                              ? 'bg-emerald-500 ring-2 ring-emerald-300 scale-105'
                              : 'bg-emerald-600 hover:bg-emerald-700 hover:border-emerald-500 active:scale-95'
                          }`}
                        >
                          {isGeneratingPDF ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>{tx(
                              "\n                          በመዘጋጀት ላይ... (Generating PDF...)\n                        "
                            )}</>
                          ) : showPdfSuccess ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white animate-bounce" />{tx(" በተሳካ ሁኔታ ተዘጋጅቷል! (Success!)\n                        ")}</>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />{tx(" ፒዲኤፉን አስቀምጥ (Save as PDF)\n                        ")}</>
                          )}
                        </button>
                        <button
                          disabled={isGeneratingPDF}
                          onClick={() => {
                            playInteractiveSound('click');
                            setSelectedCardStudentId(null);
                            setIsPdfDownloadPreview(false);
                          }}
                          className={`p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
                            isGeneratingPDF ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col gap-2 shrink-0 no-print">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-indigo-600" />
                          <span className="font-extrabold text-slate-800 text-sm">{tx("የተማሪ ውጤት ካርድ ማመንጫ (Report Card Generator)")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={isGeneratingPDF}
                            onClick={() => {
                              playInteractiveSound('click');
                              setIsPdfDownloadPreview(true);
                              setPreviewViewType('card');
                            }}
                            className="px-4 py-1.5 text-white text-xs font-black rounded-lg shadow-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all duration-300"
                          >
                            <Printer className="w-3.5 h-3.5" />{tx(" ካርዱን በPDF አውርድ (Download PDF A4)\n                      ")}</button>
                          <button
                            disabled={isGeneratingPDF}
                            onClick={() => {
                              setPdfError(null);
                              playInteractiveSound('success');
                              setPreviewViewType('card');
                              setTimeout(() => {
                                window.print();
                              }, 150);
                            }}
                            className={`px-4 py-1.5 text-white text-xs font-black rounded-lg shadow-xs flex items-center gap-1.5 transition-all duration-300 ${
                              isGeneratingPDF 
                                ? 'bg-slate-400 cursor-not-allowed opacity-50' 
                                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                            }`}
                          >
                            <Printer className="w-3.5 h-3.5" />{tx(" ካርዱን አትም (Print Card)\n                      ")}</button>
                          <button
                            disabled={isGeneratingPDF}
                            onClick={() => {
                              playInteractiveSound('click');
                              setSelectedCardStudentId(null);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isGeneratingPDF 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">{tx("ቀጥታ እይታ (Live Preview):")}</span>
                          <div className="inline-flex rounded-lg p-0.5 bg-slate-200/80">
                            <button
                              type="button"
                              onClick={() => { playInteractiveSound('click'); setPreviewViewType('card'); }}
                              className={`px-3 py-1.5 text-[11px] font-black rounded-md transition-all flex items-center gap-1 ${
                                previewViewType === 'card'
                                  ? 'bg-white text-indigo-900 shadow-xs'
                                  : 'text-slate-600 hover:text-slate-850'
                              }`}
                            >
                              <Award className="w-3.5 h-3.5" />{tx(" ካርድ (Card View)\n                        ")}</button>
                            <button
                              type="button"
                              onClick={() => { playInteractiveSound('click'); setPreviewViewType('list'); }}
                              className={`px-3 py-1.5 text-[11px] font-black rounded-md transition-all flex items-center gap-1 ${
                                previewViewType === 'list'
                                  ? 'bg-white text-indigo-900 shadow-xs'
                                  : 'text-slate-600 hover:text-slate-850'
                              }`}
                            >
                              <List className="w-3.5 h-3.5" />{tx(" ዝርዝር (List View)\n                        ")}</button>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 font-mono">
                          {previewViewType === 'card' ? 'A4 landscape sheet styling' : 'Scrollable item list styling'}
                        </span>
                      </div>
                      {/* Fallback Help notice box for Report Card */}
                      <div className="bg-amber-50 border border-amber-200 px-3.5 py-2.5 rounded-xl text-slate-800 text-[11px] leading-relaxed print:hidden flex items-start gap-2 shadow-2xs mt-1.5">
                        <span className="text-sm">💡</span>
                        <div>
                          <span className="font-extrabold text-amber-950">{tx("ተግባራዊ መመሪያ (Help): ")}</span>{tx("\n                      \"ካርዱን በPDF አውርድ\" የሚለው ካልሰራ፣ ")}<strong>{tx("\"ካርዱን አትም\" (Print)")}</strong>{tx(" የሚለውን ተጭነው ")}<strong>"Save as PDF"</strong>{tx(" በመምረጥ ማውረድ ይችላሉ።\n                    ")}</div>
                      </div>
                      {pdfError && (
                        <div className="text-right text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 self-end animate-pulse">
                          ⚠️ {pdfError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scrollable Printable Card Box */}
                  <div className={`overflow-y-auto p-6 flex-1 transition-all duration-300 ${isPdfDownloadPreview ? 'bg-slate-900 scrollbar-thin' : 'bg-slate-100'}`}>
                    
                    {/* Print Template Wrapper */}
                    <div 
                      id="report-card-print-area" 
                      className="w-full text-slate-900 font-sans select-none transition-all duration-300"
                    >
                      {/* Dynamic CSS Print Stylesheet injected dynamically specifically for single A4 Landscape page fitting */}
                      <style dangerouslySetInnerHTML={{__html: `
                        @media print {
                          @page {
                            size: landscape !important;
                            margin: 0 !important;
                          }
                          #root {
                            display: none !important;
                            height: 0 !important;
                            overflow: hidden !important;
                            visibility: hidden !important;
                          }
                          html, body, #print-report-modal, #print-report-modal > div, .overflow-y-auto, .flex-1 {
                            overflow: visible !important;
                            height: auto !important;
                            max-height: none !important;
                            display: block !important;
                            position: relative !important;
                            background: transparent !important;
                            box-shadow: none !important;
                            border: none !important;
                            flex: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                          }
                          .no-print {
                            display: none !important;
                            visibility: hidden !important;
                          }
                          #print-report-modal {
                            z-index: 9999999 !important;
                          }
                          #report-card-print-area {
                            display: block !important;
                            width: 100% !important;
                            max-width: 275mm !important;
                            height: auto !important;
                            background: transparent !important;
                            border: none !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin: 0 auto !important;
                          }
                          .report-card-page {
                            display: flex !important;
                            flex-direction: row !important;
                            width: 100% !important;
                            max-width: 275mm !important;
                            height: 190mm !important; /* Extremely safe for landscape A4 & Letter printing without blank overflow pages */
                            min-height: 190mm !important;
                            max-height: 190mm !important;
                            box-sizing: border-box !important;
                            padding: 3.5mm 5mm !important;
                            margin: 0 auto !important;
                            box-shadow: none !important;
                            border: 5px double #854d0e !important;
                            border-radius: 4px !important;
                            background-color: #faf8f2 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            page-break-after: always !important;
                            break-after: page !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            overflow: hidden !important;
                            position: relative !important;
                          }
                          .report-card-page:last-child {
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                            margin-bottom: 0 !important;
                            margin-top: 0 !important;
                          }
                          /* Professional running header for printed report card pages */
                          .report-card-print-header {
                            display: flex !important;
                            align-items: center !important;
                            justify-content: space-between !important;
                            border-bottom: 1.5px solid #854d0e !important;
                            padding-bottom: 2px !important;
                            margin-bottom: 4px !important;
                            width: 100% !important;
                            color: #1e1b4b !important;
                            font-size: 8.5px !important;
                            font-weight: 800 !important;
                          }
                          /* Explicit automatic section page-break rule */
                          .report-card-section-break {
                            page-break-before: always !important;
                            break-before: page !important;
                          }
                        }
                      `}} />

                      {/* Card View Layout Container */}
                      <div className={previewViewType === 'card' ? 'block space-y-8' : 'hidden'}>
                        
                        {/* PAGE 1: OUTER SIDE (የውጭው ገጽ - የፊትና የጀርባ ሽፋን) */}
                        <div 
                          id="report-card-print-area-front" 
                          className="report-card-page bg-[#faf8f2] p-5 md:p-6 w-full max-w-[1120px] aspect-[297/210] min-h-[824px] mx-auto shadow-2xl rounded-2xl border-4 md:border-6 border-double border-amber-800 text-slate-900 relative overflow-hidden flex flex-row gap-8 transition-all duration-300"
                        >
                          {/* Watermark Logo Backing (Cover Side only, center of right half) */}
                          <div className="absolute top-0 bottom-0 right-0 left-1/2 flex items-center justify-center opacity-[0.025] pointer-events-none select-none">
                            {schoolConfig?.logoImage ? (
                              <img src={schoolConfig.logoImage} alt="" className="w-64 h-64 object-contain opacity-20 grayscale" />
                            ) : (
                              <GraduationCap className="w-64 h-64 text-amber-900" />
                            )}
                          </div>

                          {/* Left Half: BACK COVER (የጀርባ ሽፋን) */}
                          <div className="w-1/2 flex flex-col justify-between pr-4 border-r-2 border-dashed border-amber-800/30 text-slate-900 relative h-full">
                            <div className="space-y-1.5 text-left">
                              {/* Marking Scheme Section */}
                              <div className="border-b border-amber-800/20 pb-1">
                                <h3 className="text-[12.5px] font-black text-amber-900 uppercase tracking-wider font-display">{tx(
                                  "\n                              የውጤት መግለጫና የማርክ አሰጣጥ ደንብ\n                            "
                                )}</h3>
                                <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide -mt-0.5 font-mono">
                                  METHOD OF MARKING & GRADING SYSTEM
                                </p>
                              </div>
                              
                              {/* Dotted leaders for official rules */}
                              <div className="border-2 border-double border-amber-800/20 p-2 bg-white/60 rounded-xl space-y-0.5 shadow-xs">
                                <div className="flex items-center justify-between text-[11px] font-black text-indigo-950">
                                  <span>90% - 100%</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 mx-2"></span>
                                  <span className="text-emerald-850">{tx("እጅግ በጣም ጥሩ (Excellent)")}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-black text-indigo-900">
                                  <span>80% - 89%</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 mx-2"></span>
                                  <span className="text-indigo-850">{tx("በጣም ጥሩ (Very Good)")}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-black text-indigo-800">
                                  <span>60% - 79%</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 mx-2"></span>
                                  <span className="text-slate-800">{tx("ጥሩ (Good)")}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-black text-slate-800">
                                  <span>50% - 59%</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 mx-2"></span>
                                  <span className="text-amber-800">{tx("በቂ (Satisfactory)")}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-black text-rose-850">
                                  <span>{tx("ከ 50% በታች")}</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 mx-2"></span>
                                  <span className="text-rose-700">{tx("ዝቅተኛ (Needs Support)")}</span>
                                </div>
                              </div>

                              {/* Official Guidance Text inside a warning box */}
                              <div className="bg-amber-50/50 border border-amber-800/10 p-1.5 rounded-lg text-[9px] text-slate-750 leading-normal space-y-0.5 text-justify shadow-2xs">
                                <p className="font-bold">
                                  ⚠️ <span className="text-amber-900">{tx("ማስታወሻ፡")}</span>{tx(
                                  " ማንኛውም ተማሪ ዜሮ (0) ማርክ ሊሰጠው አይገባም። ምክንያቱም ተማሪው ምንም ዓይነት ሥራ አልሠራም ማለት ስለሆነ። ተማሪው በትምህርት ቀናት በሙሉ ካልተገኘና የተሰጡትንም ሥራዎች ካልሠራ \"Ab\" (Absent) ተብሎ ይጻፋል::\n                            "
                                )}</p>
                                <p className="italic text-slate-500 font-bold text-[8.5px]">
                                  Note: A mark Zero (0) should never be given. If a student has been absent from class for the whole period covered and has not made any of the work, they should be marked "Ab".
                                </p>
                              </div>

                              {/* Parent engagement Notice */}
                              <div className="space-y-0.5">
                                <h4 className="text-[11.5px] font-black text-amber-900 uppercase tracking-wider font-display">{tx(
                                  "\n                              የወላጅ/የአሳዳጊ መግለጫና ክትትል (PARENT ENGAGEMENT)\n                            "
                                )}</h4>
                                <p className="text-[10px] text-slate-700 leading-normal text-justify font-bold">{tx(
                                  "\n                              የተማሪዎች ውጤታማነት በትምህርት ቤትና በቤት ውስጥ በሚደረግ የጋራ ጥረትና ክትትል ላይ የተመሰረተ ነው። ወላጆች የተማሪዎችን የዕለት ከዕለት የትምህርት ዝግጅት、ስነ-ምግባርና መገኘት እንዲከታተሉ በአክብሮት እናሳስባለን።\n                            "
                                )}</p>
                                <p className="text-[9px] text-slate-500 leading-normal text-justify italic font-bold">
                                  Students' success depends on the joint effort from both school and home. We kindly urge parents/guardians to regularly follow up.
                                </p>
                              </div>

                              {/* Parent Signatures Table */}
                              <div className="pt-1">
                                <table className="w-full text-[10px] border-collapse border border-amber-800/20 rounded-lg bg-white/40 shadow-xs">
                                  <thead>
                                    <tr className="bg-amber-800/10 text-slate-800 font-extrabold border-b border-amber-800/20 text-[9px] uppercase font-mono">
                                      <th className="p-1 px-1.5 border-r border-amber-800/20 text-left">{tx("ሩብ ዓመት / ሴሚስተር (Term)")}</th>
                                      <th className="p-1 px-1.5 border-r border-amber-800/20 text-center">{tx("የወላጅ ፊርማ (Signature)")}</th>
                                      <th className="p-1 px-1.5 text-center">{tx("ቀን (Date)")}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-amber-800/15">
                                      <td className="p-1 px-1.5 font-bold text-slate-700 border-r border-amber-800/20">{tx("1ኛ ወሰን ትምህርት (1st Semester)")}</td>
                                      <td className="p-1 px-1.5 border-r border-amber-800/20"></td>
                                      <td className="p-1 px-1.5"></td>
                                    </tr>
                                    <tr className="border-b border-amber-800/15">
                                      <td className="p-1 px-1.5 font-bold text-slate-700 border-r border-amber-800/20">{tx("2ኛ ወሰን ትምህርት (2nd Semester)")}</td>
                                      <td className="p-1 px-1.5 border-r border-amber-800/20"></td>
                                      <td className="p-1 px-1.5"></td>
                                    </tr>
                                    <tr>
                                      <td className="p-1 px-1.5 font-bold text-slate-700 border-r border-amber-800/20">{tx("ዓመታዊ ማጠቃለያ (Annual Sum)")}</td>
                                      <td className="p-1 px-1.5 border-r border-amber-800/20"></td>
                                      <td className="p-1 px-1.5"></td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Footer copyright */}
                            <div className="text-center text-[10px] font-mono font-bold text-slate-400 mt-1">
                              © {schoolConfig?.nameEng || 'DILIGENT ACADEMY'} • ALL RIGHTS RESERVED
                            </div>
                          </div>

                          {/* Right Half: FRONT COVER (የፊት ገጽ) */}
                          <div className="w-1/2 flex flex-col justify-between pl-4 relative h-full text-left">
                            {/* Ribbon Banner for Outstanding Achievement */}
                            {isHonorRoll && (
                              <div className="absolute top-16 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-[9.5px] font-extrabold flex items-center gap-0.5 shadow-md uppercase tracking-wider rotate-[3deg] z-10 border border-amber-400">
                                <Sparkles className="w-3 h-3 animate-spin" />{tx(" የላቀ ውጤት (Honor Roll)\n                          ")}</div>
                            )}

                            {/* Government & School Header block with gorgeous solid-indigo banner */}
                            <div className="text-center pb-2 relative">
                              <div className="bg-[#0f172a] text-white p-3 rounded-xl -mx-4 -mt-5 mb-2.5 border-b-4 border-amber-500 relative flex flex-col items-center shadow-md">
                                {/* Background Pattern */}
                                <div className="absolute inset-0 bg-radial-gradient opacity-10"></div>
                                {/* Official Seal / Logo Centered Above the Text */}
                                <div className="flex flex-col items-center gap-1.5 relative z-10 text-center">
                                  <div className="bg-white p-0.5 rounded-full border border-amber-400 shrink-0 shadow-md">
                                    <svg className="w-10 h-10 text-blue-900" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="#0F52BA" fillOpacity="0.08"/>
                                      <path d="M12 2L14.85 8.15L21.5 9.12L16.7 13.8L17.85 20.5L12 17.25L6.15 20.5L7.3 13.8L2.5 9.12L9.15 8.15L12 2Z" fill="#FFD700" stroke="#E6B800" strokeWidth="0.4"/>
                                      <circle cx="12" cy="12" r="3" stroke="#0F52BA" strokeWidth="0.6" fill="none"/>
                                      <path d="M12 8V16M8 12H16" stroke="#0F52BA" strokeWidth="0.6"/>
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <h3 className="text-[12.5px] font-black tracking-widest text-amber-300 leading-none">{tx("የአዲስ አበባ ከተማ አስተዳደር ትምህርት ቢሮ")}</h3>
                                    <h4 className="text-[9.5px] font-black text-slate-300 tracking-wide uppercase leading-none mt-1 font-mono">ADDIS ABABA CITY ADMINISTRATION EDUCATION BUREAU</h4>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-center gap-1 mt-2">
                                <div className="w-16 h-16 rounded-full bg-white border-2 border-amber-500/80 p-1 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                                  <img 
                                    src={schoolConfig?.logoImage || DEFAULT_SCHOOL_LOGO} 
                                    alt="School Logo" 
                                    className="w-full h-full object-contain" 
                                  />
                                </div>
                                <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight leading-none uppercase font-display mt-0.5">
                                  {schoolConfig?.nameAmh || tx("ኪብር መካከለኛ ደረጃ ትምህርት ቤት")}
                                </h1>
                                <h2 className="text-sm font-black text-amber-800 tracking-widest uppercase mt-0.5 font-display">
                                  {(schoolConfig?.nameEng || 'DILIGENT ACADEMY').replace(/app/i, '').trim()}
                                </h2>
                                <p className="text-[11px] italic text-slate-500 max-w-xs mx-auto leading-tight mt-1 font-bold">
                                  " {schoolConfig?.mottoAmh || tx("ለክህሎትና ለውጤታማነት እንተጋለን!")} " / " {schoolConfig?.mottoEng || 'Striving for Skills and Excellence'} "
                                </p>
                              </div>

                              {/* Dynamic Report Card Type */}
                              <div className="text-center mt-2">
                                <div className="inline-block bg-[#1e1b4b] text-amber-400 px-3 py-1 rounded-md text-[11px] font-black tracking-widest leading-none border border-amber-600/50 font-display">
                                  {(() => {
                                    const gradeNumMatch = cardStudent.grade.match(/\d+/);
                                    const gradeNum = gradeNumMatch ? parseInt(gradeNumMatch[0]) : 7;
                                    if (gradeNum >= 1 && gradeNum <= 6) {
                                      return tx("የአንደኛ ደረጃ ትምህርት ቤት (1-6) የተማሪ ውጤት መግለጫ • PRIMARY SCHOOL REPORT CARD");
                                    } else if (gradeNum >= 7 && gradeNum <= 8) {
                                      return tx("የመካከለኛ ደረጃ ትምህርት ቤት (7-8) የተማሪ ውጤት መግለጫ • MIDDLE SCHOOL REPORT CARD");
                                    } else {
                                      return tx("የሁለተኛ ደረጃ ትምህርት ቤት (9-12) የተማሪ ውጤት መግለጫ • HIGH SCHOOL REPORT CARD");
                                    }
                                  })()}
                                </div>
                              </div>

                              {/* Location & Program */}
                              <div className="grid grid-cols-3 gap-3 text-[11.5px] border-b border-amber-800/10 pb-2 mt-3 font-bold text-left">
                                <div className="flex flex-col border-r border-amber-800/10 pr-2">
                                  <span className="text-[#854d0e] text-[9px] uppercase tracking-wider font-bold">{tx("ክ/ከተማ (Sub-City)")}</span>
                                  <span className="text-indigo-950 font-black text-[12px] mt-0.5">{tx("ኮልፌ ቀራኒዮ")}</span>
                                </div>
                                <div className="flex flex-col border-r border-amber-800/10 px-2 text-center">
                                  <span className="text-[#854d0e] text-[9px] uppercase tracking-wider font-bold">{tx("ወረዳ (Woreda)")}</span>
                                  <span className="text-indigo-950 font-black text-[12px] mt-0.5">05</span>
                                </div>
                                <div className="flex flex-col pl-2 text-right">
                                  <span className="text-[#854d0e] text-[9px] uppercase tracking-wider font-bold">{tx("መርሃ ግብር (Program)")}</span>
                                  <span className="text-indigo-950 font-black text-[12px] mt-0.5">{tx("መደበኛ (Regular)")}</span>
                                </div>
                              </div>
                            </div>

                            {/* Student Biography Info & Portrait box */}
                            <div className="flex gap-4 bg-[#fdfcf7] p-2 rounded-lg border border-[#e4dcbf] text-[11.5px] relative mt-1 shrink-0 shadow-xs">
                              <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#854d0e] rounded-l"></div>
                              
                              {/* Profile Fields */}
                              <div className="flex-1 space-y-2">
                                {/* Full Name Row */}
                                <div className="flex items-center gap-2 border border-slate-200 bg-white px-2 py-1 rounded shadow-2xs">
                                  <span className="text-[#854d0e] text-[10px] font-black uppercase tracking-wider shrink-0">{tx("የተማሪው ስም / Name:")}</span>
                                  <strong className="text-[#1e1b4b] font-black text-[14px] flex-1 truncate">{cardStudent.name}</strong>
                                </div>
                                
                                {/* ID and Gender Grid */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-2 border border-slate-200 bg-white px-2 py-1 rounded shadow-2xs">
                                    <span className="text-[#854d0e] text-[10px] font-black uppercase tracking-wider shrink-0">ID:</span>
                                    <strong className="text-slate-950 font-mono font-black text-[11.5px] truncate">{cardStudent.id}</strong>
                                  </div>
                                  <div className="flex items-center gap-2 border border-slate-200 bg-white px-2 py-1 rounded shadow-2xs">
                                    <span className="text-[#854d0e] text-[10px] font-black uppercase tracking-wider shrink-0">Sex:</span>
                                    <strong className="text-slate-950 font-black text-[11.5px] truncate">
                                      {(cardStudent.gender === 'Female' || cardStudent.gender === 'F') ? tx("ሴት (F)") : tx("ወንድ (M)")}
                                    </strong>
                                  </div>
                                </div>

                                {/* Grade and Year Grid */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center gap-2 border border-slate-200 bg-white px-2 py-1 rounded shadow-2xs">
                                    <span className="text-[#854d0e] text-[10px] font-black uppercase tracking-wider shrink-0">{tx("ክፍል / Grade:")}</span>
                                    <strong className="text-[#1e1b4b] font-black text-[11.5px] truncate">{cardStudent.grade} - {cardStudent.section}</strong>
                                  </div>
                                  <div className="flex items-center gap-2 border border-slate-200 bg-white px-2 py-1 rounded shadow-2xs">
                                    <span className="text-[#854d0e] text-[10px] font-black uppercase tracking-wider shrink-0">{tx("ዘመን / Year:")}</span>
                                    <strong className="text-slate-950 font-black text-[11px] truncate">{schoolConfig?.academicYear || tx("2018 ዓ.ም")}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Student Portrait Placeholder */}
                              <div className="w-20 h-24 bg-slate-50 border border-slate-200 rounded flex flex-col items-center justify-center p-1 relative shrink-0 overflow-hidden">
                                {cardStudent.photo ? (
                                  <img 
                                    src={cardStudent.photo} 
                                    alt={cardStudent.name} 
                                    className="w-full h-full object-cover rounded-sm"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <>
                                    <div className="absolute inset-0.5 border border-dashed border-slate-300 rounded-sm"></div>
                                    <Users className="w-7 h-7 text-slate-400" />
                                    <span className="text-[8.5px] text-slate-500 text-center font-bold mt-1 leading-none">{tx("የተማሪው ፎቶ")}<br/>(Photo)</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Authentic Diagonal Official Ink Stamp */}
                            <div className="absolute bottom-12 right-20 pointer-events-none select-none z-20">
                              {isStudentPassing(rosterItem) ? (
                                <div className="border-4 border-double border-blue-600 text-blue-700 font-sans font-black text-center text-[10px] tracking-wider px-3 py-1.5 rounded-lg rotate-[-12deg] bg-white/50 opacity-90 shadow-sm transform flex flex-col items-center">
                                  <span className="text-[13px] font-black leading-none">{tx("ያለፈ / PROMOTED")}</span>
                                  <span className="text-[5.5px] tracking-widest mt-0.5 leading-none">OFFICIAL PASSED STAMP</span>
                                </div>
                              ) : (
                                <div className="border-4 border-double border-red-600 text-red-700 font-sans font-black text-center text-[10px] tracking-wider px-3 py-1.5 rounded-lg rotate-[-12deg] bg-white/50 opacity-90 shadow-sm transform flex flex-col items-center">
                                  <span className="text-[13px] font-black leading-none">{tx("አልፏል / RETAINED")}</span>
                                  <span className="text-[5.5px] tracking-widest mt-0.5 leading-none">OFFICIAL RETAINED STAMP</span>
                                </div>
                              )}
                            </div>

                            {/* Promoted / Detained decision footer detail */}
                            <div className="text-[10.5px] border-t border-amber-800/10 pt-2.5 flex justify-between font-bold text-slate-700">
                              <div>
                                <span>{tx("ወደ ቀጣይ ክፍል የተዛወረ/ች / Promoted to: ")}</span>
                                <strong className="text-indigo-950 font-black border-b border-slate-400 pb-0.5 italic pl-1 text-[11.5px]">
                                  {isStudentPassing(rosterItem) ? (() => {
                                    const match = cardStudent.grade.match(/\d+/);
                                    return match ? `Grade ${parseInt(match[0]) + 1}` : 'Next Grade';
                                  })() : '___'}
                                </strong>
                              </div>
                              <div>
                                <span>{tx("ውሳኔ (Decision): ")}</span>
                                <strong className={`font-black border-b border-slate-400 pb-0.5 italic ${isStudentPassing(rosterItem) ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {isStudentPassing(rosterItem) ? tx("የተዛወረ / PROMOTED") : tx("አልተዛወረም / RETAINED")}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Visual Page Break on Screen */}
                        <div className="no-print flex items-center justify-center gap-3 py-4">
                          <div className="h-[1px] bg-slate-300 flex-1"></div>
                          <span className="text-xs font-black text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-4 py-1 flex items-center gap-2 shadow-2xs font-display">
                            <FileText className="w-3.5 h-3.5" />{tx(" የጀርባ/የውስጥ ገጽ (Page 2: Inner Marks & Remarks)\n                      ")}</span>
                          <div className="h-[1px] bg-slate-300 flex-1"></div>
                        </div>

                        {/* PAGE 2: INNER SIDE (የውስጥ ገጽ - የማርክ ዝርዝርና አስተያየት) */}
                        <div 
                          id="report-card-print-area-back" 
                          className="report-card-page report-card-section-break bg-[#faf8f2] p-5 md:p-6 w-full max-w-[1120px] aspect-[297/210] min-h-[824px] mx-auto shadow-2xl rounded-2xl border-4 md:border-6 border-double border-amber-800 text-slate-900 relative overflow-hidden flex flex-row gap-8 transition-all duration-300"
                        >
                          {/* Left Half: ACADEMIC MARKS LIST TABLE */}
                          <div className="w-1/2 flex flex-col justify-between pr-4 border-r-2 border-dashed border-amber-800/30 relative h-full">
                            <div className="flex-1 flex flex-col">
                              {/* Print-Only Header with School Name & Student Info */}
                              <div className="hidden print:flex report-card-print-header">
                                <div className="flex items-center gap-1.5">
                                  <img src={schoolConfig?.logoImage || DEFAULT_SCHOOL_LOGO} alt="" className="w-4 h-4 object-contain rounded-full" />
                                  <span className="font-display font-black tracking-wide text-indigo-950">
                                    {schoolConfig?.nameAmh || tx("ኪብር መካከለኛ ደረጃ ትምህርት ቤት")} • {(schoolConfig?.nameEng || 'DILIGENT ACADEMY').replace(/app/i, '').trim()}
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-slate-600">
                                  {cardStudent.name} ({cardStudent.grade} - {cardStudent.section}) • ID: {cardStudent.id}
                                </span>
                              </div>

                              {/* Subject Marks Title */}
                              <div className="border-b border-amber-800/20 pb-1.5 mb-2 flex justify-between items-center text-left">
                                <div>
                                  <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider font-display">{tx(
                                    "\n                                የትምህርት ዓይነቶች ውጤት ዝርዝር\n                              "
                                  )}</h3>
                                  <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide -mt-0.5 font-mono">
                                    SUBJECT PERFORMANCE & MARK LIST
                                  </p>
                                </div>
                                <span className="text-[9.5px] bg-[#1e1b4b] text-white px-2.5 py-0.5 rounded font-bold uppercase font-mono tracking-wider">
                                  Academic Results
                                </span>
                              </div>

                              {/* SNUG HIGH CONTRAST PRINTABLE TABLE */}
                              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-md">
                                <table className="w-full text-[10.5px] border-collapse text-left border-slate-300 table-fixed">
                                  <colgroup>
                                    <col style={{ width: '32%' }} />
                                    <col style={{ width: '17%' }} />
                                    <col style={{ width: '17%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '16%' }} />
                                  </colgroup>
                                  <thead>
                                    <tr className="bg-[#1e1b4b] text-white font-extrabold text-[8.5px] uppercase font-mono border-b border-slate-350 leading-tight">
                                      <th className="p-1.5 pl-1.5 border-r border-slate-300/30 leading-tight">{tx("ትምህርት (Subject)")}</th>
                                      <th className="p-1.5 text-center border-r border-slate-300/30 leading-tight">{tx("1ኛ ወሰን (S1)")}</th>
                                      <th className="p-1.5 text-center border-r border-slate-300/30 leading-tight">{tx("2ኛ ወሰን (S2)")}</th>
                                      <th className="p-1.5 text-center border-r border-slate-300/30 bg-[#2e1065] text-amber-300 font-black leading-tight">{tx("ዓመታዊ (Annual)")}</th>
                                      <th className="p-1.5 text-center leading-tight font-display">{tx("ፊደል (Grade)")}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {subjects.map((sub, idx) => {
                                      const s1 = getSubjectSem1Avg(cardStudent.id, sub);
                                      const s2 = getSubjectSem2Avg(cardStudent.id, sub);
                                      const annual = getSubjectAnnualAvg(cardStudent.id, sub);

                                      const letter = annual !== null ? getLetterGrade(annual) : null;

                                      return (
                                        <tr key={sub} className={`border-b border-slate-250 hover:bg-[#faf6e9] transition-colors text-[11px] leading-tight ${idx % 2 === 1 ? 'bg-[#faf8f2]/30' : 'bg-white'}`}>
                                          <td className="p-1.5 pl-1.5 font-black text-slate-900 border-r border-slate-200 whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                                            {sub}
                                          </td>
                                          <td className="p-1.5 text-center font-bold border-r border-slate-200 text-slate-700 whitespace-nowrap leading-tight">
                                            {s1 !== null ? (s1 + '%') : <span className="text-slate-300 font-normal">-</span>}
                                          </td>
                                          <td className="p-1.5 text-center font-bold border-r border-slate-200 text-slate-700 whitespace-nowrap leading-tight">
                                            {s2 !== null ? (s2 + '%') : <span className="text-slate-300 font-normal">-</span>}
                                          </td>
                                          <td className="p-1.5 text-center font-black border-r border-slate-200 bg-amber-500/10 text-amber-950 whitespace-nowrap leading-tight">
                                            {annual !== null ? (annual + '%') : <span className="text-slate-300 font-normal">-</span>}
                                          </td>
                                          <td className="p-1.5 text-center font-black whitespace-nowrap leading-none">
                                            {letter ? (
                                              <span className={`inline-block px-1 py-0.5 rounded text-[9.5px] font-extrabold border leading-none ${letter.color}`}>
                                                {letter.grade}
                                              </span>
                                            ) : '-'}
                                          </td>
                                        </tr>
                                      );
                                    })}

                                    {/* Table Summary Rows with individual clean columns */}
                                    <tr className="bg-slate-50 border-t-2 border-slate-400 font-black text-[11px]">
                                      <td className="p-1.5 pl-1.5 font-black text-[#1e1b4b] border-r border-slate-200 whitespace-nowrap leading-tight">{tx(
                                        "\n                                    ድምር (Total Sum)\n                                  "
                                      )}</td>
                                      <td className="p-1.5 text-center border-r border-slate-200 text-slate-800 whitespace-nowrap leading-tight">
                                        {(() => {
                                          const sum = subjects.reduce((acc, s) => acc + (getSubjectSem1Avg(cardStudent.id, s) || 0), 0);
                                          return sum > 0 ? sum : '-';
                                        })()}
                                      </td>
                                      <td className="p-1.5 text-center border-r border-slate-200 text-slate-800 whitespace-nowrap leading-tight">
                                        {(() => {
                                          const sum = subjects.reduce((acc, s) => acc + (getSubjectSem2Avg(cardStudent.id, s) || 0), 0);
                                          return sum > 0 ? sum : '-';
                                        })()}
                                      </td>
                                      <td className="p-1.5 text-center border-r border-slate-200 bg-amber-100 text-amber-950 font-black whitespace-nowrap leading-tight">
                                        {(() => {
                                          const sum = subjects.reduce((acc, s) => acc + (getSubjectAnnualAvg(cardStudent.id, s) || 0), 0);
                                          return sum > 0 ? sum : '-';
                                        })()}
                                      </td>
                                      <td className="p-1.5 bg-slate-50/50"></td>
                                    </tr>

                                    <tr className="bg-slate-100 border-t border-slate-300 font-black text-[11px]">
                                      <td className="p-1.5 pl-1.5 font-black text-[#1e1b4b] border-r border-slate-200 whitespace-nowrap leading-tight">{tx(
                                        "\n                                    አማካይ (Average)\n                                  "
                                      )}</td>
                                      <td className="p-1.5 text-center border-r border-slate-200 text-[#1e1b4b] font-black whitespace-nowrap leading-tight">
                                        {getStudentSem1Average(cardStudent.id) !== null ? (getStudentSem1Average(cardStudent.id) + '%') : '-'}
                                      </td>
                                      <td className="p-1.5 text-center border-r border-slate-200 text-[#1e1b4b] font-black whitespace-nowrap leading-tight">
                                        {getStudentSem2Average(cardStudent.id) !== null ? (getStudentSem2Average(cardStudent.id) + '%') : '-'}
                                      </td>
                                      <td className="p-1.5 text-center border-r border-slate-200 bg-amber-200 text-amber-950 font-black whitespace-nowrap leading-tight">
                                        {rosterItem.average}%
                                      </td>
                                      <td className="p-1.5 bg-slate-100"></td>
                                    </tr>

                                    <tr className="bg-slate-50 border-t border-slate-300 font-black text-[11px]">
                                      <td className="p-1.5 pl-1.5 font-black text-[#1e1b4b] border-r border-slate-200 whitespace-nowrap leading-tight">{tx(
                                        "\n                                    ደረጃ (Class Rank)\n                                  "
                                      )}</td>
                                      <td className="p-1.5 text-center border-r border-slate-200 text-indigo-900 whitespace-nowrap leading-tight">
                                        {getStudentSem1Rank(cardStudent.id) !== '-' ? `${getStudentSem1Rank(cardStudent.id)}/${studentRosterData.length}` : '-'}
                                      </td>
                                      <td className="p-1.5 text-center border-r border-slate-200 text-indigo-900 whitespace-nowrap leading-tight">
                                        {getStudentSem2Rank(cardStudent.id) !== '-' ? `${getStudentSem2Rank(cardStudent.id)}/${studentRosterData.length}` : '-'}
                                      </td>
                                      <td className="p-1.5 text-center border-r border-slate-200 bg-amber-100 text-[#1e1b4b] font-black whitespace-nowrap leading-tight">
                                        {rosterItem.rank !== null ? `${rosterItem.rank}/${studentRosterData.length}` : '-'}
                                      </td>
                                      <td className="p-1.5 bg-slate-50/50"></td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Brief explanation */}
                            <div className="bg-amber-50/40 border border-amber-800/10 p-2 rounded-lg text-[10.5px] text-slate-600 mt-1.5 font-bold leading-none text-center">{tx("\n                          የክፍል አማካይ ውጤት (Class General Average): ")}{classAverageVal}%
                            </div>
                          </div>


                          {/* Right Half: CONDUCTS, REMARKS, ATTENDANCE & OFFICIAL SIGNATURES */}
                          <div className="w-1/2 flex flex-col justify-between pl-4 relative h-full text-left">
                            {/* Print-Only Running Header (Right Half) */}
                            <div className="hidden print:flex report-card-print-header">
                              <div className="flex items-center gap-1.5">
                                <img src={schoolConfig?.logoImage || DEFAULT_SCHOOL_LOGO} alt="" className="w-4 h-4 object-contain rounded-full" />
                                <span className="font-display font-black tracking-wide text-indigo-950">
                                  {(schoolConfig?.nameEng || 'DILIGENT ACADEMY').replace(/app/i, '').trim()} • {tx("የተማሪ ውጤት ካርድ (Official Report Card)")}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-slate-600">
                                {selectedTerm === 'annual' ? 'ANNUAL EVALUATION' : selectedTerm.toUpperCase()}
                              </span>
                            </div>

                            <div className="space-y-4">
                              {/* Conduct & Behaviors block with beautifully styled letter circle badges */}
                              <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-md">
                                <h4 className="text-[13px] font-black text-amber-950 uppercase mb-2 pb-1 border-b border-slate-200 flex justify-between font-display">
                                  <span>{tx("🌟 ባህሪና ሥነ-ምግባር / BEHAVIORS & CONDUCTS")}</span>
                                  <span className="text-[11px] text-slate-400">{tx("ግምገማ (Grade)")}</span>
                                </h4>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px]">
                                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                    <span className="text-slate-600 font-bold">{tx("1. ደንብ ማክበር (Obedience):")}</span>
                                    <strong className="text-emerald-700 font-black text-sm">{rosterItem.conduct}</strong>
                                  </div>
                                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                    <span className="text-slate-600 font-bold">{tx("2. ትጋትና ንቃት (Diligence):")}</span>
                                    <strong className="text-indigo-950 font-black text-sm">{['A+', 'A', 'B'].includes(rosterItem.conduct) ? 'A' : 'B'}</strong>
                                  </div>
                                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                    <span className="text-slate-600 font-bold">{tx("3. ንጽህና (Hygiene):")}</span>
                                    <strong className="text-indigo-950 font-black text-sm">A</strong>
                                  </div>
                                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                    <span className="text-slate-600 font-bold">{tx("4. ትብብር (Cooperation):")}</span>
                                    <strong className="text-indigo-950 font-black text-sm">{['A+', 'A'].includes(rosterItem.conduct) ? 'A' : 'B'}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Attendance Dashboard Card */}
                              <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-md">
                                <h4 className="text-[13px] font-black text-[#1e1b4b] uppercase mb-2 pb-1 border-b border-slate-200 font-display">{tx(
                                  "\n                              📅 የቀሪ ቀናት ማጠቃለያ / ATTENDANCE SUMMARY\n                            "
                                )}</h4>
                                <div className="grid grid-cols-3 gap-3 text-center text-[12px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                  <div>
                                    <span className="text-slate-500 block font-bold leading-none mb-1">{tx("ጠቅላላ ቀናት (Total)")}</span>
                                    <strong className="text-[#1e1b4b] font-black text-sm block">{tx("180 ቀናት")}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block font-bold leading-none mb-1">{tx("የቀረበት ቀን (Absent)")}</span>
                                    <strong className="text-rose-700 font-black text-sm block">{rosterItem.absent}{tx(" ቀን")}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block font-bold leading-none mb-1">{tx("የተገኘበት (Present)")}</span>
                                    <strong className="text-emerald-700 font-black text-sm block">{180 - rosterItem.absent}{tx(" ቀን")}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Dynamic Handwritten Teachers Remarks (Quarterly/Semester remarks) */}
                              <div className="border border-[#e4dcbf] rounded-lg p-3 bg-[#faf8f2]/50 text-[12px] space-y-2.5 shadow-xs">
                                <div>
                                  <p className="font-bold text-[12px] text-amber-950">{tx("የ1ኛ ወሰን ትምህርት አስተያየት (1st Semester Remark):")}</p>
                                  <p className="font-serif italic text-indigo-900 font-black pl-1.5 pt-0.5 leading-snug text-[12px]">
                                    {(() => {
                                      const s1Avg = getStudentSem1Average(cardStudent.id);
                                      if (s1Avg === null) return tx("ውጤት አልተመዘገበም (No Grade Registered)");
                                      if (s1Avg >= 90) return tx("\"እጅግ በጣም ከፍተኛ ውጤት ያስመዘገበ ተማሪ ነው፤ በቀጣይም ይህንን ውጤት እንዲያስቀጥል ድጋፍ ይደረግለት።\"");
                                      if (s1Avg >= 75) return tx("\"በጣም ጥሩ ውጤት ነው፤ የበለጠ ውጤታማ እንዲሆን የየዕለት ክትትልና እገዛ ቢደረግለት ይመረጣል።\"");
                                      if (s1Avg >= 50) return tx("\"ጥሩ ማለፊያ ውጤት ነው፤ በቀጣይ ክፍለ ጊዜ ይበልጥ በትኩረት እንዲያጠና ይበረታታ።\"");
                                      return tx("\"ውጤቱን ለማሻሻል ከፍተኛ ጥረት፣ የየዕለት እገዛና ተከታታይ ክትትል ያስፈልገዋል።\"");
                                    })()}
                                  </p>
                                </div>
                                <div className="border-t border-slate-200/50 pt-2">
                                  <p className="font-bold text-[12px] text-amber-950">{tx("የ2ኛ ወሰን ትምህርት አስተያየት (2nd Semester Remark):")}</p>
                                  <p className="font-serif italic text-indigo-900 font-black pl-1.5 pt-0.5 leading-snug text-[12px]">
                                    {(() => {
                                      if (rosterItem.average >= 90 && isStudentPassing(rosterItem)) return tx(
                                        "\"የላቀና እጅግ አስደሳች ውጤት ነው፤ ለነበረው ተከታታይ ትጋት ትልቅ አድናቆት ይገባዋል። በቀጣይም እንዲበረታታ።\""
                                      );
                                      if (rosterItem.average >= 75 && isStudentPassing(rosterItem)) return tx("\"አመርቂና በጣም ጥሩ ውጤት ነው፤ በቀጣዩ ክፍል ይህንን የትምህርት ስኬት አስጠብቆ እንዲቀጥል ይመረጣል።\"");
                                      if (isStudentPassing(rosterItem)) return tx("\"ትምህርቱን በስኬት አጠናቋል፤ በቀጣይ ክፍል ውጤቱን ይበልጥ ለማሳደግ በትጋት እንዲያጠና ይመረጣል።\"");
                                      return tx("\"በሚቀጥለው ዓመት ውጤቱን ለማሻሻል ከፍተኛ ጥረት፣ የየዕለት እገዛና ተከታታይ ክትትል ያስፈልገዋል።\"");
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Circular Director Official Ink Seal */}
                            <div className="absolute bottom-14 right-24 pointer-events-none select-none z-10 opacity-90">
                              <div className="relative w-22 h-22 rounded-full border-4 border-double border-blue-600 flex flex-col items-center justify-center p-1.5 text-center rotate-[-6deg] bg-blue-50/10 shrink-0 font-sans shadow-sm">
                                <div className="absolute inset-0.5 rounded-full border border-dashed border-blue-600"></div>
                                <span className="text-[6.5px] font-black uppercase text-blue-600 leading-none">{schoolConfig?.nameEng || 'DILIGENT ACADEMY'}</span>
                                <span className="text-[5.5px] font-bold text-blue-600 my-0.2">★ OFFICIAL ★</span>
                                <span className="text-[8px] font-black text-blue-600 tracking-widest leading-none border border-blue-600 px-1 py-0.5 rounded bg-white/50">APPROVED</span>
                                <span className="text-[6.5px] font-black text-blue-600 uppercase mt-0.5">Addis Ababa</span>
                              </div>
                            </div>

                            {/* Official Signatures footer block with double underline lines */}
                            <div className="grid grid-cols-2 gap-4 text-[12px] text-center border-t border-amber-800/15 pt-2.5 shrink-0">
                              <div className="flex flex-col items-center">
                                <div className="h-8 w-2/3 border-b border-slate-400 flex items-end justify-center">
                                  {/* Removed for physical signing/fingerprinting */}
                                </div>
                                <span className="text-[12.5px] font-black text-slate-800 mt-1">{tx("የክፍል ኃላፊ መምህር")}</span>
                                <span className="text-[10px] text-slate-500 font-mono font-bold -mt-0.5">Home Room Teacher</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="h-8 w-2/3 border-b border-slate-400 flex items-end justify-center">
                                  {/* Removed for physical signing/fingerprinting */}
                                </div>
                                <span className="text-[12.5px] font-black text-slate-800 mt-1">{tx("የርዕሰ መምህር (ማህተም)")}</span>
                                <span className="text-[10px] text-slate-500 font-mono font-bold -mt-0.5">Director (Seal)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* List View Layout Container */}
                      <div className={previewViewType === 'list' ? 'block' : 'hidden'}>
                        <div className="space-y-6 text-slate-800">
                          {/* List-based Header */}
                          <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
                                <Award className="w-8 h-8" />
                              </div>
                              <div>
                                <h1 className="text-xl font-black text-slate-900 leading-none">
                                  {schoolConfig?.nameAmh || tx("ኪብር መካከለኛ ደረጃ ትምህርት ቤት")}
                                </h1>
                                <p className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase">
                                  {schoolConfig?.nameEng || 'DILIGENT ACADEMY'}
                                </p>
                                <p className="text-xs font-semibold text-slate-500 italic mt-0.5">
                                  “ {schoolConfig?.mottoAmh || tx("ለክህሎትና ለውጤታማነት እንተጋለን!")} ”
                                </p>
                              </div>
                            </div>
                            
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right text-xs self-start md:self-auto">
                              <span className="text-slate-400 block text-[9px] font-bold uppercase">{tx("የተማሪ መለያ / Student ID")}</span>
                              <strong className="text-slate-900 font-mono font-black text-sm">{cardStudent.id}</strong>
                            </div>
                          </div>

                          {/* Student Bio Strip */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                            <div>
                              <span className="text-slate-500 block text-[9px] font-bold uppercase">{tx("የተማሪው ስም (Student Name)")}</span>
                              <strong className="text-slate-900 font-black text-xs block mt-0.5">{cardStudent.name}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] font-bold uppercase">{tx("ክፍልና ደረጃ (Grade / Sec)")}</span>
                              <strong className="text-slate-900 font-extrabold text-xs block mt-0.5">{cardStudent.grade} - {cardStudent.section}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] font-bold uppercase">{tx("ክፍለ ጊዜ (Term / Year)")}</span>
                              <strong className="text-slate-900 font-extrabold text-xs block mt-0.5 capitalize">
                                {selectedTerm === 'annual' ? 'Annual Sum' : (selectedTerm + ' Quarter')}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] font-bold uppercase">{tx("ውሳኔ (Result Status)")}</span>
                              <strong className={`font-black text-xs block mt-0.5 ${cardPass ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {cardPass ? tx("✅ PASS (ያለፈ)") : '❌ RETAINED'}
                              </strong>
                            </div>
                          </div>

                          {/* List of Subjects */}
                          <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <List className="w-4 h-4 text-indigo-600" />{tx(
                              " የትምህርት ውጤት ዝርዝር (List of Academic Achievements)\n                        "
                            )}</h3>
                            
                            {subjects.map(sub => {
                              const scores: (number | null)[] = [];
                              if (isSemester) {
                                const s1 = grades.find(g => g.studentId === cardStudent.id && g.subject === sub && (g.term || 1) === 1)?.total ?? null;
                                const s2 = grades.find(g => g.studentId === cardStudent.id && g.subject === sub && (g.term || 1) === 2)?.total ?? null;
                                scores.push(s1, s2);
                              } else {
                                const q1 = grades.find(g => g.studentId === cardStudent.id && g.subject === sub && (g.term || 1) === 1)?.total ?? null;
                                const q2 = grades.find(g => g.studentId === cardStudent.id && g.subject === sub && (g.term || 1) === 2)?.total ?? null;
                                const q3 = grades.find(g => g.studentId === cardStudent.id && g.subject === sub && (g.term || 1) === 3)?.total ?? null;
                                const q4 = grades.find(g => g.studentId === cardStudent.id && g.subject === sub && (g.term || 1) === 4)?.total ?? null;
                                scores.push(q1, q2, q3, q4);
                              }

                              const validScores = scores.filter((s): s is number => s !== null);
                              const average = validScores.length > 0 ? Math.round(validScores.reduce((sum, s) => sum + s, 0) / validScores.length) : null;
                              const letter = average !== null ? getLetterGrade(average) : null;
                              const subjectRank = average !== null ? getSubjectRankAndTotalForTerm(sub, cardStudent.id, 'annual') : null;
                              const teachDetails = getTeacherNameAndSigForSubject(sub);

                              return (
                                <div key={sub} className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-200 rounded-xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">📖</span>
                                      <div>
                                        <strong className="text-slate-900 font-extrabold text-sm">{sub}</strong>
                                        <span className="block text-[10px] text-slate-400 font-medium">{tx("አስተማሪ፡ ")}{teachDetails.name}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Assessment Breakdown List */}
                                  <div className="flex flex-wrap gap-2.5 items-center bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-150">
                                    {isSemester ? (
                                      <>
                                        <div className="text-center px-1">
                                          <span className="text-[8px] font-bold text-slate-400 uppercase block">Sem 1</span>
                                          <strong className="text-slate-800 font-extrabold text-xs">{scores[0] !== null ? `${scores[0]}%` : '-'}</strong>
                                        </div>
                                        <div className="h-6 w-px bg-slate-200"></div>
                                        <div className="text-center px-1">
                                          <span className="text-[8px] font-bold text-slate-400 uppercase block">Sem 2</span>
                                          <strong className="text-slate-800 font-extrabold text-xs">{scores[1] !== null ? `${scores[1]}%` : '-'}</strong>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="text-center px-1">
                                          <span className="text-[8px] font-bold text-slate-400 uppercase block">Q1</span>
                                          <strong className="text-slate-800 font-extrabold text-xs">{scores[0] !== null ? `${scores[0]}%` : '-'}</strong>
                                        </div>
                                        <div className="h-6 w-px bg-slate-200"></div>
                                        <div className="text-center px-1">
                                          <span className="text-[8px] font-bold text-slate-400 uppercase block">Q2</span>
                                          <strong className="text-slate-800 font-extrabold text-xs">{scores[1] !== null ? `${scores[1]}%` : '-'}</strong>
                                        </div>
                                        <div className="h-6 w-px bg-slate-200"></div>
                                        <div className="text-center px-1">
                                          <span className="text-[8px] font-bold text-slate-400 uppercase block">Q3</span>
                                          <strong className="text-slate-800 font-extrabold text-xs">{scores[2] !== null ? `${scores[2]}%` : '-'}</strong>
                                        </div>
                                        <div className="h-6 w-px bg-slate-200"></div>
                                        <div className="text-center px-1">
                                          <span className="text-[8px] font-bold text-slate-400 uppercase block">Q4</span>
                                          <strong className="text-slate-800 font-extrabold text-xs">{scores[3] !== null ? `${scores[3]}%` : '-'}</strong>
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Subject grade outcome */}
                                  <div className="flex items-center gap-3 justify-end min-w-[150px]">
                                    <div className="text-right">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase block">{tx("ድምር አማካይ")}</span>
                                      <strong className="text-slate-900 font-black text-sm">{average !== null ? `${average}%` : '-'}</strong>
                                    </div>

                                    <div className="h-8 w-px bg-slate-200"></div>

                                    <div className="text-center">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase block">{tx("ፊደል")}</span>
                                      {letter ? (
                                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black border ${letter.color}`}>
                                          {letter.grade}
                                        </span>
                                      ) : '-'}
                                    </div>

                                    <div className="h-8 w-px bg-slate-200"></div>

                                    <div className="text-center">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase block">{tx("ደረጃ")}</span>
                                      <strong className="text-indigo-900 font-bold text-xs block mt-0.5">
                                        {subjectRank ? `${subjectRank.rank}/${subjectRank.totalInClass}` : '-'}
                                      </strong>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Overall Metrics block */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 avoid-break-inside">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                              <h4 className="text-xs font-black text-slate-900 uppercase">{tx("የውጤት ማጠቃለያ (Metrics Summary)")}</h4>
                              <div className="flex justify-between text-xs py-1 border-b border-slate-150">
                                <span className="text-slate-500">{tx("ዓመታዊ አማካይ ውጤት (Annual Average):")}</span>
                                <strong className="text-indigo-900 font-black">{rosterItem.average}%</strong>
                              </div>
                              <div className="flex justify-between text-xs py-1 border-b border-slate-150">
                                <span className="text-slate-500">{tx("የክፍሉ አማካይ (Class Average):")}</span>
                                <strong className="text-slate-800 font-bold">{classAverageVal}%</strong>
                              </div>
                              <div className="flex justify-between text-xs py-1">
                                <span className="text-slate-500">{tx("አጠቃላይ ደረጃ (Annual Rank):")}</span>
                                <strong className="text-slate-950 font-black">{rosterItem.rank !== null ? `${rosterItem.rank} / ${studentRosterData.length}` : '-'}</strong>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                              <h4 className="text-xs font-black text-slate-900 uppercase">{tx("ስነ-ምግባርና መገኘት (Conduct & Attendance)")}</h4>
                              <div className="flex justify-between text-xs py-1 border-b border-slate-150">
                                <span className="text-slate-500">{tx("ሥነ-ምግባር ደረጃ (Conduct Grade):")}</span>
                                <strong className="text-emerald-700 font-black">{rosterItem.conduct}</strong>
                              </div>
                              <div className="flex justify-between text-xs py-1">
                                <span className="text-slate-500">{tx("የቀረበት ቀናት (Days Absent):")}</span>
                                <strong className="text-rose-700 font-black">{rosterItem.absent}{tx(" ቀን (Days)")}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Signatures Row */}
                          <div className="grid grid-cols-2 gap-8 text-center pt-4 border-t border-slate-200 avoid-break-inside">
                            <div className="flex flex-col items-center">
                              <div className="h-6 w-2/3 border-b border-slate-300 pb-1 flex items-end justify-center">
                                {/* Removed for physical signing/fingerprinting */}
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 mt-1">{tx("የክፍል ኃላፊ መምህር (Homeroom Teacher)")}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="h-6 w-2/3 border-b border-slate-300 pb-1 flex items-end justify-center">
                                {/* Removed for physical signing/fingerprinting */}
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 mt-1">{tx("የርዕሰ መምህር (Director Seal)")}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Modal Footer Controls */}
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end shrink-0 no-print">
                    <button
                      disabled={isGeneratingPDF}
                      onClick={() => {
                        playInteractiveSound('click');
                        setSelectedCardStudentId(null);
                      }}
                      className={`px-5 py-2 text-slate-800 text-xs font-black rounded-xl transition-colors ${
                        isGeneratingPDF 
                          ? 'bg-slate-100 text-slate-450 cursor-not-allowed' 
                          : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                    >{tx("\n                  ይዝጉ (Close)\n                ")}</button>
                  </div>

                </div>
              </div>,
              document.body
            );
          })()}

          {/* ================= ROSTER CELL QUICK BREAKDOWN EDITOR MODAL ================= */}
          {quickEditStudentId && quickEditSubject && (() => {
            const student = students.find(s => s.id === quickEditStudentId);
            if (!student) return null;

            const totalPossible = 100;
            const currentTotal = Number(quickEditQuiz || 0) + Number(quickEditCw || 0) + Number(quickEditHw || 0) + Number(quickEditMid || 0) + Number(quickEditFinal || 0);

            return (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                  
                  {/* Header */}
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <Edit2 className="w-5 h-5 text-indigo-600" />
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{tx("የውጤት ማሻሻያ (Grade Breakdown)")}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Student ID: {student.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        playInteractiveSound('click');
                        setQuickEditStudentId(null);
                        setQuickEditSubject(null);
                      }}
                      className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                      <span className="text-[10px] text-indigo-700 block font-bold uppercase">{tx("የተማሪ ስምና የትምህርት አይነት")}</span>
                      <strong className="text-sm text-slate-950 block">{student.name}</strong>
                      <span className="text-xs text-indigo-900 font-extrabold bg-indigo-100/60 px-2 py-0.5 rounded-md inline-block mt-1">
                        📖 {quickEditSubject}
                      </span>
                    </div>

                    {quickEditError && (
                      <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold rounded-lg">
                        {quickEditError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Quiz (10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={quickEditQuiz}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.min(10, Math.max(0, Number(e.target.value)));
                            setQuickEditQuiz(val);
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Classwork (10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={quickEditCw}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.min(10, Math.max(0, Number(e.target.value)));
                            setQuickEditCw(val);
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Homework (10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={quickEditHw}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.min(10, Math.max(0, Number(e.target.value)));
                            setQuickEditHw(val);
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Mid Exam (20)</label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={quickEditMid}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.min(20, Math.max(0, Number(e.target.value)));
                            setQuickEditMid(val);
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Final Exam (50)</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={quickEditFinal}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.min(50, Math.max(0, Number(e.target.value)));
                            setQuickEditFinal(val);
                          }}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center mt-2">
                      <span className="text-xs font-bold text-slate-600">{tx("ጠቅላላ ውጤት (Total Sum):")}</span>
                      <strong className={'text-sm font-black px-3 py-1 rounded-md ' + (
                        currentTotal >= 85 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                        currentTotal >= 50 ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                        'bg-rose-50 text-rose-800 border border-rose-100'
                      )}>
                        {currentTotal} / {totalPossible}%
                      </strong>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-2 justify-end shrink-0">
                    <button
                      onClick={() => {
                        playInteractiveSound('click');
                        setQuickEditStudentId(null);
                        setQuickEditSubject(null);
                      }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all"
                    >{tx("\n                  ይዝጉ (Cancel)\n                ")}</button>
                    <button
                      onClick={handleSaveQuickEdit}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />{tx(" መዝግብ (Save Grade)\n                ")}</button>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* ================= CUSTOM CONFIRMATION MODAL ================= */}
          {confirmModal.isOpen && (
            <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{confirmModal.title}</h3>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">{tx("የማረጋገጫ መስኮት (Confirmation Request)")}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {confirmModal.description}
                  </p>

                  {confirmModal.type === 'bulk_clear' && (
                    <div className="mt-4 p-3 bg-rose-50/55 border border-rose-100 rounded-xl text-rose-900 text-[10px] font-bold flex gap-2">
                      <span className="text-sm">⚠️</span>
                      <span>{tx("ይህ ተግባር ውጤቶችን በሙሉ የሚያጠፋ ስለሆነ በከፍተኛ ጥንቃቄ እንዲተገበር ይመከራል።")}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-2.5 justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      playInteractiveSound('click');
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all"
                  >{tx("\n                ይቅር (Cancel)\n              ")}</button>
                  <button
                    type="button"
                    onClick={() => {
                      confirmModal.onConfirm();
                    }}
                    className={'px-5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs ' + (
                      confirmModal.type === 'bulk_approve'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    )}
                  >
                    {confirmModal.type === 'bulk_approve' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />{tx(" አጽድቅ (Confirm Approve)\n                  ")}</>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />{tx(" አጥፋ (Confirm Delete)\n                  ")}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= PDF GENERATING OVERLAY ================= */}
          {isGeneratingPDF && (
            <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
              <div className="bg-white/95 border border-slate-200/50 rounded-2xl p-8 max-w-sm text-center shadow-2xl flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                  <Sparkles className="w-6 h-6 text-indigo-600 absolute animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">{tx("ፒዲኤፍ እየተዘጋጀ ነው...")}</h4>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Generating A4 PDF Report</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                  {pdfProgressMsg}
                </p>
              </div>
            </div>
          )}
          {/* Student Edit Modal */}
          {editingStudent && (
            <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 text-sm font-sans">{tx("የተማሪ መረጃ ማስተካከያ (Edit Student)")}</span>
                  <button 
                    onClick={() => { playInteractiveSound('click'); setEditingStudent(null); }}
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleEditStudentSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("የተማሪው ሙሉ ስም (Student Full Name):")}</label>
                    <input 
                      type="text"
                      value={editStudentName}
                      onChange={(e) => setEditStudentName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("ጾታ (Gender):")}</label>
                      <select 
                        value={editStudentGender}
                        onChange={(e) => setEditStudentGender(e.target.value as any)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium"
                      >
                        <option value="Male">{tx("ወንድ (M)")}</option>
                        <option value="Female">{tx("ሴት (F)")}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("ዕድሜ (Age):")}</label>
                      <input 
                        type="number"
                        min="4"
                        max="25"
                        value={editStudentAge}
                        onChange={(e) => setEditStudentAge(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium"
                        placeholder="14"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("ክፍል (Grade):")}</label>
                      <div className="w-full p-3 rounded-xl border border-slate-150 text-sm bg-slate-100 font-bold text-slate-500">
                        {editingStudent.grade} - {editingStudent.section}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("የወላጅ ኢሜል (Parent Email):")}</label>
                    <input 
                      type="email"
                      value={editStudentParentEmail}
                      onChange={(e) => setEditStudentParentEmail(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50"
                    />
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { playInteractiveSound('click'); setEditingStudent(null); }}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                    >{tx("\n                  ይቅር (Cancel)\n                ")}</button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                    >{tx("\n                  💾 አስቀምጥ (Save Changes)\n                ")}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Student Delete Confirmation Warning Modal */}
          {deletingStudent && (
            <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
                <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center gap-2 text-rose-800">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="font-extrabold text-xs uppercase tracking-wider">{tx("የተማሪ መዝገብ ማጥፊያ ማስጠንቀቂያ")}</span>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-slate-800 text-xs font-semibold leading-relaxed">
                    ⚠️ <strong className="text-rose-700">{tx("ማስጠንቀቂያ፡")}</strong>{tx(" ተማሪ ")}<strong className="text-slate-950 font-black">"{deletingStudent.name}"</strong>{tx("ን በቋሚነት ከሲስተሙ ማጥፋት ይፈልጋሉ?\n              ")}</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{tx(
                    "\n                ይህንን ተማሪ ሲያጠፉ የልጁ መገለጫ፣ የፈተና/የምዘና ውጤቶች፣ የአይዲ መረጃ እና የወላጅ ትስስር ከሲስተሙ ሙሉ በሙሉ ይሰረዛሉ። ይህ ተግባር ሊመለስ አይችልም።\n              "
                  )}</p>
                  
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { playInteractiveSound('click'); setDeletingStudent(null); }}
                      className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                    >{tx("\n                  አይ፣ ይቅር (Cancel)\n                ")}</button>
                    <button
                      onClick={handleDeleteStudentConfirm}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                    >{tx("\n                  አዎ፣ አጥፋ (Delete)\n                ")}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assessment Weights Customization Modal */}
          {isWeightModalOpen && (
            <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-indigo-900">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="font-extrabold text-sm font-sans text-indigo-950">{tx("የውጤት ክፍፍል መመሪያ ማስተካከያ")}</h3>
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Configure Assessment Weights ({selectedSubject})</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { playInteractiveSound('click'); setIsWeightModalOpen(false); }}
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-150">
                    💡 <strong>{tx("ማሳሰቢያ፡")}</strong>{tx(
                    " እባክዎን የእያንዳንዱን የምዘና ዘርፍ ከፍተኛ ማርክ (Max Mark) በትምህርት ቤትዎ መመሪያ መሰረት ያስተካክሉ። "
                  )}<strong>{tx("የሁሉም ድምር በትክክል 100% መሆን አለበት።")}</strong>
                  </p>

                  {weightError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                      {weightError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Quiz */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">{tx("ኩዊዝ (Quiz Max):")}</label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={weightQuiz}
                        onChange={(e) => { setWeightError(null); setWeightQuiz(Number(e.target.value)); }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-slate-50/50"
                      />
                    </div>

                    {/* Classwork */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">{tx("የክፍል ሥራ (CW Max):")}</label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={weightCw}
                        onChange={(e) => { setWeightError(null); setWeightCw(Number(e.target.value)); }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-slate-50/50"
                      />
                    </div>

                    {/* Homework */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">{tx("የቤት ሥራ (HW Max):")}</label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={weightHw}
                        onChange={(e) => { setWeightError(null); setWeightHw(Number(e.target.value)); }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-slate-50/50"
                      />
                    </div>

                    {/* Group Work */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">{tx("የቡድን ሥራ (GW Max):")}</label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={weightGw}
                        onChange={(e) => { setWeightError(null); setWeightGw(Number(e.target.value)); }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-slate-50/50"
                      />
                    </div>

                    {/* Project */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">{tx("የፕሮጀክት ሥራ (PW Max):")}</label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={weightPw}
                        onChange={(e) => { setWeightError(null); setWeightPw(Number(e.target.value)); }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-slate-50/50"
                      />
                    </div>

                    {/* Participation */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">{tx("የክፍል ተሳትፎ (CP Max):")}</label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={weightCp}
                        onChange={(e) => { setWeightError(null); setWeightCp(Number(e.target.value)); }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-slate-50/50"
                      />
                    </div>

                    {/* Mid Exam */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">{tx("ግማሽ ፈተና (Mid Exam Max):")}</label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={weightMid}
                        onChange={(e) => { setWeightError(null); setWeightMid(Number(e.target.value)); }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-slate-50/50"
                      />
                    </div>

                    {/* Final Exam */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">{tx("ማጠቃለያ ፈተና (Final Exam Max):")}</label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={weightFinal}
                        onChange={(e) => { setWeightError(null); setWeightFinal(Number(e.target.value)); }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Dynamic Live Sum Bar */}
                  <div className="pt-4 border-t border-slate-150">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">{tx("የክፍፍሉ አጠቃላይ ድምር (Total Sum)")}</span>
                        <strong className="text-sm text-slate-700">{tx("መሆን ያለበት፡ 100%")}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        {Number(weightQuiz) + Number(weightCw) + Number(weightHw) + Number(weightGw) + Number(weightPw) + Number(weightCp) + Number(weightMid) + Number(weightFinal) === 100 ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 border border-emerald-200 text-emerald-800 text-sm font-black rounded-xl">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />{tx("\n                        100 / 100% (ትክክል ነው)\n                      ")}</div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-black rounded-xl">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            {Number(weightQuiz) + Number(weightCw) + Number(weightHw) + Number(weightGw) + Number(weightPw) + Number(weightCp) + Number(weightMid) + Number(weightFinal)} / 100%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { playInteractiveSound('click'); setIsWeightModalOpen(false); }}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >{tx("\n                ይቅር (Cancel)\n              ")}</button>
                  <button
                    onClick={handleSaveWeights}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                  >{tx("\n                💾 ማስተካከያውን አስቀምጥ (Save Distribution)\n              ")}</button>
                </div>
              </div>
            </div>
          )}

          {showSignatureModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
                <div className="p-5 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✍️</span>
                    <h3 className="font-extrabold text-slate-900">{tx("ፊርማ ማስተካከያ (Signatures Setup)")}</h3>
                  </div>
                  <button 
                    onClick={() => { playInteractiveSound('click'); setShowSignatureModal(false); }}
                    className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-5 space-y-6">
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { playInteractiveSound('click'); setSigTab('teacher'); }}
                      className={`py-2 text-xs font-black rounded-lg transition-all ${sigTab === 'teacher' ? 'bg-white shadow-2xs text-indigo-950' : 'text-slate-500 hover:text-slate-700'}`}
                    >{tx("\n                  የመምህር ፊርማ (Teacher)\n                ")}</button>
                    <button
                      type="button"
                      onClick={() => { playInteractiveSound('click'); setSigTab('principal'); }}
                      className={`py-2 text-xs font-black rounded-lg transition-all ${sigTab === 'principal' ? 'bg-white shadow-2xs text-indigo-950' : 'text-slate-500 hover:text-slate-700'}`}
                    >{tx("\n                  የዳይሬክተር ፊርማ (Principal)\n                ")}</button>
                  </div>

                  {sigTab === 'teacher' ? (
                    <div className="space-y-4">
                      {teacherSig && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase">{tx("ያለው ፊርማ (Current Saved Signature)")}</p>
                          <img src={teacherSig} className="h-10 mx-auto object-contain border border-slate-200 rounded bg-white p-1" alt="Teacher Signature" />
                          <button
                            onClick={() => {
                              playInteractiveSound('click');
                              setTeacherSig('');
                              localStorage.removeItem('school_sig_teacher');
                            }}
                            className="text-[10px] font-black text-rose-600 hover:underline"
                          >{tx("\n                        🗑️ ፊርማ ሰርዝ (Delete)\n                      ")}</button>
                        </div>
                      )}
                      <SignaturePad 
                        title={tx("አዲስ የመምህር ፊርማ ይሳሉ (Draw New Teacher Signature)")}
                        onSave={(dataUrl) => {
                          playInteractiveSound('success');
                          setTeacherSig(dataUrl);
                          localStorage.setItem('school_sig_teacher', dataUrl);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {principalSig && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase">{tx("ያለው ፊርማ (Current Saved Signature)")}</p>
                          <img src={principalSig} className="h-10 mx-auto object-contain border border-slate-200 rounded bg-white p-1" alt="Principal Signature" />
                          <button
                            onClick={() => {
                              playInteractiveSound('click');
                              setPrincipalSig('');
                              localStorage.removeItem('school_sig_principal');
                            }}
                            className="text-[10px] font-black text-rose-600 hover:underline"
                          >{tx("\n                        🗑️ ፊርማ ሰርዝ (Delete)\n                      ")}</button>
                        </div>
                      )}
                      <SignaturePad 
                        title={tx("አዲስ የዳይሬክተር ፊርማ ይሳሉ (Draw New Principal Signature)")}
                        onSave={(dataUrl) => {
                          playInteractiveSound('success');
                          setPrincipalSig(dataUrl);
                          localStorage.setItem('school_sig_principal', dataUrl);
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => { playInteractiveSound('click'); setShowSignatureModal(false); }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer"
                  >{tx("\n                እሺ ተከናውኗል (Done)\n              ")}</button>
                </div>
              </div>
            </div>
          )}

          {/* Floating Action Button (FAB) for QR Scanner Attendance */}
          {onOpenQRScanner && (
            <div className="fixed bottom-6 right-6 z-40 print:hidden">
              <button
                id="grade-tracker-qr-scanner-fab"
                type="button"
                onClick={() => {
                  playInteractiveSound('click');
                  onOpenQRScanner();
                }}
                className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20 cursor-pointer"
                title={tx("የQR አቴንዳንስ መመዝገቢያ (Scan QR Attendance)")}
              >
                <div className="p-1 bg-white/20 rounded-full animate-pulse">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-black tracking-wide pr-1">
                  {tx("QR አቴንዳንስ (Quick Attendance)")}
                </span>
              </button>
            </div>
          )}
        </div>
      );
};

// SignaturePad Component for hand-drawn signature canvas drawing
const SignaturePad = ({ onSave, title }: { onSave: (dataUrl: string) => void; title: string }) => {
  const { tx } = useLanguage();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e1b4b'; // Deep indigo ink color
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Check if canvas is empty to avoid saving blank image
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-600">{title}</p>
      <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[120px] cursor-crosshair bg-slate-50 touch-none"
        />
        <div className="absolute bottom-2 right-2 pointer-events-none text-[9px] font-bold text-slate-400 bg-white/75 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200">{tx("\n          እዚህ ላይ ይፈርሙ (Draw here)\n        ")}</div>
      </div>
      <div className="flex flex-wrap gap-2 p-1.5 border border-slate-200 rounded-2xl bg-white/50 w-fit items-center">
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
        >{tx("\n          🗑️ አጽዳ (Clear)\n        ")}</button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black transition-colors"
        >{tx("\n          💾 ፊርማ አስቀምጥ (Save)\n        ")}</button>
      </div>
    </div>
  );
};
