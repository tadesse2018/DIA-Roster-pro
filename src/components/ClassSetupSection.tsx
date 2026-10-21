import React, { useState, useMemo } from 'react';
import { 
  PlusCircle, BookOpen, Layers, CheckSquare, Square, Edit2, Trash2, X, 
  AlertTriangle, Shield, User, Clock, Calendar, Save, Printer, Plus, 
  Check, Search, Sparkles, RefreshCw, ChevronRight, CheckCircle2
} from 'lucide-react';
import { ClassSetup, Teacher, WeeklySchedule, ClassSchedulePeriod, Student } from '../schoolData';
import { playInteractiveSound } from './AudioEngine';
import { useLanguage } from './LanguageContext';

interface ClassSetupSectionProps {
  classes: ClassSetup[];
  teachers?: Teacher[];
  students?: Student[];
  onAddClass: (classObj: ClassSetup) => void;
  onEditClass?: (classObj: ClassSetup) => void;
  onDeleteClass?: (id: string) => void;
  schoolConfig?: any;
  onUpdateSchoolConfig?: (newConfig: any) => void;
}

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

// Comprehensive Ethiopian Curriculum Subject Presets
export const ETHIOPIAN_CURRICULUM_PRESETS = [
  { name: 'Afaan Oromo', amh: 'አፋን ኦሮሞ (Afaan Oromoo)', icon: '🗣️' },
  { name: 'Moral Education', amh: 'ግብረገብ (Moral Education)', icon: '🕊️' },
  { name: 'Mathematics', amh: 'ሒሳብ (Mathematics)', icon: '📐' },
  { name: 'English', amh: 'እንግሊዝኛ (English)', icon: '📖' },
  { name: 'Amharic', amh: 'አማርኛ (Amharic)', icon: '🇪🇹' },
  { name: 'General Science', amh: 'አጠቃላይ ሳይንስ (General Science)', icon: '🔬' },
  { name: 'Environmental Science', amh: 'አካባቢ ሳይንስ (Env. Science)', icon: '🌱' },
  { name: 'Social Studies', amh: 'ህብረተሰብ ጥናት (Social Studies)', icon: '🌍' },
  { name: 'Citizenship', amh: 'ዜግነት / ስነ-ዜጋ (Citizenship)', icon: '⚖️' },
  { name: 'Information Technology', amh: 'ኢንፎርሜሽን ቴክኖሎጂ (IT)', icon: '💻' },
  { name: 'HPE', amh: 'የሰውነት ማጎልመሻ (HPE/Sport)', icon: '⚽' },
  { name: 'PVA', amh: 'ስነ-ጥበብና ሙዚቃ (Visual & Performing Arts)', icon: '🎨' },
  { name: 'Career & Tech', amh: 'የሙያና ቴክኒክ / ግብርና (CTE/Agri)', icon: '🌾' },
  { name: 'Physics', amh: 'ፊዚክስ (Physics)', icon: '⚛️' },
  { name: 'Chemistry', amh: 'ኬሚስትሪ (Chemistry)', icon: '🧪' },
  { name: 'Biology', amh: 'ባዮሎጂ (Biology)', icon: '🧬' },
  { name: 'Economics', amh: 'ኢኮኖሚክስ (Economics)', icon: '📊' },
  { name: 'History', amh: 'ታሪክ (History)', icon: '📜' },
  { name: 'Geography', amh: 'ጂኦግራፊ (Geography)', icon: '🗺️' },
  { name: 'Tigrigna', amh: 'ትግርኛ (Tigrigna)', icon: '🗣️' }
];

