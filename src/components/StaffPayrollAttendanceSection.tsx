import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar, 
  Search, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Users, 
  UserCheck, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Move,
  Maximize2,
  Minimize2,
  Filter,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Edit2,
  Zap,
  Check,
  ShieldCheck,
  BadgeDollarSign,
  FileCheck,
  FileSpreadsheet,
  LayoutGrid,
  Smartphone
} from 'lucide-react';
import { StaffMember, Teacher, StaffAttendanceStatus, StaffMonthlyAttendance } from '../schoolData';
import { playInteractiveSound } from './AudioEngine';
import { useLanguage } from './LanguageContext';
import { getFormattedDualCalendarDate } from './GradeTrackerSection';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface StaffPayrollAttendanceProps {
  staffList: StaffMember[];
  teachers: Teacher[];
  schoolConfig?: any;
  workspaceId?: string;
  initialModule?: 'attendance' | 'finance';
  onUpdateStaff?: (updatedStaffList: StaffMember[]) => void;
}

const ETHIOPIAN_MONTHS = [
  { id: 1, nameAmh: 'መስከረም (Meskerem)', nameEng: 'September' },
  { id: 2, nameAmh: 'ጥቅምት (Tikimt)', nameEng: 'October' },
  { id: 3, nameAmh: 'ኅዳር (Hidar)', nameEng: 'November' },
  { id: 4, nameAmh: 'ታኅሣሥ (Tahsas)', nameEng: 'December' },
  { id: 5, nameAmh: 'ጥር (Tir)', nameEng: 'January' },
  { id: 6, nameAmh: 'የካቲት (Yekatit)', nameEng: 'February' },
  { id: 7, nameAmh: 'መጋቢት (Megabit)', nameEng: 'March' },
  { id: 8, nameAmh: 'ሚያዝያ (Miazia)', nameEng: 'April' },
  { id: 9, nameAmh: 'ግንቦት (Ginbot)', nameEng: 'May' },
  { id: 10, nameAmh: 'ሰኔ (Sene)', nameEng: 'June' },
  { id: 11, nameAmh: 'ሐምሌ (Hamle)', nameEng: 'July' },
  { id: 12, nameAmh: 'ነሐሴ (Nehase)', nameEng: 'August' },
];

const AMHARIC_DAYS_ABBR = ['እሁ', 'ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'ዓር', 'ቅዳ'];
const ENG_DAYS_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Accurately calculate day of the week for any Ethiopian date (Year, Month, Day).
 * Meskerem 1 in Gregorian calendar falls on September 12 GC if the previous Ethiopian year had 6 Pagume days
 * ((ethYear - 1) % 4 === 3), otherwise September 11 GC.
 * For example: Meskerem 1, 2019 E.C. corresponds to September 11, 2026 GC (Friday / ዓር / አርብ).
 * Returns 0: እሁ (Sun), 1: ሰኞ (Mon), 2: ማክ (Tue), 3: ረቡ (Wed), 4: ሐሙ (Thu), 5: ዓር (Fri), 6: ቅዳ (Sat).
 */
export const getEthiopianDayOfWeek = (ethYear: number, ethMonth: number, ethDay: number): number => {
  const isPrevLeap = ((ethYear - 1) % 4 === 3);
  const startDayGC = isPrevLeap ? 12 : 11;
  const meskerem1 = new Date(ethYear + 7, 8, startDayGC);
  const daysOffset = (ethMonth - 1) * 30 + (ethDay - 1);
  const targetDate = new Date(meskerem1.getFullYear(), meskerem1.getMonth(), meskerem1.getDate() + daysOffset);
  return (targetDate.getDay() + 1) % 7;
};

// Ethiopian local 12-hour school clock calculation:
// 6:00 AM GC = 12:00, 7:00 AM GC = 1:00, 7:35 AM GC = 1:35 (matches Ethiopian time format e.g. "1:35")
export const getEthiopianClockTime = (date: Date = new Date()): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  let ethHours = (hours - 6 + 24) % 12;
  if (ethHours === 0) ethHours = 12;
  const minStr = String(minutes).padStart(2, '0');
  return `${ethHours}:${minStr}`;
};

export const isArrivalLate = (timeStr?: string): boolean => {
  if (!timeStr) return false;
  const parts = timeStr.split(':');
  if (parts.length < 2) return false;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  // School schedule: Arrival after 1:45 or 2:00 is considered late
  if (h === 1 && m > 45) return true;
  if (h >= 2 && h <= 6) return true;
  return false;
};

