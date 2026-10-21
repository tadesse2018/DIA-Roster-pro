import React, { useState, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  Phone, 
  CheckSquare, 
  Square, 
  Shield, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle, 
  QrCode, 
  UserPlus, 
  Briefcase, 
  Award, 
  Sparkles,
  Calendar,
  DollarSign,
  Search,
  CheckCircle2,
  Mail,
  MapPin,
  Clock,
  ChevronRight,
  BookOpen,
  Download,
  Printer,
  Camera,
  Image as ImageIcon,
  FileSpreadsheet
} from 'lucide-react';
import { 
  Teacher, 
  StaffMember, 
  StaffCategory, 
  ADMIN_DIVISIONS,
  DEFAULT_SCHOOL_SUBJECTS,
  getSubjectDisplayName,
  DEFAULT_SCHOOL_LOGO
} from '../schoolData';
import { playInteractiveSound } from './AudioEngine';
import { useLanguage } from './LanguageContext';
import { RegisterStaffModal } from './RegisterStaffModal';
import { StaffPayrollAttendanceSection } from './StaffPayrollAttendanceSection';
import { AdminDivisionOfWorkSection } from './AdminDivisionOfWorkSection';

interface TeacherSectionProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Teacher) => void;
  onEditTeacher?: (teacher: Teacher) => void;
  onDeleteTeacher?: (id: string) => void;
  schoolConfig?: any;
  onShowTeacherQR?: (teacher: any) => void;
  staffList?: StaffMember[];
  onAddStaff?: (staff: StaffMember) => void;
  onEditStaff?: (staff: StaffMember) => void;
  onDeleteStaff?: (id: string) => void;
  onOpenRegisterStaffModal?: () => void;
  workspaceId?: string;
  initialTab?: 'directory' | 'admin-division' | 'attendance';
  onOpenMarkList?: (staff: StaffMember, matchedTeacher?: Teacher) => void;
}

