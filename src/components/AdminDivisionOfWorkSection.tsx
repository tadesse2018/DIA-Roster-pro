import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Award, 
  GraduationCap, 
  FileText, 
  FileSpreadsheet,
  DollarSign, 
  Sparkles, 
  Shield, 
  Users, 
  Phone, 
  Mail, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Edit2, 
  Printer, 
  Download, 
  UserPlus, 
  QrCode, 
  CheckSquare, 
  Square, 
  ChevronRight,
  Info,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  StaffMember, 
  Teacher, 
  ADMIN_DIVISIONS, 
  AdminDivisionInfo, 
  AdminDivisionCode,
  StaffCategory
} from '../schoolData';
import { playInteractiveSound } from './AudioEngine';
import { useLanguage } from './LanguageContext';

interface AdminDivisionOfWorkSectionProps {
  staffList: StaffMember[];
  teachers: Teacher[];
  schoolConfig?: any;
  workspaceId?: string;
  onEditStaff: (staff: StaffMember) => void;
  onOpenRegisterModal: () => void;
  onShowIDCard?: (staff: any) => void;
  initialDivisionFilter?: string;
  onOpenMarkList?: (staff: StaffMember, matchedTeacher?: Teacher) => void;
}

export const AdminDivisionOfWorkSection: React.FC<AdminDivisionOfWorkSectionProps> = ({
  staffList = [],
  teachers = [],
  schoolConfig,
  workspaceId = 'default',
  onEditStaff,
  onOpenRegisterModal,
  onShowIDCard,
  initialDivisionFilter = 'all',
  onOpenMarkList
}) => {
  const { tx } = useLanguage();

  // Active filter: 'all' or specific division code
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>(initialDivisionFilter);

  // Interactive daily routine checks per division: { [divisionCode_routineIndex]: boolean }
  const [completedRoutines, setCompletedRoutines] = useState<{ [key: string]: boolean }>({});

  // Charter Print/Preview modal open state
  const [isCharterModalOpen, setIsCharterModalOpen] = useState(false);

  // Combine staffList and teachers into unified list
  const unifiedStaffList: StaffMember[] = useMemo(() => {
    const list: StaffMember[] = [...staffList];
    const existingIds = new Set(list.map(s => s.id));

    teachers.forEach(t => {
      if (!existingIds.has(t.id)) {
        list.push({
          id: t.id,
          name: t.name,
          category: 'Head Teacher',
          roleTitle: t.isHomeroomTeacher ? 'ዋና መምህር / የክፍል ኃላፊ' : 'ዋና መምህር (Head Teacher)',
          educationLevel: t.educationLevel || 'Degree',
          phone: t.phone || '',
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

  // Helper: map a staff member to their corresponding administrative division
  const getStaffForDivision = (divisionCode: AdminDivisionCode): StaffMember[] => {
    return unifiedStaffList.filter(s => {
      const cat = s.category;
      const roleLower = (s.roleTitle || '').toLowerCase();
      const roleAmh = s.roleTitle || '';

      switch (divisionCode) {
        case 'principal':
          return cat === 'Principal' || 
            (cat === 'Head Teacher' && (roleLower.includes('principal') || roleAmh.includes('ርዕሰ') || roleAmh.includes('ር/መ') || roleAmh.includes('ዳይሬክተር')));
        
        case 'vice_principal':
          return cat === 'Vice Principal' || 
            roleLower.includes('vice') || roleAmh.includes('ምክትል') || roleAmh.includes('ም/ር/መ');

        case 'secretary':
          return cat === 'Secretary' || 
            (cat === 'Administrator' && (roleLower.includes('secretary') || roleLower.includes('registrar') || roleAmh.includes('ፀሐፊ') || roleAmh.includes('ጸሐፊ') || roleAmh.includes('ሬጅስትራር') || roleAmh.includes('ሰነድ'))) ||
            roleLower.includes('secretary') || roleAmh.includes('ፀሐፊ') || roleAmh.includes('ጸሐፊ');

        case 'finance':
          return cat === 'Finance' || 
            roleLower.includes('finance') || roleLower.includes('accountant') || roleLower.includes('cashier') || 
            roleAmh.includes('ፋይናንስ') || roleAmh.includes('ሂሳብ') || roleAmh.includes('ገንዘብ ያዥ');

        case 'cleaner':
          return cat === 'Cleaner' || 
            roleLower.includes('clean') || roleLower.includes('sanitation') || roleLower.includes('janitor') ||
            roleAmh.includes('ጽዳት') || roleAmh.includes('ፅዳት') || roleAmh.includes('ንፅህና');

        case 'security':
          return cat === 'Security Guard' || 
            roleLower.includes('security') || roleLower.includes('guard') ||
            roleAmh.includes('ጥበቃ') || roleAmh.includes('ደህንነት');

        default:
          return false;
      }
    });
  };

  // Toggle routine item completion
  const handleToggleRoutine = (divCode: string, idx: number) => {
    playInteractiveSound('click');
    const key = `${divCode}_${idx}`;
    setCompletedRoutines(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Download official Administrative Duty Charter in HTML/PDF format
  const handleDownloadCharterPDF = () => {
    playInteractiveSound('success');
    const schoolAmh = schoolConfig?.nameAmh || 'ደሊጀንት አካዳሚ';
    const schoolEng = (schoolConfig?.nameEng || 'DILIGENT ACADEMY').replace(/app/i, '').trim();
    const academicYear = schoolConfig?.academicYear || '2018 ዓ.ም';
    const generatedDate = new Date().toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });

    const rowsHtml = ADMIN_DIVISIONS.map((div, idx) => {
      const assigned = getStaffForDivision(div.code);
      const staffNames = assigned.length > 0 
        ? assigned.map(s => `${s.name} (${s.phone || '-'})`).join('<br/>') 
        : '<span style="color: #999; font-style: italic;">ሰራተኛ አልተመደበም</span>';

      const dutiesList = div.coreResponsibilities.map(d => `• ${d}`).join('<br/>');

      return `
        <tr>
          <td style="text-align: center; font-weight: bold; width: 35px; vertical-align: top;">${idx + 1}</td>
          <td style="font-weight: 800; vertical-align: top; width: 140px;">
            <div style="font-size: 13px; color: #1e1b4b;">[${div.shortCode}] ${div.titleAmh}</div>
            <div style="font-size: 10px; color: #64748b;">${div.titleEng}</div>
            <div style="font-size: 10px; margin-top: 4px; color: #475569;"><b>ተጠሪነት፡</b> ${div.reportsTo}</div>
          </td>
          <td style="vertical-align: top; width: 160px; font-weight: 600; font-size: 11px;">
            ${staffNames}
          </td>
          <td style="vertical-align: top; font-size: 10.5px; line-height: 1.4; text-align: left; padding: 6px 8px;">
            ${dutiesList}
          </td>
          <td style="text-align: center; width: 90px; vertical-align: bottom; font-size: 10px; color: #64748b;">
            _________________
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <title>${schoolAmh} - የአስተዳደር የስራ ክፍፍልና ኃላፊነቶች ድልድል ሰነድ</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: "Noto Sans Ethiopic", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 15px; font-size: 11px; }
    .header { text-align: center; border-bottom: 2.5px solid #1e1b4b; padding-bottom: 12px; margin-bottom: 14px; }
    .title-amh { font-size: 20px; font-weight: 900; color: #1e1b4b; margin: 0; }
    .title-eng { font-size: 13px; font-weight: 700; color: #475569; margin: 2px 0; }
    .doc-badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 14px; border-radius: 9999px; font-weight: 800; font-size: 12px; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #f1f5f9; color: #1e293b; font-weight: 800; text-align: left; padding: 8px 6px; border: 1px solid #cbd5e1; font-size: 11px; }
    td { padding: 6px; border: 1px solid #cbd5e1; }
    .footer { margin-top: 25px; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .sign-block { width: 220px; text-align: center; font-size: 11px; }
    .sign-line { border-bottom: 1px solid #000; margin-top: 35px; margin-bottom: 4px; }
    .stamp-box { border: 2px dashed #94a3b8; width: 120px; height: 70px; display: inline-flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 10px; font-weight: bold; border-radius: 8px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title-amh">${schoolAmh}</h1>
    <h2 class="title-eng">${schoolEng}</h2>
    <div class="doc-badge">📋 የትምህርት ቤት የአስተዳደር የስራ ክፍፍልና ኃላፊነቶች ድልድል ሰነድ (${academicYear})</div>
    <div style="font-size: 10px; color: #64748b; margin-top: 5px;">
      የተዘጋጀበት ቀን፡ ${generatedDate} | 6ቱ ዋና ዋና የአስተዳደር ክፍሎች (ር/መ ፣ ም/ር/መ ፣ ፃፉ ፣ ፋይናንስ ፣ ፅዳት እና ጥበቃ)
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align: center; width: 35px;">ተ.ቁ</th>
        <th style="width: 140px;">የስራ ክፍል (Division)</th>
        <th style="width: 160px;">የተመደበው ሰራተኛና ስልክ</th>
        <th>ዋና ዋና የስራ ድርሻዎችና ኃላፊነቶች (Core Responsibilities & Duties)</th>
        <th style="text-align: center; width: 90px;">ፊርማ</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    <div class="sign-block">
      <div><b>ያዘጋጀው / ፀሐፊ፡</b></div>
      <div class="sign-line"></div>
      <div>ስምና ፊርማ (Name & Sign)</div>
    </div>
    <div class="sign-block">
      <div class="stamp-box">የት/ቤቱ ማህተም<br/>(Official Stamp)</div>
    </div>
    <div class="sign-block">
      <div><b>ያፀደቀው / ርዕሰ መምህር፡</b></div>
      <div class="sign-line"></div>
      <div>ስምና ፊርማ (Principal Signature)</div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Administrative_Division_Charter_${academicYear.replace(/\s+/g, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }
  };

  // Get icon for division
  const getDivisionIcon = (code: AdminDivisionCode) => {
    switch (code) {
      case 'principal':
        return <Award className="w-6 h-6 text-purple-600" />;
      case 'vice_principal':
        return <GraduationCap className="w-6 h-6 text-blue-600" />;
      case 'secretary':
        return <FileText className="w-6 h-6 text-amber-600" />;
      case 'finance':
        return <DollarSign className="w-6 h-6 text-emerald-600" />;
      case 'cleaner':
        return <Sparkles className="w-6 h-6 text-teal-600" />;
      case 'security':
        return <Shield className="w-6 h-6 text-rose-600" />;
    }
  };

  // Filter divisions based on selector
  const visibleDivisions = useMemo(() => {
    if (selectedDivisionFilter === 'all') return ADMIN_DIVISIONS;
    return ADMIN_DIVISIONS.filter(d => d.code === selectedDivisionFilter);
  }, [selectedDivisionFilter]);

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & CHARTER ACTIONS BANNER                    */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-300" />
                <span>{tx('የትምህርት ቤት አስተዳደር')}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-slate-300">
                6ቱ ዋና የስራ ክፍሎች
              </span>
              <span className="text-xs text-indigo-300 font-mono">
                {schoolConfig?.academicYear || '2018 ዓ.ም'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{tx('የአስተዳደር የስራ ክፍፍልና ኃላፊነቶች')}</span>
              <span className="text-sm font-medium text-indigo-300 hidden sm:inline">
                ({tx('School Administrative Division of Labor')})
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              የትምህርት ቤቱ 6ቱ ዋና የአስተዳደር ክፍሎች የስራ ድልድል፡ <strong className="text-purple-300">ር/መ (ርዕሰ መምህር)</strong>፣ <strong className="text-blue-300">ም/ር/መ (ምክትል ርዕሰ መምህር)</strong>፣ <strong className="text-amber-300">ፃፉ (ፀሐፊና ሰነድ ያዥ)</strong>፣ <strong className="text-emerald-300">ፋይናንስ (ሂሳብና ክፍያ)</strong>፣ <strong className="text-teal-300">ፅዳት (ሳኒቴሽን)</strong> እና <strong className="text-rose-300">ጥበቃ (የግቢ ደህንነት)</strong>።
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleDownloadCharterPDF}
              className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95 cursor-pointer"
              title={tx('የስራ ክፍፍል ቻርተር ሰነድ በPDF አውርድ ወይም አትም')}
            >
              <Download className="w-4 h-4" />
              <span>{tx('የስራ ክፍፍል ቻርተር አትም (Export Charter)')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playInteractiveSound('click');
                onOpenRegisterModal();
              }}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs flex items-center gap-2 transition-all border border-white/15 cursor-pointer active:scale-95"
              title={tx('አዲስ ሰራተኛ መድብ ወይም መዝግብ')}
            >
              <UserPlus className="w-4 h-4 text-indigo-300" />
              <span>{tx('+ አዲስ ሰራተኛ መድብ (Assign Staff)')}</span>
            </button>
          </div>
        </div>

        {/* 6 DIVISION SUMMARY CARDS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-6 pt-5 border-t border-white/10">
          {ADMIN_DIVISIONS.map((div) => {
            const assignedStaff = getStaffForDivision(div.code);
            const isSelected = selectedDivisionFilter === div.code;

            return (
              <button
                key={div.code}
                type="button"
                onClick={() => {
                  playInteractiveSound('click');
                  setSelectedDivisionFilter(prev => prev === div.code ? 'all' : div.code);
                }}
                className={`p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-1.5 relative border ${
                  isSelected 
                    ? 'bg-white text-slate-900 border-white shadow-lg ring-2 ring-indigo-400' 
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono border ${
                    isSelected ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-white/10 text-indigo-200 border-white/15'
                  }`}>
                    [{div.shortCode}]
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
                    assignedStaff.length > 0 
                      ? (isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300')
                      : (isSelected ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300')
                  }`}>
                    {assignedStaff.length} ሰራተኛ
                  </span>
                </div>

                <div>
                  <h4 className={`text-xs font-black truncate ${isSelected ? 'text-slate-900' : 'text-white'}`}>
                    {div.titleAmh}
                  </h4>
                  <span className={`text-[10px] block truncate ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                    {div.titleEng}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DIVISION SELECTOR PILLS                                */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
          <button
            type="button"
            onClick={() => {
              playInteractiveSound('click');
              setSelectedDivisionFilter('all');
            }}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer text-xs ${
              selectedDivisionFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {tx('ሁሉንም 6 ክፍሎች አሳይ (Show All 6 Divisions)')}
          </button>

          {ADMIN_DIVISIONS.map(div => {
            const count = getStaffForDivision(div.code).length;
            const isSelected = selectedDivisionFilter === div.code;

            return (
              <button
                key={div.code}
                type="button"
                onClick={() => {
                  playInteractiveSound('click');
                  setSelectedDivisionFilter(div.code);
                }}
                className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>[{div.shortCode}] {div.titleAmh}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          የተመረጡ ክፍሎች፡ <strong className="text-slate-900 dark:text-white font-mono">{visibleDivisions.length}</strong>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. FULL DIVISION DUTIES CARDS                             */}
      {/* ========================================================= */}
      <div className="space-y-6">
        {visibleDivisions.map((div) => {
          const assignedStaff = getStaffForDivision(div.code);

          return (
            <div
              key={div.code}
              id={`division-${div.code}`}
              className={`bg-white dark:bg-slate-900 rounded-3xl border ${div.color.border} shadow-sm overflow-hidden transition-all`}
            >
              {/* DIVISION CARD TOP BANNER */}
              <div className={`p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 ${div.color.cardBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 shrink-0">
                      {getDivisionIcon(div.code)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black font-mono border ${div.color.badgeBg} ${div.color.badgeText}`}>
                          [{div.shortCode}]
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {div.titleEng}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          ተጠሪነት፡ {div.reportsTo}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                        {div.titleAmh}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-3xl">
                        {div.overview}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playInteractiveSound('click');
                        onOpenRegisterModal();
                      }}
                      className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl text-xs border border-indigo-200 dark:border-indigo-800/80 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{tx('+ ሰራተኛ መድብ')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* DIVISION CONTENT: 2-COLUMN LAYOUT */}
              <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* COLUMN 1: RESPONSIBILITIES & DAILY ROUTINES (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Core Duties & Responsibilities */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{tx('ዋና ዋና የስራ ድርሻዎችና ኃላፊነቶች (Core Responsibilities):')}</span>
                    </h4>

                    <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                      {div.coreResponsibilities.map((resp, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            {rIdx + 1}
                          </span>
                          <span className="flex-1">{resp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Daily Routine Task Checklist */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{tx('የዕለት ተዕለት ተግባራት መከታተያ (Daily Routine Checklist):')}</span>
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        የተጠናቀቁ፡ {div.dailyRoutines.filter((_, idx) => completedRoutines[`${div.code}_${idx}`]).length} / {div.dailyRoutines.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {div.dailyRoutines.map((routine, rtIdx) => {
                        const routineKey = `${div.code}_${rtIdx}`;
                        const isDone = !!completedRoutines[routineKey];

                        return (
                          <button
                            key={rtIdx}
                            type="button"
                            onClick={() => handleToggleRoutine(div.code, rtIdx)}
                            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer text-xs ${
                              isDone
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isDone ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <span className={`text-[11px] leading-snug ${isDone ? 'line-through opacity-85 font-medium' : 'font-semibold'}`}>
                              {routine}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Division Meta Footnotes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                        {tx('የትምህርት ዝግጅትና ልምድ መስፈርት:')}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {div.qualifications}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                        {tx('የደመወዝ ስኬል (Benchmark):')}
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                        {div.suggestedSalaryRange}
                      </span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: ASSIGNED PERSONNEL (5 cols) */}
                <div className="lg:col-span-5 space-y-3 lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{tx('በዚህ ክፍል የተመደቡ ሰራተኞች')}</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {assignedStaff.length} {tx('ሰው')}
                    </span>
                  </div>

                  {assignedStaff.length === 0 ? (
                    /* EMPTY STATE: NO STAFF ASSIGNED YET */
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-slate-200/60 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {tx('ለዚህ ክፍል ሰራተኛ አልተመደበም')}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          በዚህ የስራ ክፍል ስር የሚሰሩ ሰራተኞችን አሁን ይመዝግቡ ወይም ከዝርዝሩ መድቡ።
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playInteractiveSound('click');
                          onOpenRegisterModal();
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{tx('+ ሰራተኛ መዝግብ')}</span>
                      </button>
                    </div>
                  ) : (
                    /* LIST OF ASSIGNED STAFF CARDS */
                    <div className="space-y-3">
                      {assignedStaff.map((staff) => {
                        const matchedTeacher = teachers.find(t => t.id === staff.id);

                        return (
                          <div
                            key={staff.id}
                            className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {/* Staff photo thumbnail */}
                              <div className="w-11 h-11 rounded-full overflow-hidden bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shrink-0 flex items-center justify-center font-bold text-indigo-600 shadow-2xs">
                                {staff.photo ? (
                                  <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-sm">{staff.name.charAt(0)}</span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                    {staff.name}
                                  </h5>
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                                    {staff.id}
                                  </span>
                                </div>
                                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block truncate">
                                  {staff.roleTitle || div.titleAmh}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800">
                              <div>
                                <span className="text-slate-400 block">{tx('ስልክ ቁጥር:')}</span>
                                <a 
                                  href={`tel:${staff.phone}`}
                                  className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-1"
                                >
                                  <Phone className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{staff.phone || '-'}</span>
                                </a>
                              </div>

                              <div>
                                <span className="text-slate-400 block">{tx('ደመወዝ:')}</span>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {staff.baseSalary ? staff.baseSalary.toLocaleString() + ' ETB' : '-'}
                                </span>
                              </div>

                              {staff.assignedArea && (
                                <div className="col-span-2 border-t border-slate-100 dark:border-slate-800 pt-1">
                                  <span className="text-slate-400 block">{tx('የስራ ቢሮ / ቦታ:')}</span>
                                  <span className="text-slate-700 dark:text-slate-300 truncate block font-medium">
                                    📍 {staff.assignedArea}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* TEACHING ASSIGNMENT BADGE (If assigned to teach) */}
                            {(staff.subjects?.length || matchedTeacher?.subjects?.length || staff.assignedClass || matchedTeacher?.assignedClass) && (
                              <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/80 text-[11px] space-y-1">
                                <div className="flex items-center justify-between text-blue-900 dark:text-blue-200 font-extrabold text-[10px] uppercase">
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>{tx('የማስተማር ድልድል (Teaching Load):')}</span>
                                  </span>
                                  <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-[9px] font-mono font-black">
                                    {staff.assignedClass || matchedTeacher?.assignedClass || 'Grade 7'} - {staff.assignedSection || matchedTeacher?.assignedSection || 'A'}
                                  </span>
                                </div>
                                <div className="text-[10px] text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-1.5 flex-wrap">
                                  <span>{tx('የትምህርት አይነት:')}</span>
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {(staff.subjects || matchedTeacher?.subjects || ['Biology']).join(', ')}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Card actions */}
                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              {onOpenMarkList && (staff.subjects?.length || matchedTeacher?.subjects?.length || staff.assignedClass || matchedTeacher?.assignedClass) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    playInteractiveSound('click');
                                    onOpenMarkList(staff, matchedTeacher);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                                  title={tx('የማርክ ሊስት ሰሌዳ ክፈት')}
                                >
                                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                                  <span>{tx('ማርክ ሊስት')}</span>
                                </button>
                              )}
                              {onShowIDCard && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    playInteractiveSound('click');
                                    const staffCardData = {
                                      ...staff,
                                      ...(matchedTeacher || {}),
                                      photo: staff.photo || matchedTeacher?.photo,
                                      roleTitle: staff.roleTitle || staff.category || div.titleAmh,
                                      category: staff.category || div.primaryCategory,
                                      academicYear: schoolConfig?.academicYear || '2018 ዓ.ም'
                                    };
                                    onShowIDCard(staffCardData);
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                  title={tx('የሰራተኛ መታወቂያ አትም')}
                                >
                                  <QrCode className="w-3 h-3" />
                                  <span>{tx('መታወቂያ')}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  playInteractiveSound('click');
                                  onEditStaff(staff);
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title={tx('መረጃና ፎቶ አስተካክል')}
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>{tx('አስተካክል / ፎቶ')}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