export const StaffPayrollAttendanceSection: React.FC<StaffPayrollAttendanceProps> = ({
  staffList,
  teachers,
  schoolConfig,
  workspaceId = 'default',
  initialModule = 'attendance',
  onUpdateStaff
}) => {
  const { tx } = useLanguage();

  // Combine staffList and teachers so NO ONE is left out!
  // If a teacher from teachers[] is not in staffList, synthesize a staff view
  const allUnifiedStaff = useMemo<StaffMember[]>(() => {
    const map = new Map<string, StaffMember>();
    
    // First, add all registered staff
    staffList.forEach(s => {
      map.set(s.id, {
        ...s,
        baseSalary: s.baseSalary || (
          s.category === 'Principal' ? 18500 :
          s.category === 'Vice Principal' ? 16000 :
          s.category === 'Secretary' ? 10500 :
          s.category === 'Finance' ? 14500 :
          s.category === 'Head Teacher' ? 16500 :
          s.category === 'Main Teacher' ? 12000 :
          s.category === 'Assistant Teacher' ? 7500 :
          s.category === 'Administrator' ? 12500 :
          s.category === 'Cleaner' ? 5500 :
          s.category === 'Security Guard' ? 6200 : 8000
        )
      });
    });

    // Second, ensure all teachers from teachers[] exist
    teachers.forEach(t => {
      if (!map.has(t.id)) {
        map.set(t.id, {
          id: t.id,
          name: t.name,
          category: 'Main Teacher',
          roleTitle: 'ዋና መምህር (Teacher)',
          educationLevel: t.educationLevel || 'Degree',
          phone: t.phone || '-',
          email: t.email,
          gender: t.gender,
          age: t.age,
          subjects: t.subjects,
          assignedClass: t.assignedClass,
          assignedSection: t.assignedSection,
          isHomeroomTeacher: t.isHomeroomTeacher,
          baseSalary: 12000,
          dailyRate: 400,
          registeredBy: t.registeredBy || 'Principal',
          timestamp: t.timestamp || new Date().toISOString()
        });
      }
    });

    return Array.from(map.values());
  }, [staffList, teachers]);

  // Dynamically resolve system date from main system configuration & dual calendar
  const systemEthDate = useMemo(() => {
    const dual = getFormattedDualCalendarDate(new Date());
    // Parse year: prioritize schoolConfig.academicYear (e.g. "2018 ዓ.ም")
    let yearNum = 2018;
    if (schoolConfig?.academicYear) {
      const match = String(schoolConfig.academicYear).match(/\d{4}/);
      if (match) {
        yearNum = parseInt(match[0], 10);
      }
    } else {
      const match = dual.ec.match(/\d{4}/);
      if (match) {
        yearNum = parseInt(match[0], 10);
      }
    }

    // Determine current month index (1 - 12)
    let monthIdx = 1;
    for (let i = 0; i < ETHIOPIAN_MONTHS.length; i++) {
      const monthPrefix = ETHIOPIAN_MONTHS[i].nameAmh.split(' ')[0];
      if (dual.ec.includes(monthPrefix)) {
        monthIdx = ETHIOPIAN_MONTHS[i].id;
        break;
      }
    }

    // Determine today's day number in Ethiopian month (e.g. "መስከረም 11 ቀን")
    const dayMatch = dual.ec.match(/(\d+)\s*ቀን/);
    const dayNum = dayMatch ? parseInt(dayMatch[1], 10) : 1;

    return {
      year: yearNum,
      month: monthIdx,
      day: dayNum,
      ecFormatted: dual.ec,
      gcFormatted: dual.gc
    };
  }, [schoolConfig?.academicYear]);

  // Selected Ethiopian Year & Month - initialized to system date
  const [selectedEthMonthIndex, setSelectedEthMonthIndex] = useState(() => systemEthDate.month);
  const [selectedEthYear, setSelectedEthYear] = useState(() => systemEthDate.year);

  // Synchronize when system configuration year or month updates
  useEffect(() => {
    setSelectedEthYear(systemEthDate.year);
    setSelectedEthMonthIndex(systemEthDate.month);
  }, [systemEthDate.year, systemEthDate.month]);

  const monthKey = `${selectedEthYear}-${String(selectedEthMonthIndex).padStart(2, '0')}`;

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Live Ethiopian clock updated every 10 seconds
  const [liveEthTime, setLiveEthTime] = useState(() => getEthiopianClockTime());
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveEthTime(getEthiopianClockTime());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Active Module: 'attendance' (Principal & HR Attendance + Time) vs 'finance' (Finance & Salary Processing)
  const [activeModule, setActiveModule] = useState<'attendance' | 'finance'>(initialModule);

  useEffect(() => {
    setActiveModule(initialModule);
  }, [initialModule]);

  // Finance Approval State persisted per workspace & month
  const financeApprovalKey = `school_finance_approved_${workspaceId}_${monthKey}`;
  const [isFinanceApproved, setIsFinanceApproved] = useState<boolean>(() => {
    try {
      return localStorage.getItem(financeApprovalKey) === 'true';
    } catch (e) {
      return false;
    }
  });

  // Quick in-cell popover selector for fast 1-click status change
  const [quickSelectCell, setQuickSelectCell] = useState<{ staffId: string; day: number } | null>(null);

  // View Mode: '30days' (Full 30-Day Grid) vs 'todayLive' (Today's Quick Clock-In Kiosk)
  const [viewMode, setViewMode] = useState<'30days' | 'todayLive'>('30days');

  // Attendance Records: Map of staffId -> { [day: number]: StaffAttendanceStatus }
  const storageKey = `school_staff_attendance_${workspaceId}_${monthKey}`;
  const [attendanceMap, setAttendanceMap] = useState<{ [staffId: string]: { [day: number]: StaffAttendanceStatus } }>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // Clock-in / Arrival Time Records: Map of staffId -> { [day: number]: string (e.g. "1:35") }
  const timesStorageKey = `school_staff_attendance_times_${workspaceId}_${monthKey}`;
  const [attendanceTimeMap, setAttendanceTimeMap] = useState<{ [staffId: string]: { [day: number]: string } }>(() => {
    try {
      const saved = localStorage.getItem(timesStorageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // Modal for Principal editing exact arrival time / status for a specific cell
  const [editingCellData, setEditingCellData] = useState<{
    staffId: string;
    staffName: string;
    day: number;
    currentStatus: StaffAttendanceStatus;
    currentTime: string;
  } | null>(null);

  // Base salary overrides per staff member (Finance adjustments)
  const salaryOverrideKey = `school_staff_base_salaries_${workspaceId}`;
  const [salaryOverrides, setSalaryOverrides] = useState<{ [staffId: string]: number }>(() => {
    try {
      const saved = localStorage.getItem(salaryOverrideKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // Modal for viewing and printing an individual staff payslip
  const [selectedPayslipStaff, setSelectedPayslipStaff] = useState<StaffMember | null>(null);

  // Modal for Finance editing a staff member's base salary
  const [editingSalaryStaff, setEditingSalaryStaff] = useState<StaffMember | null>(null);
  const [newSalaryInput, setNewSalaryInput] = useState<string>('');

  // 4-Way Multi-Directional Scrolling Refs & State
  const attendanceTableContainerRef = useRef<HTMLDivElement>(null);
  const financeTableContainerRef = useRef<HTMLDivElement>(null);
  const [isTableMaximized, setIsTableMaximized] = useState<boolean>(false);

  // Freeze staff column toggle: Default to FALSE so on mobile it NEVER covers ("አይሸፍንም") the 30-day columns!
  const [freezeStaffCol, setFreezeStaffCol] = useState<boolean>(false);

  // Selected Day for Mobile Fast Attendance (defaults to today's day)
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(systemEthDate.day);

  // Programmatic smooth scroll in all directions including week jumps
  const handleScrollTable = (direction: 'left' | 'right' | 'up' | 'down' | 'today' | 'start' | 'week1' | 'week2' | 'week3' | 'week4' | 'totals') => {
    const el = activeModule === 'attendance' ? attendanceTableContainerRef.current : financeTableContainerRef.current;
    if (!el) return;
    playInteractiveSound('click');
    if (direction === 'left') {
      el.scrollBy({ left: -280, behavior: 'smooth' });
    } else if (direction === 'right') {
      el.scrollBy({ left: 280, behavior: 'smooth' });
    } else if (direction === 'up') {
      el.scrollBy({ top: -200, behavior: 'smooth' });
    } else if (direction === 'down') {
      el.scrollBy({ top: 200, behavior: 'smooth' });
    } else if (direction === 'start') {
      el.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    } else if (direction === 'week1') {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction === 'week2') {
      el.scrollTo({ left: 340, behavior: 'smooth' });
    } else if (direction === 'week3') {
      el.scrollTo({ left: 650, behavior: 'smooth' });
    } else if (direction === 'week4') {
      el.scrollTo({ left: 960, behavior: 'smooth' });
    } else if (direction === 'today') {
      const todayDay = systemEthDate.day;
      el.scrollTo({ left: Math.max(0, (todayDay - 2) * 44 + 60), behavior: 'smooth' });
    } else if (direction === 'totals') {
      el.scrollTo({ left: 1600, behavior: 'smooth' });
    }
  };

  // Persist & Load attendance from Firestore and localStorage
  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const docRef = doc(db, 'schools', workspaceId, 'staffAttendance', monthKey);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.attendanceMap) setAttendanceMap(data.attendanceMap);
          if (data.attendanceTimeMap) setAttendanceTimeMap(data.attendanceTimeMap);
          return;
        }
      } catch (err) {
        console.warn('Failed to load attendance from Firestore, using local cache:', err);
      }

      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setAttendanceMap(JSON.parse(saved));
        } else {
          const initial: { [staffId: string]: { [day: number]: StaffAttendanceStatus } } = {};
          allUnifiedStaff.forEach(stf => {
            initial[stf.id] = {};
            for (let d = 1; d <= 30; d++) {
              initial[stf.id][d] = 'P';
            }
          });
          setAttendanceMap(initial);
        }
      } catch (e) {
        console.error(e);
      }

      try {
        const savedTimes = localStorage.getItem(timesStorageKey);
        if (savedTimes) {
          setAttendanceTimeMap(JSON.parse(savedTimes));
        } else {
          const initialTimes: { [staffId: string]: { [day: number]: string } } = {};
          allUnifiedStaff.forEach(stf => {
            initialTimes[stf.id] = {};
            for (let d = 1; d <= 30; d++) {
              initialTimes[stf.id][d] = '1:30';
            }
          });
          setAttendanceTimeMap(initialTimes);
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadAttendance();

    try {
      setIsFinanceApproved(localStorage.getItem(financeApprovalKey) === 'true');
    } catch (e) {}
  }, [monthKey, storageKey, timesStorageKey, financeApprovalKey, allUnifiedStaff.length, workspaceId]);

  const saveAttendance = async (
    newMap: { [staffId: string]: { [day: number]: StaffAttendanceStatus } },
    newTimesMap?: { [staffId: string]: { [day: number]: string } }
  ) => {
    setAttendanceMap(newMap);
    const timesToSave = newTimesMap !== undefined ? newTimesMap : attendanceTimeMap;
    if (newTimesMap !== undefined) {
      setAttendanceTimeMap(newTimesMap);
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(newMap));
      if (newTimesMap !== undefined) {
        localStorage.setItem(timesStorageKey, JSON.stringify(newTimesMap));
      }
    } catch (e) {
      console.error(e);
    }

    try {
      await setDoc(doc(db, 'schools', workspaceId, 'staffAttendance', monthKey), {
        attendanceMap: newMap,
        attendanceTimeMap: timesToSave,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Firestore save attendance error:', err);
    }
  };

  const handleToggleFinanceApproval = () => {
    playInteractiveSound('success');
    const newVal = !isFinanceApproved;
    setIsFinanceApproved(newVal);
    try {
      localStorage.setItem(financeApprovalKey, String(newVal));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEditTimeModal = (
    staffId: string,
    staffName: string,
    day: number,
    status: StaffAttendanceStatus,
    time?: string
  ) => {
    playInteractiveSound('click');
    setEditingCellData({
      staffId,
      staffName,
      day,
      currentStatus: status,
      currentTime: time || attendanceTimeMap[staffId]?.[day] || getEthiopianClockTime()
    });
  };

  // Toggle or cycle day status in place: P (ተገኝቷል) -> L (አርፍዷል) -> F (ፍቃድ) -> A (ቀሪ) -> P
  const handleCellClick = (staffId: string, day: number) => {
    playInteractiveSound('click');
    const current = attendanceMap[staffId]?.[day] || 'P';
    let next: StaffAttendanceStatus = 'P';
    if (current === 'P') next = 'L';
    else if (current === 'L') next = 'F';
    else if (current === 'F') next = 'A';
    else if (current === 'A') next = 'P';
    else next = 'P';

    const updated = {
      ...attendanceMap,
      [staffId]: {
        ...(attendanceMap[staffId] || {}),
        [day]: next
      }
    };

    const updatedTimes = { ...attendanceTimeMap };
    if (!updatedTimes[staffId]) updatedTimes[staffId] = {};

    if (next === 'P') {
      updatedTimes[staffId][day] = updatedTimes[staffId][day] || '1:30';
    } else if (next === 'L') {
      // Marked Late - set late arrival time e.g. 2:15
      updatedTimes[staffId][day] = updatedTimes[staffId][day] || '2:15';
    } else {
      delete updatedTimes[staffId][day];
    }

    saveAttendance(updated, updatedTimes);
  };

  // Direct 1-click status setter in place (P, L, F, A)
  const handleSetDirectStatus = (staffId: string, day: number, status: StaffAttendanceStatus) => {
    playInteractiveSound('click');
    const updated = {
      ...attendanceMap,
      [staffId]: {
        ...(attendanceMap[staffId] || {}),
        [day]: status
      }
    };

    const updatedTimes = { ...attendanceTimeMap };
    if (!updatedTimes[staffId]) updatedTimes[staffId] = {};

    if (status === 'P') {
      updatedTimes[staffId][day] = updatedTimes[staffId][day] || '1:30';
    } else if (status === 'L') {
      updatedTimes[staffId][day] = updatedTimes[staffId][day] || '2:15';
    } else if (status === 'H') {
      updatedTimes[staffId][day] = updatedTimes[staffId][day] || getEthiopianClockTime();
    } else {
      delete updatedTimes[staffId][day];
    }

    saveAttendance(updated, updatedTimes);
    setQuickSelectCell(null);
  };

  // Save changes from cell edit modal
  const handleSaveEditedCell = (
    staffId: string,
    day: number,
    status: StaffAttendanceStatus,
    arrivalTime: string
  ) => {
    const updatedAttendance = {
      ...attendanceMap,
      [staffId]: {
        ...(attendanceMap[staffId] || {}),
        [day]: status
      }
    };
    const updatedTimes = { ...attendanceTimeMap };
    if (!updatedTimes[staffId]) updatedTimes[staffId] = {};

    if (status === 'P' || status === 'H') {
      updatedTimes[staffId][day] = arrivalTime.trim() || getEthiopianClockTime();
    } else {
      delete updatedTimes[staffId][day];
    }
    saveAttendance(updatedAttendance, updatedTimes);
  };

  // Today's / Selected Day's fast clock-in action for a specific staff member
  const handleQuickClockInToday = (staffId: string, customTime?: string, targetDay?: number) => {
    playInteractiveSound('success');
    const day = targetDay ?? selectedMobileDay ?? systemEthDate.day;
    const timeToRecord = customTime || getEthiopianClockTime();

    const updatedAttendance = {
      ...attendanceMap,
      [staffId]: {
        ...(attendanceMap[staffId] || {}),
        [day]: 'P' as StaffAttendanceStatus
      }
    };
    const updatedTimes = {
      ...attendanceTimeMap,
      [staffId]: {
        ...(attendanceTimeMap[staffId] || {}),
        [day]: timeToRecord
      }
    };
    saveAttendance(updatedAttendance, updatedTimes);
  };

  // Status setter (e.g. set Absent, Leave, or Half-day for today or selected day)
  const handleSetTodayStatus = (staffId: string, status: StaffAttendanceStatus, targetDay?: number) => {
    playInteractiveSound('click');
    const day = targetDay ?? selectedMobileDay ?? systemEthDate.day;
    const updatedAttendance = {
      ...attendanceMap,
      [staffId]: {
        ...(attendanceMap[staffId] || {}),
        [day]: status
      }
    };
    const updatedTimes = { ...attendanceTimeMap };
    if (!updatedTimes[staffId]) updatedTimes[staffId] = {};

    if (status === 'P' || status === 'H') {
      updatedTimes[staffId][day] = updatedTimes[staffId][day] || getEthiopianClockTime();
    } else {
      delete updatedTimes[staffId][day];
    }
    saveAttendance(updatedAttendance, updatedTimes);
  };

  // Mark all staff present right now for selected day or today
  const handleMarkAllPresentLive = (targetDay?: number) => {
    playInteractiveSound('success');
    const day = targetDay ?? selectedMobileDay ?? systemEthDate.day;
    const currentTime = getEthiopianClockTime();
    const updatedAttendance = { ...attendanceMap };
    const updatedTimes = { ...attendanceTimeMap };

    allUnifiedStaff.forEach(stf => {
      if (!updatedAttendance[stf.id]) updatedAttendance[stf.id] = {};
      if (!updatedTimes[stf.id]) updatedTimes[stf.id] = {};
      updatedAttendance[stf.id][day] = 'P';
      updatedTimes[stf.id][day] = currentTime;
    });

    saveAttendance(updatedAttendance, updatedTimes);
  };

  // Bulk actions
  const handleFillAllMonthPresent = () => {
    playInteractiveSound('success');
    const updated = { ...attendanceMap };
    const updatedTimes = { ...attendanceTimeMap };
    allUnifiedStaff.forEach(stf => {
      updated[stf.id] = updated[stf.id] ? { ...updated[stf.id] } : {};
      updatedTimes[stf.id] = updatedTimes[stf.id] ? { ...updatedTimes[stf.id] } : {};
      for (let d = 1; d <= 30; d++) {
        updated[stf.id][d] = 'P';
        if (!updatedTimes[stf.id][d]) {
          updatedTimes[stf.id][d] = '1:30';
        }
      }
    });
    saveAttendance(updated, updatedTimes);
  };

  const handleResetMonthAttendance = () => {
    if (!confirm(tx('የወሩን አቴንዳንስ ሙሉ በሙሉ ማጽዳት ይፈልጋሉ? (Are you sure you want to reset all attendance for this month?)'))) {
      return;
    }
    playInteractiveSound('wrong');
    const updated = { ...attendanceMap };
    const updatedTimes = { ...attendanceTimeMap };
    allUnifiedStaff.forEach(stf => {
      updated[stf.id] = {};
      updatedTimes[stf.id] = {};
    });
    saveAttendance(updated, updatedTimes);
  };

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return allUnifiedStaff.filter(stf => {
      const matchSearch = stf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stf.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stf.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = categoryFilter === 'All' || 
        stf.category === categoryFilter ||
        (categoryFilter === 'Principal' && (stf.category === 'Head Teacher' && (stf.roleTitle?.toLowerCase().includes('principal') || stf.roleTitle?.includes('ርዕሰ')))) ||
        (categoryFilter === 'Vice Principal' && (stf.roleTitle?.toLowerCase().includes('vice') || stf.roleTitle?.includes('ምክትል'))) ||
        (categoryFilter === 'Secretary' && (stf.roleTitle?.toLowerCase().includes('secretary') || stf.roleTitle?.includes('ፀሐፊ') || stf.roleTitle?.includes('ሰነድ'))) ||
        (categoryFilter === 'Finance' && (stf.roleTitle?.toLowerCase().includes('finance') || stf.roleTitle?.includes('ፋይናንስ') || stf.roleTitle?.includes('ሂሳብ')));

      return matchSearch && matchCategory;
    });
  }, [allUnifiedStaff, searchQuery, categoryFilter]);

  // Dual calendar date reference
  const dualHeaderDate = useMemo(() => {
    return getFormattedDualCalendarDate(new Date());
  }, []);

  // Compute payroll metrics and attendance totals (P, L, F, A) for a staff member
  const computeStaffPayroll = (staff: StaffMember) => {
    const daysObj = attendanceMap[staff.id] || {};
    let presentDays = 0; // ድምር P
    let lateDays = 0;    // ድምር L (አርፍዷል)
    let leaveDays = 0;   // ድምር ፍቃድ (F)
    let absentDays = 0;  // ድምር ቀሪ (A)
    let halfDays = 0;    // ድምር H

    for (let d = 1; d <= 30; d++) {
      const status = daysObj[d] || 'P';
      if (status === 'P') presentDays += 1;
      else if (status === 'L') lateDays += 1;
      else if (status === 'F') leaveDays += 1;
      else if (status === 'A') absentDays += 1;
      else if (status === 'H') {
        halfDays += 1;
        presentDays += 0.5;
      }
    }

    const baseSalary = salaryOverrides[staff.id] !== undefined ? salaryOverrides[staff.id] : (staff.baseSalary || 10000);
    const dailyRate = Math.round(baseSalary / 30);
    // Deduction: Absent days deducted fully, half-days deducted 50%
    const absenceDeductions = Math.round((absentDays * dailyRate) + (halfDays * (dailyRate / 2)));
    const netPayable = Math.max(0, baseSalary - absenceDeductions);

    return {
      baseSalary,
      dailyRate,
      presentDays,
      lateDays,
      leaveDays,
      absentDays,
      halfDays,
      absenceDeductions,
      netPayable
    };
  };

  // Overall totals across staff: calculates individual sums for P, L, Leave (F), and A
  const overallTotals = useMemo(() => {
    let totalBase = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalPresent = 0;
    let totalLate = 0;
    let totalLeave = 0;
    let totalAbsences = 0;

    filteredStaff.forEach(s => {
      const p = computeStaffPayroll(s);
      totalBase += p.baseSalary;
      totalDeductions += p.absenceDeductions;
      totalNet += p.netPayable;
      totalPresent += p.presentDays;
      totalLate += p.lateDays;
      totalLeave += p.leaveDays;
      totalAbsences += p.absentDays;
    });

    return { totalBase, totalDeductions, totalNet, totalPresent, totalLate, totalLeave, totalAbsences };
  }, [filteredStaff, attendanceMap, salaryOverrides]);

  // Handle opening and saving base salary adjustments
  const handleOpenEditSalary = (staff: StaffMember) => {
    const currentBase = salaryOverrides[staff.id] !== undefined ? salaryOverrides[staff.id] : (staff.baseSalary || 10000);
    setNewSalaryInput(String(currentBase));
    setEditingSalaryStaff(staff);
  };

  const handleSaveSalary = () => {
    if (!editingSalaryStaff) return;
    const num = parseInt(newSalaryInput, 10);
    if (!isNaN(num) && num >= 0) {
      const updated = { ...salaryOverrides, [editingSalaryStaff.id]: num };
      setSalaryOverrides(updated);
      try {
        localStorage.setItem(salaryOverrideKey, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      playInteractiveSound('success');
      setEditingSalaryStaff(null);
    }
  };

  // Download Pure 30-Day Staff Attendance Sheet (No salary columns)
  const handleDownloadAttendanceOnlyPDF = () => {
    playInteractiveSound('success');
    const schoolAmh = schoolConfig?.nameAmh || 'ደሊጀንት አካዳሚ';
    const schoolEng = (schoolConfig?.nameEng || 'DILIGENT ACADEMY').replace(/app/i, '').trim();
    const curMonth = ETHIOPIAN_MONTHS[selectedEthMonthIndex - 1];
    const monthTitle = `${curMonth?.nameAmh} ${selectedEthYear} ዓ.ም`;
    const generatedDate = new Date().toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });

    const rowsHtml = filteredStaff.map((staff, idx) => {
      const p = computeStaffPayroll(staff);
      const daysObj = attendanceMap[staff.id] || {};
      const dayCells = Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
        const st = daysObj[d] || 'P';
        let bg = '#ecfdf5';
        let color = '#047857';
        if (st === 'A') { bg = '#fef2f2'; color = '#b91c1c'; }
        else if (st === 'L') { bg = '#fffbeb'; color = '#b45309'; }
        else if (st === 'F') { bg = '#eff6ff'; color = '#1d4ed8'; }
        return `<td style="text-align: center; font-weight: bold; background-color: ${bg}; color: ${color}; padding: 2px;">${st === 'F' ? 'ፍ' : st}</td>`;
      }).join('');

      return `
        <tr>
          <td style="text-align: center; font-weight: bold; width: 30px;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; width: 65px;">${staff.id}</td>
          <td style="font-weight: 700; text-align: left; padding-left: 6px;">${staff.name}</td>
          <td style="text-align: left; width: 90px; font-size: 10px;">${staff.roleTitle || staff.category}</td>
          ${dayCells}
          <td style="text-align: center; width: 35px; font-weight: 800; color: #047857; background-color: #ecfdf5;">${p.presentDays}</td>
          <td style="text-align: center; width: 35px; font-weight: 800; color: #b45309; background-color: #fffbeb;">${p.lateDays}</td>
          <td style="text-align: center; width: 35px; font-weight: 800; color: #1d4ed8; background-color: #eff6ff;">${p.leaveDays}</td>
          <td style="text-align: center; width: 35px; font-weight: 800; color: #b91c1c; background-color: #fef2f2;">${p.absentDays}</td>
          <td style="width: 60px;"></td>
        </tr>
      `;
    }).join('');

    const dayHeaders = Array.from({ length: 30 }, (_, i) => i + 1).map(d => `<th style="text-align: center; width: 20px; font-size: 9px; padding: 2px;">${d}</th>`).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <title>${schoolAmh} - የሰራተኞች 30 ቀናት የአቴንዳንስ መዝገብ (${monthTitle})</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif; background: #f8fafc; margin: 0; padding: 15px; color: #0f172a; }
    .action-bar { max-width: 1100px; margin: 0 auto 15px auto; display: flex; justify-content: space-between; align-items: center; background: white; padding: 10px 18px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .btn-print { background: #4338ca; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; }
    .doc-page { max-width: 1100px; margin: 0 auto; background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .header-table { width: 100%; border-bottom: 2px solid #1e293b; padding-bottom: 8px; margin-bottom: 10px; }
    .school-title { font-size: 18px; font-weight: 900; color: #1e1b4b; margin: 0; text-transform: uppercase; text-align: center; }
    .school-eng { font-size: 11px; font-weight: 800; color: #4338ca; text-align: center; text-transform: uppercase; margin: 2px 0 0 0; }
    .doc-subtitle { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 4px; text-align: center; }
    .meta-badges { display: flex; justify-content: space-between; background: #f1f5f9; border-radius: 8px; padding: 6px 12px; font-size: 10.5px; font-weight: bold; margin-bottom: 10px; border: 1px solid #e2e8f0; }
    table.roster { width: 100%; border-collapse: collapse; font-size: 10px; }
    table.roster th, table.roster td { border: 1px solid #cbd5e1; padding: 3px 4px; }
    table.roster th { background-color: #f8fafc; color: #1e293b; font-weight: 800; }
    .signatures { margin-top: 20px; display: flex; justify-content: space-between; text-align: center; font-size: 10.5px; font-weight: bold; color: #334155; }
    .sig-line { width: 160px; border-bottom: 1.5px dashed #64748b; margin: 20px auto 4px auto; }
    @media print { body { background: white; padding: 0; } .action-bar { display: none !important; } .doc-page { border: none; box-shadow: none; padding: 0; } -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  </style>
</head>
<body>
  <div class="action-bar">
    <div style="font-size: 13px; font-weight: bold;">📄 የሰራተኞች የአቴንዳንስ መዝገብ - ${filteredStaff.length} ሰራተኞች (${monthTitle})</div>
    <button class="btn-print" onclick="window.print()">🖨️ በPDF አስቀምጥ / አትም (Print / Save PDF)</button>
  </div>
  <div class="doc-page">
    <div class="header-table">
      <h1 class="school-title">${schoolAmh}</h1>
      <div class="school-eng">${schoolEng}</div>
      <div class="doc-subtitle">የ30 ቀናት የሰራተኞችና መምህራን የመገኘት (Attendance) መዝገብ ሉህ</div>
    </div>
    <div class="meta-badges">
      <div>የአቴንዳንስ ወር፡ <span style="color: #4338ca;">${monthTitle}</span></div>
      <div>ጠቅላላ ሰራተኞች፡ <span>${filteredStaff.length}</span></div>
      <div>የመጣ (P)፡ <span style="color: #047857;">${overallTotals.totalPresent}</span> | ያረፈደ (L)፡ <span style="color: #b45309;">${overallTotals.totalLate}</span> | የቀረ (A)፡ <span style="color: #b91c1c;">${overallTotals.totalAbsences}</span></div>
      <div>ቀን፡ <span>${generatedDate}</span></div>
    </div>
    <table class="roster">
      <thead>
        <tr>
          <th>ተ.ቁ</th>
          <th>መታወቂያ</th>
          <th>ሙሉ ስም</th>
          <th>የስራ መደብ</th>
          ${dayHeaders}
          <th style="color: #047857;">P</th>
          <th style="color: #b45309;">L</th>
          <th style="color: #1d4ed8;">ፍ</th>
          <th style="color: #b91c1c;">A</th>
          <th>ፊርማ</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot>
        <tr style="background: #f1f5f9; font-weight: 800;">
          <td colspan="4" style="text-align: right; padding-right: 6px;">ጠቅላላ ድምር:</td>
          <td colspan="30" style="text-align: center; color: #64748b; font-size: 9px;">የ30 ቀናት አቴንዳንስ ማጠቃለያ</td>
          <td style="text-align: center; color: #047857;">${overallTotals.totalPresent}</td>
          <td style="text-align: center; color: #b45309;">${overallTotals.totalLate}</td>
          <td style="text-align: center; color: #1d4ed8;">${overallTotals.totalLeave}</td>
          <td style="text-align: center; color: #b91c1c;">${overallTotals.totalAbsences}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
    <div class="signatures">
      <div><div class="sig-line"></div><div>ያዘጋጀው - የሰው ኃይል</div></div>
      <div><div class="sig-line"></div><div>ያረጋገጠው - ርዕሰ መምህር</div></div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    const safeMonth = (curMonth?.nameAmh || 'Month').replace(/[^a-zA-Z0-9\u1200-\u137F]/g, '_');
    link.download = `የሰራተኞች_አቴንዳንስ_መዝገብ_${safeMonth}_${selectedEthYear}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  // Download / Print Official Payroll & Attendance Report (Featuring Attendance Totals: P, L, A and Salary)
  const handleDownloadPayrollReportPDF = () => {
    playInteractiveSound('success');
    const schoolAmh = schoolConfig?.nameAmh || 'ደሊጀንት አካዳሚ';
    const schoolEng = (schoolConfig?.nameEng || 'DILIGENT ACADEMY').replace(/app/i, '').trim();
    const curMonth = ETHIOPIAN_MONTHS[selectedEthMonthIndex - 1];
    const monthTitle = `${curMonth?.nameAmh} ${selectedEthYear} ዓ.ም`;
    const generatedDate = new Date().toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });

    const rowsHtml = filteredStaff.map((staff, idx) => {
      const p = computeStaffPayroll(staff);
      return `
        <tr>
          <td style="text-align: center; font-weight: bold; width: 35px;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; width: 75px;">${staff.id}</td>
          <td style="font-weight: 700; text-align: left; padding-left: 8px;">${staff.name}</td>
          <td style="text-align: left; width: 110px;">${staff.roleTitle || staff.category}</td>
          <td style="text-align: center; width: 55px; font-weight: 800; color: #047857; background-color: #ecfdf5;">${p.presentDays}</td>
          <td style="text-align: center; width: 55px; font-weight: 800; color: #b45309; background-color: #fffbeb;">${p.lateDays}</td>
          <td style="text-align: center; width: 55px; font-weight: 800; color: #b91c1c; background-color: #fef2f2;">${p.absentDays}</td>
          <td style="text-align: center; width: 55px; font-weight: 800; color: #1d4ed8; background-color: #eff6ff;">${p.leaveDays}</td>
          <td style="font-family: monospace; text-align: right; width: 85px; font-weight: 700;">${p.baseSalary.toLocaleString()}</td>
          <td style="font-family: monospace; text-align: right; width: 85px; color: #b91c1c; font-weight: 700;">${p.absenceDeductions > 0 ? '-' + p.absenceDeductions.toLocaleString() : '0'}</td>
          <td style="font-family: monospace; text-align: right; width: 95px; font-weight: 900; color: #047857;">${p.netPayable.toLocaleString()} ETB</td>
          <td style="text-align: center; width: 80px; font-size: 10px; font-weight: bold;">
            ${isFinanceApproved ? '✓ ተረጋግጧል' : 'በሂደት ላይ'}
          </td>
          <td style="width: 85px;"></td>
        </tr>
      `;
    }).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <title>${schoolAmh} - የደመወዝ ክፍያና የአቴንዳንስ ድምር ሪፖርት (${monthTitle})</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Ethiopic", Helvetica, Arial, sans-serif;
      background: #f8fafc;
      margin: 0;
      padding: 15px;
      color: #0f172a;
    }
    .action-bar {
      max-width: 1100px;
      margin: 0 auto 15px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .btn-print {
      background: #047857;
      color: white;
      border: none;
      padding: 10px 22px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
    }
    .doc-page {
      max-width: 1100px;
      margin: 0 auto;
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .school-title {
      font-size: 21px;
      font-weight: 900;
      color: #064e3b;
      margin: 0;
      text-transform: uppercase;
      text-align: center;
    }
    .school-eng {
      font-size: 12px;
      font-weight: 800;
      color: #047857;
      letter-spacing: 1px;
      margin: 2px 0 0 0;
      text-transform: uppercase;
      text-align: center;
    }
    .doc-subtitle {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 5px;
      text-align: center;
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
      color: #0f172a;
      font-weight: 900;
      font-size: 10.5px;
      text-transform: uppercase;
    }
    table.roster tr:nth-child(even) {
      background-color: #fafbfc;
    }
    .signatures {
      margin-top: 25px;
      display: flex;
      justify-content: space-between;
      text-align: center;
      font-size: 11px;
      font-weight: bold;
      color: #334155;
      page-break-inside: avoid;
    }
    .sig-line {
      width: 180px;
      border-bottom: 1.5px dashed #475569;
      margin: 28px auto 6px auto;
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
    <div style="font-size: 13px; font-weight: bold; color: #064e3b;">
      📄 የደመወዝ ክፍያና የአቴንዳንስ ድምር ሪፖርት - ${filteredStaff.length} ሰራተኞች (${monthTitle})
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ በPDF አስቀምጥ / አትም (Print / Save PDF)</button>
  </div>

  <div class="doc-page">
    <div class="header-table">
      <h1 class="school-title">${schoolAmh}</h1>
      <div class="school-eng">${schoolEng}</div>
      <div class="doc-subtitle">የሰራተኞች ወርሃዊ ደመወዝ ክፍያና የአቴንዳንስ (P, L, A) ድምር ሪፖርት ሰንጠረዥ</div>
    </div>

    <div class="meta-badges">
      <div>የክፍያ ወር፡ <span style="color: #047857;">${monthTitle}</span></div>
      <div>ጠቅላላ ሰራተኞች፡ <span>${filteredStaff.length}</span></div>
      <div>የመጣ (P)፡ <span style="color: #047857;">${overallTotals.totalPresent}</span> | ያረፈደ (L)፡ <span style="color: #b45309;">${overallTotals.totalLate}</span> | የቀረ (A)፡ <span style="color: #b91c1c;">${overallTotals.totalAbsences}</span></div>
      <div>ጠቅላላ መነሻ፡ <span>${overallTotals.totalBase.toLocaleString()} ETB</span></div>
      <div>የቀሪ ቅጣት ቅነሳ፡ <span style="color: #b91c1c;">-${overallTotals.totalDeductions.toLocaleString()} ETB</span></div>
      <div>የተጣራ ክፍያ፡ <span style="color: #047857;">${overallTotals.totalNet.toLocaleString()} ETB</span></div>
      <div>ቀን፡ <span>${generatedDate}</span></div>
    </div>

    <table class="roster">
      <thead>
        <tr>
          <th style="text-align: center;">ተ.ቁ</th>
          <th style="text-align: left;">መታወቂያ</th>
          <th style="text-align: left;">ሙሉ ስም</th>
          <th style="text-align: left;">የስራ መደብ</th>
          <th style="text-align: center; color: #047857;">የመጣበት (P)</th>
          <th style="text-align: center; color: #b45309;">ያረፈደበት (L)</th>
          <th style="text-align: center; color: #b91c1c;">የቀረበት (A)</th>
          <th style="text-align: center; color: #1d4ed8;">ፍቃድ (F)</th>
          <th style="text-align: right;">መነሻ ደመወዝ</th>
          <th style="text-align: right; color: #b91c1c;">ተቀናሽ ቅጣት</th>
          <th style="text-align: right; color: #047857;">የተጣራ ክፍያ</th>
          <th style="text-align: center;">የፋይናንስ ሁኔታ</th>
          <th style="text-align: center;">የሰራተኛ ፊርማ</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
      <tfoot>
        <tr style="background: #f1f5f9; font-weight: 900;">
          <td colspan="4" style="text-align: right; padding-right: 8px;">ጠቅላላ ድምር (Grand Totals):</td>
          <td style="text-align: center; color: #047857; font-size: 12px;">${overallTotals.totalPresent}</td>
          <td style="text-align: center; color: #b45309; font-size: 12px;">${overallTotals.totalLate}</td>
          <td style="text-align: center; color: #b91c1c; font-size: 12px;">${overallTotals.totalAbsences}</td>
          <td style="text-align: center; color: #1d4ed8; font-size: 12px;">${overallTotals.totalLeave}</td>
          <td style="text-align: right; font-family: monospace;">${overallTotals.totalBase.toLocaleString()}</td>
          <td style="text-align: right; font-family: monospace; color: #b91c1c;">-${overallTotals.totalDeductions.toLocaleString()}</td>
          <td style="text-align: right; font-family: monospace; color: #047857; font-size: 12px;">${overallTotals.totalNet.toLocaleString()} ETB</td>
          <td style="text-align: center;">${isFinanceApproved ? 'ተረጋግጧል' : 'በሂደት ላይ'}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    <div class="signatures">
      <div>
        <div class="sig-line"></div>
        <div>ያዘጋጀው - የሰው ኃይል (Prepared By - HR)</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div>ያረጋገጠው - ፋይናንስ (Verified By - Finance)</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div>ያጸደቀው - ዋና ርዕሰ መምህር (Approved By - Principal)</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    const safeMonth = (curMonth?.nameAmh || 'Month').replace(/[^a-zA-Z0-9\u1200-\u137F]/g, '_');
    link.download = `የደመወዝ_እና_አቴንዳንስ_ሪፖርት_${safeMonth}_${selectedEthYear}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  // Export Payroll & Attendance Totals as Excel-Compatible CSV
  const handleExportPayrollCSV = () => {
    playInteractiveSound('success');
    const curMonth = ETHIOPIAN_MONTHS[selectedEthMonthIndex - 1];
    const monthTitle = `${curMonth?.nameAmh || 'Month'}_${selectedEthYear}`;
    
    const headers = [
      'ተ.ቁ',
      'መታወቂያ (Staff ID)',
      'ሙሉ ስም (Full Name)',
      'የስራ መደብ (Role)',
      'የመጣበት ቀን ድምር (P)',
      'ያረፈደበት ቀን ድምር (L)',
      'የቀረበት ቀን ድምር (A)',
      'የፍቃድ ቀን ድምር (F)',
      'መነሻ ደመወዝ (Base Salary ETB)',
      'የቀን ተመን (Daily Rate ETB)',
      'የቀሪና አርፍዶ ተቀናሽ (Deductions ETB)',
      'የተጣራ ክፍያ (Net Payable ETB)',
      'የፋይናንስ ሁኔታ (Finance Status)'
    ];

    const rows = filteredStaff.map((staff, idx) => {
      const p = computeStaffPayroll(staff);
      return [
        idx + 1,
        `"${staff.id}"`,
        `"${staff.name}"`,
        `"${staff.roleTitle || staff.category}"`,
        p.presentDays,
        p.lateDays,
        p.absentDays,
        p.leaveDays,
        p.baseSalary,
        p.dailyRate,
        p.absenceDeductions,
        p.netPayable,
        `"${isFinanceApproved ? 'ተረጋግጧል' : 'በሂደት ላይ'}"`
      ].join(',');
    });

    const totalsRow = [
      'ጠቅላላ ድምር',
      '""',
      `"${filteredStaff.length} ሰራተኞች"`,
      '""',
      overallTotals.totalPresent,
      overallTotals.totalLate,
      overallTotals.totalAbsences,
      overallTotals.totalLeave,
      overallTotals.totalBase,
      '""',
      overallTotals.totalDeductions,
      overallTotals.totalNet,
      `"${isFinanceApproved ? 'ተረጋግጧል' : 'በሂደት ላይ'}"`
    ].join(',');

    const csvContent = '\uFEFF' + [headers.join(','), ...rows, totalsRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `የደመወዝ_እና_አቴንዳንስ_ሪፖርት_${monthTitle}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  // Print Single Staff Payslip
  const handlePrintSinglePayslip = (staff: StaffMember) => {
    playInteractiveSound('success');
    const p = computeStaffPayroll(staff);
    const schoolAmh = schoolConfig?.nameAmh || 'ደሊጀንት አካዳሚ';
    const curMonth = ETHIOPIAN_MONTHS[selectedEthMonthIndex - 1];
    const monthTitle = `${curMonth?.nameAmh} ${selectedEthYear} ዓ.ም`;

    const html = `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <title>የደመወዝ ክፍያ ደረሰኝ - ${staff.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif; padding: 25px; max-width: 600px; margin: 0 auto; color: #0f172a; }
    .card { border: 2px solid #064e3b; border-radius: 12px; padding: 20px; background: white; }
    .title { text-align: center; font-size: 18px; font-weight: 900; color: #064e3b; }
    .sub { text-align: center; font-size: 13px; color: #64748b; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    td, th { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    .total { font-weight: 900; font-size: 15px; color: #047857; background: #ecfdf5; }
    .btn { background: #047857; color: white; padding: 8px 18px; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold; }
    @media print { .btn { display: none; } }
  </style>
</head>
<body>
  <button class="btn" onclick="window.print()">🖨️ አትም (Print Payslip)</button>
  <div class="card">
    <div class="title">${schoolAmh}</div>
    <div class="sub">የወርሃዊ ደመወዝ ክፍያ ደረሰኝ (Monthly Pay Voucher) • ${monthTitle}</div>
    <table>
      <tr><td><strong>የሰራተኛው ስም፡</strong></td><td>${staff.name}</td></tr>
      <tr><td><strong>መታወቂያ ቁጥር፡</strong></td><td><span style="font-family: monospace; font-weight: bold;">${staff.id}</span></td></tr>
      <tr><td><strong>የስራ መደብ፡</strong></td><td>${staff.roleTitle || staff.category}</td></tr>
      <tr style="background: #f8fafc;">
        <td><strong>የአቴንዳንስ ድምር፡</strong></td>
        <td>
          <span style="color: #047857; font-weight: bold;">P: ${p.presentDays}</span> • 
          <span style="color: #b45309; font-weight: bold;">L: ${p.lateDays}</span> • 
          <span style="color: #b91c1c; font-weight: bold;">A: ${p.absentDays}</span> • 
          <span style="color: #1d4ed8; font-weight: bold;">F: ${p.leaveDays}</span>
        </td>
      </tr>
      <tr><td><strong>መነሻ ደመወዝ፡</strong></td><td style="text-align: right; font-weight: bold; font-family: monospace;">${p.baseSalary.toLocaleString()} ETB</td></tr>
      <tr><td><strong>የቀን ተመን፡</strong></td><td style="text-align: right; font-family: monospace;">${p.dailyRate.toLocaleString()} ETB/ቀን</td></tr>
      <tr><td><strong>የቀሪ ቅጣት ተቀናሽ (${p.absentDays} ቀን)፡</strong></td><td style="text-align: right; color: #b91c1c; font-family: monospace;">-${p.absenceDeductions.toLocaleString()} ETB</td></tr>
      <tr class="total"><td><strong>የተጣራ ተከፋይ ደመወዝ፡</strong></td><td style="text-align: right; font-size: 16px; font-family: monospace;">${p.netPayable.toLocaleString()} ETB</td></tr>
    </table>
    <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold;">
      <div>የሰራተኛው ፊርማ፡ __________________</div>
      <div>የፋይናንስ ፊርማ፡ __________________</div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (win) {
      setTimeout(() => win.print(), 500);
    }
  };

  return (
    <div className="space-y-6" id="staff-payroll-attendance-section">
      {/* Primary Module Switcher: Attendance (Principal) vs Finance (Salary) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100/90 dark:bg-slate-800/90 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              playInteractiveSound('click');
              setActiveModule('attendance');
            }}
            className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeModule === 'attendance'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>{tx('የአቴንዳንስና የሰዓት ክትትል (Attendance & Time - Principal)')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playInteractiveSound('click');
              setActiveModule('finance');
            }}
            className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeModule === 'finance'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>{tx('የደመወዝ ክፍያና ፋይናንስ (Finance & Payroll)')}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto pr-2">
          {activeModule === 'attendance' ? (
            <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-xl border border-indigo-200/60 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              {tx('ሰዓት በርዕሰ መምህሩ ማስተካከል ይቻላል')}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleToggleFinanceApproval}
              className={`text-[11px] font-black px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                isFinanceApproved
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 shadow-2xs'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
              }`}
              title={tx('በፋይናንስ የተረጋገጠ ሁኔታን ለመቀየር ይጫኑ')}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isFinanceApproved ? tx('በፋይናንስ ተረጋግጧል (Verified)') : tx('በፋይናንስ በሂደት ላይ (Pending)')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Header & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className={`p-2.5 text-white rounded-2xl shadow-sm ${
                activeModule === 'finance'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                  : 'bg-gradient-to-br from-indigo-600 to-purple-700'
              }`}>
                {activeModule === 'finance' ? <DollarSign className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>
                    {activeModule === 'finance'
                      ? tx('የሰራተኞች ደመወዝ ስሌት እና ፋይናንስ')
                      : tx('የ30 ቀናት የሰራተኞችና መምህራን አቴንዳንስና ሰዓት')}
                  </span>
                  <span className="text-xs bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200/50">
                    {activeModule === 'finance' ? 'Finance & Payroll' : 'Principal Attendance'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeModule === 'finance'
                    ? tx('የሰራተኞች መነሻ ደመወዝ፣ የቀሪና አርፍዶ ቅጣት ቅነሳ እና የተጣራ ክፍያ በፋይናንስ የሚሰራበት')
                    : tx('ሰዓት በርዕሰ መምህሩ ማስተካከል የሚቻልበት፣ P፣ L እና ፍቃድ አሁን ባለበት በቀጥታ የሚሞላበት እና ድምር የሚሰላበት')}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats & View Mode Banner */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Ethiopian Clock Badge */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 px-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-2xs font-mono">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider leading-none">
                  {tx('የአሁኑ ሰዓት (Live Clock)')}
                </span>
                <span className="text-sm font-black text-amber-950 dark:text-amber-200 leading-tight">
                  {liveEthTime}
                </span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  playInteractiveSound('click');
                  setViewMode('30days');
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === '30days'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{tx('የ30 ቀናት ሰንጠረዥ')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playInteractiveSound('click');
                  setViewMode('todayLive');
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'todayLive'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{tx('የዛሬ ፈጣን መግቢያ')}</span>
                <span className="bg-emerald-600 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full">
                  {liveEthTime}
                </span>
              </button>
            </div>

            {activeModule === 'attendance' ? (
              <>
                <button
                  type="button"
                  onClick={handleFillAllMonthPresent}
                  className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer transform active:scale-95"
                  title={tx('ሁሉንም ሰራተኞች ለ30 ቀናት ተገኝተዋል አድርግ (Mark All Present)')}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{tx('ሁሉንም 30 ቀናት አሟላ')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetMonthAttendance}
                  className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  title={tx('አቴንዳንስ አጽዳ (Reset)')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{tx('አጽዳ')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAttendanceOnlyPDF}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer print:hidden"
                  title={tx("የ30 ቀናት የአቴንዳንስ ሉህ በPDF ያውርዱ")}
                >
                  <Download className="w-4 h-4" />
                  <span>{tx('የአቴንዳንስ ሉህ (PDF)')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playInteractiveSound('success');
                    window.print();
                  }}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer print:hidden"
                >
                  <Printer className="w-4 h-4" />
                  <span>{tx('አትም (Print Sheet)')}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDownloadPayrollReportPDF}
                  className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer print:hidden"
                  title={tx('የደመወዝ ክፍያና አቴንዳንስ (P, L, A) ድምር ሪፖርት አትም / በPDF አስቀምጥ')}
                >
                  <Printer className="w-4 h-4" />
                  <span>{tx('የደመወዝ ሪፖርት አትም / PDF')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPayrollCSV}
                  className="py-2.5 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl shadow-2xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer print:hidden"
                  title={tx('የደመወዝ እና አቴንዳንስ ሰንጠረዥ በ Excel / CSV ያውርዱ')}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{tx('Excel / CSV')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleFinanceApproval}
                  className={`text-xs font-black px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer print:hidden ${
                    isFinanceApproved
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 shadow-2xs'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                  }`}
                  title={tx('የፋይናንስ ማረጋገጫ')}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isFinanceApproved ? tx('✅ ተረጋግጧል') : tx('⏳ ማረጋገጫ በመጠባበቅ ላይ')}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Ethiopian Month & Year Selector with Dual Calendar Badges */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-black text-slate-600 dark:text-slate-300 px-2">
                {tx('ወር (Month):')}
              </span>
              <select
                value={selectedEthMonthIndex}
                onChange={(e) => setSelectedEthMonthIndex(parseInt(e.target.value, 10))}
                className="py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
              >
                {ETHIOPIAN_MONTHS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nameAmh} - {m.nameEng}
                  </option>
                ))}
              </select>

              <select
                value={selectedEthYear}
                onChange={(e) => setSelectedEthYear(parseInt(e.target.value, 10))}
                className="py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:border-indigo-600 cursor-pointer shadow-2xs font-mono"
              >
                {[
                  systemEthDate.year - 2,
                  systemEthDate.year - 1,
                  systemEthDate.year,
                  systemEthDate.year + 1
                ].map(yr => (
                  <option key={yr} value={yr}>
                    {yr} ዓ.ም {yr === systemEthDate.year ? '(የአሁኑ ዘመን / Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Dual Calendar Badge mirroring student attendance style */}
            <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
              <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <span>🇪🇹 EC:</span>
                <span className="font-extrabold">{ETHIOPIAN_MONTHS[selectedEthMonthIndex - 1]?.nameAmh.split(' ')[0]} {selectedEthYear} ዓ.ም</span>
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <span>📅 GC:</span>
                <span className="font-extrabold">{ETHIOPIAN_MONTHS[selectedEthMonthIndex - 1]?.nameEng} (Day 1 - 30)</span>
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <span>📌 {tx("የዛሬ ቀን (Today)፡")}</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{systemEthDate.ecFormatted}</span>
              </span>
            </div>
          </div>

          {/* Quick Legend of Statuses */}
          <div className="flex items-center gap-2 text-[11px] font-bold flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200/60">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <strong>P</strong>: {tx('ተገኝቷል (Present)')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200/60">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <strong>L</strong>: {tx('አርፍዷል (Late)')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200/60">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <strong>ፍቃድ</strong>: {tx('ፈቃድ (Leave/Permission)')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-lg border border-rose-200/60">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <strong>A</strong>: {tx('ቀሪ (Absent)')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 rounded-lg border border-purple-200/60">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <strong>H</strong>: {tx('ግማሽ ቀን (Half Day)')}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'All', label: tx('ሁሉም ሰራተኞች (All)') },
              { id: 'Principal', label: tx('ር/መ (Principal)') },
              { id: 'Vice Principal', label: tx('ም/ር/መ (Vice Principal)') },
              { id: 'Secretary', label: tx('ፃፉ (Secretary)') },
              { id: 'Finance', label: tx('ፋይናንስ (Finance)') },
              { id: 'Cleaner', label: tx('ፅዳት (Cleaners)') },
              { id: 'Security Guard', label: tx('ጥበቃ (Security)') },
              { id: 'Head Teacher', label: tx('ዋና መምህራን (Head)') },
              { id: 'Assistant Teacher', label: tx('ረዳት (Assistants)') }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playInteractiveSound('click');
                  setCategoryFilter(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tx('ሰራተኛ ፈልግ... (Search staff)')}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:border-indigo-600 outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards: Attendance Totals (P, L, ፍቃድ, ቀሪ) vs Finance Totals */}
      {activeModule === 'attendance' ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">{tx('ጠቅላላ ሰራተኞች')}</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center justify-between">
              <span>{filteredStaff.length}</span>
              <Users className="w-5 h-5 text-indigo-500 opacity-60" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-2xs">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">{tx('ድምር P (ተገኝቷል)')}</span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
              {overallTotals.totalPresent}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-2xs">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">{tx('ድምር L (አርፍዷል)')}</span>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 font-mono">
              {overallTotals.totalLate}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/20 dark:bg-blue-950/10 shadow-2xs">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 block">{tx('ድምር ፍቃድ (ፈቃድ)')}</span>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1 font-mono">
              {overallTotals.totalLeave}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/20 dark:bg-rose-950/10 shadow-2xs">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block">{tx('ድምር ቀሪ (A)')}</span>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1 font-mono">
              {overallTotals.totalAbsences}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">{tx('ጠቅላላ ሰራተኞች (Staff)')}</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center justify-between">
              <span>{filteredStaff.length}</span>
              <Users className="w-5 h-5 text-indigo-500 opacity-60" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">{tx('ጠቅላላ መነሻ ደመወዝ (Gross Salary)')}</span>
            <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {overallTotals.totalBase.toLocaleString()} <span className="text-xs font-bold text-slate-400">ETB</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/20 dark:bg-rose-950/10 shadow-2xs">
            <span className="text-xs font-bold text-rose-500 block">{tx('የቀሪ ቅጣት ቅነሳ (Deductions)')}</span>
            <div className="text-xl md:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
              -{overallTotals.totalDeductions.toLocaleString()} <span className="text-xs font-bold text-rose-400">ETB</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-2xs">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">{tx('የተጣራ የሚከፈል ደመወዝ (Net Payable)')}</span>
            <div className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-1 font-mono">
              {overallTotals.totalNet.toLocaleString()} <span className="text-xs font-bold text-emerald-500">ETB</span>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Module View Switcher: 30-Day Grid vs Mobile Daily View */}
      {activeModule === 'attendance' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                playInteractiveSound('click');
                setViewMode('30days');
              }}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === '30days'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>{tx('የ30 ቀናት ሰንጠረዥ (30-Day Grid)')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playInteractiveSound('click');
                setViewMode('todayLive');
              }}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'todayLive'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{tx('የቀን ፈጣን መመዝገቢያ (Mobile Day View)')}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping hidden sm:inline-block" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">💡 {tx('በስልክ ላይ የቀን ፈጣን መመዝገቢያ ያለ ምንም ማንሸራተት ይመቻል')}</span>
          </div>
        </div>
      )}

      {/* Today's / Any Day's Live Clock-In Kiosk (Quick attendance with automatic timestamps) */}
      {viewMode === 'todayLive' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          {/* Header of Mobile Day Kiosk */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {tx('የቀን ፈጣን መመዝገቢያና ሰዓት መቆጣጠሪያ')}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs rounded-full border border-emerald-300/50 font-mono">
                    {tx('ቀን')} {selectedMobileDay}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  📅 {systemEthDate.ecFormatted} • 🇪🇹 {tx('የአሁኑ ሰዓት')}: <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{liveEthTime}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleMarkAllPresentLive(selectedMobileDay)}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer transform active:scale-95"
                title={`Mark all staff present for day ${selectedMobileDay}`}
              >
                <Zap className="w-4 h-4" />
                <span>{tx('ሁሉንም ለቀን')} {selectedMobileDay} {tx('ቲክ አድርግ (Mark All Present)')}</span>
              </button>
            </div>
          </div>

          {/* Horizontal Day Selector Carousel for 30 Days (Direct 1-touch mobile navigation) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>{tx('ቀን ይምረጡ (Select Day 1 - 30):')}</span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                {selectedMobileDay === systemEthDate.day ? '🎯 ' + tx('የዛሬ ቀን ተመርጧል') : `${tx('ቀን')} ${selectedMobileDay} ${tx('ተመርጧል')}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 scrollbar-thin">
              {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
                const isToday = selectedEthYear === systemEthDate.year && selectedEthMonthIndex === systemEthDate.month && d === systemEthDate.day;
                const isSelected = d === selectedMobileDay;
                const dayOfWeek = getEthiopianDayOfWeek(selectedEthYear, selectedEthMonthIndex, d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      playInteractiveSound('click');
                      setSelectedMobileDay(d);
                    }}
                    className={`shrink-0 flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer min-w-[52px] ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-400'
                        : isToday
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-black text-xs leading-none">{d}</span>
                    <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {isToday ? 'ዛሬ' : AMHARIC_DAYS_ABBR[dayOfWeek]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Staff Cards for Selected Mobile Day */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStaff.map((staff) => {
              const day = selectedMobileDay;
              const status = attendanceMap[staff.id]?.[day] || 'P';
              const arrivalTime = attendanceTimeMap[staff.id]?.[day] || (status === 'P' ? '1:30' : undefined);
              const isLate = isArrivalLate(arrivalTime);

              return (
                <div
                  key={staff.id}
                  className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shrink-0 flex items-center justify-center font-black text-xs text-indigo-600 dark:text-indigo-400">
                        {staff.photo ? (
                          <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          staff.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {staff.name}
                        </h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{staff.id}</span>
                          <span>•</span>
                          <span className="truncate">{staff.roleTitle}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 text-right">
                      {status === 'P' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-black border border-emerald-300/60">
                          <Check className="w-3.5 h-3.5" />
                          <span>{tx('ተገኝቷል')}</span>
                        </span>
                      )}
                      {status === 'A' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-black border border-rose-300/60">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{tx('ቀሪ')}</span>
                        </span>
                      )}
                      {status === 'L' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-black border border-amber-300/60">
                          <span>{tx('አርፍዷል')}</span>
                        </span>
                      )}
                      {status === 'F' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-black border border-blue-300/60">
                          <span>{tx('ፍቃድ')}</span>
                        </span>
                      )}
                      {status === 'H' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 rounded-xl text-xs font-black border border-purple-300/60">
                          <span>{tx('ግማሽ ቀን')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrival Time Information */}
                  {(status === 'P' || status === 'H') && (
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">{tx('የመግቢያ ሰዓት')}:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">{arrivalTime || liveEthTime}</span>
                      </div>
                      <div>
                        {isLate ? (
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] rounded-lg border border-amber-200">
                            ⚠️ {tx('አርፍዷል')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] rounded-lg border border-emerald-200">
                            ✨ {tx('በሰዓቱ')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Action Buttons: P, L, ፍቃድ, A, and Principal Time Edit */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleQuickClockInToday(staff.id, undefined, selectedMobileDay)}
                      className={`p-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        status === 'P'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                      title={tx('በሰዓቱ መግቢያ (P)')}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{tx('P')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetTodayStatus(staff.id, 'L', selectedMobileDay)}
                      className={`p-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        status === 'L'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-800'
                      }`}
                      title={tx('ያረፈደ መግቢያ (L)')}
                    >
                      <span>{tx('L')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetTodayStatus(staff.id, 'F', selectedMobileDay)}
                      className={`p-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        status === 'F'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-800'
                      }`}
                      title={tx('የፍቃድ ሁኔታ (F)')}
                    >
                      <span>{tx('ፍቃድ')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetTodayStatus(staff.id, 'A', selectedMobileDay)}
                      className={`p-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        status === 'A'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700'
                      }`}
                      title={tx('ቀሪ (A)')}
                    >
                      <span>{tx('A')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditTimeModal(staff.id, staff.name, day, status, arrivalTime)}
                      className="p-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 flex items-center justify-center gap-1 cursor-pointer"
                      title={tx('የርዕሰ መምህር የሰዓት ማስተካከያ (Principal Time Adjustment)')}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{tx('ሰዓት')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main 30-Day Attendance Table (Principal View - No Salary Columns) */}
      {activeModule === 'attendance' ? (
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden ${viewMode === 'todayLive' ? 'mt-6' : ''}`}>
        {/* Printable Letterhead */}
        <div className="hidden print:block p-6 text-center border-b border-slate-900 space-y-1">
          <h1 className="text-xl font-black uppercase tracking-wider">{schoolConfig?.nameAmh || 'ደሊጀንት አካዳሚ'}</h1>
          <h2 className="text-sm font-bold text-slate-700">{schoolConfig?.nameEng || 'Diligent Academy'} - Staff 30-Day Payroll Attendance Sheet</h2>
          <div className="text-xs font-bold text-slate-600 mt-1 flex justify-center gap-6">
            <span>📅 {ETHIOPIAN_MONTHS[selectedEthMonthIndex - 1]?.nameAmh} {selectedEthYear} ዓ.ም</span>
            <span>📅 GC: {ETHIOPIAN_MONTHS[selectedEthMonthIndex - 1]?.nameEng} (30 Working Days)</span>
          </div>
        </div>

        {/* 4-Way Multi-Directional Navigation & Pan Control Bar with Sticky Header Description */}
        <div className="sticky top-0 z-30 px-3 sm:px-4 py-2.5 bg-slate-50/98 dark:bg-slate-800/98 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-xs space-y-2 text-xs print:hidden">
          {/* Persistent Header Description / Context Bar so headers are always visible when scrolling down */}
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 pb-1.5 border-b border-slate-200/70 dark:border-slate-700/70 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1 text-xs">
                📅 {ETHIOPIAN_MONTHS[selectedEthMonthIndex - 1]?.nameAmh.split(' ')[0]} {selectedEthYear} ዓ.ም ({tx('30 ቀናት')})
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                {ETHIOPIAN_MONTHS[selectedEthMonthIndex - 1]?.nameEng} (Day 1 - 30)
              </span>
            </div>
            {/* Quick Status Legend */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300/40">P: ተገኝቷል</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold border border-amber-300/40">L: አርፍዷል</span>
              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold border border-rose-300/40">A: ቀርቷል</span>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold border border-blue-300/40">F: ፍቃድ</span>
            </div>
          </div>

          {/* Top row: directions, pin toggle, full screen */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 text-xs">
                <Move className="w-3.5 h-3.5 text-indigo-600" />
                <span>{tx('ባለ 4-አቅጣጫ ማንሸራተቻ')}</span>
              </div>

              {/* Pin / Free Scroll Toggle (crucial for mobile so staff column doesn't cover days) */}
              <button
                type="button"
                onClick={() => {
                  playInteractiveSound('click');
                  setFreezeStaffCol(!freezeStaffCol);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                  freezeStaffCol
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={freezeStaffCol ? tx('ስም ቋሚ ነው (ጠቅ ሲያደርጉት በነጻነት ይንሸራተታል)') : tx('ሙሉ ማንሸራተቻ (ስም ሳይሸፍን በነጻነት ይንሸራተታል)')}
              >
                <span>{freezeStaffCol ? '📌 ' + tx('ስም ቋሚ') : '🔓 ' + tx('ሙሉ ማንሸራተቻ (አይሸፍንም)')}</span>
              </button>
            </div>

            {/* Directional Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScrollTable('left')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-90 flex items-center gap-1 font-black text-xs"
                title={tx('ወደ ግራ አንሸራትት (Scroll Left)')}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden xs:inline">{tx('ግራ')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleScrollTable('right')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-90 flex items-center gap-1 font-black text-xs"
                title={tx('ወደ ቀኝ አንሸራትት (Scroll Right)')}
              >
                <span className="hidden xs:inline">{tx('ቀኝ')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
              <button
                type="button"
                onClick={() => handleScrollTable('up')}
                className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-90"
                title={tx('ወደ ላይ አንሸራትት')}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScrollTable('down')}
                className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-90"
                title={tx('ወደ ታች አንሸራትት')}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsTableMaximized(!isTableMaximized)}
                className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-90 ml-1"
                title={isTableMaximized ? tx('የተገደበ ቁመት') : tx('ሙሉ ቁመት')}
              >
                {isTableMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick Jump Navigation Bar (Direct 1-tap jump to any week or section) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">🚀 {tx('ፈጣን ዝላይ')}:</span>
            <button
              type="button"
              onClick={() => handleScrollTable('start')}
              className="shrink-0 px-2 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] rounded-lg cursor-pointer transition-all active:scale-95"
              title={tx('ወደ መጀመሪያ ተመለስ (ስም)')}
            >
              ⏮️ {tx('ስም')}
            </button>
            <button
              type="button"
              onClick={() => handleScrollTable('week1')}
              className="shrink-0 px-2 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] rounded-lg cursor-pointer transition-all active:scale-95"
            >
              📅 {tx('ሳምንት 1 (1-7)')}
            </button>
            <button
              type="button"
              onClick={() => handleScrollTable('week2')}
              className="shrink-0 px-2 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] rounded-lg cursor-pointer transition-all active:scale-95"
            >
              📅 {tx('ሳምንት 2 (8-14)')}
            </button>
            <button
              type="button"
              onClick={() => handleScrollTable('week3')}
              className="shrink-0 px-2 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] rounded-lg cursor-pointer transition-all active:scale-95"
            >
              📅 {tx('ሳምንት 3 (15-21)')}
            </button>
            <button
              type="button"
              onClick={() => handleScrollTable('week4')}
              className="shrink-0 px-2 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] rounded-lg cursor-pointer transition-all active:scale-95"
            >
              📅 {tx('ሳምንት 4 (22-30)')}
            </button>
            <button
              type="button"
              onClick={() => handleScrollTable('today')}
              className="shrink-0 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] rounded-lg shadow-2xs cursor-pointer transition-all active:scale-95"
              title={tx('ወደ ዛሬ ቀን አምጣ')}
            >
              🎯 {tx('ዛሬ (ቀን')} {systemEthDate.day})
            </button>
            <button
              type="button"
              onClick={() => handleScrollTable('totals')}
              className="shrink-0 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-black text-[11px] rounded-lg cursor-pointer transition-all active:scale-95"
            >
              📊 {tx('ድምር')}
            </button>
          </div>
        </div>

        {/* 4-Way Scrollable Table Viewport with Native Touch Pan */}
        <div 
          ref={attendanceTableContainerRef}
          className={`overflow-x-auto overflow-y-auto w-full overscroll-contain transition-all duration-200 ${
            isTableMaximized ? 'max-h-[85vh]' : 'max-h-[640px]'
          }`}
          style={{
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pan-y'
          }}
        >
          <table className="min-w-[1720px] w-max text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className={`p-3 font-extrabold w-[165px] min-w-[165px] max-w-[185px] sm:w-[220px] sm:min-w-[220px] border-r border-b border-slate-200 dark:border-slate-700 ${
                  freezeStaffCol
                    ? 'sticky top-0 left-0 z-30 bg-slate-100 dark:bg-slate-800 shadow-xs'
                    : 'sticky top-0 z-20 bg-slate-100 dark:bg-slate-800'
                }`}>
                  {tx('የሰራተኛው ሙሉ ስም እና የስራ ድርሻ (Staff Member)')}
                </th>

                {/* 30 Days Columns with Sticky Top */}
                {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
                  const dayOfWeek = getEthiopianDayOfWeek(selectedEthYear, selectedEthMonthIndex, day);
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const isToday = selectedEthYear === systemEthDate.year && selectedEthMonthIndex === systemEthDate.month && day === systemEthDate.day;
                  return (
                    <th
                      key={day}
                      className={`p-1.5 text-center font-black border-r border-b border-slate-200 dark:border-slate-700 w-[44px] min-w-[44px] max-w-[44px] sticky top-0 z-20 transition-colors ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-600'
                          : isWeekend 
                          ? 'bg-amber-100/90 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                      title={isToday ? `Today (ዛሬ) - Day ${day}` : `Day ${day}`}
                    >
                      <div className={`text-[11px] font-mono leading-none ${isToday ? 'font-black text-white' : ''}`}>{day}</div>
                      <div className={`text-[9px] font-normal mt-0.5 ${isToday ? 'text-indigo-100 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                        {AMHARIC_DAYS_ABBR[dayOfWeek]}
                      </div>
                    </th>
                  );
                })}

                {/* Attendance Totals Columns: P, L, ፍቃድ, and ቀሪ with Sticky Top */}
                <th className="p-2 font-black text-center sticky top-0 z-20 bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 w-[58px] min-w-[58px] max-w-[58px] border-r border-b border-slate-200 dark:border-slate-700" title={tx('ድምር P (የተገኙበት ቀን ብዛት)')}>
                  {tx('ድምር P')}
                </th>
                <th className="p-2 font-black text-center sticky top-0 z-20 bg-amber-100/90 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 w-[58px] min-w-[58px] max-w-[58px] border-r border-b border-slate-200 dark:border-slate-700" title={tx('ድምር L (ያረፈዱበት ቀን ብዛት)')}>
                  {tx('ድምር L')}
                </th>
                <th className="p-2 font-black text-center sticky top-0 z-20 bg-blue-100/90 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 w-[58px] min-w-[58px] max-w-[58px] border-r border-b border-slate-200 dark:border-slate-700" title={tx('ድምር ፍቃድ (በፍቃድ የቀሩበት ቀን ብዛት)')}>
                  {tx('ድምር ፍቃድ')}
                </th>
                <th className="p-2 font-black text-center sticky top-0 z-20 bg-rose-100/90 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 w-[58px] min-w-[58px] max-w-[58px] border-b border-slate-200 dark:border-slate-700" title={tx('ድምር ቀሪ (ያለፍቃድ የቀሩበት ቀን ብዛት)')}>
                  {tx('ድምር ቀሪ')}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.map((staff) => {
                const payroll = computeStaffPayroll(staff);
                const daysObj = attendanceMap[staff.id] || {};

                return (
                  <tr 
                    key={staff.id} 
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Staff identity column (Responds to freezeStaffCol toggle) */}
                    <td className={`p-2.5 w-[165px] min-w-[165px] max-w-[185px] sm:w-[220px] sm:min-w-[220px] border-r border-slate-200 dark:border-slate-800 ${
                      freezeStaffCol
                        ? 'sticky left-0 z-10 bg-white dark:bg-slate-900 shadow-xs'
                        : 'bg-white dark:bg-slate-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        {/* Profile Avatar / Photo */}
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center font-black text-[10px] text-indigo-600 dark:text-indigo-400">
                          {staff.photo ? (
                            <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                          ) : (
                            staff.name.charAt(0)
                          )}
                        </div>

                        <div className="min-w-0 truncate">
                          <div className="font-extrabold text-slate-900 dark:text-white truncate text-xs">
                            {staff.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold shrink-0">{staff.id}</span>
                            <span>•</span>
                            <span className="truncate">{staff.roleTitle}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 30 Day Cells */}
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
                      const status = daysObj[day] || 'P';
                      const arrivalTime = attendanceTimeMap[staff.id]?.[day] || (status === 'P' ? '1:30' : undefined);
                      const isLate = isArrivalLate(arrivalTime);
                      const dayOfWeek = getEthiopianDayOfWeek(selectedEthYear, selectedEthMonthIndex, day);
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      const isToday = selectedEthYear === systemEthDate.year && selectedEthMonthIndex === systemEthDate.month && day === systemEthDate.day;
                      const isQuickSelected = quickSelectCell?.staffId === staff.id && quickSelectCell?.day === day;

                      let cellColor = 'bg-emerald-500 text-white font-black';
                      let displayLabel = 'P';

                      if (status === 'A') {
                        cellColor = 'bg-rose-500 text-white font-black';
                        displayLabel = 'A';
                      } else if (status === 'L') {
                        cellColor = 'bg-amber-400 text-slate-950 font-black';
                        displayLabel = 'L';
                      } else if (status === 'F') {
                        cellColor = 'bg-blue-600 text-white font-black';
                        displayLabel = 'ፍቃድ';
                      } else if (status === 'H') {
                        cellColor = 'bg-purple-500 text-white font-black';
                        displayLabel = 'H';
                      }

                      return (
                        <td
                          key={day}
                          onClick={() => handleCellClick(staff.id, day)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setQuickSelectCell(isQuickSelected ? null : { staffId: staff.id, day });
                          }}
                          className={`relative p-1 text-center border-r border-slate-100 dark:border-slate-800/60 cursor-pointer select-none transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/60 w-[44px] min-w-[44px] max-w-[44px] ${
                            isToday 
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/30 ring-1 ring-inset ring-indigo-300 dark:ring-indigo-800' 
                              : isWeekend 
                              ? 'bg-amber-50/30 dark:bg-amber-950/10' 
                              : ''
                          }`}
                          title={tx('ጠቅ ያድርጉ: P -> L -> ፍቃድ -> A ለመቀየር። Right click: ፈጣን ምርጫ።')}
                        >
                          <div className="flex flex-col items-center justify-center py-0.5">
                            <span className={`inline-flex items-center justify-center min-w-[24px] px-1 h-5 rounded-md text-[9.5px] font-black shadow-2xs transition-all ${cellColor}`}>
                              {displayLabel}
                            </span>
                            {(status === 'P' || status === 'L' || status === 'H') && arrivalTime && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditTimeModal(staff.id, staff.name, day, status, arrivalTime);
                                }}
                                className={`text-[8px] font-mono font-black leading-tight mt-0.5 px-1 py-0.2 rounded border whitespace-nowrap shadow-2xs hover:scale-105 transition-all cursor-pointer ${
                                  isLate
                                    ? 'bg-amber-50 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/80'
                                    : 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/80'
                                }`}
                                title={tx('የርዕሰ መምህር የሰዓት ማስተካከያ (Click to adjust time)')}
                              >
                                {arrivalTime}
                              </span>
                            )}
                          </div>

                          {/* Quick In-Place 1-Click Status Popup */}
                          {isQuickSelected && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-40 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xl rounded-xl p-1.5 flex items-center gap-1 animate-in fade-in zoom-in-95"
                            >
                              <button
                                type="button"
                                onClick={() => handleSetDirectStatus(staff.id, day, 'P')}
                                className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded cursor-pointer"
                                title={tx('ተገኝቷል')}
                              >
                                P
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetDirectStatus(staff.id, day, 'L')}
                                className="px-1.5 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-bold rounded cursor-pointer"
                                title={tx('አርፍዷል')}
                              >
                                L
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetDirectStatus(staff.id, day, 'F')}
                                className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded cursor-pointer whitespace-nowrap"
                                title={tx('ፍቃድ')}
                              >
                                ፍቃድ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetDirectStatus(staff.id, day, 'A')}
                                className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded cursor-pointer"
                                title={tx('ቀሪ')}
                              >
                                A
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditTimeModal(staff.id, staff.name, day, status, arrivalTime)}
                                className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded cursor-pointer"
                                title={tx('ሰዓት አብጅ')}
                              >
                                ⏱️
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* ድምር P (Present Days) */}
                    <td className="p-2 text-center font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 border-r border-slate-100 dark:border-slate-800 w-[58px] min-w-[58px] max-w-[58px]">
                      {payroll.presentDays}
                    </td>

                    {/* ድምር L (Late Days) */}
                    <td className="p-2 text-center font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20 border-r border-slate-100 dark:border-slate-800 w-[58px] min-w-[58px] max-w-[58px]">
                      {payroll.lateDays}
                    </td>

                    {/* ድምር ፍቃድ (Leave Days) */}
                    <td className="p-2 text-center font-mono font-black text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20 border-r border-slate-100 dark:border-slate-800 w-[58px] min-w-[58px] max-w-[58px]">
                      {payroll.leaveDays}
                    </td>

                    {/* ድምር ቀሪ (Absent Days) */}
                    <td className="p-2 text-center font-mono font-black text-rose-700 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20 w-[58px] min-w-[58px] max-w-[58px]">
                      {payroll.absentDays}
                    </td>
                  </tr>
                );
              })}

              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={35} className="p-8 text-center text-slate-400 text-xs">
                    {tx('ምንም ሰራተኛ አልተገኘም (No staff found)')}
                  </td>
                </tr>
              )}
            </tbody>

            {/* Total Row with Sticky Bottom Pinning */}
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800 font-black border-t-2 border-slate-300 dark:border-slate-700">
                <td className={`p-3 w-[165px] min-w-[165px] max-w-[185px] sm:w-[220px] sm:min-w-[220px] border-r border-t-2 border-slate-300 dark:border-slate-700 ${
                  freezeStaffCol
                    ? 'sticky bottom-0 left-0 z-30 bg-slate-100 dark:bg-slate-800 shadow-xs'
                    : 'sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800'
                }`}>
                  {tx('ድምር (Grand Totals):')} {filteredStaff.length} {tx('ሰራተኞች')}
                </td>
                <td colSpan={30} className="p-2 text-center text-slate-500 text-[11px] border-r border-t-2 border-slate-300 dark:border-slate-700 sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800">
                  {tx('የ30 ቀናት አቴንዳንስ መዝገብ')}
                </td>
                {/* Grand totals for P, L, ፍቃድ, ቀሪ with sticky bottom */}
                <td className="p-2 text-center font-mono text-emerald-700 dark:text-emerald-400 border-r border-t-2 border-slate-300 dark:border-slate-700 sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 font-black w-[58px] min-w-[58px] max-w-[58px]">
                  {overallTotals.totalPresent}
                </td>
                <td className="p-2 text-center font-mono text-amber-700 dark:text-amber-400 border-r border-t-2 border-slate-300 dark:border-slate-700 sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 font-black w-[58px] min-w-[58px] max-w-[58px]">
                  {overallTotals.totalLate}
                </td>
                <td className="p-2 text-center font-mono text-blue-700 dark:text-blue-400 border-r border-t-2 border-slate-300 dark:border-slate-700 sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 font-black w-[58px] min-w-[58px] max-w-[58px]">
                  {overallTotals.totalLeave}
                </td>
                <td className="p-2 text-center font-mono text-rose-700 dark:text-rose-400 border-t-2 border-slate-300 dark:border-slate-700 sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 font-black w-[58px] min-w-[58px] max-w-[58px]">
                  {overallTotals.totalAbsences}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Official Printable Signatures Block */}
        <div className="hidden print:grid grid-cols-3 gap-8 p-8 mt-6 border-t-2 border-slate-900 text-center text-xs">
          <div className="space-y-4">
            <p className="font-extrabold text-slate-900">{tx('ያዘጋጀው (Prepared By - HR)')}</p>
            <div className="border-b border-slate-400 w-3/4 mx-auto pt-6" />
            <p className="text-[10px] text-slate-500">ፊርማና ቀን (Signature & Date)</p>
          </div>
          <div className="space-y-4">
            <p className="font-extrabold text-slate-900">{tx('ያረጋገጠው (Audited By - Finance)')}</p>
            <div className="border-b border-slate-400 w-3/4 mx-auto pt-6" />
            <p className="text-[10px] text-slate-500">ፊርማና ቀን (Signature & Date)</p>
          </div>
          <div className="space-y-4">
            <p className="font-extrabold text-slate-900">{tx('ያጸደቀው (Approved By - Principal)')}</p>
            <div className="border-b border-slate-400 w-3/4 mx-auto pt-6" />
            <p className="text-[10px] text-slate-500">ማህተምና ፊርማ (Seal & Signature)</p>
          </div>
        </div>
      </div>
      ) : (
        /* Dedicated Salary & Finance Table with Attendance Totals (P, L, A, F) */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          {/* Header of Salary / Finance Module */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <BadgeDollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {tx('የሰራተኞች ደመወዝ ክፍያና አቴንዳንስ ማጠቃለያ')}
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs rounded-full border border-emerald-300/50">
                  {filteredStaff.length} {tx('ሰራተኞች')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {tx('የሰራተኛው የቀረበት ቀን (A)፣ ያረፈደበት ቀን (L) እና የመጣበት ቀን (P) ድምር ከደመወዝ ክፍያ ጋር ተሰልቶ የቀረበ ሪፖርት')}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadPayrollReportPDF}
                className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                title={tx('የደመወዝ እና የአቴንዳንስ ድምር ሪፖርት አትም / በPDF')}
              >
                <Printer className="w-4 h-4" />
                <span>{tx('የደመወዝ ሪፖርት አትም (Print Report)')}</span>
              </button>

              <button
                type="button"
                onClick={handleExportPayrollCSV}
                className="py-2.5 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl shadow-2xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                title={tx('የደመወዝና አቴንዳንስ ሰንጠረዥ በ Excel/CSV ያውርዱ')}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>{tx('Excel / CSV')}</span>
              </button>
            </div>
          </div>

          {/* 4-Way Multi-Directional Navigation Bar for Finance */}
          <div className="px-3 sm:px-4 py-2 bg-slate-50/95 dark:bg-slate-800/80 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs print:hidden">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 text-xs">
                <Move className="w-3.5 h-3.5 text-emerald-600" />
                <span>{tx('ባለ 4-አቅጣጫ ማንሸራተቻ')}</span>
              </div>

              {/* Pin / Free Scroll Toggle */}
              <button
                type="button"
                onClick={() => {
                  playInteractiveSound('click');
                  setFreezeStaffCol(!freezeStaffCol);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                  freezeStaffCol
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={freezeStaffCol ? tx('ስም ቋሚ ነው') : tx('ሙሉ ማንሸራተቻ (አይሸፍንም)')}
              >
                <span>{freezeStaffCol ? '📌 ' + tx('ስም ቋሚ') : '🔓 ' + tx('ሙሉ ማንሸራተቻ (አይሸፍንም)')}</span>
              </button>
            </div>

            {/* Directional Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScrollTable('left')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-90 flex items-center gap-1 font-black text-xs"
                title={tx('ወደ ግራ አንሸራትት')}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden xs:inline">{tx('ግራ')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleScrollTable('right')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-90 flex items-center gap-1 font-black text-xs"
                title={tx('ወደ ቀኝ አንሸራትት')}
              >
                <span className="hidden xs:inline">{tx('ቀኝ')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
              <button
                type="button"
                onClick={() => handleScrollTable('up')}
                className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-90"
                title={tx('ወደ ላይ አንሸራትት')}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScrollTable('down')}
                className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-90"
                title={tx('ወደ ታች አንሸራትት')}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScrollTable('start')}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-[11px] rounded-lg cursor-pointer transition-all active:scale-95 ml-1"
                title={tx('ወደ መጀመሪያ ተመለስ')}
              >
                ⏮️ {tx('መጀመሪያ')}
              </button>
              <button
                type="button"
                onClick={() => setIsTableMaximized(!isTableMaximized)}
                className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-90"
                title={isTableMaximized ? tx('የተገደበ ቁመት') : tx('ሙሉ ቁመት')}
              >
                {isTableMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Main Salary & Attendance Summary Table (4-Way Viewport) */}
          <div 
            ref={financeTableContainerRef}
            className={`overflow-x-auto overflow-y-auto w-full overscroll-contain transition-all duration-200 ${
              isTableMaximized ? 'max-h-[85vh]' : 'max-h-[640px]'
            }`}
            style={{
              scrollbarWidth: 'thin',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y'
            }}
          >
            <table className="min-w-[1240px] w-max text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-black">
                  <th className={`p-3 text-center w-12 border-r border-b border-slate-200 dark:border-slate-700 ${
                    freezeStaffCol ? 'sticky top-0 left-0 z-30 bg-slate-100 dark:bg-slate-800 shadow-2xs' : 'sticky top-0 z-20 bg-slate-100 dark:bg-slate-800'
                  }`}>ተ.ቁ</th>
                  <th className={`p-3 min-w-[200px] border-r border-b border-slate-200 dark:border-slate-700 ${
                    freezeStaffCol ? 'sticky top-0 left-12 z-30 bg-slate-100 dark:bg-slate-800 shadow-2xs' : 'sticky top-0 z-20 bg-slate-100 dark:bg-slate-800'
                  }`}>{tx('የሰራተኛው ሙሉ ስም እና የስራ ድርሻ')}</th>
                  
                  {/* Attendance Totals in Salary Table */}
                  <th className="p-2 text-center bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 min-w-[70px] border-r border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20" title={tx('የመጣበት ቀን ድምር (P)')}>
                    {tx('የመጣ (P)')}
                  </th>
                  <th className="p-2 text-center bg-amber-100/90 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 min-w-[70px] border-r border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20" title={tx('ያረፈደበት ቀን ድምር (L)')}>
                    {tx('ያረፈደ (L)')}
                  </th>
                  <th className="p-2 text-center bg-rose-100/90 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 min-w-[70px] border-r border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20" title={tx('የቀረበት ቀን ድምር (A)')}>
                    {tx('የቀረ (A)')}
                  </th>
                  <th className="p-2 text-center bg-blue-100/90 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 min-w-[65px] border-r border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20" title={tx('የፍቃድ ቀን ድምር (F)')}>
                    {tx('ፍቃድ (F)')}
                  </th>

                  {/* Financial Columns */}
                  <th className="p-3 text-right min-w-[110px] border-r border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 bg-slate-100 dark:bg-slate-800">
                    {tx('መነሻ ደመወዝ')}
                  </th>
                  <th className="p-2 text-right min-w-[85px] border-r border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 bg-slate-100 dark:bg-slate-800">
                    {tx('የቀን ተመን')}
                  </th>
                  <th className="p-3 text-right bg-rose-100/80 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 min-w-[100px] border-r border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
                    {tx('የቀሪ ቅጣት')}
                  </th>
                  <th className="p-3 text-right bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 min-w-[120px] border-r border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
                    {tx('የተጣራ ደመወዝ')}
                  </th>
                  <th className="p-2 text-center min-w-[95px] border-r border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 bg-slate-100 dark:bg-slate-800">
                    {tx('የፋይናንስ ሁኔታ')}
                  </th>
                  <th className="p-2 text-center min-w-[90px] sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">{tx('ደረሰኝ')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStaff.map((staff, sIdx) => {
                  const payroll = computeStaffPayroll(staff);
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className={`p-3 text-center font-bold text-slate-500 border-r border-slate-100 dark:border-slate-800 ${
                        freezeStaffCol ? 'sticky left-0 z-10 bg-white dark:bg-slate-900' : 'bg-white dark:bg-slate-900'
                      }`}>
                        {sIdx + 1}
                      </td>
                      <td className={`p-3 border-r border-slate-100 dark:border-slate-800 ${
                        freezeStaffCol ? 'sticky left-12 z-10 bg-white dark:bg-slate-900 shadow-2xs' : 'bg-white dark:bg-slate-900'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center font-black text-[10px] text-indigo-600 dark:text-indigo-400">
                            {staff.photo ? <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" /> : staff.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white">{staff.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{staff.id}</span>
                              <span>•</span>
                              <span>{staff.roleTitle || staff.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Attendance Totals: P, L, A, F */}
                      <td className="p-2 text-center font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 border-r border-slate-100 dark:border-slate-800">
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-md font-mono text-xs font-bold">
                          {payroll.presentDays}
                        </span>
                      </td>
                      <td className="p-2 text-center font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20 border-r border-slate-100 dark:border-slate-800">
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded-md font-mono text-xs font-bold">
                          {payroll.lateDays}
                        </span>
                      </td>
                      <td className="p-2 text-center font-mono font-black text-rose-700 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20 border-r border-slate-100 dark:border-slate-800">
                        <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/60 rounded-md font-mono text-xs font-bold">
                          {payroll.absentDays}
                        </span>
                      </td>
                      <td className="p-2 text-center font-mono font-black text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20 border-r border-slate-100 dark:border-slate-800">
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 rounded-md font-mono text-xs font-bold">
                          {payroll.leaveDays}
                        </span>
                      </td>

                      {/* Base Salary with edit */}
                      <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{payroll.baseSalary.toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditSalary(staff)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title={tx('መነሻ ደመወዝ አስተካክል')}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Daily Rate */}
                      <td className="p-2 text-right font-mono text-slate-500 text-[11px] border-r border-slate-100 dark:border-slate-800">
                        {payroll.dailyRate.toLocaleString()}
                      </td>

                      {/* Deductions */}
                      <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10 border-r border-slate-100 dark:border-slate-800">
                        {payroll.absenceDeductions > 0 ? `-${payroll.absenceDeductions.toLocaleString()}` : '0'}
                      </td>

                      {/* Net Payable */}
                      <td className="p-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 text-sm border-r border-slate-100 dark:border-slate-800">
                        {payroll.netPayable.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">ETB</span>
                      </td>

                      {/* Finance Status */}
                      <td className="p-2 text-center border-r border-slate-100 dark:border-slate-800">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          isFinanceApproved
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        }`}>
                          {isFinanceApproved ? 'ተረጋግጧል' : 'በሂደት ላይ'}
                        </span>
                      </td>

                      {/* Payslip */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedPayslipStaff(staff)}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          title={tx('የክፍያ ደረሰኝ እይ')}
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>{tx('ደረሰኝ')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Grand Totals (Sticky Bottom Pinning) */}
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 font-black border-t-2 border-slate-300 dark:border-slate-700">
                  <td colSpan={2} className={`p-3 text-right pr-4 font-black border-t-2 border-r border-slate-300 dark:border-slate-700 ${
                    freezeStaffCol ? 'sticky bottom-0 left-0 z-30 bg-slate-100 dark:bg-slate-800 shadow-2xs' : 'sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {tx('ጠቅላላ ድምር (Grand Totals):')} {filteredStaff.length} {tx('ሰራተኞች')}
                  </td>
                  <td className="p-2 text-center font-mono text-emerald-700 dark:text-emerald-400 font-black text-sm sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">
                    {overallTotals.totalPresent}
                  </td>
                  <td className="p-2 text-center font-mono text-amber-700 dark:text-amber-400 font-black text-sm sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">
                    {overallTotals.totalLate}
                  </td>
                  <td className="p-2 text-center font-mono text-rose-700 dark:text-rose-400 font-black text-sm sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">
                    {overallTotals.totalAbsences}
                  </td>
                  <td className="p-2 text-center font-mono text-blue-700 dark:text-blue-400 font-black text-sm sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">
                    {overallTotals.totalLeave}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-200 font-black sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">
                    {overallTotals.totalBase.toLocaleString()} ETB
                  </td>
                  <td className="p-2 text-right font-mono text-slate-400 text-[11px] sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">-</td>
                  <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400 font-black sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">
                    -{overallTotals.totalDeductions.toLocaleString()} ETB
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-300 font-black text-base sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">
                    {overallTotals.totalNet.toLocaleString()} ETB
                  </td>
                  <td className="p-2 text-center text-[10px] font-bold text-slate-500 sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">
                    {isFinanceApproved ? 'ተረጋግጧል' : 'በሂደት ላይ'}
                  </td>
                  <td className="sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Official Signatures Block for Finance */}
          <div className="hidden print:grid grid-cols-3 gap-8 p-8 mt-6 border-t-2 border-slate-900 text-center text-xs">
            <div className="space-y-4">
              <p className="font-extrabold text-slate-900">{tx('ያዘጋጀው - የሰው ኃይል (Prepared By - HR)')}</p>
              <div className="border-b border-slate-400 w-3/4 mx-auto pt-6" />
              <p className="text-[10px] text-slate-500">ፊርማና ቀን (Signature & Date)</p>
            </div>
            <div className="space-y-4">
              <p className="font-extrabold text-slate-900">{tx('ያረጋገጠው - ፋይናንስ (Audited By - Finance)')}</p>
              <div className="border-b border-slate-400 w-3/4 mx-auto pt-6" />
              <p className="text-[10px] text-slate-500">ፊርማና ቀን (Signature & Date)</p>
            </div>
            <div className="space-y-4">
              <p className="font-extrabold text-slate-900">{tx('ያጸደቀው - ዋና ርዕሰ መምህር (Approved By - Principal)')}</p>
              <div className="border-b border-slate-400 w-3/4 mx-auto pt-6" />
              <p className="text-[10px] text-slate-500">ማህተምና ፊርማ (Seal & Signature)</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cell / Time Modal */}
      {editingCellData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                    <span>{tx('የርዕሰ መምህር የሰዓትና የሁኔታ ማስተካከያ')}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingCellData.staffName} • {tx('ቀን')} {editingCellData.day} • {tx('ሰዓት በርዕሰ መምህሩ ማስተካከል ይቻላል')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCellData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Status Selection: P, L, ፍቃድ (F), A, H */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {tx('የአቴንዳንስ ሁኔታ ይምረጡ (Status)')}:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { key: 'P', label: tx('P ተገኝቷል'), color: 'bg-emerald-600 text-white' },
                  { key: 'L', label: tx('L አርፍዷል'), color: 'bg-amber-500 text-slate-950' },
                  { key: 'F', label: tx('ፍቃድ'), color: 'bg-blue-600 text-white' },
                  { key: 'A', label: tx('A ቀሪ'), color: 'bg-rose-600 text-white' },
                  { key: 'H', label: tx('H ግማሽ'), color: 'bg-purple-600 text-white' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setEditingCellData({
                      ...editingCellData,
                      currentStatus: opt.key as StaffAttendanceStatus
                    })}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all cursor-pointer ${
                      editingCellData.currentStatus === opt.key
                        ? `${opt.color} shadow-md ring-2 ring-indigo-500`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Input (Active when P, L, or H - allows Principal to adjust arrival time) */}
            {(editingCellData.currentStatus === 'P' || editingCellData.currentStatus === 'L' || editingCellData.currentStatus === 'H') && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{tx('የመግቢያ ሰዓት ማስተካከያ (Arrival Time)')}:</span>
                  <button
                    type="button"
                    onClick={() => setEditingCellData({
                      ...editingCellData,
                      currentTime: getEthiopianClockTime()
                    })}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>{tx('የአሁኑ ሰዓት')} ({liveEthTime})</span>
                  </button>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingCellData.currentTime}
                    onChange={(e) => setEditingCellData({
                      ...editingCellData,
                      currentTime: e.target.value
                    })}
                    placeholder="1:35"
                    className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-black text-slate-900 dark:text-white outline-none focus:border-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    {tx('ሰዓት')}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400 font-bold mr-1">{tx('ምርጫዎች')}:</span>
                  {['1:15', '1:30', '1:35', '1:45', '2:00', '2:15'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditingCellData({
                        ...editingCellData,
                        currentTime: preset
                      })}
                      className={`text-[11px] font-mono font-bold px-2 py-1 rounded-lg border cursor-pointer transition-all ${
                        editingCellData.currentTime === preset
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCellData(null)}
                className="py-2 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {tx('ሰርዝ (Cancel)')}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveEditedCell(
                    editingCellData.staffId,
                    editingCellData.day,
                    editingCellData.currentStatus,
                    editingCellData.currentTime
                  );
                  setEditingCellData(null);
                  playInteractiveSound('success');
                }}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all"
              >
                {tx('መዝግብና አስቀምጥ (Save)')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Base Salary Override Modal (Finance) */}
      {editingSalaryStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <BadgeDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">
                    {tx('መነሻ ደመወዝ ማስተካከያ')}
                  </h3>
                  <p className="text-[11px] text-slate-400">{editingSalaryStaff.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSalaryStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {tx('አዲስ ወርሃዊ መነሻ ደመወዝ (ETB)')}:
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={newSalaryInput}
                onChange={(e) => setNewSalaryInput(e.target.value)}
                placeholder="ለምሳሌ: 15000"
                className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black font-mono text-slate-900 dark:text-white outline-none focus:border-emerald-600"
              />
              <p className="text-[11px] text-slate-400">
                {tx('የቀን ተመን በ30 ተካፍሎ ይሰላል')} (~{Math.round((parseInt(newSalaryInput, 10) || 0) / 30).toLocaleString()} ETB / {tx('ቀን')})
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSalaryStaff(null)}
                className="py-2 px-3.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {tx('ሰርዝ')}
              </button>
              <button
                type="button"
                onClick={handleSaveSalary}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer transition-all"
              >
                {tx('አስቀምጥ')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip View Modal */}
      {selectedPayslipStaff && (() => {
        const p = computeStaffPayroll(selectedPayslipStaff);
        const curMonth = ETHIOPIAN_MONTHS[selectedEthMonthIndex - 1];
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm">
                      {tx('የሰራተኛ ወርሃዊ የክፍያ ደረሰኝ (Payslip)')}
                    </h3>
                    <p className="text-[11px] text-slate-400">{curMonth?.nameAmh} {selectedEthYear} ዓ.ም</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPayslipStaff(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Staff summary */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{selectedPayslipStaff.name}</span>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{selectedPayslipStaff.id}</span>
                </div>
                <div className="text-xs text-slate-500">{selectedPayslipStaff.roleTitle || selectedPayslipStaff.category}</div>
              </div>

              {/* Attendance metrics in payslip */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/50">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">የመጣ (P)</div>
                  <div className="text-sm font-black font-mono text-emerald-800 dark:text-emerald-300">{p.presentDays}</div>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/50">
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">ያረፈደ (L)</div>
                  <div className="text-sm font-black font-mono text-amber-800 dark:text-amber-300">{p.lateDays}</div>
                </div>
                <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/50">
                  <div className="text-[10px] text-rose-700 dark:text-rose-400 font-bold">የቀረ (A)</div>
                  <div className="text-sm font-black font-mono text-rose-800 dark:text-rose-300">{p.absentDays}</div>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200/50">
                  <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold">ፍቃድ (F)</div>
                  <div className="text-sm font-black font-mono text-blue-800 dark:text-blue-300">{p.leaveDays}</div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600 dark:text-slate-400">{tx('መነሻ ደመወዝ')}:</span>
                  <span className="font-mono font-bold">{p.baseSalary.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600 dark:text-slate-400">{tx('የቀን ተመን (30 ቀናት)')}:</span>
                  <span className="font-mono">{p.dailyRate.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between py-1.5 text-rose-600 dark:text-rose-400 font-bold">
                  <span>{tx('የቀሪ ቅጣት ቅነሳ')}:</span>
                  <span className="font-mono">-{p.absenceDeductions.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-black text-emerald-700 dark:text-emerald-400">
                  <span>{tx('የተጣራ የሚከፈል ደመወዝ')}:</span>
                  <span className="font-mono text-base">{p.netPayable.toLocaleString()} ETB</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPayslipStaff(null)}
                  className="py-2 px-3.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {tx('ዝጋ')}
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintSinglePayslip(selectedPayslipStaff)}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{tx('ደረሰኝ አትም (Print)')}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