export const TeacherSection: React.FC<TeacherSectionProps> = ({ 
  teachers = [], 
  onAddTeacher, 
  onEditTeacher,
  onDeleteTeacher,
  schoolConfig,
  onShowTeacherQR,
  staffList = [],
  onAddStaff,
  onEditStaff,
  onDeleteStaff,
  onOpenRegisterStaffModal,
  workspaceId = 'default',
  initialTab = 'directory',
  onOpenMarkList
}) => {
  const { tx } = useLanguage();

  // Primary Tab: Directory vs Admin Division of Work vs 30-Day Attendance/Payroll
  const [activeTab, setActiveTab] = useState<'directory' | 'admin-division' | 'attendance'>(initialTab);

  // Sync activeTab with initialTab prop if it changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Internal modal open state if onOpenRegisterStaffModal is not passed
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  // Search and Category Filter for Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Edit State & Modal States for Teachers & All Staff
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);
  const [editPhoto, setEditPhoto] = useState('');
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<'Male' | 'Female'>('Male');
  const [editAge, setEditAge] = useState('');
  const [editEducationLevel, setEditEducationLevel] = useState('Degree');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCategory, setEditCategory] = useState<string>('Head Teacher');
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editBaseSalary, setEditBaseSalary] = useState<number>(14000);
  const [editShift, setEditShift] = useState('Full Time (ሙሉ ቀን)');
  const [editAssignedGrade, setEditAssignedGrade] = useState('Grade 1');
  const [editAssignedSection, setEditAssignedSection] = useState('A');
  const [editSelectedSubjects, setEditSelectedSubjects] = useState<string[]>([]);
  const [editAllocations, setEditAllocations] = useState<{ grade: string; section: string; subjects?: string[]; }[]>([]);
  const [editFormGrade, setEditFormGrade] = useState('Grade 1');
  const [editFormSection, setEditFormSection] = useState('A');
  const [editAllocSelectedSubjects, setEditAllocSelectedSubjects] = useState<string[]>([]);
  const [editIsHomeroom, setEditIsHomeroom] = useState('No');
  const [editHomeroomGrade, setEditHomeroomGrade] = useState('Grade 1');
  const [editHomeroomSection, setEditHomeroomSection] = useState('A');
  const [editTeaches, setEditTeaches] = useState<boolean>(true);

  // Dedicated Class & Subject Allocation Modal State
  const [allocatingTeacher, setAllocatingTeacher] = useState<Teacher | null>(null);
  const [allocModalList, setAllocModalList] = useState<{ grade: string; section: string; subjects?: string[]; }[]>([]);
  const [allocModalGrade, setAllocModalGrade] = useState('Grade 1');
  const [allocModalSection, setAllocModalSection] = useState('A');
  const [allocModalSelectedSubjects, setAllocModalSelectedSubjects] = useState<string[]>(['Mathematics']);
  const [allocModalCustomSubject, setAllocModalCustomSubject] = useState('');

  // Delete State & Warning Modal
  const [deletingStaff, setDeletingStaff] = useState<{ id: string; name: string; isTeacher: boolean } | null>(null);

  const activeGradesList = schoolConfig?.schoolLevel === 'secondary'
    ? ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
    : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];

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
      ...DEFAULT_SCHOOL_SUBJECTS
    ];
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
  }, [schoolConfig?.subjects]);

  // Harmonize teachers and staffList into a unified display list
  const unifiedStaffList: StaffMember[] = useMemo(() => {
    const list: StaffMember[] = [...staffList];
    const existingIds = new Set(list.map(s => s.id));

    // Also include any teachers from teachers[] that aren't in staffList
    teachers.forEach(t => {
      if (!existingIds.has(t.id)) {
        list.push({
          id: t.id,
          name: t.name,
          category: 'Head Teacher',
          roleTitle: t.isHomeroomTeacher ? 'ዋና መምህር / የክፍል ኃላፊ' : 'ዋና መምህር (Head Teacher)',
          educationLevel: t.educationLevel,
          phone: t.phone,
          email: t.email,
          gender: t.gender,
          age: t.age,
          photo: t.photo,
          subjects: t.subjects,
          assignedClass: t.assignedClass,
          assignedSection: t.assignedSection,
          classAllocations: t.classAllocations,
          isHomeroomTeacher: t.isHomeroomTeacher,
          baseSalary: 14500,
          dailyRate: Math.round(14500 / 30),
          shift: 'Full Time (ሙሉ ቀን)',
          registeredBy: t.registeredBy || 'Admin',
          timestamp: t.timestamp || new Date().toISOString()
        });
      }
    });

    return list;
  }, [staffList, teachers]);

  // Filtered staff list by search and category
  const filteredStaff = useMemo(() => {
    return unifiedStaffList.filter(item => {
      const matchesSearch = 
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery) ||
        (item.roleTitle && item.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.subjects && item.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;

      if (selectedCategoryFilter === 'All') return true;
      if (selectedCategoryFilter === 'Head Teacher') return item.category === 'Head Teacher' || item.category === 'Main Teacher';
      if (selectedCategoryFilter === 'Principal') return item.category === 'Principal' || (item.category === 'Head Teacher' && (item.roleTitle?.toLowerCase().includes('principal') || item.roleTitle?.includes('ርዕሰ') || item.roleTitle?.includes('ር/መ')));
      if (selectedCategoryFilter === 'Vice Principal') return item.category === 'Vice Principal' || item.roleTitle?.toLowerCase().includes('vice') || item.roleTitle?.includes('ምክትል') || item.roleTitle?.includes('ም/ር/መ');
      if (selectedCategoryFilter === 'Secretary') return item.category === 'Secretary' || item.roleTitle?.toLowerCase().includes('secretary') || item.roleTitle?.toLowerCase().includes('registrar') || item.roleTitle?.includes('ፀሐፊ') || item.roleTitle?.includes('ሰነድ');
      if (selectedCategoryFilter === 'Finance') return item.category === 'Finance' || item.roleTitle?.toLowerCase().includes('finance') || item.roleTitle?.toLowerCase().includes('accountant') || item.roleTitle?.includes('ፋይናንስ') || item.roleTitle?.includes('ሂሳብ');
      if (selectedCategoryFilter === 'Cleaner') return item.category === 'Cleaner' || item.roleTitle?.toLowerCase().includes('clean') || item.roleTitle?.includes('ጽዳት') || item.roleTitle?.includes('ፅዳት');
      if (selectedCategoryFilter === 'Security Guard') return item.category === 'Security Guard' || item.roleTitle?.toLowerCase().includes('security') || item.roleTitle?.includes('ጥበቃ');
      return item.category === selectedCategoryFilter;
    });
  }, [unifiedStaffList, searchQuery, selectedCategoryFilter]);

  // Download Staff Roster as PDF document to local storage
  const handleDownloadStaffRosterPDF = () => {
    playInteractiveSound('success');

    const totalStaff = filteredStaff.length;
    const totalMale = filteredStaff.filter(s => s.gender === 'Male').length;
    const totalFemale = filteredStaff.filter(s => s.gender === 'Female').length;
    const schoolAmh = schoolConfig?.nameAmh || 'ደሊጀንት አካዳሚ';
    const schoolEng = (schoolConfig?.nameEng || 'DILIGENT ACADEMY').replace(/app/i, '').trim();
    const academicYear = schoolConfig?.academicYear || '2018 ዓ.ም';
    const categoryTitle = selectedCategoryFilter === 'All' ? 'ሁሉም ሰራተኞች (All Staff)' : selectedCategoryFilter;
    const generatedDate = new Date().toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });
    const schoolLogo = schoolConfig?.logoImage || DEFAULT_SCHOOL_LOGO;

    const rowsHtml = filteredStaff.map((st, idx) => {
      const isTeaching = st.category === 'Head Teacher' || st.category === 'Main Teacher' || st.category === 'Assistant Teacher' || (st.subjects && st.subjects.length > 0) || teachers.some(t => t.id === st.id);
      const teachingSummary = isTeaching 
        ? `${st.isHomeroomTeacher ? '🎓 ተጠሪ: ' + (st.assignedClass || 'Grade 1') + '-' + (st.assignedSection || 'A') + ' | ' : ''}ትምህርቶች: ${(st.subjects || []).join(', ') || 'አልተመደበም'}`
        : (st.roleTitle || st.category);

      return `
        <tr>
          <td style="text-align: center; font-weight: bold; width: 35px;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; width: 80px;">${st.id}</td>
          <td style="font-weight: 700; text-align: left; padding-left: 8px;">${st.name}</td>
          <td style="text-align: center; width: 60px;">${st.gender === 'Male' ? 'ወንድ' : 'ሴት'}</td>
          <td style="text-align: left; width: 100px;">${st.category}</td>
          <td style="text-align: center; width: 80px;">${st.educationLevel || '-'}</td>
          <td style="font-family: monospace; text-align: center; width: 105px;">${st.phone || '-'}</td>
          <td style="text-align: left; font-size: 10px;">${teachingSummary}</td>
          <td style="font-family: monospace; text-align: right; width: 85px;">${st.baseSalary ? st.baseSalary.toLocaleString() + ' ETB' : '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <title>${schoolAmh} - የመምህራንና ሰራተኞች መዝገብ (${categoryTitle})</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Ethiopic", Helvetica, Arial, sans-serif;
      background: #f8fafc;
      margin: 0;
      padding: 20px;
      color: #0f172a;
    }
    .action-bar {
      max-width: 1050px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .btn-print {
      background: #4338ca;
      color: white;
      border: none;
      padding: 10px 22px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
    }
    .doc-page {
      max-width: 1050px;
      margin: 0 auto;
      background: white;
      padding: 25px;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .school-title {
      font-size: 20px;
      font-weight: 900;
      color: #1e1b4b;
      margin: 0;
      text-transform: uppercase;
    }
    .school-eng {
      font-size: 12px;
      font-weight: 800;
      color: #4338ca;
      letter-spacing: 1px;
      margin: 2px 0 0 0;
      text-transform: uppercase;
    }
    .doc-subtitle {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 6px;
    }
    .meta-badges {
      display: flex;
      justify-content: space-between;
      background: #f1f5f9;
      border-radius: 10px;
      padding: 8px 14px;
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 14px;
      border: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 6px;
    }
    table.roster {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    table.roster th, table.roster td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
    }
    table.roster th {
      background-color: #f8fafc;
      color: #1e293b;
      font-weight: 800;
      font-size: 10px;
      text-transform: uppercase;
    }
    table.roster tr:nth-child(even) {
      background-color: #fcfdfe;
    }
    .signatures {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      text-align: center;
      font-size: 11px;
      font-weight: bold;
      color: #334155;
      page-break-inside: avoid;
    }
    .sig-line {
      width: 170px;
      border-bottom: 1.5px dashed #64748b;
      margin: 30px auto 6px auto;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .action-bar {
        display: none !important;
      }
      .doc-page {
        box-shadow: none;
        border: none;
        padding: 0;
        max-width: 100%;
      }
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <div style="font-size: 13px; font-weight: bold; color: #1e293b;">
      📄 የመምህራንና ሰራተኞች ዝርዝር መዝገብ - ${totalStaff} ሰራተኞች
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ በPDF አስቀምጥ / አትም (Save as PDF / Print)</button>
  </div>

  <div class="doc-page">
    <table class="header-table">
      <tr>
        <td style="text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px;">
            <img src="${schoolLogo}" style="width: 52px; height: 52px; object-fit: contain; border-radius: 50%; border: 1.5px solid #c7d2fe; padding: 2px; background: white;" alt="School Logo" />
            <div>
              <h1 class="school-title">${schoolAmh}</h1>
              <div class="school-eng">${schoolEng}</div>
            </div>
          </div>
          <div class="doc-subtitle">የመምህራን እና ሰራተኞች ማውጫ መዝገብ (STAFF & FACULTY DIRECTORY)</div>
        </td>
      </tr>
    </table>

    <div class="meta-badges">
      <div>ምድብ፡ <span style="color: #4338ca;">${categoryTitle}</span></div>
      <div>የትምህርት ዘመን፡ <span style="color: #4338ca;">${academicYear}</span></div>
      <div>ጠቅላላ ሰራተኞች፡ <span>${totalStaff} (ወንድ፡ ${totalMale} | ሴት፡ ${totalFemale})</span></div>
      <div>ቀን፡ <span>${generatedDate}</span></div>
    </div>

    <table class="roster">
      <thead>
        <tr>
          <th style="text-align: center;">ተ.ቁ</th>
          <th style="text-align: left;">መታወቂያ (ID)</th>
          <th style="text-align: left;">ሙሉ ስም (Full Name)</th>
          <th style="text-align: center;">ጾታ</th>
          <th style="text-align: left;">የሰራተኛ ምድብ</th>
          <th style="text-align: center;">የት/ደረጃ</th>
          <th style="text-align: center;">ስልክ ቁጥር</th>
          <th style="text-align: left;">የሚያስተምረው / የስራ ድርሻ</th>
          <th style="text-align: right;">መነሻ ደመወዝ</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="signatures">
      <div>
        <div class="sig-line"></div>
        <div>የሰው ኃይል አስተዳዳሪ (HR Officer)</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div>ዋና ርዕሰ መምህር (Head Principal)</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div>የትምህርት ቤቱ ይፋዊ ማህተም (School Seal)</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    const safeCat = categoryTitle.replace(/[^a-zA-Z0-9\u1200-\u137F]/g, '_');
    link.download = `የመምህራን_እና_ሰራተኞች_መዝገብ_${safeCat}_${academicYear}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const handleDownloadStaffCSV = () => {
    playInteractiveSound('success');
    let csvString = "Staff ID,Full Name,Gender,Category,Education Level,Phone,Assigned Role / Class,Subjects,Base Salary\n";
    filteredStaff.forEach(s => {
      const subjectsStr = (s.subjects || []).join('; ');
      csvString += `${s.id},"${s.name.replace(/"/g, '""')}",${s.gender || 'Male'},"${s.category}","${s.educationLevel || '-'}","${s.phone || '-'}","${s.assignedClass ? s.assignedClass + ' - ' + s.assignedSection : s.roleTitle || s.category}","${subjectsStr}",${s.baseSalary || 0}\n`;
    });
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Staff_List_${selectedCategoryFilter}_${(schoolConfig?.nameEng || 'School').replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open Edit Modal for any Staff Member or Teacher
  const handleOpenEdit = (staff: StaffMember) => {
    const isTeacher = teachers.some(t => t.id === staff.id) || 
      staff.category === 'Head Teacher' || 
      staff.category === 'Main Teacher' || 
      staff.category === 'Assistant Teacher';

    const matchedTeacher = teachers.find(t => t.id === staff.id) || {
      id: staff.id,
      name: staff.name,
      gender: staff.gender || 'Male',
      age: staff.age,
      educationLevel: staff.educationLevel || 'Degree',
      phone: staff.phone,
      email: staff.email,
      photo: staff.photo,
      subjects: staff.subjects || ['Mathematics'],
      assignedClass: staff.assignedClass || activeGradesList[0] || 'Grade 1',
      assignedSection: staff.assignedSection || 'A',
      classAllocations: staff.classAllocations || [],
      isHomeroomTeacher: !!staff.isHomeroomTeacher,
      registeredBy: staff.registeredBy,
      timestamp: staff.timestamp
    };

    setEditingStaffMember(staff);
    setEditingTeacher(matchedTeacher);
    setEditPhoto(staff.photo || matchedTeacher.photo || '');
    setEditName(staff.name);
    setEditGender(staff.gender || 'Male');
    setEditAge(staff.age ? String(staff.age) : '');
    setEditEducationLevel(staff.educationLevel || matchedTeacher.educationLevel || 'Degree');
    setEditPhone(staff.phone || '');
    setEditEmail(staff.email || matchedTeacher.email || '');
    setEditCategory(staff.category || (isTeacher ? 'Main Teacher' : 'Support Staff'));
    setEditRoleTitle(staff.roleTitle || '');
    setEditBaseSalary(staff.baseSalary || 14000);
    setEditShift(staff.shift || 'Full Time (ሙሉ ቀን)');
    setEditAssignedGrade(staff.assignedClass || matchedTeacher.assignedClass || activeGradesList[0] || 'Grade 1');
    setEditAssignedSection(staff.assignedSection || matchedTeacher.assignedSection || 'A');
    setEditSelectedSubjects(matchedTeacher.subjects || staff.subjects || ['Mathematics']);
    setEditAllocations(matchedTeacher.classAllocations || staff.classAllocations || [
      { grade: staff.assignedClass || matchedTeacher.assignedClass || activeGradesList[0] || 'Grade 1', section: staff.assignedSection || matchedTeacher.assignedSection || 'A', subjects: matchedTeacher.subjects }
    ]);
    setEditFormGrade(activeGradesList[0] || 'Grade 1');
    setEditFormSection('A');
    setEditAllocSelectedSubjects(matchedTeacher.subjects || []);
    setEditIsHomeroom(matchedTeacher.isHomeroomTeacher || staff.isHomeroomTeacher ? 'Yes' : 'No');
    setEditHomeroomGrade(staff.assignedClass || matchedTeacher.assignedClass || activeGradesList[0] || 'Grade 1');
    setEditHomeroomSection(staff.assignedSection || matchedTeacher.assignedSection || 'A');

    const isVicePrincipalItem = staff.category === 'Vice Principal' || staff.roleTitle?.toLowerCase().includes('vice') || staff.roleTitle?.includes('ምክትል');
    const hasTeachingDuties = !!(
      matchedTeacher ||
      (staff.subjects && staff.subjects.length > 0) ||
      staff.assignedClass ||
      (staff.classAllocations && staff.classAllocations.length > 0)
    );
    setEditTeaches(isVicePrincipalItem ? hasTeachingDuties : true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffMember && !editingTeacher) return;
    if (!editName.trim()) {
      alert(tx('እባክዎን ሙሉ ስም ያስገቡ (Please enter full name)'));
      return;
    }

    const isVicePrincipal = editCategory === 'Vice Principal' || editingStaffMember?.category === 'Vice Principal' || editingStaffMember?.roleTitle?.toLowerCase().includes('vice') || editingStaffMember?.roleTitle?.includes('ምክትል');
    const isTeacher = (
      teachers.some(t => t.id === editingStaffMember?.id) ||
      editCategory === 'Head Teacher' ||
      editCategory === 'Main Teacher' ||
      editCategory === 'Assistant Teacher' ||
      (isVicePrincipal && editTeaches)
    );

    if (isTeacher && editSelectedSubjects.length === 0) {
      alert(tx('እባክዎን ቢያንስ አንድ የሚያስተምሩት የትምህርት አይነት ይምረጡ (Select at least one subject)'));
      return;
    }

    const finalAssignedClass = editIsHomeroom === 'Yes' ? editHomeroomGrade : editAssignedGrade;
    const finalAssignedSection = editIsHomeroom === 'Yes' ? editHomeroomSection : editAssignedSection;

    let finalAllocations = [...editAllocations];
    const idx = finalAllocations.findIndex(a => a.grade === finalAssignedClass && a.section === finalAssignedSection);
    if (idx === -1) {
      finalAllocations = [{ grade: finalAssignedClass, section: finalAssignedSection, subjects: editSelectedSubjects }, ...finalAllocations];
    } else {
      finalAllocations[idx] = { grade: finalAssignedClass, section: finalAssignedSection, subjects: editSelectedSubjects };
    }

    if (isTeacher) {
      const existingTeacher = editingTeacher || teachers.find(t => t.id === editingStaffMember?.id);
      const updatedTeacher: Teacher = {
        id: editingStaffMember?.id || existingTeacher?.id || `TCH-${Math.floor(1000 + Math.random() * 9000)}`,
        name: editName.trim(),
        gender: editGender,
        age: editAge ? parseInt(editAge, 10) : undefined,
        educationLevel: editEducationLevel,
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
        photo: editPhoto || undefined,
        subjects: editSelectedSubjects,
        assignedClass: finalAssignedClass,
        assignedSection: finalAssignedSection,
        classAllocations: finalAllocations,
        isHomeroomTeacher: editIsHomeroom === 'Yes',
        registeredBy: existingTeacher?.registeredBy || 'Principal',
        timestamp: existingTeacher?.timestamp || new Date().toISOString()
      };

      if (onEditTeacher) {
        onEditTeacher(updatedTeacher);
      }
    }

    if (editingStaffMember) {
      const updatedStaff: StaffMember = {
        ...editingStaffMember,
        name: editName.trim(),
        gender: editGender,
        age: editAge ? parseInt(editAge, 10) : undefined,
        educationLevel: editEducationLevel,
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
        photo: editPhoto || undefined,
        category: editCategory as any,
        roleTitle: editRoleTitle.trim() || (isTeacher ? (editIsHomeroom === 'Yes' ? 'ዋና መምህር / የክፍል ኃላፊ' : (editCategory === 'Assistant Teacher' ? 'ረዳት መምህር' : 'መምህር')) : editingStaffMember.roleTitle),
        baseSalary: editBaseSalary || editingStaffMember.baseSalary || 14000,
        dailyRate: Math.round((editBaseSalary || 14000) / 30),
        shift: editShift,
        subjects: isTeacher ? editSelectedSubjects : undefined,
        assignedClass: isTeacher ? finalAssignedClass : undefined,
        assignedSection: isTeacher ? finalAssignedSection : undefined,
        classAllocations: isTeacher ? finalAllocations : undefined,
        isHomeroomTeacher: isTeacher ? editIsHomeroom === 'Yes' : undefined
      };

      if (onEditStaff) {
        onEditStaff(updatedStaff);
      }
    }

    playInteractiveSound('success');
    setEditingTeacher(null);
    setEditingStaffMember(null);
  };

  // Open standalone Class & Subject Allocation Modal
  const handleOpenClassAllocationModal = (teacher: Teacher) => {
    setAllocatingTeacher(teacher);
    const existingAllocations = teacher.classAllocations && teacher.classAllocations.length > 0
      ? teacher.classAllocations
      : [{ grade: teacher.assignedClass || activeGradesList[0] || 'Grade 1', section: teacher.assignedSection || 'A', subjects: teacher.subjects || ['Mathematics'] }];
    setAllocModalList(JSON.parse(JSON.stringify(existingAllocations)));
    setAllocModalGrade(activeGradesList[0] || 'Grade 1');
    setAllocModalSection('A');
    setAllocModalSelectedSubjects(teacher.subjects && teacher.subjects.length > 0 ? [teacher.subjects[0]] : ['Mathematics']);
    setAllocModalCustomSubject('');
  };

  const handleAddModalAllocation = () => {
    if (allocModalSelectedSubjects.length === 0 && !allocModalCustomSubject.trim()) {
      alert(tx('እባክዎን ለዚህ ክፍል ቢያንስ አንድ የትምህርት አይነት ይምረጡ (Please select or type at least one subject for this class)'));
      return;
    }

    const subjs = [...allocModalSelectedSubjects];
    if (allocModalCustomSubject.trim() && !subjs.includes(allocModalCustomSubject.trim())) {
      subjs.push(allocModalCustomSubject.trim());
    }

    const existingIdx = allocModalList.findIndex(a => a.grade === allocModalGrade && a.section === allocModalSection);
    if (existingIdx >= 0) {
      const updated = [...allocModalList];
      updated[existingIdx] = { grade: allocModalGrade, section: allocModalSection, subjects: subjs };
      setAllocModalList(updated);
    } else {
      setAllocModalList([...allocModalList, { grade: allocModalGrade, section: allocModalSection, subjects: subjs }]);
    }
    playInteractiveSound('click');
    setAllocModalCustomSubject('');
  };

  const handleRemoveModalAllocation = (index: number) => {
    playInteractiveSound('click');
    if (allocModalList.length <= 1) {
      alert(tx('መምህሩ ቢያንስ አንድ የተመደበበት ክፍል ሊኖረው ይገባል (Teacher must have at least one allocated class)'));
      return;
    }
    setAllocModalList(allocModalList.filter((_, i) => i !== index));
  };

  const handleSaveAllocationsModal = () => {
    if (!allocatingTeacher) return;
    if (allocModalList.length === 0) {
      alert(tx('እባክዎን ቢያንስ አንድ የክፍልና የትምህርት ምደባ ያካትቱ (Please add at least one allocation)'));
      return;
    }

    // Derive all unique subjects taught across all assigned classes
    const uniqueSubjects = Array.from(new Set(allocModalList.flatMap(a => a.subjects || [])));
    const primaryAlloc = allocModalList[0];

    const updatedTeacher: Teacher = {
      ...allocatingTeacher,
      classAllocations: allocModalList,
      subjects: uniqueSubjects.length > 0 ? uniqueSubjects : allocatingTeacher.subjects,
      assignedClass: allocatingTeacher.isHomeroomTeacher ? allocatingTeacher.assignedClass : primaryAlloc.grade,
      assignedSection: allocatingTeacher.isHomeroomTeacher ? allocatingTeacher.assignedSection : primaryAlloc.section
    };

    if (onEditTeacher) {
      onEditTeacher(updatedTeacher);
    }
    playInteractiveSound('success');
    setAllocatingTeacher(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingStaff) return;
    playInteractiveSound('click');

    if (deletingStaff.isTeacher && onDeleteTeacher) {
      onDeleteTeacher(deletingStaff.id);
    }
    if (onDeleteStaff) {
      onDeleteStaff(deletingStaff.id);
    }
    setDeletingStaff(null);
  };

  const triggerRegisterModal = () => {
    playInteractiveSound('click');
    if (onOpenRegisterStaffModal) {
      onOpenRegisterStaffModal();
    } else {
      setIsStaffModalOpen(true);
    }
  };

  return (
    <div className="space-y-6" id="teacher-staff-management-section">
      {/* SECTION BANNER & CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800 p-0.5 shadow-md shadow-indigo-500/10 shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src={schoolConfig?.logoImage || DEFAULT_SCHOOL_LOGO} 
                alt="School Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {tx('የሰራተኞችና መምህራን ማዕከል')}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Total: {unifiedStaffList.length}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {tx('የሰራተኞችና መምህራን አስተዳደር ማዕከል')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {tx('የዋና መምህራንና የሰራተኞች መዝገብ፣ መታወቂያ ፎቶ፣ እና የ30 ቀናት ደመወዝ አቴንዳንስ')}
              </p>
            </div>
          </div>

          {/* REGISTER STAFF BUTTON */}
          <div className="flex items-center gap-2">
            <button
              onClick={triggerRegisterModal}
              className="px-5 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black rounded-2xl text-xs transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95 cursor-pointer flex items-center gap-2"
              id="open-register-staff-modal-btn"
            >
              <UserPlus className="w-4 h-4" />
              <span>{tx('+ አዲስ ሰራተኛ / መምህር መዝግብ (Register Staff)')}</span>
            </button>
          </div>
        </div>

        {/* PRIMARY SUB-TABS */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            onClick={() => {
              playInteractiveSound('click');
              setActiveTab('directory');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{tx('የሰራተኞችና መምህራን ዝርዝር (Staff Directory)')}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'directory' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {unifiedStaffList.length}
            </span>
          </button>

          <button
            onClick={() => {
              playInteractiveSound('click');
              setActiveTab('admin-division');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'admin-division'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4 text-purple-400" />
            <span>{tx('የአስተዳደር የስራ ክፍፍል (Admin Division of Work)')}</span>
            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black">
              6 ክፍሎች
            </span>
          </button>

          <button
            onClick={() => {
              playInteractiveSound('click');
              setActiveTab('attendance');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{tx('የ30 ቀናት ደመወዝ አቴንዳንስ (30-Day Payroll Attendance)')}</span>
            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
              <DollarSign className="w-3 h-3" />
              <span>Payroll</span>
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: UNIFIED STAFF & TEACHERS DIRECTORY (NO OUTER FORM!) */}
      {/* ========================================================= */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* FILTER & SEARCH BAR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tx('በስም፣ አይዲ፣ ስልክ፣ ወይም የትምህርት አይነት ፈልግ...')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800/50 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* CATEGORY PILL SELECTORS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
              {[
                { key: 'All', label: tx('ሁሉም (All)') },
                { key: 'Principal', label: tx('ር/መ (Principal)') },
                { key: 'Vice Principal', label: tx('ም/ር/መ (Vice Principal)') },
                { key: 'Secretary', label: tx('ፃፉ (Secretary)') },
                { key: 'Finance', label: tx('ፋይናንስ (Finance)') },
                { key: 'Cleaner', label: tx('ፅዳት (Cleaners)') },
                { key: 'Security Guard', label: tx('ጥበቃ (Security)') },
                { key: 'Head Teacher', label: tx('ዋና መምህራን (Head Teachers)') },
                { key: 'Assistant Teacher', label: tx('ረዳት መምህራን (Assistants)') }
              ].map(cat => (
                <button
                  key={cat.key}
                  onClick={() => {
                    playInteractiveSound('click');
                    setSelectedCategoryFilter(cat.key);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer text-[11px] ${
                    selectedCategoryFilter === cat.key
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* STAFF CARDS & TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{tx('የተመዘገቡ ሰራተኞችና መምህራን ማውጫ')}</span>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    ({filteredStaff.length} {tx('ተገኝተዋል')})
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadStaffRosterPDF}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title={tx("የመምህራንና ሰራተኞች መዝገብ በPDF ወደ ሎካል ስቶሬጅ ያውርዱ")}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{tx('በPDF አውርድ (Staff PDF)')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadStaffCSV}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title={tx("የሰራተኞች ዳታ በExcel/CSV አውርድ")}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playInteractiveSound('success');
                    window.print();
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title={tx("የሰራተኞች ዝርዝር አትም")}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{tx('አትም (Print List)')}</span>
                </button>
              </div>
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">{tx('ፎቶና ሙሉ ስም (Staff)')}</th>
                    <th className="p-3">{tx('የሰራተኛ ምድብ (Category)')}</th>
                    <th className="p-3">{tx('የት/ደረጃና ስልክ (Education & Phone)')}</th>
                    <th className="p-3">{tx('የሚያስተምረው / ክፍል (Teaching / Allocation)')}</th>
                    <th className="p-3">{tx('መነሻ ደመወዝ (Base Salary)')}</th>
                    <th className="p-3 text-center">{tx('እርምጃዎች (Actions)')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                  {filteredStaff.map((staff) => {
                    const isTeaching = staff.category === 'Head Teacher' || staff.category === 'Main Teacher' || staff.category === 'Assistant Teacher' || (staff.subjects && staff.subjects.length > 0) || teachers.some(t => t.id === staff.id);
                    const matchedTeacher = teachers.find(t => t.id === staff.id);

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        {/* PHOTO & NAME */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-100 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border border-indigo-200 dark:border-slate-700 shrink-0 flex items-center justify-center font-black text-indigo-700 dark:text-indigo-300 shadow-2xs">
                              {staff.photo ? (
                                <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                              ) : (
                                staff.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-900 dark:text-white text-xs">{staff.name}</span>
                                {staff.isHomeroomTeacher && (
                                  <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold rounded border border-emerald-300/60 dark:border-emerald-800 inline-flex items-center gap-1">
                                    <span>🎓</span>
                                    <span>{tx('የክፍል ተጠሪ')} ({staff.assignedClass || 'Grade 1'} - {staff.assignedSection || 'A'})</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                <span className="font-mono">{staff.id}</span>
                                <span>•</span>
                                <span>{staff.gender === 'Female' ? tx('ሴት') : tx('ወንድ')}</span>
                                {staff.age && <span>• {staff.age} {tx('ዓመት')}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY & ROLE */}
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            staff.category === 'Principal'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                              : staff.category === 'Vice Principal'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                              : staff.category === 'Secretary'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : staff.category === 'Finance'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : staff.category === 'Cleaner'
                              ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800'
                              : staff.category === 'Security Guard'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              : staff.category === 'Head Teacher' || staff.category === 'Main Teacher'
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200'
                              : staff.category === 'Assistant Teacher'
                              ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                          }`}>
                            {staff.category === 'Principal' ? tx('[ር/መ] ርዕሰ መምህር') :
                             staff.category === 'Vice Principal' ? tx('[ም/ር/መ] ምክትል ር/መ') :
                             staff.category === 'Secretary' ? tx('[ፃፉ] ፀሐፊና ሰነድ') :
                             staff.category === 'Finance' ? tx('[ፋይናንስ] ሂሳብና ክፍያ') :
                             staff.category === 'Cleaner' ? tx('[ፅዳት] ፅዳትና ንፅህና') :
                             staff.category === 'Security Guard' ? tx('[ጥበቃ] ደህንነትና ጥበቃ') :
                             staff.category === 'Head Teacher' ? tx('ዋና መምህር') :
                             staff.category === 'Assistant Teacher' ? tx('ረዳት መምህር') :
                             staff.category === 'Administrator' ? tx('አስተዳደር') : staff.category}
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate max-w-[140px]">
                            {staff.roleTitle || staff.category}
                          </span>
                        </td>

                        {/* EDUCATION & PHONE */}
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px]">
                            {staff.educationLevel}
                          </span>
                          <span className="block font-mono text-slate-800 dark:text-slate-200 font-medium text-[11px] mt-0.5">
                            {staff.phone}
                          </span>
                        </td>

                        {/* SUBJECTS & ALLOCATIONS */}
                        <td className="p-3">
                          {isTeaching ? (
                            <div className="space-y-1.5 max-w-[280px]">
                              {staff.classAllocations && staff.classAllocations.length > 0 ? (
                                <div className="space-y-1">
                                  {staff.classAllocations.map((a, i) => (
                                    <div key={i} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/80 text-[11px]">
                                      <span className="font-extrabold text-indigo-700 dark:text-indigo-300 font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                                        {a.grade.replace('Grade ', '')}-{a.section}:
                                      </span>
                                      <span className="font-medium text-slate-700 dark:text-slate-200 text-[10px] truncate" title={a.subjects?.join(', ')}>
                                        {a.subjects && a.subjects.length > 0 
                                          ? a.subjects.map(s => getSubjectDisplayName(s).split(' ')[0]).join('፣ ') 
                                          : (staff.subjects?.map(s => getSubjectDisplayName(s).split(' ')[0]).join('፣ ') || '-')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div>
                                  {staff.subjects && staff.subjects.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {staff.subjects.map(s => (
                                        <span key={s} className="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 rounded text-[10px] font-bold">
                                          {getSubjectDisplayName(s).split(' ')[0]}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">-</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{staff.assignedArea || 'Campus Area'}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 block">{staff.shift}</span>
                            </div>
                          )}
                        </td>

                        {/* BASE SALARY */}
                        <td className="p-3 font-mono">
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xs">
                            {(staff.baseSalary || 14000).toLocaleString()} ETB
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            ~{staff.dailyRate || Math.round((staff.baseSalary || 14000)/30)} ETB/ቀን
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onOpenMarkList && (matchedTeacher || (staff.subjects && staff.subjects.length > 0) || staff.assignedClass) && (
                              <button
                                onClick={() => {
                                  playInteractiveSound('click');
                                  onOpenMarkList(staff, matchedTeacher);
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs"
                                title={tx('የማርክ ሊስት ሰሌዳ ክፈት (Open Mark List)')}
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{tx('ማርክ')}</span>
                              </button>
                            )}

                            {matchedTeacher && (
                              <button
                                onClick={() => {
                                  playInteractiveSound('click');
                                  handleOpenClassAllocationModal(matchedTeacher);
                                }}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs"
                                title={tx('የትምህርት እና የክፍል ምደባ (Class & Subject Allocation)')}
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>{tx('ምደባ')}</span>
                              </button>
                            )}

                            {onShowTeacherQR && (
                              <button
                                onClick={() => {
                                  playInteractiveSound('click');
                                  const staffCardData = {
                                    ...staff,
                                    ...(matchedTeacher || {}),
                                    photo: staff.photo || matchedTeacher?.photo,
                                    roleTitle: staff.roleTitle || staff.category || 'መምህር (Teacher)',
                                    category: staff.category || 'Main Teacher',
                                    academicYear: (matchedTeacher as any)?.academicYear || schoolConfig?.academicYear || '2018 ዓ.ም'
                                  };
                                  onShowTeacherQR(staffCardData);
                                }}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 rounded-lg transition-colors cursor-pointer"
                                title={tx('የሰራተኛ መታወቂያ ካርድ (Staff/Teacher ID Card)')}
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                playInteractiveSound('click');
                                handleOpenEdit(staff);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                              title={tx('አስተካክል (Edit)')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                playInteractiveSound('click');
                                setDeletingStaff({
                                  id: staff.id,
                                  name: staff.name,
                                  isTeacher: !!matchedTeacher
                                });
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title={tx('አስወግድ (Delete)')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic text-xs">
                        {tx('ምንም የተመዘገበ ሰራተኛ አልተገኘም (No staff found)')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="lg:hidden space-y-3">
              {filteredStaff.map((staff) => {
                const matchedTeacher = teachers.find(t => t.id === staff.id);
                return (
                  <div key={staff.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-100 dark:bg-slate-700 border border-indigo-200 shrink-0 flex items-center justify-center font-bold text-indigo-700">
                          {staff.photo ? (
                            <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                          ) : (
                            staff.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs block">{staff.name}</span>
                            {staff.isHomeroomTeacher && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold rounded border border-emerald-300/60 dark:border-emerald-800">
                                🎓 {staff.assignedClass || 'Grade 1'} - {staff.assignedSection || 'A'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{staff.id}</span>
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block">{staff.roleTitle || staff.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {matchedTeacher && (
                          <button
                            onClick={() => {
                              playInteractiveSound('click');
                              handleOpenClassAllocationModal(matchedTeacher);
                            }}
                            className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg cursor-pointer border border-indigo-200 dark:border-indigo-800"
                            title={tx('ምደባ (Allocations)')}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onShowTeacherQR && (
                          <button
                            onClick={() => {
                              playInteractiveSound('click');
                              const staffCardData = {
                                ...staff,
                                ...(matchedTeacher || {}),
                                photo: staff.photo || matchedTeacher?.photo,
                                roleTitle: staff.roleTitle || staff.category || 'መምህር (Teacher)',
                                category: staff.category || 'Main Teacher',
                                academicYear: (matchedTeacher as any)?.academicYear || schoolConfig?.academicYear || '2018 ዓ.ም'
                              };
                              onShowTeacherQR(staffCardData);
                            }}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer"
                            title={tx('የሰራተኛ መታወቂያ ካርድ (Staff/Teacher ID Card)')}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="p-2 bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingStaff({ id: staff.id, name: staff.name, isTeacher: !!matchedTeacher })}
                          className="p-2 bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200/60 dark:border-slate-700 pt-2 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{tx('ስልክ:')}</span>
                        <span className="font-mono font-bold text-[11px]">{staff.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{tx('ደመወዝ:')}</span>
                        <span className="font-mono font-bold text-emerald-600 text-[11px]">{(staff.baseSalary || 14000).toLocaleString()} ETB</span>
                      </div>
                      {staff.subjects && staff.subjects.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-400 block">{tx('የሚያስተምራቸው የትምህርት አይነቶች:')}</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {staff.subjects.map(s => (
                              <span key={s} className="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ADMINISTRATIVE DIVISION OF WORK (6 DIVISIONS)      */}
      {/* ========================================================= */}
      {activeTab === 'admin-division' && (
        <AdminDivisionOfWorkSection
          staffList={unifiedStaffList}
          teachers={teachers}
          schoolConfig={schoolConfig}
          workspaceId={workspaceId}
          onEditStaff={handleOpenEdit}
          onOpenRegisterModal={triggerRegisterModal}
          onShowIDCard={onShowTeacherQR}
          onOpenMarkList={onOpenMarkList}
        />
      )}

      {/* ========================================================= */}
      {/* TAB 3: UNIFIED 30-DAY STAFF PAYROLL ATTENDANCE TABLE */}
      {/* ========================================================= */}
      {activeTab === 'attendance' && (
        <StaffPayrollAttendanceSection
          staffList={unifiedStaffList}
          teachers={teachers}
          schoolConfig={schoolConfig}
          workspaceId={workspaceId}
          onUpdateStaff={(updatedList) => {
            // Update individual staff members if needed
          }}
        />
      )}

      {/* ========================================================= */}
      {/* EDIT TEACHER / STAFF MODAL */}
      {/* ========================================================= */}
      {(editingTeacher || editingStaffMember) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <span className="font-extrabold text-slate-800 dark:text-white text-sm">
                {(teachers.some(t => t.id === editingStaffMember?.id) || editCategory === 'Head Teacher' || editCategory === 'Main Teacher' || editCategory === 'Assistant Teacher')
                  ? tx('የመምህር መረጃ ማስተካከያ (Edit Teacher)')
                  : tx('የሰራተኛ መረጃ ማስተካከያ (Edit Staff Member)')}
              </span>
              <button 
                onClick={() => { 
                  playInteractiveSound('click'); 
                  setEditingTeacher(null); 
                  setEditingStaffMember(null); 
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* PHOTO UPLOAD & PREVIEW (Works for ANY Staff Member and Teacher) */}
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="relative group w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-100 to-indigo-50 dark:from-slate-750 dark:to-slate-700 border-2 border-indigo-200 dark:border-indigo-800 shrink-0 flex items-center justify-center shadow-xs">
                  {editPhoto ? (
                    <img src={editPhoto} alt={editName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {(editName || 'S').charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300">
                    📸 {tx('የሰራተኛው/የመምህሩ ፎቶ (Staff/Teacher Photo):')}
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs active:scale-95">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{editPhoto ? tx('ፎቶ ቀይር (Change)') : tx('ፎቶ ጫን (Upload Photo)')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditPhoto(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {editPhoto && (
                      <button
                        type="button"
                        onClick={() => {
                          playInteractiveSound('click');
                          setEditPhoto('');
                        }}
                        className="px-2.5 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
                      >
                        {tx('አስወግድ (Remove)')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* NAME */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  {(teachers.some(t => t.id === editingStaffMember?.id) || editCategory === 'Head Teacher' || editCategory === 'Main Teacher' || editCategory === 'Assistant Teacher')
                    ? tx('የመምህሩ ሙሉ ስም (Teacher Name):')
                    : tx('የሰራተኛው ሙሉ ስም (Staff Name):')}
                </label>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800 dark:text-white font-medium"
                  required
                />
              </div>

              {/* EDUCATION & PHONE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    {tx('የትምህርት ደረጃ:')}
                  </label>
                  <select 
                    value={editEducationLevel}
                    onChange={(e) => setEditEducationLevel(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white font-medium"
                  >
                    <option value="Certificate">{tx('ሰርተፍኬት (Certificate)')}</option>
                    <option value="Diploma">{tx('ዲፕሎማ (Diploma)')}</option>
                    <option value="Degree">{tx('መጀመሪያ ዲግሪ (Degree)')}</option>
                    <option value="Masters">{tx('ማስተርስ ዲግሪ (Masters)')}</option>
                    <option value="PhD">{tx('ፒኤችዲ (PhD)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    {tx('ስልክ ቁጥር (Phone):')}
                  </label>
                  <input 
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-600 outline-none bg-slate-50/50 dark:bg-slate-800 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* VICE PRINCIPAL TEACHING DUTY TOGGLE */}
              {(editCategory === 'Vice Principal' || editingStaffMember?.category === 'Vice Principal' || editingStaffMember?.roleTitle?.toLowerCase().includes('vice') || editingStaffMember?.roleTitle?.includes('ምክትል')) && (
                <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-blue-950 dark:text-blue-100">
                        {tx('የማስተማር ስራ ምደባ (Assign Teaching Duties):')}
                      </h5>
                      <p className="text-[10px] text-blue-700 dark:text-blue-300">
                        {tx('ይህ ምክትል ር/መምህር በተጨማሪነት የሚያስተምረው ክፍልና ሴክሽን ካለ ያንቁ')}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={editTeaches} 
                      onChange={(e) => setEditTeaches(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              )}

              {/* TEACHER-SPECIFIC CONTROLS: GRADE, SECTION, ROLE, SUBJECTS */}
              {(teachers.some(t => t.id === editingStaffMember?.id) || editCategory === 'Head Teacher' || editCategory === 'Main Teacher' || editCategory === 'Assistant Teacher' || ((editCategory === 'Vice Principal' || editingStaffMember?.category === 'Vice Principal') && editTeaches)) && (
                <>
                  {/* DIRECT GRADE & SECTION ASSIGNMENT (Always visible & editable for teachers) */}
                  <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black uppercase text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                        <span>{tx('የተመደበበት ክፍል እና ሴክሽን (Assigned Grade & Section):')}</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                          {tx('የክፍል ደረጃ (Grade):')}
                        </label>
                        <select
                          value={editAssignedGrade}
                          onChange={(e) => {
                            setEditAssignedGrade(e.target.value);
                            setEditHomeroomGrade(e.target.value);
                          }}
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                        >
                          {activeGradesList.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-indigo-900 dark:text-indigo-300 mb-1">
                          {tx('ሴክሽን (Section):')}
                        </label>
                        <select
                          value={editAssignedSection}
                          onChange={(e) => {
                            setEditAssignedSection(e.target.value);
                            setEditHomeroomSection(e.target.value);
                          }}
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs font-mono"
                        >
                          {['A', 'B', 'C', 'D', 'E', 'F'].map(sec => (
                            <option key={sec} value={sec}>{tx('ሴክሽን')} {sec}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* TEACHER ROLE / CATEGORY SELECTION */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('የመምህሩ ኃላፊነት (Role):')}
                      </label>
                      {editCategory === 'Vice Principal' || editingStaffMember?.category === 'Vice Principal' ? (
                        <input
                          type="text"
                          value={editRoleTitle}
                          onChange={(e) => setEditRoleTitle(e.target.value)}
                          placeholder="ምክትል ርዕሰ መምህርት"
                          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white outline-none"
                        />
                      ) : (
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white outline-none"
                        >
                          <option value="Head Teacher">{tx('ዋና መምህር (Head Teacher)')}</option>
                          <option value="Main Teacher">{tx('መምህር (Main Teacher)')}</option>
                          <option value="Assistant Teacher">{tx('ረዳት መምህር (Assistant Teacher)')}</option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('የክፍል ተጠሪ (Homeroom):')}
                      </label>
                      <select 
                        value={editIsHomeroom}
                        onChange={(e) => setEditIsHomeroom(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold focus:border-indigo-600 outline-none bg-white dark:bg-slate-800 dark:text-white"
                      >
                        <option value="No">{tx('አይደለም (No)')}</option>
                        <option value="Yes">{tx('አዎ የክፍል ተጠሪ ነው (Yes)')}</option>
                      </select>
                    </div>
                  </div>

                  {/* SUBJECTS CHECKBOXES */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1.5">
                      {tx('የሚያስተምረው የትምህርት አይነት (Subjects Taught):')}
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700 max-h-40 overflow-y-auto">
                      {availableSubjects.map((sub) => {
                        const isChecked = editSelectedSubjects.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => {
                              playInteractiveSound('click');
                              if (isChecked) {
                                if (editSelectedSubjects.length === 1) return;
                                setEditSelectedSubjects(editSelectedSubjects.filter(s => s !== sub));
                              } else {
                                setEditSelectedSubjects([...editSelectedSubjects, sub]);
                              }
                            }}
                            className={`flex items-center gap-2 text-left p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              isChecked ? 'font-bold text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate" title={sub}>{getSubjectDisplayName(sub)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* NON-TEACHER STAFF SPECIFIC CONTROLS & SALARY/SHIFT */}
              {(!((teachers.some(t => t.id === editingStaffMember?.id) || editCategory === 'Head Teacher' || editCategory === 'Main Teacher' || editCategory === 'Assistant Teacher') && !(editCategory === 'Vice Principal' || editingStaffMember?.category === 'Vice Principal'))) && (
                <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('የስራ ምድብ (Category):')}
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Principal">{tx('ር/መ - ርዕሰ መምህር (Principal)')}</option>
                        <option value="Vice Principal">{tx('ም/ር/መ - ምክትል ር/መ (Vice Principal)')}</option>
                        <option value="Secretary">{tx('ፃፉ - ፀሐፊና ሰነድ ያዥ (Secretary & Registrar)')}</option>
                        <option value="Finance">{tx('ፋይናንስ - ሂሳብና ክፍያ (Finance & Accountant)')}</option>
                        <option value="Cleaner">{tx('ፅዳት - ፅዳትና ንፅህና (Cleaner & Sanitation)')}</option>
                        <option value="Security Guard">{tx('ጥበቃ - የግቢ ደህንነትና ጥበቃ (Security Guard)')}</option>
                        <option value="Head Teacher">{tx('ዋና መምህር (Head / Lead Teacher)')}</option>
                        <option value="Assistant Teacher">{tx('ረዳት መምህር (Assistant Teacher)')}</option>
                        <option value="Administrator">{tx('አስተዳደር እና ድጋፍ (Admin & Support)')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('የስራ ድርሻ (Role Title):')}
                      </label>
                      <input 
                        type="text"
                        value={editRoleTitle}
                        onChange={(e) => setEditRoleTitle(e.target.value)}
                        placeholder="ለምሳሌ፡ ጥበቃ፣ ጸሐፊ፣ አካውንታንት..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold focus:border-indigo-600 outline-none bg-white dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('መሰረታዊ ደመወዝ (Salary ETB):')}
                      </label>
                      <input 
                        type="number"
                        value={editBaseSalary}
                        onChange={(e) => setEditBaseSalary(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold focus:border-indigo-600 outline-none bg-white dark:bg-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                        {tx('የስራ ፈረቃ (Shift):')}
                      </label>
                      <select
                        value={editShift}
                        onChange={(e) => setEditShift(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Full Time (ሙሉ ቀን)">Full Time (ሙሉ ቀን)</option>
                        <option value="Morning Shift (የጠዋት ፈረቃ)">Morning Shift (የጠዋት ፈረቃ)</option>
                        <option value="Afternoon Shift (ከሰአት ፈረቃ)">Afternoon Shift (ከሰአት ፈረቃ)</option>
                        <option value="Night Shift (የሌሊት ፈረቃ)">Night Shift (የሌሊት ፈረቃ)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { 
                    playInteractiveSound('click'); 
                    setEditingTeacher(null); 
                    setEditingStaffMember(null); 
                  }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {tx('ይቅር (Cancel)')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  {tx('💾 አስቀምጥ (Save Changes)')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DEDICATED CLASS & SUBJECT ALLOCATIONS BUILDER MODAL */}
      {/* ========================================================= */}
      {allocatingTeacher && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">
                    {tx('የክፍል እና የትምህርት አይነት ምደባ (Class & Subject Allocations)')}
                  </h3>
                  <p className="text-[11px] text-indigo-100 font-medium">
                    {allocatingTeacher.name} {allocatingTeacher.isHomeroomTeacher ? '• የክፍል ኃላፊ' : ''}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { playInteractiveSound('click'); setAllocatingTeacher(null); }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Instructions Banner */}
              <div className="bg-indigo-50/80 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <span>💡</span>
                  <span>{tx('የመምህር የትምህርት አይነት ምደባ መመሪያ')}</span>
                </p>
                <p className="text-[11px] leading-relaxed text-indigo-800 dark:text-indigo-300">
                  {tx('መምህሩ የሚያስተምራቸውን ክፍሎችና ለእያንዳንዱ ክፍል የሚያስተምራቸውን የትምህርት አይነቶች ለይተው ይመድቡ። (ለምሳሌ፦ 4ኛ-A ሒሳብ፣ 5ኛ-A ሒሳብ፣ 6ኛ-A ሒሳብ፣ 7ኛ-A ሒሳብ እና IT)')}
                </p>
              </div>

              {/* CURRENT ALLOCATIONS LIST */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {tx('የተመደቡባቸው ክፍሎችና የትምህርት አይነቶች (Current Allocations):')} ({allocModalList.length})
                </label>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {allocModalList.map((alloc, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-sm bg-indigo-600 text-white px-2.5 py-1 rounded-lg shadow-2xs">
                          {alloc.grade.replace('Grade ', '')}-{alloc.section}
                        </span>
                        <div>
                          <div className="flex flex-wrap gap-1">
                            {alloc.subjects && alloc.subjects.length > 0 ? (
                              alloc.subjects.map(s => (
                                <span key={s} className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 rounded-md text-xs font-bold border border-indigo-200 dark:border-indigo-700">
                                  {getSubjectDisplayName(s)}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">{tx('ምንም ትምህርት አልተመረጠም')}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 block">
                            {alloc.grade} - {tx('ሴክሽን')} {alloc.section}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveModalAllocation(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                        title={tx('ይህን ክፍል ምደባ ሰርዝ (Remove Allocation)')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {allocModalList.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      {tx('ምንም ክፍል አልተመደበም። ከታች አዲስ ክፍልና ትምህርት ይመድቡ።')}
                    </div>
                  )}
                </div>
              </div>

              {/* ADD NEW ALLOCATION FORM */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="text-indigo-600">➕</span>
                  <span>{tx('አዲስ የክፍልና የትምህርት ምደባ ማከያ (Add Class & Subject Allocation):')}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      {tx('የክፍል ደረጃ (Grade):')}
                    </label>
                    <select
                      value={allocModalGrade}
                      onChange={(e) => setAllocModalGrade(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {activeGradesList.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      {tx('ሴክሽን (Section):')}
                    </label>
                    <select
                      value={allocModalSection}
                      onChange={(e) => setAllocModalSection(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-mono"
                    >
                      {['A', 'B', 'C', 'D', 'E', 'F'].map(sec => (
                        <option key={sec} value={sec}>{tx('ሴክሽን')} {sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                    {tx(`በዚህ ክፍል (${allocModalGrade} - ${allocModalSection}) የሚያስተምራቸው የትምህርት አይነቶች ይምረጡ:`)}
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto">
                    {availableSubjects.map((sub) => {
                      const isChecked = allocModalSelectedSubjects.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            playInteractiveSound('click');
                            if (isChecked) {
                              setAllocModalSelectedSubjects(allocModalSelectedSubjects.filter(s => s !== sub));
                            } else {
                              setAllocModalSelectedSubjects([...allocModalSelectedSubjects, sub]);
                            }
                          }}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg text-[11px] text-left transition-colors cursor-pointer ${
                            isChecked 
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' 
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate" title={sub}>{getSubjectDisplayName(sub)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Custom Subject input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={allocModalCustomSubject}
                    onChange={(e) => setAllocModalCustomSubject(e.target.value)}
                    placeholder={tx('ሌላ የትምህርት አይነት ካለ እዚህ ጻፉ (e.g. IT, Maths)...')}
                    className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddModalAllocation}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <span>➕ {tx('ክፍልና ትምህርት መዝግብ')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => { playInteractiveSound('click'); setAllocatingTeacher(null); }}
                className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-white transition-colors cursor-pointer"
              >
                {tx('ይቅር (Cancel)')}
              </button>
              <button
                type="button"
                onClick={handleSaveAllocationsModal}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{tx('💾 ምደባውን በሙሉ አጽድቅ (Save Allocations)')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE WARNING CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-rose-50 dark:bg-rose-950/50 border-b border-rose-100 dark:border-rose-900 px-6 py-4 flex items-center gap-2 text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-extrabold text-xs uppercase tracking-wider">
                {tx('የሰራተኛ መዝገብ ማጥፊያ ማስጠንቀቂያ')}
              </span>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-800 dark:text-slate-200 text-xs font-semibold leading-relaxed">
                ⚠️ <strong className="text-rose-700">{tx('ማስጠንቀቂያ፡')}</strong> {tx('ሰራተኛ ')}
                <strong className="text-slate-950 dark:text-white font-black">"{deletingStaff.name}"</strong>
                {tx('ን በቋሚነት ከሲስተሙ ማጥፋት ይፈልጋሉ?')}
              </p>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {tx('ይህንን ሰራተኛ ሲያጠፉ ተያያዥነት ያላቸው መዛግብቶች በሙሉ ከዳታቤዝ ይሰረዛሉ።')}
              </p>
              
              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { playInteractiveSound('click'); setDeletingStaff(null); }}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {tx('አይ፣ ይቅር (Cancel)')}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  {tx('አዎ፣ አጥፋ (Delete)')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERNAL REGISTRATION MODAL IF TRIGGERED LOCALLY */}
      {isStaffModalOpen && (
        <RegisterStaffModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          onAddStaff={(newStaff) => {
            if (onAddStaff) onAddStaff(newStaff);
          }}
          onAddTeacher={onAddTeacher}
          existingTeachers={teachers}
          schoolConfig={schoolConfig}
        />
      )}
    </div>
  );
};
