import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, Send, Users, CheckCircle2, Search, Filter, 
  Clock, Reply, Sparkles, Plus, Trash2, CheckSquare, 
  Square, BookOpen, GraduationCap, PhoneCall, Check, User, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CommunicationService, 
  CommunicationMessage, 
  CommunicationReply 
} from '../lib/communicationService';
import { Student, Teacher, StaffMember } from '../schoolData';
import { useLanguage } from './LanguageContext';
import { playInteractiveSound } from './AudioEngine';

interface ParentTeacherCommunicationProps {
  currentUserRole: 'principal' | 'teacher' | 'parent';
  currentUserName?: string;
  currentUserContact?: string; // phone or email
  currentStudent?: Student | null; // For parent or focused student
  currentTeacher?: Teacher | null; // Teacher details
  allStudents: Student[];
  allTeachers: Teacher[];
  allStaff?: StaffMember[];
  workspaceId: string;
  onOpenStudentReport?: (studentId: string) => void;
}

export const ParentTeacherCommunication: React.FC<ParentTeacherCommunicationProps> = ({
  currentUserRole,
  currentUserName,
  currentUserContact,
  currentStudent,
  currentTeacher,
  allStudents,
  allTeachers,
  allStaff = [],
  workspaceId,
  onOpenStudentReport
}) => {
  const { tx } = useLanguage();
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  const [filterSection, setFilterSection] = useState<string>('ALL');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Determine assigned teaching classes & sections for the teacher
  const teacherAllocations = useMemo(() => {
    const teacherObj = currentTeacher || (currentUserContact ? allTeachers.find(t => t.email === currentUserContact || t.phone === currentUserContact) : null);
    if (!teacherObj) return [];

    const list: { grade: string; section: string; subjects?: string[] }[] = [];
    if (teacherObj.classAllocations && teacherObj.classAllocations.length > 0) {
      teacherObj.classAllocations.forEach(a => {
        if (!list.some(x => x.grade === a.grade && x.section.toUpperCase() === a.section.toUpperCase())) {
          list.push({ grade: a.grade, section: a.section.toUpperCase(), subjects: a.subjects });
        }
      });
    }
    if (teacherObj.assignedClass) {
      const sec = (teacherObj.assignedSection || 'A').toUpperCase();
      if (!list.some(x => x.grade === teacherObj.assignedClass && x.section === sec)) {
        list.push({ grade: teacherObj.assignedClass, section: sec, subjects: teacherObj.subjects });
      }
    }
    return list;
  }, [currentTeacher, currentUserContact, allTeachers]);

  // Compose State for Teachers / Principal
  const [composeSenderRole, setComposeSenderRole] = useState<'principal' | 'teacher' | 'assistant_teacher'>(
    currentUserRole === 'principal' 
      ? 'principal' 
      : ((currentTeacher as any)?.category === 'Assistant Teacher' ? 'assistant_teacher' : 'teacher')
  );
  const [composeSenderName, setComposeSenderName] = useState(
    currentUserName || (currentUserRole === 'principal' ? 'ዋና መምህር' : 'መምህር')
  );
  const [composeSubject, setComposeSubject] = useState(
    teacherAllocations[0]?.subjects?.[0] || ''
  );
  const [composeGrade, setComposeGrade] = useState<string>(
    teacherAllocations[0]?.grade || 'Grade 1'
  );
  const [composeSection, setComposeSection] = useState<string>(
    teacherAllocations[0]?.section || 'A'
  );
  const [composeTargetType, setComposeTargetType] = useState<'all' | 'selected'>('all');
  const [composeSelectedStudentIds, setComposeSelectedStudentIds] = useState<string[]>([]);
  const [composeTitle, setComposeTitle] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [studentSearchFilter, setStudentSearchFilter] = useState('');

  // Sync teacher allocated class and section if available
  useEffect(() => {
    if (teacherAllocations.length > 0) {
      setComposeGrade(teacherAllocations[0].grade);
      setComposeSection(teacherAllocations[0].section);
      if (teacherAllocations[0].subjects && teacherAllocations[0].subjects.length > 0) {
        setComposeSubject(teacherAllocations[0].subjects[0]);
      }
    }
  }, [teacherAllocations]);

  // Parent Compose State (Parent to Teacher/Principal)
  const [parentTargetRecipient, setParentTargetRecipient] = useState<'principal' | 'homeroom' | 'assistant' | 'subject'>('homeroom');
  const [parentSelectedSubject, setParentSelectedSubject] = useState('ሒሳብ (Mathematics)');
  const [parentComposeTitle, setParentComposeTitle] = useState('');
  const [parentComposeContent, setParentComposeContent] = useState('');

  // Reply text state per message
  const [replyInputs, setReplyInputs] = useState<{ [messageId: string]: string }>({});
  const [sendSuccessToast, setSendSuccessToast] = useState<string | null>(null);

  // Available grades list from students
  const availableGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    allStudents.forEach(s => {
      if (s.grade) gradesSet.add(s.grade);
    });
    if (gradesSet.size === 0) {
      return ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
    }
    return Array.from(gradesSet).sort();
  }, [allStudents]);

  // List of available subjects across teachers
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>([
      'ሒሳብ (Mathematics)',
      'እንግሊዝኛ (English)',
      'አማርኛ (Amharic)',
      'አካባቢ ሳይንስ (Environmental Science)',
      'አጠቃላይ ሳይንስ (General Science)',
      'ማህበራዊ ሳይንስ (Social Studies)',
      'ስነ-ጥበብ (Art & Crafts)',
      'የሰውነት ማጎልመሻ (Physical Education)'
    ]);
    allTeachers.forEach(t => {
      (t.subjects || []).forEach(s => subs.add(s));
    });
    return Array.from(subs);
  }, [allTeachers]);

  // Load and subscribe to communication messages
  useEffect(() => {
    CommunicationService.setWorkspaceId(workspaceId);
    const unsubscribe = CommunicationService.subscribe((msgs) => {
      setMessages(msgs);
    });
    return unsubscribe;
  }, [workspaceId]);

  // Students matching the currently chosen compose grade and section
  const targetClassStudents = useMemo(() => {
    return allStudents.filter(
      s => s.grade === composeGrade && s.section.toUpperCase() === composeSection.toUpperCase()
    );
  }, [allStudents, composeGrade, composeSection]);

  // Filtered target class students for the selective checklist
  const filteredTargetClassStudents = useMemo(() => {
    if (!studentSearchFilter.trim()) return targetClassStudents;
    const q = studentSearchFilter.toLowerCase();
    return targetClassStudents.filter(
      s => s.name.toLowerCase().includes(q) || 
           s.id.toLowerCase().includes(q) ||
           (s.parentPhone && s.parentPhone.includes(q))
    );
  }, [targetClassStudents, studentSearchFilter]);

  // Filter messages for current user
  const visibleMessages = useMemo(() => {
    return messages.filter(msg => {
      // If user is a Parent:
      if (currentUserRole === 'parent') {
        // Parent should see messages sent if:
        // 1. Sent by the parent themselves
        // 2. Broadcast to all students in their child's grade and section
        // 3. Specifically targeted to their child's ID or their phone
        if (msg.senderContact === currentUserContact) return true;
        if (!currentStudent) return true;

        if (msg.grade === currentStudent.grade && msg.section === currentStudent.section) {
          if (msg.targetType === 'all') return true;
          if (msg.targetStudentIds && msg.targetStudentIds.includes(currentStudent.id)) return true;
          if (currentUserContact && msg.targetParentPhones && msg.targetParentPhones.includes(currentUserContact)) return true;
        }
        if (msg.studentId === currentStudent.id) return true;
        return false;
      }

      // If user is Staff (Principal or Teacher):
      if (filterGrade !== 'ALL' && msg.grade !== filterGrade) return false;
      if (filterSection !== 'ALL' && msg.section !== filterSection) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = msg.title.toLowerCase().includes(q);
        const matchContent = msg.content.toLowerCase().includes(q);
        const matchSender = msg.senderName.toLowerCase().includes(q);
        const matchStudent = (msg.targetStudentNames || []).some(n => n.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchSender && !matchStudent) return false;
      }

      return true;
    });
  }, [messages, currentUserRole, currentUserContact, currentStudent, filterGrade, filterSection, searchQuery]);

  // Count unread messages for badge
  const unreadCount = useMemo(() => {
    return visibleMessages.filter(m => {
      if (currentUserRole === 'parent') return !m.readByParent;
      return !m.readByStaff;
    }).length;
  }, [visibleMessages, currentUserRole]);

  // Quick preset templates for Teachers / Principal
  const applyPresetTemplate = (type: 'homework' | 'conduct' | 'meeting' | 'praise') => {
    if (type === 'homework') {
      setComposeTitle('የቤት ስራ እና የዕለት ንባብ ክትትል (Homework & Reading Progress)');
      setComposeContent('ውድ የተከበሩ ወላጅ፤ ተማሪው/ዋ የቤት ስራውን/ዋን በንቃት እንዲሰራ/እንድትሰራ እና በየቀኑ ቢያንስ ለ20 ደቂቃዎች የንባብ ልምምድ እንዲያደርግ/እንድታደርግ የቅርብ ክትትል እንዲያደርጉ በትህትና እናሳስባለን።');
    } else if (type === 'conduct') {
      setComposeTitle('የክፍል ውስጥ ስነ-ምግባር እና የትምህርት ዝግጁነት ክትትል (Conduct & Readiness)');
      setComposeContent('ሰላም የተከበሩ ወላጅ፤ ልጅዎ በክፍል ውስጥ ንቁ ተሳትፎ እያደረገ/ች ሲሆን የትምህርት መጽሐፍትን እና አስፈላጊ ቁሳቁሶችን በየቀኑ በቦርሳው/ዋ ይዞ/ዛ እንዲመጣ/እንድትመጣ ድጋፍዎ እንዲቀጥል በአክብሮት እንጠይቃለን።');
    } else if (type === 'meeting') {
      setComposeTitle('የወላጆች እና መምህራን የጋራ የምክክር መድረክ ጥሪ (Parent-Teacher Meeting)');
      setComposeContent('ውድ ወላጆች፤ የልጆቻችንን አጠቃላይ የትምህርት አቀባበል እና የፈተና ዝግጁነት ለመገምገም በመጪው ቅዳሜ ከጠዋቱ 3:30 በዋናው የስብሰባ አዳራሽ እንድትገኙ በአክብሮት ተጋብዘዋል።');
    } else if (type === 'praise') {
      setComposeTitle('የላቀ የትምህርት ጥረት እና የባህሪ ምስጋና (Special Commendation)');
      setComposeContent('ውድ ወላጅ፤ ልጅዎ በዚህ ሳምንት ባሳየው/ችው የላቀ የትጋት ውጤት፣ መልካም ስነ-ምግባር እና አርአያነት ያለው ተሳትፎ ከልብ ልናመሰግንዎ እና ልናበረታታዎ እንወዳለን።');
    }
  };

  // Toggle single student selection
  const handleToggleStudent = (studentId: string) => {
    setComposeSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Select all students in target class
  const handleSelectAllStudents = () => {
    setComposeSelectedStudentIds(targetClassStudents.map(s => s.id));
  };

  // Deselect all
  const handleDeselectAllStudents = () => {
    setComposeSelectedStudentIds([]);
  };

  // Handle Staff Message Submission
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTitle.trim() || !composeContent.trim()) return;

    if (composeTargetType === 'selected' && composeSelectedStudentIds.length === 0) {
      setSendSuccessToast(tx('⚠️ እባክዎን ቢያንስ የአንድ ተማሪ ወላጅ ይምረጡ (Please select at least one student parent).'));
      setTimeout(() => setSendSuccessToast(null), 4000);
      return;
    }

    const selectedStudents = allStudents.filter(s => composeSelectedStudentIds.includes(s.id));
    const targetStudentNames = composeTargetType === 'all' 
      ? [`ለሁሉም የ${composeGrade} - ${composeSection} ተማሪዎች ወላጆች (All Parents)`]
      : selectedStudents.map(s => `${s.name} (${s.id})`);
    
    const targetParentPhones = composeTargetType === 'all'
      ? targetClassStudents.map(s => s.parentPhone).filter(Boolean) as string[]
      : selectedStudents.map(s => s.parentPhone).filter(Boolean) as string[];

    let roleDisplay = composeSenderName;
    if (composeSenderRole === 'principal') {
      roleDisplay = composeSenderName.includes('ዋና መምህር') ? composeSenderName : `${composeSenderName} (ዋና መምህር / Head Teacher)`;
    } else if (composeSenderRole === 'assistant_teacher') {
      roleDisplay = composeSenderName.includes('ረዳት') ? composeSenderName : `${composeSenderName} (ረዳት መምህር / Assistant Teacher)`;
    }

    CommunicationService.sendMessage({
      title: composeTitle.trim(),
      content: composeContent.trim(),
      senderRole: composeSenderRole,
      senderName: roleDisplay,
      senderContact: currentUserContact || '0911223344',
      senderSubject: composeSubject || (composeSenderRole === 'principal' ? 'ዋና መምህር' : composeSenderRole === 'assistant_teacher' ? 'ረዳት መምህር' : 'የክፍል ተጠሪ መምህር'),
      grade: composeGrade,
      section: composeSection,
      targetType: composeTargetType,
      targetStudentIds: composeTargetType === 'all' ? [] : composeSelectedStudentIds,
      targetStudentNames,
      targetParentPhones,
      studentId: composeTargetType === 'selected' && selectedStudents.length === 1 ? selectedStudents[0].id : undefined,
      studentName: composeTargetType === 'selected' && selectedStudents.length === 1 ? selectedStudents[0].name : undefined,
      workspaceId
    });

    setSendSuccessToast(
      composeTargetType === 'all'
        ? tx(`መልዕክቱ ለሁሉም የ${composeGrade}-${composeSection} ተማሪዎች ወላጆች በተሳካ ሁኔታ ተልኳል!`)
        : tx(`መልዕክቱ ለተመረጡት ${selectedStudents.length} ተማሪዎች ወላጆች በተሳካ ሁኔታ ተልኳል!`)
    );

    // Reset Form
    setComposeTitle('');
    setComposeContent('');
    setComposeSelectedStudentIds([]);
    setActiveTab('inbox');
    setTimeout(() => setSendSuccessToast(null), 4000);
  };

  // Handle Parent Message Submission (Parent to Teacher/Principal)
  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentComposeTitle.trim() || !parentComposeContent.trim()) return;

    let targetRoleTitle = 'ዋና መምህር (Head Teacher)';
    let targetSubjectName = 'አጠቃላይ ትምህርት ቤት';
    if (parentTargetRecipient === 'homeroom') {
      targetRoleTitle = 'የክፍል ተጠሪ መምህር (Homeroom Teacher)';
      targetSubjectName = 'የክፍል ኃላፊነት';
    } else if (parentTargetRecipient === 'assistant') {
      targetRoleTitle = 'ረዳት መምህር (Assistant Teacher)';
      targetSubjectName = 'ረዳት ክትትል';
    } else if (parentTargetRecipient === 'subject') {
      targetRoleTitle = `የትምህርት መምህር (${parentSelectedSubject})`;
      targetSubjectName = parentSelectedSubject;
    }

    const parentDisplayName = currentStudent 
      ? `የ${currentStudent.name} ወላጅ (${currentUserName || 'ወላጅ'})`
      : currentUserName || 'የተማሪ ወላጅ';

    CommunicationService.sendMessage({
      title: parentComposeTitle.trim(),
      content: parentComposeContent.trim(),
      senderRole: 'parent',
      senderName: parentDisplayName,
      senderContact: currentUserContact || '0922334455',
      senderSubject: targetSubjectName,
      grade: currentStudent?.grade || 'Grade 1',
      section: currentStudent?.section || 'A',
      targetType: 'selected',
      targetStudentIds: currentStudent ? [currentStudent.id] : [],
      targetStudentNames: currentStudent ? [`${currentStudent.name} (የልጅ መታወቂያ: ${currentStudent.id})`] : [],
      targetParentPhones: currentUserContact ? [currentUserContact] : [],
      studentId: currentStudent?.id,
      studentName: currentStudent?.name,
      workspaceId
    });

    setSendSuccessToast(tx(`መልዕክትዎ ለ${targetRoleTitle} በተሳካ ሁኔታ ተልኳል!`));
    setParentComposeTitle('');
    setParentComposeContent('');
    setActiveTab('inbox');
    setTimeout(() => setSendSuccessToast(null), 4000);
  };

  // Handle Adding Reply
  const handleSendReply = (messageId: string) => {
    const text = (replyInputs[messageId] || '').trim();
    if (!text) return;

    let replySenderRole: CommunicationReply['senderRole'] = 'parent';
    let replySenderName = currentUserName || 'ወላጅ';
    if (currentUserRole === 'principal') {
      replySenderRole = 'principal';
      replySenderName = currentUserName || 'ዋና መምህር (Principal)';
    } else if (currentUserRole === 'teacher') {
      replySenderRole = 'teacher';
      replySenderName = currentUserName || 'መምህር (Teacher)';
    } else if (currentUserRole === 'parent' && currentStudent) {
      replySenderName = `የ${currentStudent.name} ወላጅ`;
    }

    CommunicationService.addReply(messageId, {
      senderRole: replySenderRole,
      senderName: replySenderName,
      senderContact: currentUserContact || '',
      message: text
    }, workspaceId);

    setReplyInputs(prev => ({ ...prev, [messageId]: '' }));
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* Toast Notification */}
      <AnimatePresence>
        {sendSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl flex items-center justify-between shadow-lg text-emerald-900 dark:text-emerald-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl">
                <Check className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xs sm:text-sm">{sendSuccessToast}</span>
            </div>
            <button 
              onClick={() => setSendSuccessToast(null)}
              className="text-xs font-bold px-3 py-1 bg-white/80 dark:bg-slate-900 rounded-lg border border-emerald-300 dark:border-emerald-700"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-indigo-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-black uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-300" />
              <span>{tx("የወላጅ፣ መምህራን እና ረዳት መምህራን ቀጥታ ኮሚዩኒኬሽን")}</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-mono animate-pulse">
                  {unreadCount} {tx("አዲስ")}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <span>💬 {tx("የሁለትዮሽ መልዕክት እና የክትትል ማዕከል (Communication Portal)")}</span>
            </h2>
            <p className="text-indigo-200 text-xs max-w-2xl leading-relaxed">
              {currentUserRole === 'parent' 
                ? tx("ስለ ልጅዎ የትምህርት ዝግጁነት፣ የቤት ስራ እና ምግባር ከዋና መምህሩ፣ ከክፍል አላፊው እና ከረዳት መምህሯ ጋር በቀጥታ ሀሳብ ይለዋወጡ፣ ግብረ-መልስ ይስጡ እንዲሁም አዳዲስ መልዕክቶችን ይጻፉ።")
                : tx("ለክፍሉ ተማሪዎች ወላጆች በሙሉ በአንድ ጊዜ ወይም በተማሪዎች ስም ዝርዝር መርጠው ለተወሰኑ ወላጆች በብዛት መልዕክት ይላኩ፤ የወላጆችን ግብረ-መልስ በቀጥታ ይከታተሉ።")
              }
            </p>
            {currentUserRole === 'parent' && currentStudent && (
              <div className="pt-1 flex items-center gap-2 text-xs font-bold text-emerald-300">
                <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 rounded-lg">
                  🎓 {tx("የተማሪ ስም:")} {currentStudent.name} (ID: {currentStudent.id}) - {currentStudent.grade} {currentStudent.section}
                </span>
              </div>
            )}
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/15 backdrop-blur-md shrink-0 self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'inbox'
                  ? 'bg-white text-indigo-950 shadow-md scale-102'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{tx("የመልዕክት ሳጥን (Inbox)")}</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('compose')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'compose'
                  ? 'bg-emerald-500 text-white shadow-md scale-102'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {currentUserRole === 'parent' 
                  ? tx("ለመምህር መልዕክት ጻፍ (Write Message)")
                  : tx("አዲስ መልዕክት ላክ (Compose)")
                }
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: INBOX & CONVERSATION THREADS */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {/* Filter Bar (Only for Staff) */}
          {currentUserRole !== 'parent' && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tx("በተማሪ ስም፣ በመልዕክት ርዕስ ወይም በላኪው ይፈልጉ (Search messages)...")}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>{tx("ክፍል:")}</span>
                </div>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="ALL">{tx("ሁሉም ክፍሎች (All Grades)")}</option>
                  {availableGrades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="ALL">{tx("ሁሉም ሴክሽኖች (All Sections)")}</option>
                  {['A', 'B', 'C', 'D'].map(sec => (
                    <option key={sec} value={sec}>{tx("ሴክሽን")} {sec}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Messages Listing */}
          {visibleMessages.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-2xl">
                📭
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {tx("እስካሁን ምንም መልዕክት አልተገኘም (No messages yet)")}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {currentUserRole === 'parent'
                  ? tx("ከመምህራን ወይም ከዋና መምህሩ የተላከ አዲስ መልዕክት የለም። ለፈለጉት መምህር አዲስ መልዕክት መጻፍ ይችላሉ።")
                  : tx("በተመረጠው ክፍል እና ሴክሽን የተላከ መልዕክት የለም። አዲስ መልዕክት ለመላክ \"አዲስ መልዕክት ላክ\" የሚለውን ይጫኑ።")
                }
              </p>
              <button
                onClick={() => setActiveTab('compose')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{tx("አዲስ መልዕክት ጻፍ")}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {visibleMessages.map((msg) => {
                const isSelected = selectedMessageId === msg.id;
                const isUnread = currentUserRole === 'parent' ? !msg.readByParent : !msg.readByStaff;

                return (
                  <div
                    key={msg.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden ${
                      isUnread 
                        ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20 shadow-md' 
                        : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Message Header */}
                    <div 
                      onClick={() => {
                        setSelectedMessageId(isSelected ? null : msg.id);
                        if (isUnread) {
                          CommunicationService.markAsRead(msg.id, currentUserRole === 'parent' ? 'parent' : 'staff', workspaceId);
                        }
                      }}
                      className="p-5 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 select-none hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isUnread && (
                            <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full uppercase tracking-wider animate-pulse">
                              {tx("አዲስ / Unread")}
                            </span>
                          )}

                          {/* Sender badge */}
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 ${
                            msg.senderRole === 'principal'
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                              : msg.senderRole === 'assistant_teacher'
                              ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800'
                              : msg.senderRole === 'parent'
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800'
                          }`}>
                            <span>
                              {msg.senderRole === 'principal' ? '👨‍💼' : msg.senderRole === 'assistant_teacher' ? '👩‍🏫' : msg.senderRole === 'parent' ? '👨‍👩‍👧' : '👨‍🏫'}
                            </span>
                            <span>{msg.senderName}</span>
                          </span>

                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold rounded-lg">
                            {msg.grade} - {msg.section}
                          </span>

                          {msg.targetType === 'all' ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-blue-900">
                              📢 {tx("ለሁሉም ወላጆች")}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold rounded-lg border border-amber-200 dark:border-amber-900">
                              🎯 {tx(`ለተመረጡ ${msg.targetStudentIds?.length || 1} ወላጆች`)}
                            </span>
                          )}

                          {msg.senderSubject && (
                            <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium rounded-lg">
                              📚 {msg.senderSubject}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                          {msg.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {msg.content}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(msg.createdAt).toLocaleDateString('am-ET', { month: 'short', day: 'numeric' })}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {msg.replies && msg.replies.length > 0 && (
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <Reply className="w-3 h-3" />
                              <span>{msg.replies.length} {tx("ግብረ-መልስ")}</span>
                            </span>
                          )}
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                            {isSelected ? '▲ ዝጋ' : '▼ ክፈት'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail & Conversation Thread */}
                    {isSelected && (
                      <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 space-y-4">
                        {/* Target students information */}
                        {msg.targetStudentNames && msg.targetStudentNames.length > 0 && (
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                              👥 {tx("የተመረጡ ተማሪዎች / ወላጆች (Targeted Students):")}
                            </span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {msg.targetStudentNames.map((st, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 rounded-md text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
                                  {st}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Full Message Body */}
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                            <span>{tx("የመልዕክት ዝርዝር (Message Content):")}</span>
                            {msg.senderContact && (
                              <span className="font-mono text-[11px] flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                <PhoneCall className="w-3 h-3 text-emerald-500" />
                                {msg.senderContact}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                            {msg.content}
                          </p>
                          
                          {/* Quick access to student grades / report card if parent is viewing or staff viewing child */}
                          {onOpenStudentReport && (currentStudent || msg.studentId) && (
                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => onOpenStudentReport(currentStudent?.id || msg.studentId || '')}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>{tx("የተማሪውን ውጤት እና ሪፖርት ካርድ ተመልከት (View Report Card)")}</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Thread Replies / Feedback */}
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Reply className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{tx("የተሰጡ ግብረ-መልሶች እና ውይይቶች (Feedback & Replies):")}</span>
                            <span className="font-mono text-[10px] text-slate-400">({(msg.replies || []).length})</span>
                          </h4>

                          {(msg.replies || []).length === 0 ? (
                            <p className="text-xs text-slate-400 italic pl-2">
                              {tx("እስካሁን ምንም ግብረ-መልስ አልተሰጠም። ከዚህ በታች ግብረ-መልስዎን ይጻፉ።")}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {msg.replies.map((rep) => {
                                const isRepParent = rep.senderRole === 'parent';
                                return (
                                  <div
                                    key={rep.id}
                                    className={`p-3.5 rounded-xl text-xs space-y-1 border ${
                                      isRepParent
                                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 ml-3'
                                        : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 mr-3'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center text-[11px] font-bold">
                                      <span className={isRepParent ? 'text-emerald-900 dark:text-emerald-300' : 'text-indigo-900 dark:text-indigo-300'}>
                                        {isRepParent ? '👨‍👩‍👧 ' : '👨‍🏫 '}
                                        {rep.senderName}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {new Date(rep.timestamp).toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-line leading-relaxed">
                                      {rep.message}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Reply Input Box */}
                          <div className="pt-2 flex gap-2">
                            <input
                              type="text"
                              value={replyInputs[msg.id] || ''}
                              onChange={(e) => setReplyInputs({ ...replyInputs, [msg.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSendReply(msg.id);
                                }
                              }}
                              placeholder={
                                currentUserRole === 'parent'
                                  ? tx("ለመምህሩ ግብረ-መልስ ወይም ጥያቄ ይጻፉ (Reply to teacher)...")
                                  : tx("ለወላጁ ምላሽ ይጻፉ (Reply to parent)...")
                              }
                              className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendReply(msg.id)}
                              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{tx("ላክ (Reply)")}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: COMPOSE NEW MESSAGE */}
      {activeTab === 'compose' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
          {/* STAFF COMPOSE FORM (Principal, Homeroom Teacher, Assistant Teacher) */}
          {currentUserRole !== 'parent' ? (
            <form onSubmit={handleStaffSubmit} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  <span>{tx("አዲስ መልዕክት ለወላጆች መላኪያ (Compose Parent Communication)")}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {tx("ክፍል እና ሴክሽን ይምረጡ፤ ለሁሉም ወላጆች ወይም ለተመረጡ ተማሪዎች ወላጆች በብዛት ይላኩ።")}
                </p>
              </div>

              {/* 1. Sender Role Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {tx("የላኪው ኃላፊነት (Sender Role):")}
                  </label>
                  <select
                    value={composeSenderRole}
                    onChange={(e) => setComposeSenderRole(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="principal">👨‍💼 {tx("ዋና መምህር (Head Teacher / Principal)")}</option>
                    <option value="teacher">👨‍🏫 {tx("የክፍል ተጠሪ መምህር (Homeroom Teacher)")}</option>
                    <option value="assistant_teacher">👩‍🏫 {tx("ረዳት መምህር (Assistant Teacher)")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {tx("የላኪው ስም (Sender Name):")}
                  </label>
                  <input
                    type="text"
                    value={composeSenderName}
                    onChange={(e) => setComposeSenderName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {tx("የትምህርት አይነት (Subject - Optional):")}
                  </label>
                  <select
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="">{tx("አጠቃላይ ክትትል (General Follow-up)")}</option>
                    {availableSubjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Grade and Section Selector (Teacher-targeted & Assigned Class aware) */}
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-3">
                <div className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>{tx("የተማሪዎች ክፍል እና ሴክሽን መምረጫ (Target Grade & Section):")}</span>
                  </div>
                  {currentUserRole === 'teacher' && teacherAllocations.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-300/60">
                      ✓ {tx('የተመደቡበት ክፍል')}: {composeGrade} - {composeSection}
                    </span>
                  )}
                </div>

                {currentUserRole === 'teacher' && teacherAllocations.length > 1 ? (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                      {tx("የተመደቡበትን ክፍል ይምረጡ (Select from your Assigned Classes):")}
                    </label>
                    <select
                      value={`${composeGrade}|${composeSection}`}
                      onChange={(e) => {
                        const [g, s] = e.target.value.split('|');
                        setComposeGrade(g);
                        setComposeSection(s);
                        setComposeSelectedStudentIds([]);
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer shadow-2xs font-mono"
                    >
                      {teacherAllocations.map(a => (
                        <option key={`${a.grade}-${a.section}`} value={`${a.grade}|${a.section}`}>
                          🎓 {a.grade} - {tx('ሴክሽን')} {a.section} {a.subjects?.length ? `(${a.subjects.join(', ')})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                        {tx("የክፍል ደረጃ (Grade):")}
                      </label>
                      <select
                        value={composeGrade}
                        onChange={(e) => {
                          setComposeGrade(e.target.value);
                          setComposeSelectedStudentIds([]);
                        }}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer shadow-2xs"
                      >
                        {availableGrades.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                        {tx("ሴክሽን (Section):")}
                      </label>
                      <select
                        value={composeSection}
                        onChange={(e) => {
                          setComposeSection(e.target.value);
                          setComposeSelectedStudentIds([]);
                        }}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer shadow-2xs font-mono"
                      >
                        {['A', 'B', 'C', 'D', 'E', 'F'].map(sec => (
                          <option key={sec} value={sec}>{tx("ሴክሽን")} {sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Target Audience Mode (All vs. Specific Selected Parents) */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase text-slate-500">
                  {tx("የመላኪያ አድራሻ (Broadcast Mode):")}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setComposeTargetType('all')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
                      composeTargetType === 'all'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      checked={composeTargetType === 'all'}
                      onChange={() => setComposeTargetType('all')}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-extrabold text-xs block">
                        📢 {tx(`ለክፍሉ ተማሪዎች በሙሉ (All ${composeGrade}-${composeSection} Parents)`)}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        {tx(`አንድ ጊዜ የተጻፈው መልዕክት በክፍሉ ላሉ ${targetClassStudents.length} ተማሪዎች ወላጆች በሙሉ ይላካል።`)}
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setComposeTargetType('selected')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
                      composeTargetType === 'selected'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      checked={composeTargetType === 'selected'}
                      onChange={() => setComposeTargetType('selected')}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-extrabold text-xs block">
                        🎯 {tx("በተማሪዎች ስም መርጦ መላክ (Select Specific Parents)")}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        {tx("ለምሳሌ ለአበበ ወላጅ ብቻ፣ ለሁለት፣ ለሶስት ወይም ለፈለጉት መጠን መርጠው ይላኩ።")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Selective Student Checklist (When "selected" is active) */}
                {composeTargetType === 'selected' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>{tx(`የ${composeGrade} - ${composeSection} የተማሪዎች ስም ዝርዝር (መምረጫ):`)}</span>
                        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 rounded-full font-mono text-[10px]">
                          {composeSelectedStudentIds.length} {tx("ተመርጠዋል")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllStudents}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[10px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50"
                        >
                          {tx("ሁሉንም ምረጥ (Select All)")}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAllStudents}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        >
                          {tx("አውርድ (Clear)")}
                        </button>
                      </div>
                    </div>

                    {/* Quick search within student roster */}
                    <input
                      type="text"
                      value={studentSearchFilter}
                      onChange={(e) => setStudentSearchFilter(e.target.value)}
                      placeholder={tx("የተማሪውን ስም ጽፈው ይፈልጉ (e.g. አበበ / Abebe)...")}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    {/* Student List */}
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                      {filteredTargetClassStudents.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">
                          {tx("በዚህ ክፍል እና ሴክሽን የተመዘገበ ተማሪ አልተገኘም።")}
                        </p>
                      ) : (
                        filteredTargetClassStudents.map((st) => {
                          const isChecked = composeSelectedStudentIds.includes(st.id);
                          return (
                            <div
                              key={st.id}
                              onClick={() => handleToggleStudent(st.id)}
                              className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between gap-3 ${
                                isChecked
                                  ? 'bg-indigo-100/70 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-950 dark:text-white'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="text-indigo-600">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 fill-indigo-600 text-white" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                                <div className="truncate">
                                  <span className="text-xs font-extrabold block truncate">{st.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">ID: {st.id}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  {st.parentPhone ? (
                                    <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                      <PhoneCall className="w-3 h-3" />
                                      {st.parentPhone}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">{tx('ስልክ የለም')}</span>
                                  )}
                                  {st.parentName && (
                                    <span className="block text-[9px] text-slate-400 truncate max-w-[110px]">
                                      {st.parentName}
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playInteractiveSound('click');
                                    setComposeSelectedStudentIds([st.id]);
                                    setComposeTitle(`የተማሪ ${st.name} የትምህርት እና ስነ-ምግባር ክትትል`);
                                    setComposeContent(`ውድ የተከበሩ የ${st.name} ወላጅ፤ `);
                                  }}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-extrabold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                                  title={tx('ለዚህ ተማሪ ወላጅ ብቻ በተናጠል መልዕክት ይላኩ')}
                                >
                                  <Send className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                  <span>{tx('ለዚህ ወላጅ ብቻ')}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Quick Message Templates */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  ⚡ {tx("ፈጣን የመልዕክት ቅጾች (Quick Preset Templates):")}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('homework')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-700 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    📝 {tx("የቤት ስራ ክትትል")}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('conduct')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-700 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    ⭐ {tx("ስነ-ምግባር እና ዝግጁነት")}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('meeting')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-700 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    👥 {tx("የወላጆች ስብሰባ ጥሪ")}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('praise')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-700 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    🏆 {tx("የላቀ ምስጋና")}
                  </button>
                </div>
              </div>

              {/* 6. Title and Content */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {tx("የመልዕክት ርዕስ (Subject Title):")}
                  </label>
                  <input
                    type="text"
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                    required
                    placeholder={tx("ለምሳሌ፡ ስለ ተማሪው የቤት ስራ እና የንባብ ክትትል...")}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {tx("ዝርዝር መልዕክት (Detailed Message Content):")}
                  </label>
                  <textarea
                    rows={4}
                    value={composeContent}
                    onChange={(e) => setComposeContent(e.target.value)}
                    required
                    placeholder={tx("ለወላጆች የሚተላለፈውን መልዕክት፣ ምክረ-ሀሳብ ወይም ጥሪ እዚህ በዝርዝር ይጻፉ...")}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  ></textarea>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer"
                >
                  {tx("ይቅር (Cancel)")}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{tx("መልዕክቱን ላክ (Send Message)")}</span>
                </button>
              </div>
            </form>
          ) : (
            /* PARENT COMPOSE FORM (Parent sending message to Principal, Homeroom Teacher, Assistant Teacher, or Subject Teacher) */
            <form onSubmit={handleParentSubmit} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-600" />
                  <span>{tx("ለመምህራን ወይም ለዋና መምህሩ መልዕክት መላኪያ (Send Message to School)")}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {tx("የሚፈልጉትን መምህር፣ የክፍል ተጠሪ፣ ረዳት መምህር ወይም በትምህርት አይነት መርጠው ሀሳብዎን ወይም ጥያቄዎን መላክ ይችላሉ።")}
                </p>
              </div>

              {/* Recipient Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-500">
                  {tx("መልዕክቱ የሚደርሰው ለማን ነው? (Select Recipient):")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div
                    onClick={() => setParentTargetRecipient('homeroom')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      parentTargetRecipient === 'homeroom'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-2xs font-extrabold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700'
                    }`}
                  >
                    <div className="text-sm mb-1">👨‍🏫</div>
                    <div className="text-xs font-black">{tx("የክፍል ተጠሪ መምህር")}</div>
                    <div className="text-[10px] text-slate-400">{tx("Homeroom Teacher")}</div>
                  </div>

                  <div
                    onClick={() => setParentTargetRecipient('assistant')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      parentTargetRecipient === 'assistant'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-2xs font-extrabold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700'
                    }`}
                  >
                    <div className="text-sm mb-1">👩‍🏫</div>
                    <div className="text-xs font-black">{tx("ረዳት መምህር")}</div>
                    <div className="text-[10px] text-slate-400">{tx("Assistant Teacher")}</div>
                  </div>

                  <div
                    onClick={() => setParentTargetRecipient('subject')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      parentTargetRecipient === 'subject'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-2xs font-extrabold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700'
                    }`}
                  >
                    <div className="text-sm mb-1">📚</div>
                    <div className="text-xs font-black">{tx("የትምህርት አይነት መምህር")}</div>
                    <div className="text-[10px] text-slate-400">{tx("Subject Teacher")}</div>
                  </div>

                  <div
                    onClick={() => setParentTargetRecipient('principal')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      parentTargetRecipient === 'principal'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-2xs font-extrabold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700'
                    }`}
                  >
                    <div className="text-sm mb-1">👨‍💼</div>
                    <div className="text-xs font-black">{tx("ዋና መምህር / ርዕሰ መምህር")}</div>
                    <div className="text-[10px] text-slate-400">{tx("Head Teacher / Principal")}</div>
                  </div>
                </div>
              </div>

              {/* Subject Dropdown (When "subject" is chosen) */}
              {parentTargetRecipient === 'subject' && (
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2 animate-fade-in">
                  <label className="block text-[10px] font-black uppercase text-emerald-900 dark:text-emerald-300">
                    📖 {tx("የሚፈልጉትን የትምህርት አይነት ይምረጡ (Select Subject):")}
                  </label>
                  <select
                    value={parentSelectedSubject}
                    onChange={(e) => setParentSelectedSubject(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer shadow-2xs"
                  >
                    {availableSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Message inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {tx("የመልዕክት ርዕስ (Subject Title):")}
                  </label>
                  <input
                    type="text"
                    value={parentComposeTitle}
                    onChange={(e) => setParentComposeTitle(e.target.value)}
                    required
                    placeholder={tx("ለምሳሌ፡ ስለ ልጄ የቤት ስራ ወይም የክፍል ውስጥ ተሳትፎ...")}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {tx("የመልዕክት ዝርዝር (Message Content):")}
                  </label>
                  <textarea
                    rows={4}
                    value={parentComposeContent}
                    onChange={(e) => setParentComposeContent(e.target.value)}
                    required
                    placeholder={tx("ለመምህሩ ወይም ለዋና መምህሩ ማስተላለፍ የሚፈልጉትን ሀሳብ፣ ጥያቄ ወይም ግብረ-መልስ እዚህ ይጻፉ...")}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  ></textarea>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer"
                >
                  {tx("ይቅር (Cancel)")}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{tx("መልዕክቱን ላክ (Send Message)")}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