export const ClassSetupSection: React.FC<ClassSetupSectionProps> = ({ 
  classes, 
  teachers = [],
  students = [],
  onAddClass, 
  onEditClass,
  onDeleteClass,
  schoolConfig,
  onUpdateSchoolConfig
}) => {
  const { lang, t, tx } = useLanguage();
  
  // Tab switcher: 'classes' (Classes & Schedule) | 'subjects' (Dedicated Subjects by Grade/Class Manager)
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');

  const activeGradesList = schoolConfig?.schoolLevel === 'secondary'
    ? ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
    : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];

  // Registration states
  const [grade, setGrade] = useState(activeGradesList[0] || 'Grade 1');
  const [section, setSection] = useState('A');
  const [stream, setStream] = useState('General');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit class modal states
  const [editingClass, setEditingClass] = useState<ClassSetup | null>(null);
  const [editGrade, setEditGrade] = useState('');
  const [editSection, setEditSection] = useState('A');
  const [editStream, setEditStream] = useState('General');
  const [editSelectedSubjects, setEditSelectedSubjects] = useState<string[]>([]);
  const [customEditSubjectInput, setCustomEditSubjectInput] = useState('');

  // Delete class modal state
  const [deletingClass, setDeletingClass] = useState<ClassSetup | null>(null);

  // Schedule modal states
  const [schedulingClass, setSchedulingClass] = useState<ClassSetup | null>(null);
  const [localSchedule, setLocalSchedule] = useState<WeeklySchedule | null>(null);
  const [activeScheduleDay, setActiveScheduleDay] = useState<string>('Monday');

  // Homeroom filter state
  const [homeroomFilter, setHomeroomFilter] = useState<'all' | 'unassigned'>('all');

  // -------------------------------------------------------------
  // SUBJECT MANAGEMENT PER CLASS/GRADE STATES
  // -------------------------------------------------------------
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  
  // State for renaming a subject
  const [editingSubject, setEditingSubject] = useState<{
    classId: string;
    grade: string;
    section: string;
    oldName: string;
    newName: string;
    applyToAllSections: boolean;
  } | null>(null);

  // State for deleting a subject
  const [deletingSubject, setDeletingSubject] = useState<{
    classId: string;
    grade: string;
    section: string;
    subjectName: string;
    applyToAllSections: boolean;
  } | null>(null);

  // Quick inline add state per class card
  const [quickAddInputs, setQuickAddInputs] = useState<Record<string, { text: string; applyToAll: boolean }>>({});

  // Bulk Register subject across grade
  const [bulkGrade, setBulkGrade] = useState<string>(activeGradesList[0] || 'Grade 1');
  const [bulkSubjectText, setBulkSubjectText] = useState('');
  const [bulkScope, setBulkScope] = useState<'grade' | 'all'>('grade');

  // Sync default grade on schoolLevel change
  React.useEffect(() => {
    setGrade(activeGradesList[0] || 'Grade 1');
    setBulkGrade(activeGradesList[0] || 'Grade 1');
  }, [schoolConfig?.schoolLevel]);

  // Master available subjects list (combining schoolConfig, presets, and active classes)
  const availableSubjects = useMemo(() => {
    const list = new Set<string>();
    (schoolConfig?.subjects || [
      'Mathematics', 'English', 'Amharic', 'General Science', 
      'Social Studies', 'Citizenship', 'Information Technology', 'HPE'
    ]).forEach((s: string) => list.add(s));
    
    classes.forEach(c => {
      if (Array.isArray(c.subjects)) {
        c.subjects.forEach(s => list.add(s));
      }
    });

    ETHIOPIAN_CURRICULUM_PRESETS.forEach(p => list.add(p.name));
    return Array.from(list);
  }, [schoolConfig?.subjects, classes]);

  const handleSubjectToggle = (subject: string, isEdit: boolean = false) => {
    playInteractiveSound('click');
    if (isEdit) {
      if (editSelectedSubjects.includes(subject)) {
        setEditSelectedSubjects(editSelectedSubjects.filter(s => s !== subject));
      } else {
        setEditSelectedSubjects([...editSelectedSubjects, subject]);
      }
    } else {
      if (selectedSubjects.includes(subject)) {
        setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
      } else {
        setSelectedSubjects([...selectedSubjects, subject]);
      }
    }
  };

  // Add custom subject on the fly in create form
  const handleAddCustomSubjectToCreate = () => {
    const clean = customSubjectInput.trim();
    if (!clean) return;
    playInteractiveSound('success');
    if (!selectedSubjects.includes(clean)) {
      setSelectedSubjects(prev => [...prev, clean]);
    }
    setCustomSubjectInput('');
  };

  // Add custom subject on the fly in edit class modal
  const handleAddCustomSubjectToEdit = () => {
    const clean = customEditSubjectInput.trim();
    if (!clean) return;
    playInteractiveSound('success');
    if (!editSelectedSubjects.includes(clean)) {
      setEditSelectedSubjects(prev => [...prev, clean]);
    }
    setCustomEditSubjectInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubjects.length === 0) {
      alert(tx("እባክዎን ቢያንስ አንድ የትምህርት አይነት ይምረጡ (Select at least one subject)"));
      return;
    }

    // Check if class with same grade and section exists
    const duplicate = classes.find(c => c.grade === grade && c.section === section);
    if (duplicate) {
      alert(tx("ይህ ክፍል እና ሴክሽን ቀድሞ ተመዝግቧል (This Class and Section combo already exists)"));
      return;
    }

    const newClass: ClassSetup = {
      id: 'cls-' + Math.floor(1000 + Math.random() * 9000),
      grade,
      section,
      stream,
      subjects: selectedSubjects
    };

    playInteractiveSound('register');
    onAddClass(newClass);
    setSuccessMsg(`✅ የ ${grade} - ${section} ክፍል የትምህርት መመዝገቢያ በተሳካ ሁኔታ ተፈጥሯል!`);
    
    // Reset subjects
    setSelectedSubjects([]);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleOpenEdit = (cls: ClassSetup) => {
    playInteractiveSound('click');
    setEditingClass(cls);
    setEditGrade(cls.grade);
    setEditSection(cls.section);
    setEditStream(cls.stream || 'General');
    setEditSelectedSubjects(cls.subjects);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    if (editSelectedSubjects.length === 0) {
      alert(tx("እባክዎን ቢያንስ አንድ የትምህርት አይነት ይምረጡ (Select at least one subject)"));
      return;
    }

    // Check duplicate (ignore current item)
    const duplicate = classes.find(c => c.id !== editingClass.id && c.grade === editGrade && c.section === editSection);
    if (duplicate) {
      alert(tx("ይህ ክፍል እና ሴክሽን ቀድሞ ተመዝግቧል (This Class and Section combo already exists)"));
      return;
    }

    const updatedClass: ClassSetup = {
      ...editingClass,
      grade: editGrade,
      section: editSection,
      stream: editStream,
      subjects: editSelectedSubjects
    };

    onEditClass?.(updatedClass);
    playInteractiveSound('register');
    setEditingClass(null);
  };

  const handleOpenDelete = (cls: ClassSetup) => {
    playInteractiveSound('wrong');
    setDeletingClass(cls);
  };

  const handleDeleteConfirm = () => {
    if (deletingClass && onDeleteClass) {
      onDeleteClass(deletingClass.id);
      playInteractiveSound('click');
      setDeletingClass(null);
    }
  };

  // -------------------------------------------------------------
  // SUBJECT REGISTER, EDIT & DELETE HANDLERS
  // -------------------------------------------------------------

  // 1. ADD / REGISTER A SUBJECT TO A CLASS
  const handleAddSubjectToClass = (targetClass: ClassSetup, subjectName: string, applyToAllSections: boolean = false) => {
    const clean = subjectName.trim();
    if (!clean) return;

    playInteractiveSound('register');

    if (applyToAllSections) {
      // Find all classes matching this grade
      const targetClasses = classes.filter(c => c.grade === targetClass.grade);
      targetClasses.forEach(cls => {
        if (!cls.subjects.includes(clean)) {
          const updated: ClassSetup = {
            ...cls,
            subjects: [...cls.subjects, clean]
          };
          onEditClass?.(updated);
        }
      });
      setSuccessMsg(`✅ የትምህርት አይነት "${clean}" ለሁሉም የ${targetClass.grade} ሴክሽኖች ተመዝግቧል!`);
    } else {
      if (targetClass.subjects.includes(clean)) {
        alert(tx(`የትምህርት አይነት "${clean}" ቀድሞ በዚህ ክፍል ተመዝግቧል!`));
        return;
      }
      const updated: ClassSetup = {
        ...targetClass,
        subjects: [...targetClass.subjects, clean]
      };
      onEditClass?.(updated);
      setSuccessMsg(`✅ የትምህርት አይነት "${clean}" ለ ${targetClass.grade} - ${targetClass.section} ተመዝግቧል!`);
    }

    // Optionally update schoolConfig.subjectsByGrade
    if (onUpdateSchoolConfig && schoolConfig) {
      const existingGradeSubjects = schoolConfig.subjectsByGrade?.[targetClass.grade] || schoolConfig.subjects || [];
      if (!existingGradeSubjects.includes(clean)) {
        onUpdateSchoolConfig({
          ...schoolConfig,
          subjectsByGrade: {
            ...(schoolConfig.subjectsByGrade || {}),
            [targetClass.grade]: [...existingGradeSubjects, clean]
          },
          subjects: Array.from(new Set([...(schoolConfig.subjects || []), clean]))
        });
      }
    }

    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // 2. EDIT / RENAME A SUBJECT IN A CLASS OR GRADE
  const handleConfirmRenameSubject = () => {
    if (!editingSubject) return;
    const { classId, grade: targetGrade, section: targetSection, oldName, newName, applyToAllSections } = editingSubject;
    const clean = newName.trim();
    if (!clean) {
      alert(tx("እባክዎን ትክክለኛ የትምህርት አይነት ስም ያስገቡ!"));
      return;
    }

    if (clean === oldName) {
      setEditingSubject(null);
      return;
    }

    playInteractiveSound('register');

    if (applyToAllSections) {
      const targetClasses = classes.filter(c => c.grade === targetGrade);
      targetClasses.forEach(cls => {
        if (cls.subjects.includes(oldName)) {
          const updatedSubjects = cls.subjects.map(s => s === oldName ? clean : s);
          // Also update schedule if applicable
          let updatedSchedule = cls.schedule;
          if (cls.schedule) {
            const nextSched: WeeklySchedule = {};
            Object.entries(cls.schedule).forEach(([day, periods]) => {
              nextSched[day] = (periods as ClassSchedulePeriod[]).map(p => p.subject === oldName ? { ...p, subject: clean } : p);
            });
            updatedSchedule = nextSched;
          }

          onEditClass?.({
            ...cls,
            subjects: updatedSubjects,
            schedule: updatedSchedule
          });
        }
      });
      setSuccessMsg(`✅ የትምህርት አይነት ስም ወደ "${clean}" በሁሉም የ${targetGrade} ሴክሽኖች ተቀይሯል!`);
    } else {
      const targetClass = classes.find(c => c.id === classId);
      if (targetClass) {
        const updatedSubjects = targetClass.subjects.map(s => s === oldName ? clean : s);
        let updatedSchedule = targetClass.schedule;
        if (targetClass.schedule) {
          const nextSched: WeeklySchedule = {};
          Object.entries(targetClass.schedule).forEach(([day, periods]) => {
            nextSched[day] = (periods as ClassSchedulePeriod[]).map(p => p.subject === oldName ? { ...p, subject: clean } : p);
          });
          updatedSchedule = nextSched;
        }

        onEditClass?.({
          ...targetClass,
          subjects: updatedSubjects,
          schedule: updatedSchedule
        });
        setSuccessMsg(`✅ የትምህርት አይነት ስም ወደ "${clean}" ለ ${targetGrade} - ${targetSection} ተቀይሯል!`);
      }
    }

    // Sync schoolConfig.subjectsByGrade
    if (onUpdateSchoolConfig && schoolConfig) {
      const existingGradeSubs = schoolConfig.subjectsByGrade?.[targetGrade] || [];
      if (existingGradeSubs.includes(oldName)) {
        onUpdateSchoolConfig({
          ...schoolConfig,
          subjectsByGrade: {
            ...(schoolConfig.subjectsByGrade || {}),
            [targetGrade]: existingGradeSubs.map((s: string) => s === oldName ? clean : s)
          }
        });
      }
    }

    setEditingSubject(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // 3. DELETE / REMOVE A SUBJECT FROM A CLASS OR GRADE
  const handleConfirmDeleteSubject = () => {
    if (!deletingSubject) return;
    const { classId, grade: targetGrade, section: targetSection, subjectName, applyToAllSections } = deletingSubject;

    playInteractiveSound('wrong');

    if (applyToAllSections) {
      const targetClasses = classes.filter(c => c.grade === targetGrade);
      targetClasses.forEach(cls => {
        if (cls.subjects.includes(subjectName)) {
          const updatedSubjects = cls.subjects.filter(s => s !== subjectName);
          // Also clear from schedule
          let updatedSchedule = cls.schedule;
          if (cls.schedule) {
            const nextSched: WeeklySchedule = {};
            Object.entries(cls.schedule).forEach(([day, periods]) => {
              nextSched[day] = (periods as ClassSchedulePeriod[]).map(p => p.subject === subjectName ? { ...p, subject: '', teacherId: undefined, teacherName: undefined } : p);
            });
            updatedSchedule = nextSched;
          }

          onEditClass?.({
            ...cls,
            subjects: updatedSubjects,
            schedule: updatedSchedule
          });
        }
      });
      setSuccessMsg(`🗑️ የትምህርት አይነት "${subjectName}" ከሁሉም የ${targetGrade} ሴክሽኖች ተሰርዟል!`);
    } else {
      const targetClass = classes.find(c => c.id === classId);
      if (targetClass) {
        const updatedSubjects = targetClass.subjects.filter(s => s !== subjectName);
        let updatedSchedule = targetClass.schedule;
        if (targetClass.schedule) {
          const nextSched: WeeklySchedule = {};
          Object.entries(targetClass.schedule).forEach(([day, periods]) => {
            nextSched[day] = (periods as ClassSchedulePeriod[]).map(p => p.subject === subjectName ? { ...p, subject: '', teacherId: undefined, teacherName: undefined } : p);
          });
          updatedSchedule = nextSched;
        }

        onEditClass?.({
          ...targetClass,
          subjects: updatedSubjects,
          schedule: updatedSchedule
        });
        setSuccessMsg(`🗑️ የትምህርት አይነት "${subjectName}" ከ ${targetGrade} - ${targetSection} ተሰርዟል!`);
      }
    }

    setDeletingSubject(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // 4. BULK REGISTER SUBJECT ACROSS GRADE OR SCHOOL
  const handleBulkRegisterSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = bulkSubjectText.trim();
    if (!clean) return;

    playInteractiveSound('register');

    if (bulkScope === 'grade') {
      const targetClasses = classes.filter(c => c.grade === bulkGrade);
      if (targetClasses.length === 0) {
        alert(tx(`በ ${bulkGrade} ስር የተመዘገበ ክፍል አልተገኘም!`));
        return;
      }
      targetClasses.forEach(cls => {
        if (!cls.subjects.includes(clean)) {
          onEditClass?.({
            ...cls,
            subjects: [...cls.subjects, clean]
          });
        }
      });
      setSuccessMsg(`✅ የትምህርት አይነት "${clean}" ለሁሉም የ${bulkGrade} ሴክሽኖች (${targetClasses.length} ክፍሎች) ተመዝግቧል!`);
    } else {
      // All classes in school
      classes.forEach(cls => {
        if (!cls.subjects.includes(clean)) {
          onEditClass?.({
            ...cls,
            subjects: [...cls.subjects, clean]
          });
        }
      });
      setSuccessMsg(`✅ የትምህርት አይነት "${clean}" ለትምህርት ቤቱ ሁሉም ክፍሎች (${classes.length} ክፍሎች) ተመዝግቧል!`);
    }

    // Sync schoolConfig
    if (onUpdateSchoolConfig && schoolConfig) {
      onUpdateSchoolConfig({
        ...schoolConfig,
        subjects: Array.from(new Set([...(schoolConfig.subjects || []), clean])),
        ...(bulkScope === 'grade' ? {
          subjectsByGrade: {
            ...(schoolConfig.subjectsByGrade || {}),
            [bulkGrade]: Array.from(new Set([...(schoolConfig.subjectsByGrade?.[bulkGrade] || []), clean]))
          }
        } : {})
      });
    }

    setBulkSubjectText('');
    setTimeout(() => setSuccessMsg(null), 4500);
  };

  // Schedule config opener
  const handleOpenScheduleConfig = (cls: ClassSetup) => {
    playInteractiveSound('click');
    setSchedulingClass(cls);
    const initialSchedule = cls.schedule ? JSON.parse(JSON.stringify(cls.schedule)) : {};
    setLocalSchedule(initialSchedule);
    setActiveScheduleDay('Monday');
  };

  const handleSaveSchedule = () => {
    if (!schedulingClass || !localSchedule) return;

    const updatedClass: ClassSetup = {
      ...schedulingClass,
      schedule: localSchedule
    };

    onEditClass?.(updatedClass);
    playInteractiveSound('register');
    setSchedulingClass(null);
    setLocalSchedule(null);
  };

  const handlePeriodChange = (day: string, periodNumber: number, field: 'subject' | 'teacherName', value: string) => {
    if (!localSchedule) return;

    const timesMap: { [key: number]: { start: string, end: string } } = {
      1: { start: '08:30', end: '09:15' },
      2: { start: '09:15', end: '10:00' },
      3: { start: '10:00', end: '10:45' },
      4: { start: '11:15', end: '12:00' },
      5: { start: '12:00', end: '12:45' },
      6: { start: '14:00', end: '14:45' },
      7: { start: '14:45', end: '15:30' },
      8: { start: '15:30', end: '16:15' },
    };
    const { start, end } = timesMap[periodNumber] || { start: '', end: '' };

    const newSchedule = { ...localSchedule };
    if (!newSchedule[day]) {
      newSchedule[day] = [];
    }

    const existingPeriodIndex = newSchedule[day].findIndex(p => p.periodNumber === periodNumber);

    if (existingPeriodIndex >= 0) {
      const existingPeriod = { ...newSchedule[day][existingPeriodIndex] };
      existingPeriod[field] = value;
      if (!existingPeriod.startTime) existingPeriod.startTime = start;
      if (!existingPeriod.endTime) existingPeriod.endTime = end;

      if (field === 'subject' && !value) {
        existingPeriod.teacherId = undefined;
        existingPeriod.teacherName = undefined;
      }

      if (field === 'subject' && value) {
        const matchingTeacher = teachers.find(t => 
          Array.isArray(t.subjects) && t.subjects.includes(value) && 
          t.assignedClass === schedulingClass?.grade && 
          t.assignedSection === schedulingClass?.section
        );
        if (matchingTeacher) {
          existingPeriod.teacherId = matchingTeacher.id;
          existingPeriod.teacherName = matchingTeacher.name;
        } else {
          const generalTeacher = teachers.find(t => Array.isArray(t.subjects) && t.subjects.includes(value));
          if (generalTeacher) {
            existingPeriod.teacherId = generalTeacher.id;
            existingPeriod.teacherName = generalTeacher.name;
          } else {
            existingPeriod.teacherId = undefined;
            existingPeriod.teacherName = undefined;
          }
        }
      }

      if (field === 'teacherName') {
        const teacherObj = teachers.find(t => t.name === value);
        if (teacherObj) {
          existingPeriod.teacherId = teacherObj.id;
        } else {
          existingPeriod.teacherId = undefined;
        }
      }

      newSchedule[day][existingPeriodIndex] = existingPeriod;
    } else {
      const newPeriod: ClassSchedulePeriod = {
        periodNumber,
        startTime: start,
        endTime: end,
        subject: field === 'subject' ? value : '',
        teacherName: field === 'teacherName' ? value : undefined,
      };

      if (field === 'subject' && value) {
        const matchingTeacher = teachers.find(t => 
          Array.isArray(t.subjects) && t.subjects.includes(value) && 
          t.assignedClass === schedulingClass?.grade && 
          t.assignedSection === schedulingClass?.section
        );
        if (matchingTeacher) {
          newPeriod.teacherId = matchingTeacher.id;
          newPeriod.teacherName = matchingTeacher.name;
        } else {
          const generalTeacher = teachers.find(t => Array.isArray(t.subjects) && t.subjects.includes(value));
          if (generalTeacher) {
            newPeriod.teacherId = generalTeacher.id;
            newPeriod.teacherName = generalTeacher.name;
          }
        }
      }

      if (field === 'teacherName' && value) {
        const teacherObj = teachers.find(t => t.name === value);
        if (teacherObj) {
          newPeriod.teacherId = teacherObj.id;
        }
      }

      newSchedule[day].push(newPeriod);
    }

    setLocalSchedule(newSchedule);
  };

  // Filtered classes for the Subjects view
  const filteredClassesForSubjects = useMemo(() => {
    return classes.filter(cls => {
      const matchGrade = selectedGradeFilter === 'all' || cls.grade === selectedGradeFilter;
      const matchQuery = !subjectSearchQuery || 
        cls.grade.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
        cls.section.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
        (Array.isArray(cls.subjects) && cls.subjects.some(s => s.toLowerCase().includes(subjectSearchQuery.toLowerCase())));
      return matchGrade && matchQuery;
    });
  }, [classes, selectedGradeFilter, subjectSearchQuery]);

  return (
    <div className="space-y-6" id="class-setup-module">

      {/* TOP SUB-TAB NAVIGATION BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => { playInteractiveSound('click'); setActiveTab('classes'); }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-900'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{tx("የክፍሎች ውቅርና ሰሌዳ (Class Setups & Schedule)")}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              activeTab === 'classes' ? 'bg-indigo-500/50 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {classes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { playInteractiveSound('click'); setActiveTab('subjects'); }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-200 dark:ring-purple-900'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{tx("የትምህርት አይነቶች በየክፍሉ (Subjects by Grade & Class)")}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
              activeTab === 'subjects' ? 'bg-purple-500/50 text-white' : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
            }`}>
              {availableSubjects.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium px-2">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>{tx("የትምህርት አይነቶችን በየክፍሉ መመዝገብ፣ ማስተካከል (Edit) እና ማጥፋት")}</span>
        </div>
      </div>

      {/* Global Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs font-black rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CLASSES & SCHEDULE VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Subject Registration Form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xs">
            <div>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {tx("ርዕሰ መምህር ተግባር")}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5 mt-2">
                <PlusCircle className="text-indigo-600 w-5 h-5" />
                <span>{tx("በክፍል የትምህርት መመዝገቢያ ፎርም")}</span>
              </h3>
              <p className="text-slate-400 text-xs">{tx("Configure grade levels, streams, and academic subjects")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{tx("ክፍል (Grade Level):")}</label>
                  <select 
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                  >
                    {activeGradesList.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{tx("ሴክሽን (Section):")}</label>
                  <select 
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                  >
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                    <option>D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{tx("የትምህርት ዘርፍ (Stream):")}</label>
                <select 
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                >
                  <option value="General">{tx("ጠቅላላ (General)")}</option>
                  <option value="Natural Science">{tx("የተፈጥሮ ሳይንስ (Natural Science)")}</option>
                  <option value="Social Science">{tx("የማህበራዊ ሳይንስ (Social Science)")}</option>
                </select>
              </div>

              {/* QUICK ADD CUSTOM SUBJECT IN FORM */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tx("➕ አዲስ የትምህርት አይነት ጨምር (Add Custom Subject):")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSubjectToCreate(); }}}
                    placeholder={tx("የትምህርት አይነት ስም (ለምሳሌ፦ IT፣ ስፖርት...)")}
                    className="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubjectToCreate}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
                  >
                    {tx("➕ ጨምር")}
                  </button>
                </div>
              </div>

              {/* CHECKBOXES FOR SUBJECT LIST SELECTION */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    {tx("የትምህርት አይነቶች (Select Academic Subjects):")}
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedSubjects.length} {tx("ተመርጠዋል")}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 max-h-52 overflow-y-auto">
                  {availableSubjects.map((sub) => {
                    const isChecked = selectedSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleSubjectToggle(sub, false)}
                        className={`flex items-center gap-2 text-left p-2 rounded-xl text-xs transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black rounded-2xl text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                {tx("➕ የክፍል ትምህርት ፍጠር (Create Class Setup)")}
              </button>
            </form>
          </div>

          {/* Class List Table */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="text-indigo-600 w-5 h-5" />
                  <span>{tx("በክፍል የትምህርት ምዝገባዎች ዝርዝር")}</span>
                </h3>
                <p className="text-slate-400 text-xs">{tx("Currently Configured Class academic configurations")}</p>
              </div>
              
              {/* Homeroom filter control */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-stretch sm:self-auto text-xs font-semibold gap-1">
                <button
                  type="button"
                  onClick={() => { playInteractiveSound('click'); setHomeroomFilter('all'); }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    homeroomFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <span>{tx("ሁሉም ክፍሎች (")}{classes.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => { playInteractiveSound('click'); setHomeroomFilter('unassigned'); }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    homeroomFilter === 'unassigned'
                      ? 'bg-amber-500 text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-amber-600 dark:text-slate-400'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{tx("ያልተመደቡ ብቻ (")}{classes.filter(cls => !teachers.some(t => t.isHomeroomTeacher && t.assignedClass === cls.grade && t.assignedSection === cls.section)).length})</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                    <th className="p-3 border-b border-slate-100 dark:border-slate-800">{tx("የክፍል ኮድ")}</th>
                    <th className="p-3 border-b border-slate-100 dark:border-slate-800">{tx("ክፍል እና ሴክሽን")}</th>
                    <th className="p-3 border-b border-slate-100 dark:border-slate-800 text-center">{tx("ተማሪ ብዛት")}</th>
                    <th className="p-3 border-b border-slate-100 dark:border-slate-800">{tx("ዘርፍ (Stream)")}</th>
                    <th className="p-3 border-b border-slate-100 dark:border-slate-800">{tx("የተመደቡ የትምህርት አይነቶች")}</th>
                    <th className="p-3 border-b border-slate-100 dark:border-slate-800">{tx("የክፍል ኃላፊ")}</th>
                    <th className="p-3 border-b border-slate-100 dark:border-slate-800 text-center">{tx("እርምጃዎች")}</th>
                  </tr>
                </thead>
                <tbody>
                  {classes
                    .map(cls => {
                      const homeroomTeacher = teachers.find(t => 
                        t.isHomeroomTeacher && 
                        t.assignedClass === cls.grade && 
                        t.assignedSection === cls.section
                      );
                      return { ...cls, homeroomTeacher };
                    })
                    .filter(cls => {
                      if (homeroomFilter === 'unassigned') {
                        return !cls.homeroomTeacher;
                      }
                      return true;
                    })
                    .map((cls) => (
                      <tr key={cls.id} className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-400 text-xs">{cls.id}</td>
                        <td className="p-3 font-black text-slate-900 dark:text-white">
                          {cls.grade} - {cls.section}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-black">
                            {students.filter(s => s.grade === cls.grade && s.section === cls.section).length}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md text-xs font-semibold">
                            {cls.stream}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {cls.subjects.map((sub, idx) => (
                              <span 
                                key={idx} 
                                className="group relative bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-[10.5px] px-2 py-0.5 rounded-lg text-slate-700 dark:text-slate-300 font-bold border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1 transition-all"
                              >
                                <span>{sub}</span>
                                {/* Quick Edit Subject Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playInteractiveSound('click');
                                    setEditingSubject({
                                      classId: cls.id,
                                      grade: cls.grade,
                                      section: cls.section,
                                      oldName: sub,
                                      newName: sub,
                                      applyToAllSections: false
                                    });
                                  }}
                                  className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                  title={tx(`"${sub}" ስም ቀይር (Edit)`)}
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                                {/* Quick Delete Subject Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playInteractiveSound('wrong');
                                    setDeletingSubject({
                                      classId: cls.id,
                                      grade: cls.grade,
                                      section: cls.section,
                                      subjectName: sub,
                                      applyToAllSections: false
                                    });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title={tx(`"${sub}" አጥፋ (Delete)`)}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}

                            {/* Quick Add Subject button in table */}
                            <button
                              type="button"
                              onClick={() => {
                                playInteractiveSound('click');
                                setActiveTab('subjects');
                                setSelectedGradeFilter(cls.grade);
                              }}
                              className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-bold border border-dashed border-indigo-300 dark:border-indigo-700 cursor-pointer flex items-center gap-0.5"
                              title={tx("አዲስ ትምህርት ጨምር (Add Subject)")}
                            >
                              <Plus className="w-3 h-3" />
                              <span>{tx("ትምህርት")}</span>
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          {cls.homeroomTeacher ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 max-w-max">
                              <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{cls.homeroomTeacher.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 max-w-max">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{tx("ያልተመደበ (Unassigned)")}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              onClick={() => handleOpenScheduleConfig(cls)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-colors cursor-pointer"
                              title={tx("የሳምንት ክፍለ ጊዜ ሰሌዳ (Weekly Schedule)")}
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(cls)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors cursor-pointer"
                              title={tx("ማስተካከል (Edit Class)")}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(cls)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                              title={tx("ማጥፋት (Delete Class)")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {classes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">{tx("ምንም ክፍል አልተዋቀረም (No class setups found)")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEDICATED SUBJECTS BY GRADE & CLASS MANAGER */}
      {/* ========================================================================= */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">

          {/* BULK SUBJECT REGISTRATION BAR */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 rounded-3xl text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    {tx("ፈጣን የትምህርት ምዝገባ")}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>{tx("አዲስ የትምህርት አይነት በየክፍሉ መመዝገቢያ (Register Subjects)")}</span>
                </h3>
                <p className="text-xs text-indigo-200/80 max-w-xl">
                  {tx("አዲስ የትምህርት አይነት በቀላሉ ይጻፉ፤ ለተመረጠው የክፍል ደረጃ በሁሉም ሴክሽኖች ወይም ለጠቅላላ ትምህርት ቤቱ በአንድ ጠቅታ ይመዝግቡ።")}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleBulkRegisterSubject} className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-2 bg-indigo-950/80 p-1.5 rounded-2xl border border-indigo-700/60">
                  <select
                    value={bulkGrade}
                    onChange={(e) => setBulkGrade(e.target.value)}
                    disabled={bulkScope === 'all'}
                    className="p-2 rounded-xl text-xs font-bold bg-indigo-900 text-white outline-none border border-indigo-700"
                  >
                    {activeGradesList.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>

                  <select
                    value={bulkScope}
                    onChange={(e) => setBulkScope(e.target.value as any)}
                    className="p-2 rounded-xl text-xs font-bold bg-indigo-900 text-white outline-none border border-indigo-700"
                  >
                    <option value="grade">{tx("ለሁሉም የዚህ ክፍል ሴክሽኖች")}</option>
                    <option value="all">{tx("ለትምህርት ቤቱ ሁሉም ክፍሎች")}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={bulkSubjectText}
                    onChange={(e) => setBulkSubjectText(e.target.value)}
                    placeholder={tx("የትምህርት አይነት ስም (ለምሳሌ፦ IT፣ ስፖርት...)")}
                    className="p-3 rounded-2xl text-xs font-bold bg-white text-slate-900 placeholder:text-slate-400 outline-none min-w-[220px]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-md cursor-pointer whitespace-nowrap"
                  >
                    {tx("➕ መዝግብ (Register)")}
                  </button>
                </div>
              </form>
            </div>

            {/* Curriculum Preset Quick Click Chips */}
            <div className="mt-4 pt-4 border-t border-indigo-800/40 relative z-10 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-indigo-300 mr-2 flex items-center gap-1">
                <span>{tx("የተለመዱ የኢትዮጵያ ስርዓተ-ትምህርት አይነቶች:")}</span>
              </span>
              {ETHIOPIAN_CURRICULUM_PRESETS.slice(0, 11).map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setBulkSubjectText(preset.name)}
                  className="px-2.5 py-1 bg-indigo-800/40 hover:bg-indigo-700/60 text-indigo-200 text-xs font-semibold rounded-xl border border-indigo-700/40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FILTER AND SEARCH CONTROLS */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Grade Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 mr-1">{tx("ክፍል ይምረጡ:")}</span>
              <button
                type="button"
                onClick={() => { playInteractiveSound('click'); setSelectedGradeFilter('all'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGradeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tx("ሁሉም ክፍሎች")}
              </button>
              {activeGradesList.map(g => {
                const count = classes.filter(c => c.grade === g).length;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => { playInteractiveSound('click'); setSelectedGradeFilter(g); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedGradeFilter === g
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{g}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={subjectSearchQuery}
                onChange={(e) => setSubjectSearchQuery(e.target.value)}
                placeholder={tx("ትምህርት ወይም ክፍል ይፈልጉ...")}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* CLASS-BY-CLASS SUBJECT MANAGEMENT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClassesForSubjects.map(cls => {
              const classStudents = students.filter(s => s.grade === cls.grade && s.section === cls.section);
              const inlineInput = quickAddInputs[cls.id] || { text: '', applyToAll: false };

              return (
                <div 
                  key={cls.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-black text-indigo-700 dark:text-indigo-300 text-sm">
                          {cls.section}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white text-base">
                            {cls.grade} - {cls.section}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>{cls.stream}</span>
                            <span>•</span>
                            <span>{classStudents.length} {tx("ተማሪዎች")}</span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {cls.subjects.length} {tx("ትምህርቶች")}
                      </span>
                    </div>

                    {/* Quick Inline Register Input for This Class */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inlineInput.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuickAddInputs(prev => ({
                              ...prev,
                              [cls.id]: { ...prev[cls.id], text: val }
                            }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubjectToClass(cls, inlineInput.text, inlineInput.applyToAll);
                              setQuickAddInputs(prev => ({
                                ...prev,
                                [cls.id]: { text: '', applyToAll: false }
                              }));
                            }
                          }}
                          placeholder={tx(`አዲስ ትምህርት ለ ${cls.grade}-${cls.section}...`)}
                          className="flex-1 p-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 outline-none focus:border-indigo-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleAddSubjectToClass(cls, inlineInput.text, inlineInput.applyToAll);
                            setQuickAddInputs(prev => ({
                              ...prev,
                              [cls.id]: { text: '', applyToAll: false }
                            }));
                          }}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                        >
                          {tx("➕ መዝግብ")}
                        </button>
                      </div>

                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inlineInput.applyToAll}
                          onChange={(e) => {
                            const chk = e.target.checked;
                            setQuickAddInputs(prev => ({
                              ...prev,
                              [cls.id]: { ...(prev[cls.id] || { text: '' }), applyToAll: chk }
                            }));
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span>{tx(`ለሁሉም የ${cls.grade} ሴክሽኖች ይጨመር`)}</span>
                      </label>
                    </div>

                    {/* Active Subjects List with Edit and Delete */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                        {tx("የክፍሉ ትምህርቶች (Subjects):")}
                      </span>
                      
                      <div className="flex flex-wrap gap-1.5 min-h-[90px] max-h-56 overflow-y-auto p-1">
                        {cls.subjects.map(sub => {
                          const preset = ETHIOPIAN_CURRICULUM_PRESETS.find(p => p.name.toLowerCase() === sub.toLowerCase());
                          const icon = preset?.icon || '📚';

                          return (
                            <div
                              key={sub}
                              className="group flex items-center gap-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-2xs"
                            >
                              <span>{icon}</span>
                              <span className="font-extrabold">{sub}</span>

                              <div className="flex items-center gap-0.5 ml-1 border-l border-slate-300 dark:border-slate-600 pl-1">
                                {/* Edit / Rename Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    playInteractiveSound('click');
                                    setEditingSubject({
                                      classId: cls.id,
                                      grade: cls.grade,
                                      section: cls.section,
                                      oldName: sub,
                                      newName: sub,
                                      applyToAllSections: false
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer transition-colors"
                                  title={tx(`"${sub}" ስም ቀይር (Edit / Rename)`)}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>

                                {/* Delete / Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    playInteractiveSound('wrong');
                                    setDeletingSubject({
                                      classId: cls.id,
                                      grade: cls.grade,
                                      section: cls.section,
                                      subjectName: sub,
                                      applyToAllSections: false
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                                  title={tx(`"${sub}" አጥፋ (Delete)`)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {cls.subjects.length === 0 && (
                          <div className="w-full text-center py-6 text-slate-400 text-xs italic">
                            {tx("በዚህ ክፍል ምንም የትምህርት አይነት አልተመዘገበም")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggestion of missing common subjects */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      {tx("በ1-ጠቅታ ጨምር (Quick Add):")}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {ETHIOPIAN_CURRICULUM_PRESETS.filter(p => !cls.subjects.includes(p.name)).slice(0, 4).map(preset => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleAddSubjectToClass(cls, preset.name, false)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-2.5 h-2.5 text-indigo-600" />
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredClassesForSubjects.length === 0 && (
              <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <h4 className="font-bold text-base text-slate-700 dark:text-slate-300">{tx("ምንም የተመረጠ ክፍል አልተገኘም")}</h4>
                <p className="text-xs">{tx("እባክዎን ከላይ ያለውን የክፍል መምረጫ ወይም መፈለጊያ ይቀይሩ።")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT / RENAME SUBJECT (የትምህርት አይነት ስም ማስተካከያ) */}
      {/* ========================================================================= */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-100 dark:border-indigo-900/60 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-black text-sm">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>{tx("የትምህርት አይነት ስም ማስተካከያ (Edit Subject)")}</span>
              </div>
              <button 
                onClick={() => { playInteractiveSound('click'); setEditingSubject(null); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleConfirmRenameSubject(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{tx("የአሁኑ ስም (Current Name):")}</label>
                <input
                  type="text"
                  value={editingSubject.oldName}
                  disabled
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {tx("አዲስ የትምህርት አይነት ስም (New Subject Name):")}
                </label>
                <input
                  type="text"
                  value={editingSubject.newName}
                  onChange={(e) => setEditingSubject({ ...editingSubject, newName: e.target.value })}
                  autoFocus
                  required
                  placeholder={tx("አዲስ ስም ይጻፉ...")}
                  className="w-full p-3 rounded-xl border border-indigo-500 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none ring-2 ring-indigo-200 dark:ring-indigo-900"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSubject.applyToAllSections}
                    onChange={(e) => setEditingSubject({ ...editingSubject, applyToAllSections: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>{tx(`በሁሉም የ${editingSubject.grade} ሴክሽኖች ስሙ ይቀየር`)}</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-1 pl-5">
                  {tx("ያልተመረጠ ከሆነ ለዚህ ሴክሽን ብቻ ስሙ ይቀየራል።")}
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { playInteractiveSound('click'); setEditingSubject(null); }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {tx("ይቅር (Cancel)")}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  {tx("💾 ስም ቀይር (Save Changes)")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DELETE SUBJECT CONFIRMATION (የትምህርት አይነት ማጥፊያ ማረጋገጫ) */}
      {/* ========================================================================= */}
      {deletingSubject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-rose-50 dark:bg-rose-950/60 border-b border-rose-100 dark:border-rose-900/60 px-6 py-4 flex items-center gap-2 text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-extrabold text-xs uppercase tracking-wider">{tx("የትምህርት አይነት ማጥፊያ ማረጋገጫ")}</span>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-800 dark:text-slate-200 text-xs font-bold leading-relaxed">
                {tx("የትምህርት አይነት ")}<strong className="text-rose-600 text-sm font-black">"{deletingSubject.subjectName}"</strong>{tx("ን ከ ")}
                <strong className="text-slate-900 dark:text-white">{deletingSubject.grade} - {deletingSubject.section}</strong> {tx("ማጥፋት ይፈልጋሉ?")}
              </p>

              <div className="p-3 bg-rose-50/50 dark:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/60">
                <label className="flex items-center gap-2 text-xs font-bold text-rose-900 dark:text-rose-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deletingSubject.applyToAllSections}
                    onChange={(e) => setDeletingSubject({ ...deletingSubject, applyToAllSections: e.target.checked })}
                    className="rounded text-rose-600"
                  />
                  <span>{tx(`ከሁሉም የ${deletingSubject.grade} ሴክሽኖች ይጥፋ`)}</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { playInteractiveSound('click'); setDeletingSubject(null); }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {tx("አይ፣ ይቅር (Cancel)")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSubject}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  {tx("🗑️ አዎ፣ አጥፋ (Delete)")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT CLASS MODAL */}
      {/* ========================================================================= */}
      {editingClass && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <span className="font-black text-slate-800 dark:text-white text-sm">{tx("የክፍል መረጃ ማስተካከያ (Edit Class Setup)")}</span>
              <button 
                onClick={() => { playInteractiveSound('click'); setEditingClass(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{tx("ክፍል (Grade):")}</label>
                  <select 
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                  >
                    {activeGradesList.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{tx("ሴክሽን (Section):")}</label>
                  <select 
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                  >
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                    <option>D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">{tx("የትምህርት ዘርፍ (Stream):")}</label>
                <select 
                  value={editStream}
                  onChange={(e) => setEditStream(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                >
                  <option value="General">{tx("ጠቅላላ (General)")}</option>
                  <option value="Natural Science">{tx("የተፈጥሮ ሳይንስ (Natural Science)")}</option>
                  <option value="Social Science">{tx("የማህበራዊ ሳይንስ (Social Science)")}</option>
                </select>
              </div>

              {/* Quick Add Custom Subject in Edit Modal */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tx("➕ አዲስ የትምህርት አይነት ጨምር (Add Custom Subject):")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customEditSubjectInput}
                    onChange={(e) => setCustomEditSubjectInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSubjectToEdit(); }}}
                    placeholder={tx("የትምህርት አይነት ስም...")}
                    className="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubjectToEdit}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
                  >
                    {tx("➕ ጨምር")}
                  </button>
                </div>
              </div>

              {/* CURRENT SUBJECTS CHIPS */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 font-sans">
                    {tx("የተመረጡ የትምህርት አይነቶች:")}
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600">
                    {editSelectedSubjects.length} {tx("ትምህርቶች")}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 max-h-36 overflow-y-auto">
                  {editSelectedSubjects.map(sub => (
                    <span 
                      key={sub}
                      className="bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => setEditSelectedSubjects(editSelectedSubjects.filter(s => s !== sub))}
                        className="text-indigo-400 hover:text-rose-600 cursor-pointer"
                        title={tx("አስወግድ")}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {editSelectedSubjects.length === 0 && (
                    <span className="text-xs text-slate-400 italic">{tx("ምንም አልተመረጠም")}</span>
                  )}
                </div>
              </div>

              {/* CHECKBOXES FOR ALL AVAILABLE SUBJECTS */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 font-sans">
                  {tx("ከዝርዝር ይምረጡ (Toggle Subjects):")}
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 max-h-40 overflow-y-auto">
                  {availableSubjects.map((sub) => {
                    const isChecked = editSelectedSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleSubjectToggle(sub, true)}
                        className={`flex items-center gap-2 text-left p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          isChecked 
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { playInteractiveSound('click'); setEditingClass(null); }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {tx("ይቅር (Cancel)")}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  {tx("💾 አስቀምጥ (Save Changes)")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE CLASS MODAL */}
      {/* ========================================================================= */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-rose-50 dark:bg-rose-950/60 border-b border-rose-100 dark:border-rose-900/60 px-6 py-4 flex items-center gap-2 text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-extrabold text-xs uppercase tracking-wider">{tx("የክፍል ምዝገባ ማጥፊያ ማስጠንቀቂያ")}</span>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-800 dark:text-slate-200 text-xs font-semibold leading-relaxed">
                ⚠️ <strong className="text-rose-700">{tx("ማስጠንቀቂያ፡")}</strong>{tx(" ክፍል ")}<strong className="text-slate-950 dark:text-white font-black">"{deletingClass.grade} - {deletingClass.section}"</strong>{tx("ን በቋሚነት ከሲስተሙ ማጥፋት ይፈልጋሉ?")}
              </p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {tx("ይህንን ክፍል ሲያጠፉ ተያያዥነት ያላቸው የትምህርት አይነቶች ውቅሮች ከሲስተሙ ሙሉ በሙሉ ይሰረዛሉ። ይህ ተግባር ወደ ነበረበት ሊመለስ አይችልም።")}
              </p>
              
              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { playInteractiveSound('click'); setDeletingClass(null); }}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {tx("አይ፣ ይቅር (Cancel)")}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  {tx("አዎ፣ አጥፋ (Delete)")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: WEEKLY SCHEDULE PLANNER MODAL */}
      {/* ========================================================================= */}
      {schedulingClass && localSchedule && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" id="schedule-planner-modal">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 px-6 py-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                  <Calendar className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wide">
                    {tx("የክፍል ክፍለ ጊዜ ማስተካከያ (Class Schedule Planner)")}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tx("ክፍል: ")}<strong className="text-slate-800 dark:text-slate-200 font-bold">{schedulingClass.grade}</strong>{tx(" | ሴክሽን: ")}<strong className="text-slate-800 dark:text-slate-200 font-bold">{schedulingClass.section}</strong>{tx(" | ዘርፍ: ")}<strong className="text-indigo-600 font-bold">{schedulingClass.stream}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { playInteractiveSound('click'); setSchedulingClass(null); setLocalSchedule(null); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Day Selector Sidebar */}
              <div className="w-full md:w-56 bg-slate-50/50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 p-4 space-y-2 overflow-y-auto shrink-0 flex md:flex-col gap-2 md:gap-0">
                <span className="hidden md:block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  {tx("ቀናት (Days of Week)")}
                </span>
                {DAYS_OF_WEEK.map((day) => {
                  const isActive = activeScheduleDay === day.key;
                  const dayPeriodCount = localSchedule[day.key]?.filter(p => p.subject)?.length || 0;
                  return (
                    <button
                      key={day.key}
                      onClick={() => { playInteractiveSound('click'); setActiveScheduleDay(day.key); }}
                      className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white font-black shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 border border-slate-200/60 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="text-xs">{lang === 'amh' ? day.amh : day.eng}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-indigo-500/50 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {dayPeriodCount} {tx("ክፍለ ጊዜ")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Schedule Table */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>{lang === 'amh' ? DAYS_OF_WEEK.find(d => d.key === activeScheduleDay)?.amh : activeScheduleDay} {tx("ክፍለ ጊዜዎች")}</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {tx("8 መደበኛ ክፍለ ጊዜዎች (8 Standard Periods)")}
                  </span>
                </div>

                <div className="space-y-3">
                  {STANDARD_PERIODS.map((period) => {
                    const activePeriodData = localSchedule[activeScheduleDay]?.find(p => p.periodNumber === period.number);
                    const currentSubject = activePeriodData?.subject || '';
                    const currentTeacherName = activePeriodData?.teacherName || '';

                    return (
                      <div 
                        key={period.number}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          currentSubject 
                            ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800' 
                            : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-750 flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-300">
                            #{period.number}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              {period.time}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {tx("የኢትዮጵያ ሰዓት:")} {period.localTime}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          {/* Subject Selector */}
                          <select
                            value={currentSubject}
                            onChange={(e) => handlePeriodChange(activeScheduleDay, period.number, 'subject', e.target.value)}
                            className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 outline-none focus:border-indigo-600"
                          >
                            <option value="">{tx("-- የትምህርት አይነት ይምረጡ --")}</option>
                            {schedulingClass.subjects.map((sub) => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>

                          {/* Teacher Selector */}
                          <select
                            value={currentTeacherName}
                            onChange={(e) => handlePeriodChange(activeScheduleDay, period.number, 'teacherName', e.target.value)}
                            className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 outline-none focus:border-indigo-600"
                          >
                            <option value="">{tx("-- መምህር ይምረጡ --")}</option>
                            {teachers
                              .filter(t => !currentSubject || (Array.isArray(t.subjects) && t.subjects.includes(currentSubject)))
                              .map((tch) => (
                                <option key={tch.id} value={tch.name}>
                                  {tch.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {tx("ክፍለ ጊዜዎችን ሲያስተካክሉ 'ሰሌዳ አስቀምጥ'ን ይጫኑ")}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { playInteractiveSound('click'); setSchedulingClass(null); setLocalSchedule(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  {tx("ይቅር (Cancel)")}
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{tx("ሰሌዳ አስቀምጥ (Save Schedule)")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
