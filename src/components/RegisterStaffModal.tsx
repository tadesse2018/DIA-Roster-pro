import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  UserCheck, 
  Briefcase, 
  Award, 
  BookOpen, 
  Sparkles, 
  Shield, 
  GraduationCap, 
  Phone, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  ChevronRight,
  PlusCircle,
  AlertCircle,
  Camera,
  DollarSign,
  Layers,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Users
} from 'lucide-react';
import { 
  StaffCategory, 
  StaffMember, 
  Teacher,
  DEFAULT_SCHOOL_SUBJECTS,
  getSubjectDisplayName
} from '../schoolData';
import { playInteractiveSound } from './AudioEngine';
import { useLanguage } from './LanguageContext';
import { PhotoCaptureCamera } from './PhotoCaptureCamera';

interface RegisterStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStaff: (staff: StaffMember) => void;
  onAddTeacher?: (teacher: Teacher) => void;
  existingTeachers?: Teacher[];
  schoolConfig?: any;
}

export const RegisterStaffModal: React.FC<RegisterStaffModalProps> = ({
  isOpen,
  onClose,
  onAddStaff,
  onAddTeacher,
  schoolConfig
}) => {
  const { tx } = useLanguage();

  // Category selection (Head Teacher, Assistant Teacher, Administrator, Cleaner, Security Guard)
  const [selectedCategory, setSelectedCategory] = useState<StaffCategory>('Head Teacher');
  const [step, setStep] = useState<'select-category' | 'fill-form'>('select-category');

  // Photo state (for all staff categories)
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  // Common Form States
  const [name, setName] = useState('');
  const [educationLevel, setEducationLevel] = useState('Degree');
  const [phone, setPhone] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [age, setAge] = useState('');
  const [baseSalary, setBaseSalary] = useState('14000');
  const [shift, setShift] = useState('Day Shift (የቀን ፈረቃ)');
  const [assignedArea, setAssignedArea] = useState('');
  const [notes, setNotes] = useState('');

  // Head Teacher / Teacher Specific States (Subject Selection & Allocation)
  const [assignTeachingDuties, setAssignTeachingDuties] = useState<boolean>(true);
  const activeGradesList = schoolConfig?.schoolLevel === 'secondary'
    ? ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
    : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
  
  // Custom subjects added on-the-fly (e.g. Afaan Oromo, Moral)
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  // Comprehensive available subjects with Afaan Oromo and Moral prominently included
  const availableSubjects: string[] = useMemo(() => {
    const rawList = [
      'Afaan Oromo',
      'Moral Education',
      'Mathematics',
      'English',
      'Amharic',
      'General Science',
      'Social Studies',
      'Citizenship',
      'Information Technology',
      ...(schoolConfig?.subjects || []),
      ...DEFAULT_SCHOOL_SUBJECTS,
      ...customSubjects
    ];
    
    // Deduplicate case-insensitively while preserving priority
    const seen = new Set<string>();
    const result: string[] = [];
    rawList.forEach(sub => {
      if (!sub) return;
      const clean = sub.trim();
      const lower = clean.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(clean);
      }
    });
    return result;
  }, [schoolConfig?.subjects, customSubjects]);

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics']);
  const [leadershipTenure, setLeadershipTenure] = useState('4 Years (4 ዓመታት)');
  const [appointedYear, setAppointedYear] = useState('2022 / 2014 ዓ.ም');
  const [leadershipPortfolio, setLeadershipPortfolio] = useState('Academic Supervision & Subject Instruction');

  // Allocations state
  const [allocations, setAllocations] = useState<{ grade: string; section: string; subjects?: string[]; }[]>([
    { grade: activeGradesList[0] || 'Grade 1', section: 'A', subjects: ['Mathematics'] }
  ]);
  const [formGrade, setFormGrade] = useState(activeGradesList[0] || 'Grade 1');
  const [formSection, setFormSection] = useState('A');
  const [isHomeroom, setIsHomeroom] = useState('No');
  const [homeroomGrade, setHomeroomGrade] = useState(activeGradesList[0] || 'Grade 1');
  const [homeroomSection, setHomeroomSection] = useState('A');

  // Status message
  const [successStaff, setSuccessStaff] = useState<StaffMember | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default values when category changes
  const handleSelectCategory = (cat: StaffCategory) => {
    playInteractiveSound('click');
    setSelectedCategory(cat);
    setErrorMsg(null);
    setSuccessStaff(null);

    switch (cat) {
      case 'Principal':
        setRoleTitle(tx('ርዕሰ መምህርና ስራ አስኪያጅ (School Principal & Director)'));
        setEducationLevel('Masters');
        setBaseSalary('18500');
        setAssignedArea('Main Executive Office (የር/መምህር ቢሮ)');
        break;
      case 'Vice Principal':
        setRoleTitle(tx('ምክትል ርዕሰ መምህርት (Vice Principal - Academic & Discipline)'));
        setEducationLevel('Masters');
        setBaseSalary('16000');
        setAssignedArea('Academic & Discipline Office (የም/ር/መምህር ቢሮ)');
        break;
      case 'Secretary':
        setRoleTitle(tx('ዋና ፀሐፊና ሰነድ ያዥ (Head Secretary & Registrar)'));
        setEducationLevel('Degree');
        setBaseSalary('10500');
        setAssignedArea('Front Desk & Archives Office (የጽሕፈት ቤትና ሰነድ ክፍል)');
        break;
      case 'Finance':
        setRoleTitle(tx('የፋይናንስ ኦፊሰርና አካውንታንት (Finance Officer & Accountant)'));
        setEducationLevel('Degree');
        setBaseSalary('14500');
        setAssignedArea('Finance & Accounts Office (የፋይናንስና ሂሳብ ቢሮ)');
        break;
      case 'Head Teacher':
      case 'Main Teacher':
        setRoleTitle(tx('ዋና መምህር (Head / Lead Teacher)'));
        setEducationLevel('Degree');
        setBaseSalary('14500');
        setAssignedArea('Academic Department / Block A');
        break;
      case 'Assistant Teacher':
        setRoleTitle(tx('ረዳት መምህር (Assistant Teacher)'));
        setEducationLevel('Diploma');
        setBaseSalary('7500');
        setAssignedArea('Classrooms Block');
        break;
      case 'Administrator':
        setRoleTitle(tx('የአስተዳደር ኦፊሰር (Administrative Officer / Registrar)'));
        setEducationLevel('Degree');
        setBaseSalary('12500');
        setAssignedArea('Administration Office');
        break;
      case 'Cleaner':
        setRoleTitle(tx('የጽዳትና ንፅህና ባለሙያ (Sanitation & Cleaning Staff)'));
        setEducationLevel('High School Complete (10/12)');
        setBaseSalary('5500');
        setAssignedArea('Campus Grounds & Buildings (የግቢና ክፍል ጽዳት)');
        break;
      case 'Security Guard':
        setRoleTitle(tx('የደህንነትና ጥበቃ አባል (Campus Security Guard)'));
        setEducationLevel('Certificate');
        setBaseSalary('6200');
        setAssignedArea('Main Entrance Gate (ዋና መግቢያ በር)');
        break;
    }
    setStep('fill-form');
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAge('');
    setPhoto(undefined);
    setNotes('');
    setSuccessStaff(null);
    setErrorMsg(null);
    setStep('select-category');
  };

  const handleSubjectToggle = (subj: string) => {
    playInteractiveSound('click');
    if (selectedSubjects.includes(subj)) {
      if (selectedSubjects.length === 1) {
        alert(tx('እባክዎን ቢያንስ አንድ የትምህርት አይነት ይምረጡ (Select at least one subject)'));
        return;
      }
      setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  const handleAddCustomSubject = () => {
    if (!customSubjectInput.trim()) return;
    const newSub = customSubjectInput.trim();
    playInteractiveSound('click');
    if (!customSubjects.some(s => s.toLowerCase() === newSub.toLowerCase())) {
      setCustomSubjects(prev => [...prev, newSub]);
    }
    if (!selectedSubjects.some(s => s.toLowerCase() === newSub.toLowerCase())) {
      setSelectedSubjects(prev => [...prev, newSub]);
    }
    setCustomSubjectInput('');
  };

  const handleAddAllocation = () => {
    playInteractiveSound('click');
    const exists = allocations.some(a => a.grade === formGrade && a.section === formSection);
    if (exists) {
      alert(tx('ይህ ክፍልና ሴክሽን አስቀድሞ ተመድቧል (This grade and section is already allocated)'));
      return;
    }
    setAllocations([...allocations, { grade: formGrade, section: formSection, subjects: selectedSubjects }]);
  };

  const handleRemoveAllocation = (index: number) => {
    playInteractiveSound('click');
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(tx('እባክዎን ሙሉ ስም ያስገቡ (Please enter full name)'));
      playInteractiveSound('wrong');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg(tx('እባክዎን ስልክ ቁጥር ያስገቡ (Please enter phone number)'));
      playInteractiveSound('wrong');
      return;
    }

    const isTeachingRole = selectedCategory === 'Head Teacher' || selectedCategory === 'Main Teacher' || (selectedCategory === 'Vice Principal' && assignTeachingDuties);
    if (isTeachingRole && selectedSubjects.length === 0) {
      setErrorMsg(tx('እባክዎን ቢያንስ አንድ የሚያስተምሩት የትምህርት አይነት ይምረጡ (Please select at least one subject)'));
      playInteractiveSound('wrong');
      return;
    }

    // Prefix for ID based on category
    let prefix = 'STF-HT';
    if (selectedCategory === 'Principal') prefix = 'STF-PRN';
    else if (selectedCategory === 'Vice Principal') prefix = 'STF-VPR';
    else if (selectedCategory === 'Secretary') prefix = 'STF-SEC';
    else if (selectedCategory === 'Finance') prefix = 'STF-FIN';
    else if (selectedCategory === 'Cleaner') prefix = 'STF-CLN';
    else if (selectedCategory === 'Security Guard') prefix = 'STF-GRD';
    else if (selectedCategory === 'Assistant Teacher') prefix = 'STF-AST';
    else if (selectedCategory === 'Administrator') prefix = 'STF-ADM';
    else if (selectedCategory === 'Main Teacher') prefix = 'TCH';

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `${prefix}-${randomSuffix}`;
    const parsedSalary = parseFloat(baseSalary) || (isTeachingRole ? 14000 : 7000);
    const dailyRate = Math.round(parsedSalary / 30);

    const finalAssignedClass = isTeachingRole 
      ? (isHomeroom === 'Yes' ? homeroomGrade : (allocations[0]?.grade || activeGradesList[0] || 'Grade 1'))
      : undefined;
    const finalAssignedSection = isTeachingRole 
      ? (isHomeroom === 'Yes' ? homeroomSection : (allocations[0]?.section || 'A'))
      : undefined;

    let finalAllocations = isTeachingRole ? [...allocations] : undefined;
    if (isTeachingRole && finalAllocations && isHomeroom === 'Yes') {
      const existingIdx = finalAllocations.findIndex(a => a.grade === homeroomGrade && a.section === homeroomSection);
      if (existingIdx === -1) {
        finalAllocations = [{ grade: homeroomGrade, section: homeroomSection, subjects: selectedSubjects }, ...finalAllocations];
      } else {
        const item = finalAllocations[existingIdx];
        finalAllocations.splice(existingIdx, 1);
        finalAllocations.unshift(item);
      }
    }

    const newStaff: StaffMember = {
      id: newId,
      name: name.trim(),
      category: selectedCategory,
      roleTitle: roleTitle.trim() || selectedCategory,
      educationLevel,
      phone: phone.trim(),
      email: email.trim() || undefined,
      gender,
      age: age ? parseInt(age, 10) : undefined,
      photo: photo || undefined,
      subjects: isTeachingRole ? selectedSubjects : undefined,
      assignedClass: finalAssignedClass,
      assignedSection: finalAssignedSection,
      classAllocations: finalAllocations,
      isHomeroomTeacher: isTeachingRole ? isHomeroom === 'Yes' : undefined,
      leadershipTenure: selectedCategory === 'Head Teacher' ? leadershipTenure.trim() : undefined,
      appointedYear: selectedCategory === 'Head Teacher' ? appointedYear.trim() : undefined,
      leadershipPortfolio: selectedCategory === 'Head Teacher' ? leadershipPortfolio.trim() : undefined,
      shift,
      assignedArea: assignedArea.trim() || undefined,
      baseSalary: parsedSalary,
      dailyRate,
      notes: notes.trim() || undefined,
      registeredBy: 'Principal / Admin',
      timestamp: new Date().toISOString()
    };

    // If it's Head Teacher or Main Teacher, register directly into Teachers array too
    if (isTeachingRole && onAddTeacher) {
      const teacherObj: Teacher = {
        id: newId,
        name: name.trim(),
        gender,
        age: age ? parseInt(age, 10) : undefined,
        educationLevel,
        phone: phone.trim(),
        email: email.trim() || `${newId.toLowerCase()}@school.com`,
        photo: photo || undefined,
        subjects: selectedSubjects,
        assignedClass: finalAssignedClass || activeGradesList[0] || 'Grade 1',
        assignedSection: finalAssignedSection || 'A',
        classAllocations: finalAllocations || allocations,
        isHomeroomTeacher: isHomeroom === 'Yes',
        registeredBy: 'Principal',
        timestamp: new Date().toISOString()
      };
      onAddTeacher(teacherObj);
    }

    onAddStaff(newStaff);
    playInteractiveSound('success');
    setSuccessStaff(newStaff);
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  const categoriesConfig: {
    type: StaffCategory;
    title: string;
    amharic: string;
    badge: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  }[] = [
    {
      type: 'Principal',
      title: 'Principal / Headmaster',
      amharic: 'ር/መ (ርዕሰ መምህር)',
      badge: 'ር/መ',
      description: 'የትምህርት ቤቱ የበላይ መሪ፣ ስራ አስኪያጅና አስተዳዳሪ (School Principal & General Director)',
      icon: <Award className="w-5 h-5 text-purple-600" />,
      color: 'border-purple-300 hover:border-purple-500',
      bgColor: 'bg-purple-50/70 dark:bg-purple-950/25'
    },
    {
      type: 'Vice Principal',
      title: 'Vice Principal',
      amharic: 'ም/ር/መ (ምክትል ር/መምህር)',
      badge: 'ም/ር/መ',
      description: 'የአካዳሚክና ዲስፕሊን የበላይ ኃላፊ፣ የክፍለ-ጊዜና መምህራን ተቆጣጣሪ (Academic & Student Discipline VP)',
      icon: <GraduationCap className="w-5 h-5 text-blue-600" />,
      color: 'border-blue-300 hover:border-blue-500',
      bgColor: 'bg-blue-50/70 dark:bg-blue-950/25'
    },
    {
      type: 'Secretary',
      title: 'Secretary & Registrar',
      amharic: 'ፃፉ (ፀሐፊና ሰነድ ያዥ)',
      badge: 'ፃፉ',
      description: 'የቢሮ አስተዳደር፣ የተማሪዎች ቋሚ ማህደርና ደብዳቤዎች መዝጋቢ (Office records, archivist & front desk)',
      icon: <FileText className="w-5 h-5 text-amber-600" />,
      color: 'border-amber-300 hover:border-amber-500',
      bgColor: 'bg-amber-50/70 dark:bg-amber-950/25'
    },
    {
      type: 'Finance',
      title: 'Finance & Accounting',
      amharic: 'ፋይናንስ (ሂሳብና ክፍያ)',
      badge: 'ፋይናንስ',
      description: 'የወርሃዊ ትምህርት ክፍያ፣ የሰራተኞች ደመወዝና ፔይሮል፣ የገቢ/ወጪ ኃላፊ (Fee collection, payroll & accountant)',
      icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
      color: 'border-emerald-300 hover:border-emerald-500',
      bgColor: 'bg-emerald-50/70 dark:bg-emerald-950/25'
    },
    {
      type: 'Cleaner',
      title: 'Sanitation & Cleaner',
      amharic: 'ፅዳት (ፅዳትና ንፅህና)',
      badge: 'ፅዳት',
      description: 'የትምህርት ቤቱ ግቢ፣ ክፍሎችና ሽንት ቤቶች ንፅህና ኃላፊ (Campus sanitation & hygiene maintenance)',
      icon: <Sparkles className="w-5 h-5 text-teal-600" />,
      color: 'border-teal-300 hover:border-teal-500',
      bgColor: 'bg-teal-50/70 dark:bg-teal-950/25'
    },
    {
      type: 'Security Guard',
      title: 'Security Guard',
      amharic: 'ጥበቃ (የግቢ ደህንነት)',
      badge: 'ጥበቃ',
      description: 'የግቢ ደህንነት፣ የመግቢያ በር ቁጥጥርና 24/7 ጥበቃ (Perimeter security, visitor check & gate guard)',
      icon: <Shield className="w-5 h-5 text-rose-600" />,
      color: 'border-rose-300 hover:border-rose-500',
      bgColor: 'bg-rose-50/70 dark:bg-rose-950/25'
    },
    {
      type: 'Head Teacher',
      title: 'Head / Lead Teacher',
      amharic: 'ዋና መምህር',
      badge: 'መምህር',
      description: 'የሚያስተምረው የትምህርት አይነትና ክፍል ምደባ ያለው መምህር (Subject teacher with class allocations)',
      icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
      color: 'border-indigo-300 hover:border-indigo-500',
      bgColor: 'bg-indigo-50/60 dark:bg-indigo-950/20'
    },
    {
      type: 'Assistant Teacher',
      title: 'Assistant Teacher',
      amharic: 'ረዳት መምህር',
      badge: 'ረዳት',
      description: 'የክፍል ውስጥ ድጋፍ እና የላብራቶሪ/ክለብ አጋዥ መምህር (Classroom support, tutoring & lab assistant)',
      icon: <Users className="w-5 h-5 text-cyan-600" />,
      color: 'border-cyan-300 hover:border-cyan-500',
      bgColor: 'bg-cyan-50/60 dark:bg-cyan-950/20'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto print:hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]"
        id="register-staff-modal"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full">
                  {tx('የሰራተኞች መዝገብ')}
                </span>
                <span className="text-[10px] text-slate-400">
                  Staff & Teacher Registration
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                {tx('አዲስ ሰራተኛ / መምህር መመዝገቢያ')} <span className="text-indigo-300 text-xs font-medium">({tx('Register Staff')})</span>
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              playInteractiveSound('click');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* SUCCESS BANNER */}
          {successStaff ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-100">
                  {tx('ሰራተኛው በተሳካ ሁኔታ ተመዝግቧል!')}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Staff registered with unique code: <strong className="font-mono">{successStaff.id}</strong>
                </p>
              </div>

              {/* Staff badge preview */}
              <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 p-4 rounded-xl max-w-md mx-auto text-left shadow-xs space-y-3 text-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-indigo-200 shrink-0 flex items-center justify-center font-bold text-indigo-600">
                    {successStaff.photo ? (
                      <img src={successStaff.photo} alt={successStaff.name} className="w-full h-full object-cover" />
                    ) : (
                      successStaff.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-slate-900 dark:text-white text-sm block truncate">{successStaff.name}</span>
                    <span className="text-[11px] text-slate-500 truncate block">{successStaff.roleTitle}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                    {successStaff.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{tx('ስልክ ቁጥር:')}</span>
                    <span className="font-mono font-bold">{successStaff.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{tx('መነሻ ደመወዝ:')}</span>
                    <span className="font-mono font-bold text-emerald-600">{successStaff.baseSalary?.toLocaleString()} ETB</span>
                  </div>
                  {successStaff.subjects && successStaff.subjects.length > 0 && (
                    <div className="col-span-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-indigo-600 font-bold block">{tx('የሚያስተምራቸው የትምህርት አይነቶች:')}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{successStaff.subjects.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{tx('ሌላ ሰራተኛ መዝግብ (Register Another)')}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {tx('ዝጋ (Close)')}
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* STEP 1: CATEGORY SELECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                    <span>1. {tx('የሰራተኛ ምድብ ይምረጡ (Select Staff Category):')}</span>
                  </label>
                  {step === 'fill-form' && (
                    <button
                      type="button"
                      onClick={() => setStep('select-category')}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      {tx('ምድብ ቀይር (Change Category)')}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {categoriesConfig.map((cat) => {
                    const isSelected = selectedCategory === cat.type;
                    return (
                      <button
                        key={cat.type}
                        type="button"
                        onClick={() => handleSelectCategory(cat.type)}
                        className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-indigo-600 border-transparent shadow-md ' + cat.bgColor
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                            {cat.icon}
                          </div>
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                            {cat.amharic}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {cat.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: DYNAMIC REGISTRATION FORM */}
              {step === 'fill-form' && (
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between bg-indigo-50/70 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📝</span>
                      <div>
                        <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                          {selectedCategory === 'Head Teacher' 
                            ? tx('የዋና መምህር ምዝገባ ቅጽ (Head / Main Teacher Registration Form)')
                            : `${tx('የ')} ${selectedCategory} ${tx('ምዝገባ ቅጽ')}`}
                        </h4>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                          {selectedCategory === 'Head Teacher'
                            ? tx('የሚያስተምራቸው የትምህርት አይነቶች፣ የክፍል ምደባ እና የካሜራ ፎቶ መያዣ')
                            : tx('ሙሉ መረጃዎች እና የካሜራ መታወቂያ ፎቶ መያዣ')}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-indigo-600 shadow-xs border border-indigo-200 dark:border-indigo-800">
                      {selectedCategory}
                    </span>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* CAMERA PHOTO CAPTURE FOR ALL CATEGORIES */}
                  <PhotoCaptureCamera
                    currentPhoto={photo}
                    onPhotoCapture={(pic) => setPhoto(pic)}
                    label={tx('የሰራተኛ መታወቂያ ፎቶ በካሜራ አንሳ ወይም ጫን (Profile Photo Capture):')}
                  />

                  {/* Common Field 1: Full Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      {selectedCategory === 'Head Teacher' ? tx('የመምህሩ ሙሉ ስም (Teacher Full Name):') : tx('ሙሉ ስም (Full Name):')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={selectedCategory === 'Head Teacher' ? 'አቶ በቀለ አስማማው' : 'ሙሉ ስም'}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800/50 dark:text-white font-medium"
                      required
                    />
                  </div>

                  {/* Education & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('የትምህርት ደረጃ (Education Level):')}
                      </label>
                      <select
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                      >
                        <option value="Diploma">{tx('ዲፕሎማ (Diploma)')}</option>
                        <option value="Degree">{tx('መጀመሪያ ዲግሪ (BA/BSc Degree)')}</option>
                        <option value="Masters">{tx('ማስተርስ ዲግሪ (Masters)')}</option>
                        <option value="PhD">{tx('ፒኤችዲ (PhD)')}</option>
                        <option value="10th/12th Complete">{tx('10ኛ/12ኛ ያጠናቀቀ (High School)')}</option>
                        <option value="Certificate">{tx('ሰርተፍኬት (Certificate)')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('ስልክ ቁጥር (Phone Number):')} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0911XXXXXX"
                          className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800/50 dark:text-white font-mono font-medium"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Job Position & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('የስራ መደብ (Job Position):')}
                      </label>
                      <input
                        type="text"
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        placeholder="ዋና መምህር / ረዳት መምህር"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800/50 dark:text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('ኢሜል አድራሻ (Email - Optional):')}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="teacher@school.com"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800/50 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Gender, Age & Monthly Base Salary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('ጾታ (Gender):')}
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                      >
                        <option value="Male">{tx('ወንድ (M)')}</option>
                        <option value="Female">{tx('ሴት (F)')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('ዕድሜ (Age):')}
                      </label>
                      <input
                        type="number"
                        min="18"
                        max="80"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="32"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800/50 dark:text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('መነሻ ደመወዝ (Base Salary ETB):')}
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="100"
                        value={baseSalary}
                        onChange={(e) => setBaseSalary(e.target.value)}
                        placeholder="14000"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800/50 dark:text-white font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* --- TEACHING DUTIES TOGGLE FOR VICE PRINCIPAL --- */}
                  {/* ========================================================= */}
                  {selectedCategory === 'Vice Principal' && (
                    <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-blue-950 dark:text-blue-100">
                            {tx('የማስተማር ስራ ምደባ (Assign Teaching Duties):')}
                          </h5>
                          <p className="text-[10px] text-blue-700 dark:text-blue-300">
                            {tx('ይህ ምክትል ር/መምህር በተጨማሪነት የሚያስተምረው ክፍልና ሴክሽን ካለ ያንቁ (Enable if Vice Principal teaches classes)')}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={assignTeachingDuties} 
                          onChange={(e) => setAssignTeachingDuties(e.target.checked)} 
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* --- TEACHER / VICE PRINCIPAL SUBJECT & CLASS ALLOCATION --- */}
                  {/* ========================================================= */}
                  {(selectedCategory === 'Head Teacher' || selectedCategory === 'Main Teacher' || (selectedCategory === 'Vice Principal' && assignTeachingDuties)) && (
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl space-y-4">
                      {/* Subject Selection Checkboxes as requested by user! */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-black uppercase text-indigo-950 dark:text-indigo-200">
                            {tx('የሚያስተምረው የትምህርት አይነት (Subjects Taught):')} <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {selectedSubjects.length} {tx('ተመርጧል')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 max-h-44 overflow-y-auto">
                          {availableSubjects.map((sub) => {
                            const isChecked = selectedSubjects.includes(sub);
                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => handleSubjectToggle(sub)}
                                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                                  isChecked
                                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                                <span className="truncate" title={sub}>{getSubjectDisplayName(sub)}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Inline custom subject add input */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                          <input
                            type="text"
                            value={customSubjectInput}
                            onChange={(e) => setCustomSubjectInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomSubject();
                              }
                            }}
                            placeholder={tx('ሌላ የትምህርት አይነት ካለ እዚህ ይጻፉ (ለምሳሌ፦ Afaan Oromo, Moral)...')}
                            className="flex-1 p-2 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs bg-white dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomSubject}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                            title={tx('የትምህርት አይነት ጨምር')}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{tx('ጨምር')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Class and Section Allocation */}
                      <div className="space-y-2">
                        <label className="block text-xs font-black uppercase text-indigo-950 dark:text-indigo-200">
                          {tx('የክፍልና ሴክሽን ምደባ (Class & Section Allocation):')}
                        </label>

                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={formGrade}
                            onChange={(e) => setFormGrade(e.target.value)}
                            className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-bold bg-white dark:bg-slate-900 dark:text-white"
                          >
                            {activeGradesList.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>

                          <select
                            value={formSection}
                            onChange={(e) => setFormSection(e.target.value)}
                            className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-bold bg-white dark:bg-slate-900 dark:text-white"
                          >
                            {['A', 'B', 'C', 'D', 'E', 'F'].map((s) => (
                              <option key={s} value={s}>Section {s}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={handleAddAllocation}
                            className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{tx('ክፍል መድብ')}</span>
                          </button>
                        </div>

                        {/* Allocated classes tags */}
                        <div className="space-y-1.5 pt-1">
                          {allocations.map((alloc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold shadow-2xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded text-[11px]">
                                  {alloc.grade.replace('Grade ', 'Gr-')}-{alloc.section}
                                </span>
                                <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                                  {alloc.subjects && alloc.subjects.length > 0 
                                    ? alloc.subjects.map(s => getSubjectDisplayName(s)).join('፣ ') 
                                    : selectedSubjects.map(s => getSubjectDisplayName(s)).join('፣ ')}
                                </span>
                              </div>
                              {allocations.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAllocation(idx)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Homeroom & Leadership Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-indigo-950 dark:text-indigo-300 mb-1">
                            {tx('የክፍል ኃላፊ መምህር ነው? (Homeroom Teacher?):')}
                          </label>
                          <select
                            value={isHomeroom}
                            onChange={(e) => setIsHomeroom(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs focus:border-indigo-600 outline-none bg-white dark:bg-slate-900 dark:text-white font-semibold"
                          >
                            <option value="No">{tx('አይደለም (No)')}</option>
                            <option value="Yes">{tx('አዎ የክፍል ተጠሪ ነው (Yes)')}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-indigo-950 dark:text-indigo-300 mb-1">
                            {tx('የአመራር ቆይታ (Leadership Tenure):')}
                          </label>
                          <input
                            type="text"
                            value={leadershipTenure}
                            onChange={(e) => setLeadershipTenure(e.target.value)}
                            placeholder="e.g. 4 Years / 4 ዓመታት"
                            className="w-full p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs focus:border-indigo-600 outline-none bg-white dark:bg-slate-900 dark:text-white font-medium"
                          />
                        </div>
                      </div>

                      {/* Dropdown for Homeroom Grade and Section when selected as Homeroom Teacher */}
                      {isHomeroom === 'Yes' && (
                        <div className="p-3.5 bg-indigo-50/90 dark:bg-indigo-950/50 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-2.5 animate-fade-in shadow-xs">
                          <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                            <span className="text-sm">🎓</span>
                            <span>{tx('የኃላፊነት ክፍል እና ሴክሽን ይምረጡ (Select Homeroom Grade & Section):')}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-indigo-800 dark:text-indigo-300 mb-1">
                                {tx('የክፍል ደረጃ (Grade):')}
                              </label>
                              <select
                                value={homeroomGrade}
                                onChange={(e) => setHomeroomGrade(e.target.value)}
                                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-extrabold text-indigo-950 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                              >
                                {activeGradesList.map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-indigo-800 dark:text-indigo-300 mb-1">
                                {tx('ሴክሽን (Section):')}
                              </label>
                              <select
                                value={homeroomSection}
                                onChange={(e) => setHomeroomSection(e.target.value)}
                                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-extrabold text-indigo-950 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs font-mono"
                              >
                                {['A', 'B', 'C', 'D', 'E', 'F'].map(sec => (
                                  <option key={sec} value={sec}>{tx('ሴክሽን')} {sec}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1.5 pt-0.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                            <span>{tx(`ይህ መምህር የ${homeroomGrade} - ${homeroomSection} ቋሚ የክፍል ኃላፊ ሆኖ ይመደባል (Assigned as Homeroom Teacher for ${homeroomGrade} ${homeroomSection}).`)}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shift & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('የስራ ፈረቃ (Work Shift):')}
                      </label>
                      <select
                        value={shift}
                        onChange={(e) => setShift(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                      >
                        <option value="Day Shift (የቀን ፈረቃ)">{tx('የቀን ፈረቃ (Day Shift)')}</option>
                        <option value="Night Shift (የማታ ፈረቃ)">{tx('የማታ ፈረቃ (Night Shift)')}</option>
                        <option value="Full Time (ሙሉ ቀን)">{tx('ሙሉ ቀን (Full Time)')}</option>
                        <option value="Part Time (ከፊል ጊዜ)">{tx('ከፊል ጊዜ (Part Time)')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('የተመደበበት ቦታ / ቢሮ (Assigned Area / Station):')}
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={assignedArea}
                          onChange={(e) => setAssignedArea(e.target.value)}
                          placeholder="e.g. Block A / Main Office / Gate"
                          className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800/50 dark:text-white font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Notes */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      {tx('ተጨማሪ ማስታወሻ (Additional Notes - Optional):')}
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={tx('ልዩ ክህሎት ወይም የኃላፊነት ዝርዝር...')}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800/50 dark:text-white"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setStep('select-category')}
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      {tx('ወደ ኋላ (Back)')}
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black rounded-xl text-xs transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{tx('ሰራተኛውን መዝግብ (Register Staff)')}</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
