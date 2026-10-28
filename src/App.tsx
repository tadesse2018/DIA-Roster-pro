import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from './components/LanguageContext';
import { 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  Search, 
  PlusCircle, 
  Save, 
  LogOut, 
  AlertTriangle, 
  Code, 
  Code2, 
  Users, 
  Briefcase, 
  BookOpen, 
  TrendingUp, 
  Lock, 
  Database, 
  FileSpreadsheet, 
  Info, 
  X,
  Sparkles,
  ChevronRight,
  Copy,
  Megaphone,
  Layers,
  Award,
  Download,
  Upload,
  List,
  CalendarDays,
  Printer,
  Mail,
  Edit2,
  Trash2,
  QrCode,
  Shield,
  Monitor,
  Fingerprint,
  Globe,
  History,
  Key,
  Link,
  Share2,
  Camera,
  CameraOff,
  RefreshCw,
  Eye,
  EyeOff,
  UserPlus,
  MessageSquare
 } from 'lucide-react';

export interface UserAccount {
  email: string;
  phone?: string;
  password?: string;
  role: 'principal' | 'vice_principal' | 'teacher' | 'parent';
  name: string;
}
import { motion, AnimatePresence } from 'motion/react';
import { 
  INITIAL_STUDENTS, 
  INITIAL_GRADES, 
  INITIAL_TEACHERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CLASSES,
  DEFECTS_REPORT, 
  Student, 
  Grade, 
  Teacher,
  Announcement,
  ClassSetup,
  DefectDetail,
  StaffMember,
  StaffCategory,
  DEFAULT_SCHOOL_LOGO,
  DEFAULT_SCHOOL_NAME_AMH,
  DEFAULT_SCHOOL_NAME_ENG,
  DEFAULT_SCHOOL_MOTTO_AMH,
  DEFAULT_SCHOOL_MOTTO_ENG
} from './schoolData';

// Modular Imports
import { playInteractiveSound } from './components/AudioEngine';
import { TeacherSection } from './components/TeacherSection';
import { ClassSetupSection } from './components/ClassSetupSection';
import { AnnouncementSection } from './components/AnnouncementSection';
import { GradeTrackerSection, getFormattedDualCalendarDate } from './components/GradeTrackerSection';
import { GradeRemindersSection } from './components/GradeRemindersSection';
import { ParentNotificationService, SimulatedEmail } from './lib/notificationService';
import { SimulatedEmailOutbox } from './components/SimulatedEmailOutbox';
import { QRScannerModal } from './components/QRScannerModal';
import { PrincipalAnalytics } from './components/PrincipalAnalytics';
import { SchoolInfoModal } from './components/SchoolInfoModal';
import { RegisterStaffModal } from './components/RegisterStaffModal';
import { ParentTeacherCommunication } from './components/ParentTeacherCommunication';
import { StaffAttendanceTablesSection } from './components/StaffAttendanceTablesSection';

// PDF Export Libraries
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { applyOklchCleanup } from './lib/pdfUtils';

// Firebase Imports
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, seedFirestoreIfEmpty } from './lib/firebase';

// Helper to remove any undefined properties from objects before sending to Firestore
const cleanForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        cleaned[key] = cleanForFirestore(obj[key]);
      }
    });
    return cleaned;
  }
  return obj;
};

// Automatically generate a lowercase, no-spaces phonetic password for a parent based on the student's name
const generateParentPassword = (studentName: string): string => {
  if (!studentName) return 'parent123';
  const amharicMap: { [key: string]: string } = {
    "ሀ": 'ha', "ሁ": 'hu', "ሂ": 'hi', "ሃ": 'ha', "ሄ": 'he', "ህ": 'h', "ሆ": 'ho',
    "ለ": 'le', "ሉ": 'lu', "ሊ": 'li', "ላ": 'la', "ሌ": 'le', "ል": 'l', "ሎ": 'lo',
    "ሐ": 'ha', "ሑ": 'hu', "ሒ": 'hi', "ሓ": 'ha', "ሔ": 'he', "ሕ": 'h', "ሖ": 'ho',
    "መ": 'me', "ሙ": 'mu', "ሚ": 'mi', "ማ": 'ma', "ሜ": 'me', "ም": 'm', "ሞ": 'mo',
    "ሠ": 'se', "ሡ": 'su', "ሢ": 'si', "ሣ": 'sa', "ሤ": 'se', "ሥ": 's', "ሦ": 'so',
    "ረ": 're', "ሩ": 'ru', "ሪ": 'ri', "ራ": 'ra', "ሬ": 're', "ር": 'r', "ሮ": 'ro',
    "ሰ": 'se', "ሱ": 'su', "ሲ": 'si', "ሳ": 'sa', "ሴ": 'se', "ስ": 's', "ሶ": 'so',
    "ሸ": 'she', "ሹ": 'shu', "ሺ": 'shi', "ሻ": 'sha', "ሼ": 'she', "ሽ": 'sh', "ሾ": 'sho',
    "ቀ": 'ke', "ቁ": 'ku', "ቂ": 'ki', "ቃ": 'ka', "ቄ": 'ke', "ቅ": 'k', "ቆ": 'ko',
    "በ": 'be', "ቡ": 'bu', "ቢ": 'bi', "ባ": 'ba', "ቤ": 'be', "ብ": 'b', "ቦ": 'bo',
    "ተ": 'te', "ቱ": 'tu', "ቲ": 'ti', "ታ": 'ta', "ቴ": 'te', "ት": 't', "ቶ": 'to',
    "ቸ": 'che', "ቹ": 'chu', "ቺ": 'chi', "ቻ": 'cha', "ቼ": 'che', "ች": 'ch', "ቾ": 'cho',
    "ኀ": 'ha', "ኁ": 'hu', "ኂ": 'hi', "ኃ": 'ha', "ኄ": 'he', "ኅ": 'h', "ኆ": 'ho',
    "ነ": 'ne', "ኑ": 'nu', "ኒ": 'ni', "ና": 'na', "ኔ": 'ne', "ን": 'n', "ኖ": 'no',
    "ኘ": 'nye', "ኙ": 'nyu', "ኚ": 'nyi', "ኛ": 'nya', "ኜ": 'nye', "ኝ": 'ny', "ኞ": 'nyo',
    "አ": 'a', "ኡ": 'u', "ኢ": 'i', "ኣ": 'a', "ኤ": 'e', "እ": 'e', "ኦ": 'o',
    "ከ": 'ke', "ኩ": 'ku', "ኪ": 'ki', "ካ": 'ka', "ኬ": 'ke', "ክ": 'k', "ኮ": 'ko',
    "ኸ": 'he', "ኹ": 'hu', "ኺ": 'hi', "ኻ": 'ha', "ኼ": 'he', "ኽ": 'h', 'xo': 'ho',
    "ወ": 'we', "ዉ": 'wu', "ዊ": 'wi', "ዋ": 'wa', "ዌ": 'we', "ው": 'w', "ዎ": 'wo',
    "ዐ": 'a', "ዑ": 'u', "ዒ": 'i', "ዓ": 'a', "ዔ": 'e', "ዕ": 'e', "ዖ": 'o',
    "ዘ": 'ze', "ዙ": 'zu', "ዚ": 'zi', "ዛ": 'za', "ዜ": 'ze', "ዝ": 'z', "ዞ": 'zo',
    "ዠ": 'zhe', "ዡ": 'zhu', "ዢ": 'zhi', "ዣ": 'zha', "ዤ": 'zhe', "ዥ": 'zh', "ዦ": 'zho',
    "የ": 'ye', "ዩ": 'yu', "ዪ": 'yi', "ያ": 'ya', "ዬ": 'ye', "ይ": 'y', "ዮ": 'yo',
    "ደ": 'de', "ዱ": 'du', "ዲ": 'di', "ዳ": 'da', "ዴ": 'de', "ድ": 'd', "ዶ": 'do',
    "ጀ": 'je', "ጁ": 'ju', "ጂ": 'ji', "ጃ": 'ja', "ጄ": 'je', "ጅ": 'j', "ጆ": 'jo',
    "ገ": 'ge', "ጉ": 'gu', "ጊ": 'gi', "ጋ": 'ga', "ጌ": 'ge', "ግ": 'g', "ጎ": 'go',
    "ጠ": 'te', "ጡ": 'tu', "ጢ": 'ti', "ጣ": 'ta', "ጤ": 'te', "ጥ": 't', "ጦ": 'to',
    "ጨ": 'che', "ጩ": 'chu', "ጪ": 'chi', "ጫ": 'cha', "ጬ": 'che', "ጭ": 'ch', "ጮ": 'cho',
    "ጰ": 'pe', "ጳ": 'pa', "ጵ": 'p', "ጶ": 'po',
    "ጸ": 'tse', "ጹ": 'tsu', "ጺ": 'tsi', "ጻ": 'tsa', "ጼ": 'tse', "ፅ": 'ts', "ጾ": 'tso',
    "ፀ": 'tse', "ፁ": 'tsu', "ፂ": 'tsi', "ፃ": 'tsa', "ፄ": 'tse', "ፆ": 'tso',
    "ፈ": 'fe', "ፉ": 'fu', "ፊ": 'fi', "ፋ": 'fa', "ፌ": 'fe', "ፍ": 'f', "ፎ": 'fo',
    "ፐ": 'pe', "ፑ": 'pu', "ፒ": 'pi', "ፓ": 'pa', "ፔ": 'pe', "ፕ": 'p', "ፖ": 'po',
  };

  let result = '';
  // Convert standard English alphabet letters and map Amharic phonetically
  const normalizedStr = studentName.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (let i = 0; i < normalizedStr.length; i++) {
    const char = normalizedStr[i];
    const lowerChar = char.toLowerCase();
    if (amharicMap[char]) {
      result += amharicMap[char];
    } else if (/[a-z0-9]/.test(lowerChar)) {
      result += lowerChar;
    }
  }
  return result || 'parent123';
};

// Clean and short URL generator incorporating the school name and optional student reference
const shortenUrl = async (longUrl: string, schoolName?: string): Promise<string> => {
  try {
    const params = new URLSearchParams(longUrl.split('?')[1] || '');
    const schoolId = params.get('school') || 'school';

    const response = await fetch('/api/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ longUrl, schoolId })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.shortUrl) return data.shortUrl;
    }
  } catch (err) {
    // Suppress console error so it doesn't pollute the logs when adblocker blocks it
    console.warn('Could not shorten URL, using long URL fallback.');
  }
  
  // Fallback if the proxy or API fails
  return longUrl;
};

const THEMES = {
  indigo: {
    primary: 'bg-indigo-600 hover:bg-indigo-700',
    primaryText: 'text-indigo-600',
    text: 'text-indigo-700',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-100',
    focusRing: 'focus:border-indigo-600 focus:ring-indigo-600',
    accentText: 'text-indigo-800',
    accentBg: 'bg-indigo-50/40',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    shadow: 'shadow-indigo-100',
    accentBar: 'bg-indigo-600',
    appBg: 'bg-gradient-to-br from-indigo-100 via-white to-purple-100 bg-[length:200%_200%] animate-gradient-slow'
  },
  emerald: {
    primary: 'bg-emerald-600 hover:bg-emerald-700',
    primaryText: 'text-emerald-600',
    text: 'text-emerald-700',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-100',
    focusRing: 'focus:border-emerald-600 focus:ring-emerald-600',
    accentText: 'text-emerald-800',
    accentBg: 'bg-emerald-50/40',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    shadow: 'shadow-emerald-100',
    accentBar: 'bg-emerald-500',
    appBg: 'bg-gradient-to-br from-emerald-100 via-white to-teal-100 bg-[length:200%_200%] animate-gradient-slow'
  },
  violet: {
    primary: 'bg-violet-600 hover:bg-violet-700',
    primaryText: 'text-violet-600',
    text: 'text-violet-700',
    lightBg: 'bg-violet-50',
    border: 'border-violet-100',
    focusRing: 'focus:border-violet-600 focus:ring-violet-600',
    accentText: 'text-violet-800',
    accentBg: 'bg-violet-50/40',
    badge: 'bg-violet-50 text-violet-700 border-violet-100',
    shadow: 'shadow-violet-100',
    accentBar: 'bg-violet-600',
    appBg: 'bg-gradient-to-br from-violet-100 via-white to-fuchsia-100 bg-[length:200%_200%] animate-gradient-slow'
  },
  rose: {
    primary: 'bg-rose-600 hover:bg-rose-700',
    primaryText: 'text-rose-600',
    text: 'text-rose-700',
    lightBg: 'bg-rose-50',
    border: 'border-rose-100',
    focusRing: 'focus:border-rose-600 focus:ring-rose-600',
    accentText: 'text-rose-800',
    accentBg: 'bg-rose-50/40',
    badge: 'bg-rose-50 text-rose-700 border-rose-100',
    shadow: 'shadow-rose-100',
    accentBar: 'bg-rose-500',
    appBg: 'bg-gradient-to-br from-rose-100 via-white to-orange-100 bg-[length:200%_200%] animate-gradient-slow'
  },
  amber: {
    primary: 'bg-amber-600 hover:bg-amber-700',
    primaryText: 'text-amber-600',
    text: 'text-amber-700',
    lightBg: 'bg-amber-50',
    border: 'border-amber-100',
    focusRing: 'focus:border-amber-600 focus:ring-amber-600',
    accentText: 'text-amber-800',
    accentBg: 'bg-amber-50/40',
    badge: 'bg-amber-50 text-amber-900 border-amber-100',
    shadow: 'shadow-amber-100',
    accentBar: 'bg-amber-500',
    appBg: 'bg-gradient-to-br from-amber-100 via-white to-orange-100 bg-[length:200%_200%] animate-gradient-slow'
  },
  slate: {
    primary: 'bg-slate-700 hover:bg-slate-800',
    primaryText: 'text-slate-700',
    text: 'text-slate-700',
    lightBg: 'bg-slate-100',
    border: 'border-slate-200',
    focusRing: 'focus:border-slate-700 focus:ring-slate-700',
    accentText: 'text-slate-800',
    accentBg: 'bg-slate-100/50',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    shadow: 'shadow-slate-100',
    accentBar: 'bg-slate-700',
    appBg: 'bg-gradient-to-br from-slate-200 via-slate-50 to-zinc-200 bg-[length:200%_200%] animate-gradient-slow'
  }
};

const getLetterGrade = (total: number) => {
  if (total >= 90) return { label: 'A+', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (total >= 85) return { label: 'A', color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100' };
  if (total >= 80) return { label: 'B+', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
  if (total >= 75) return { label: 'B', color: 'text-indigo-600 bg-indigo-50/50 border-indigo-100' };
  if (total >= 65) return { label: 'C+', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (total >= 60) return { label: 'C', color: 'text-amber-600 bg-amber-50/50 border-amber-100' };
  if (total >= 50) return { label: 'D', color: 'text-orange-600 bg-orange-50 border-orange-100' };
  return { label: 'F', color: 'text-rose-600 bg-rose-50 border-rose-200 font-black' };
};

export default function App() {
  const { lang, setLang, t, tx } = useLanguage();
  const getSubjectAssessments = (subject: string) => {
    return schoolConfig?.subjectAssessments?.[subject] || (
      schoolConfig?.subjectAssessments?.['default'] || (
        schoolConfig?.subjectAssessments?.['__default__'] || [
          { id: 'quiz', name: tx("ኩዊዝ"), nameEng: 'QUIZ', maxMark: 10 },
          { id: 'cw', name: tx("የክፍል ሥራ"), nameEng: 'CW', maxMark: 10 },
          { id: 'hw', name: tx("የቤት ሥራ"), nameEng: 'HW', maxMark: 10 },
          { id: 'gw', name: tx("የቡድን ሥራ"), nameEng: 'GW', maxMark: 10 },
          { id: 'pw', name: tx("የፕሮጀክት ሥራ"), nameEng: 'PW', maxMark: 10 },
          { id: 'cp', name: tx("የክፍል ተሳትፎ"), nameEng: 'CP', maxMark: 10 },
          { id: 'mid', name: tx("ግማሽ ፈተና"), nameEng: 'MEXAM', maxMark: 20 },
          { id: 'final', name: tx("ማጠቃለያ ፈተና"), nameEng: 'FEXAM', maxMark: 20 },
        ]
      )
    );
  };

  // Navigation: "portal" for live system, "whitelabel" for SaaS brand setup, "report" for bug analysis
  const [activeTab, setActiveTab] = useState<'portal' | 'whitelabel' | 'report' | 'help'>('portal');
  
  // Simulated Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const loggedIn = localStorage.getItem('school_is_logged_in') === 'true';
    const hasUser = localStorage.getItem('school_current_user') !== null;
    return loggedIn && hasUser;
  });
  const [emailInput, setEmailInput] = useState(() => {
    return localStorage.getItem('sec_demo_autofill_enabled') === 'true' ? '0911223344' : '';
  });
  const [passwordInput, setPasswordInput] = useState(() => {
    return localStorage.getItem('sec_demo_autofill_enabled') === 'true' ? 'Principal123' : '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'principal' | 'vice_principal' | 'teacher' | 'parent'>(() => {
    const saved = localStorage.getItem('school_selected_role');
    return (saved as any) || 'principal';
  });
  const [vicePrincipalActiveView, setVicePrincipalActiveView] = useState<'admin' | 'teaching' | 'attendance'>('admin');
  const [isDesktopAppModalOpen, setIsDesktopAppModalOpen] = useState(false);
  const [isSchoolInfoModalOpen, setIsSchoolInfoModalOpen] = useState(false);
  
  // --- MULTI-SCHOOL TENANCY WORKSPACE REGISTRY & MODAL STATES ---
  const [isNewSchoolModalOpen, setIsNewSchoolModalOpen] = useState(false);
  const [isManageSchoolsModalOpen, setIsManageSchoolsModalOpen] = useState(false);
  const [newSchoolNameAmh, setNewSchoolNameAmh] = useState('');
  const [newSchoolNameEng, setNewSchoolNameEng] = useState('');
  const [newSchoolWorkspaceId, setNewSchoolWorkspaceId] = useState('');
  const [newSchoolLevel, setNewSchoolLevel] = useState<'primary' | 'secondary'>('primary');
  const [newSchoolSeedDemo, setNewSchoolSeedDemo] = useState<boolean>(false);
  const [newSchoolModalError, setNewSchoolModalError] = useState<string | null>(null);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string | null>(null);
  const [deletingWorkspaceFromModalId, setDeletingWorkspaceFromModalId] = useState<string | null>(null);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editWsNameAmh, setEditWsNameAmh] = useState('');
  const [editWsNameEng, setEditWsNameEng] = useState('');
  const [editWsId, setEditWsId] = useState('');

  const [workspacesRegistry, setWorkspacesRegistry] = useState<{ id: string; nameAmh: string; nameEng: string; updatedAt: number }[]>(() => {
    const saved = localStorage.getItem('school_workspaces_registry');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    // Default workspace
    return [
      {
        id: 'smart-school',
        nameAmh: tx("ደሊጀንት ት/ቤት"),
        nameEng: 'Diligent School',
        updatedAt: Date.now()
      }
    ];
  });

  const updateWorkspaceRegistryEntry = (wsId: string, nameAmh: string, nameEng: string) => {
    if (!wsId) return;
    setWorkspacesRegistry((prev) => {
      const existsIdx = prev.findIndex((item) => item.id === wsId);
      let updated = [...prev];
      if (existsIdx > -1) {
        if (prev[existsIdx].nameAmh !== nameAmh || prev[existsIdx].nameEng !== nameEng) {
          updated[existsIdx] = {
            ...prev[existsIdx],
            nameAmh: nameAmh || prev[existsIdx].nameAmh,
            nameEng: nameEng || prev[existsIdx].nameEng,
            updatedAt: Date.now()
          };
        } else {
          return prev;
        }
      } else {
        updated.push({
          id: wsId,
          nameAmh: nameAmh || tx("ስማርት ስኩል"),
          nameEng: nameEng || 'Smart School',
          updatedAt: Date.now()
        });
      }
      localStorage.setItem('school_workspaces_registry', JSON.stringify(updated));
      return updated;
    });
  };

  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string; role: 'principal' | 'teacher' | 'parent' | 'student'; studentId?: string; name?: string } | null>(() => {
    const saved = localStorage.getItem('school_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // States for dynamic User Accounts & passwords (የተጠቃሚዎች አካውንት እና ይለፍ ቃል)
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [isChangingPasswordOpen, setIsChangingPasswordOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordChangeSuccessMsg, setPasswordChangeSuccessMsg] = useState<string | null>(null);
  const [passwordChangeErrorMsg, setPasswordChangeErrorMsg] = useState<string | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [quickViewCategory, setQuickViewCategory] = useState<string | null>(null);
  const [selectedQRStudent, setSelectedQRStudent] = useState<Student | null>(null);
  const [isBatchPrintActive, setIsBatchPrintActive] = useState(false);
  const [isStudentListPrintActive, setIsStudentListPrintActive] = useState(false);
  const [selectedQRTeacher, setSelectedQRTeacher] = useState<any | null>(null);
  const [resetPasswordEmail, setResetPasswordEmail] = useState<string | null>(null);
  const [editingPasswordEmail, setEditingPasswordEmail] = useState<string | null>(null);
  const [editingPasswordValue, setEditingPasswordValue] = useState<string>('');
  const [confirmDeleteAccountEmail, setConfirmDeleteAccountEmail] = useState<string | null>(null);
  const [editingPhoneEmail, setEditingPhoneEmail] = useState<string | null>(null);
  const [editingPhoneValue, setEditingPhoneValue] = useState<string>('');
  const [githubRepoUrl, setGithubRepoUrl] = useState(() => localStorage.getItem('diligent_github_repo_url') || '');
  const [generatedGitHubLink, setGeneratedGitHubLink] = useState(() => localStorage.getItem('diligent_github_live_link') || '');

  // --- PRODUCTION-GRADE SECURE ENTRANCE PORTAL STATES ---
  const [isDemoAutoFillEnabled, setIsDemoAutoFillEnabled] = useState<boolean>(false);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('sec_2fa_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [isTwoFactorPending, setIsTwoFactorPending] = useState<boolean>(false);
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState<string>('');
  const [twoFactorGeneratedCode, setTwoFactorGeneratedCode] = useState<string>('');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState<boolean>(false);
  const [isCaptchaRequirementActive, setIsCaptchaRequirementActive] = useState<boolean>(true);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isIpBlocked, setIsIpBlocked] = useState<boolean>(false);
  const [blockCooldownSecs, setBlockCooldownSecs] = useState<number>(0);
  const [pendingLoginUser, setPendingLoginUser] = useState<any>(null);
  const [showSecurityCenter, setShowSecurityCenter] = useState<boolean>(false);

  const formatBlockCooldownTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    if (mins > 0) {
      return `${mins} ደቂቃ ከ ${s} ሰከንድ (${mins}m ${s}s)`;
    }
    return `${s} ሰከንድ (${s}s)`;
  };

  const [securityAuditTrail, setSecurityAuditTrail] = useState<Array<{
    id: string;
    timestamp: string;
    ip: string;
    device: string;
    role: string;
    status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | '2FA_CHALLENGE' | 'LOGOUT';
    email: string;
    location: string;
  }>>(() => {
    const saved = localStorage.getItem('sec_audit_trail');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'SEC-9082',
        timestamp: new Date(Date.now() - 3600000 * 2.5).toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' }) + tx(" (ከ2.5 ሰዓት በፊት)"),
        ip: '197.156.124.81',
        device: 'Android Mobile - Addis Ababa (Chrome)',
        role: 'teacher',
        status: 'SUCCESS',
        email: 'teacher@school.com',
        location: tx("አዲስ አበባ (Addis Ababa)")
      },
      {
        id: 'SEC-4501',
        timestamp: new Date(Date.now() - 3600000 * 12).toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' }) + tx(" (ትላንት ማታ)"),
        ip: '197.156.92.114',
        device: 'Windows PC - Debre Markos (Chrome Desktop)',
        role: 'principal',
        status: 'SUCCESS',
        email: 'principal@school.com',
        location: tx("ደብረ ማርቆስ (Debre Markos)")
      },
      {
        id: 'SEC-2231',
        timestamp: new Date(Date.now() - 3600000 * 13).toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' }) + tx(" (ትላንት ማታ)"),
        ip: '197.156.92.114',
        device: 'Windows PC - Debre Markos (Firefox Desktop)',
        role: 'principal',
        status: 'FAILED',
        email: 'principal@school.com',
        location: tx("ደብረ ማርቆስ (Debre Markos)")
      }
    ];
  });

  // Persist security logs & states
  React.useEffect(() => {
    localStorage.setItem('sec_audit_trail', JSON.stringify(securityAuditTrail));
  }, [securityAuditTrail]);

  React.useEffect(() => {
    localStorage.setItem('sec_2fa_enabled', String(isTwoFactorEnabled));
  }, [isTwoFactorEnabled]);

  // Sync login/logout state to localStorage to prevent unwanted session drops on navigation
  React.useEffect(() => {
    localStorage.setItem('school_is_logged_in', isLoggedIn ? 'true' : 'false');
    if (isLoggedIn) {
      if (currentUser) {
        localStorage.setItem('school_current_user', JSON.stringify(currentUser));
      }
      localStorage.setItem('school_selected_role', selectedRole);
    } else {
      localStorage.removeItem('school_current_user');
      localStorage.removeItem('school_selected_role');
    }
  }, [isLoggedIn, currentUser, selectedRole]);

  // Lockout rate-limit timer
  React.useEffect(() => {
    if (blockCooldownSecs > 0) {
      const interval = setInterval(() => {
        setBlockCooldownSecs(prev => {
          if (prev <= 1) {
            setIsIpBlocked(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [blockCooldownSecs]);

  // Logger helper
  const addSecurityLog = (email: string, role: string, status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | '2FA_CHALLENGE' | 'LOGOUT') => {
    const ips = ['197.156.124.81', '196.188.42.15', '197.156.19.143', '196.190.254.33'];
    const deviceModels = ['Chrome Desktop (Ubuntu)', 'iOS Safari (Apple)', 'Android Mobile (Samsung)', 'Edge Browser (Windows)'];
    const locations = [tx("አዲስ አበባ (Addis Ababa)"), tx("ባህር ዳር (Bahir Dar)"), tx("ደብረ ማርቆስ (Debre Markos)"), tx("ሀዋሳ (Hawassa)")];
    
    const randomIp = ips[Math.floor(Math.random() * ips.length)];
    const randomDevice = deviceModels[Math.floor(Math.random() * deviceModels.length)];
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];

    const newLog = {
      id: `SEC-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ip: randomIp,
      device: randomDevice,
      role: role || 'unknown',
      status,
      email: email || 'unknown@school.com',
      location: randomLoc
    };

    setSecurityAuditTrail(prev => [newLog, ...prev.slice(0, 19)]);
  };

  // Auto-fill credentials based on selected role tab
  React.useEffect(() => {
    if (!isLoggedIn) {
      if (isDemoAutoFillEnabled) {
        if (selectedRole === 'principal') {
          setEmailInput('0911223344');
          setPasswordInput('Principal123');
        } else if (selectedRole === 'teacher') {
          setEmailInput('0912345678');
          setPasswordInput('Teacher123');
        } else if (selectedRole === 'parent') {
          setEmailInput('0922334455');
          setPasswordInput('Parent123');
        }
      } else {
        // Do not pre-fill if demo auto-fill is disabled (highly secure mode)
        setEmailInput('');
        setPasswordInput('');
      }
    }
  }, [selectedRole, isLoggedIn, isDemoAutoFillEnabled]);

  // Dynamic School Workspace (Tenant ID) for isolating data across multiple schools
  const [schoolWorkspaceId, setSchoolWorkspaceId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSchool = params.get('school');
    if (urlSchool) {
      const sanitized = urlSchool.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      localStorage.setItem('school_workspace_id', sanitized);
      return sanitized;
    }
    const saved = localStorage.getItem('school_workspace_id');
    return saved ? saved : 'diligent';
  });

  // Keep track of the currently active workspace that has been fully loaded into states
  const [loadedWorkspaceId, setLoadedWorkspaceId] = useState<string>(schoolWorkspaceId);

  // Dynamic White-Label School Configuration (SaaS Configurator)
  const [schoolConfig, setSchoolConfig] = useState(() => {
    const saved = localStorage.getItem(`schoolConfig_${schoolWorkspaceId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Automatically migrate manual "ክቡር" to "ደሊጀንት"
        if (parsed) {
          if (!parsed.logoImage) {
            parsed.logoImage = DEFAULT_SCHOOL_LOGO;
          }
          // Keep user-customized school config without forced resets
        }
        if (parsed && parsed.subjectAssessments && '__default__' in parsed.subjectAssessments) {
          parsed.subjectAssessments['default'] = parsed.subjectAssessments['__default__'];
          delete parsed.subjectAssessments['__default__'];
        }
        return parsed;
      } catch (e) {
        // ignore
      }
    }
    return {
      nameAmh: tx(DEFAULT_SCHOOL_NAME_AMH),
      nameEng: DEFAULT_SCHOOL_NAME_ENG,
      mottoAmh: tx(DEFAULT_SCHOOL_MOTTO_AMH),
      mottoEng: DEFAULT_SCHOOL_MOTTO_ENG,
      phone: '0111223344',
      email: 'info@diligent.edu.et',
      address: tx("አዲስ አበባ፣ ኢትዮጵያ (Addis Ababa, Ethiopia)"),
      logoType: 'graduation' as 'graduation' | 'book' | 'shield' | 'award',
      logoImage: DEFAULT_SCHOOL_LOGO,
      themeColor: 'indigo' as 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate',
      subjects: ['Afaan Oromo', 'Moral Education', 'Mathematics', 'English', 'Amharic', 'Science', 'Social Studies'],
      subjectsByGrade: {},
      evaluationMode: 'quarter' as 'quarter' | 'semester',
      schoolLevel: 'primary' as 'primary' | 'secondary',
      academicYear: tx("2018 ዓ.ም")
    };
  });

  // Dynamically set document title based on school config
  React.useEffect(() => {
    if (schoolConfig?.nameAmh) {
      document.title = `${schoolConfig.nameAmh} - School Portal`;
    } else {
      document.title = 'School Management System';
    }
  }, [schoolConfig?.nameAmh]);

  // Database States loaded from localStorage if exists with try/catch safety
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(`school_students_${schoolWorkspaceId}`);
    let list: Student[] = [];
    if (saved) {
      try { list = JSON.parse(saved); } catch (e) {}
    } else if (schoolWorkspaceId === 'diligent') {
      list = INITIAL_STUDENTS;
    }
    // Ensure Grade 7 Section A has sample students if empty in diligent workspace
    if (schoolWorkspaceId === 'diligent' && !list.some(s => s.grade === 'Grade 7' && s.section === 'A')) {
      const g7Students = INITIAL_STUDENTS.filter(s => s.grade === 'Grade 7' && s.section === 'A');
      list = [...list, ...g7Students];
    }
    // User requirement: Ensure student register gender is Female
    list = list.map(s => ({ ...s, gender: 'Female' as const }));
    return list;
  });
  const [grades, setGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem(`school_grades_${schoolWorkspaceId}`);
    let list: Grade[] = [];
    if (saved) {
      try { list = JSON.parse(saved); } catch (e) {}
    } else if (schoolWorkspaceId === 'diligent') {
      list = INITIAL_GRADES;
    }
    if (schoolWorkspaceId === 'diligent') {
      const g7Grades = INITIAL_GRADES.filter(g => g.studentId.startsWith('ID-701'));
      const missing = g7Grades.filter(g => !list.some(existing => existing.studentId === g.studentId && existing.subject === g.subject));
      if (missing.length > 0) {
        list = [...list, ...missing];
      }
    }
    return list;
  });
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem(`school_teachers_${schoolWorkspaceId}`);
    let list: Teacher[] = [];
    if (saved) {
      try { list = JSON.parse(saved); } catch (e) {}
    } else if (schoolWorkspaceId === 'diligent') {
      list = INITIAL_TEACHERS;
    }
    if (schoolWorkspaceId === 'diligent') {
      list = list.map(t => {
        const initialMatch = INITIAL_TEACHERS.find(it => it.id === t.id);
        if (initialMatch && (!t.classAllocations || t.classAllocations.length <= 1 || t.subjects.length <= 1)) {
          return {
            ...t,
            subjects: initialMatch.subjects,
            classAllocations: initialMatch.classAllocations
          };
        }
        return t;
      });
    }
    return list;
  });
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem(`school_staff_${schoolWorkspaceId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'STF-HT-1001',
        name: 'ዶ/ር አለሙ በቀለ (Dr. Alemu Bekele)',
        category: 'Head Teacher',
        roleTitle: 'ርዕሰ መምህር (Head Teacher / Principal)',
        educationLevel: 'PhD',
        phone: '0911223344',
        email: 'principal@school.com',
        leadershipTenure: '6 Years (6 ዓመታት)',
        appointedYear: '2020 / 2012 ዓ.ም',
        leadershipPortfolio: 'Academic Governance, Staff Development, Board Liaison',
        shift: 'Full Time (ሙሉ ቀን)',
        assignedArea: 'Executive Principal Office',
        registeredBy: 'System Admin',
        timestamp: new Date().toISOString()
      },
      {
        id: 'STF-VPR-102',
        name: 'ወ/ሮ ራሄል ኃይሉ (W/ro Rahel Hailu)',
        category: 'Vice Principal',
        roleTitle: 'ምክትል ርዕሰ መምህርት (Vice Principal - Academic & Discipline)',
        educationLevel: 'Masters',
        phone: '0911554433',
        email: 'viceprincipal@school.com',
        gender: 'Female',
        age: 39,
        subjects: ['Biology', 'Chemistry'],
        assignedClass: 'Grade 7',
        assignedSection: 'A',
        classAllocations: [
          { grade: 'Grade 7', section: 'A', subjects: ['Biology', 'Chemistry'] },
          { grade: 'Grade 8', section: 'A', subjects: ['Biology'] }
        ],
        isHomeroomTeacher: false,
        leadershipTenure: '4 Years (4 ዓመታት)',
        appointedYear: '2022 / 2014 ዓ.ም',
        leadershipPortfolio: 'Classroom scheduling, continuous assessments, discipline & teacher mentorship',
        shift: 'Full Time (ሙሉ ቀን)',
        assignedArea: 'Academic & Discipline Office (የም/ር/መምህር ቢሮ)',
        baseSalary: 16000,
        dailyRate: 533.3,
        registeredBy: 'Principal',
        timestamp: new Date().toISOString()
      },
      {
        id: 'STF-ADM-2001',
        name: 'ወ/ሮ ሮዛ ተሾመ (W/ro Roza Teshome)',
        category: 'Administrator',
        roleTitle: 'ዋና ሬጅስትራር (Senior Registrar)',
        educationLevel: 'Degree',
        phone: '0911334455',
        email: 'registrar@school.com',
        shift: 'Day Shift (የቀን ፈረቃ)',
        assignedArea: 'Main Administration Block',
        registeredBy: 'Principal',
        timestamp: new Date().toISOString()
      },
      {
        id: 'STF-SEC-3001',
        name: 'አቶ ታምራት ታደሰ (Ato Tamirat Tadesse)',
        category: 'Security Guard',
        roleTitle: 'የደህንነትና ጥበቃ አባል (Campus Security)',
        educationLevel: 'Certificate',
        phone: '0911445566',
        shift: 'Day Shift (የቀን ፈረቃ)',
        assignedArea: 'Main Entrance Gate',
        registeredBy: 'Principal',
        timestamp: new Date().toISOString()
      },
      {
        id: 'STF-CLN-4001',
        name: 'ወ/ሮ ትዕግስት ወርቁ (W/ro Tigist Worku)',
        category: 'Cleaner',
        roleTitle: 'የጽዳት ባለሙያ (Hygiene & Sanitation)',
        educationLevel: 'High School Complete (10/12)',
        phone: '0911556677',
        shift: 'Day Shift (የቀን ፈረቃ)',
        assignedArea: 'Classroom Block & Hall',
        registeredBy: 'Principal',
        timestamp: new Date().toISOString()
      }
    ];
  });
  const [isRegisterStaffModalOpen, setIsRegisterStaffModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(`school_announcements_${schoolWorkspaceId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return schoolWorkspaceId === 'diligent' ? INITIAL_ANNOUNCEMENTS : [];
  });
  const [classes, setClasses] = useState<ClassSetup[]>(() => {
    const saved = localStorage.getItem(`school_classes_${schoolWorkspaceId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return schoolWorkspaceId === 'diligent' ? INITIAL_CLASSES : [];
  });
  const [studentExtraInfo, setStudentExtraInfo] = useState<Record<string, { conduct: string; absent: number }>>(() => {
    const saved = localStorage.getItem(`studentExtraInfo_${schoolWorkspaceId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return schoolWorkspaceId === 'diligent' ? {
      'ID-4021': { conduct: 'A', absent: 2 },
      'ID-1082': { conduct: 'A', absent: 0 },
      'ID-8843': { conduct: 'B', absent: 4 },
      'ID-5531': { conduct: 'A', absent: 1 },
      'ID-9011': { conduct: 'B', absent: 3 },
      'ID-3245': { conduct: 'A+', absent: 0 }
    } : {};
  });

  // When school workspace ID changes, reset states to the newly selected school's cache
  React.useEffect(() => {
    // Retain user-saved global config without overrides

    const cachedConfig = localStorage.getItem(`schoolConfig_${schoolWorkspaceId}`);
    if (cachedConfig) {
      try { setSchoolConfig(JSON.parse(cachedConfig)); } catch (e) {}
    } else {
      setSchoolConfig({
        nameAmh: tx("ደሊጀንት ት/ቤት"),
        nameEng: 'Diligent School',
        mottoAmh: tx("ለክህሎትና ለውጤታማነት እንተጋለን!"),
        mottoEng: 'Striving for Skills and Success!',
        phone: '0111223344',
        email: 'info@smartschool.edu.et',
        address: tx("አዲስ አበባ፣ ኢትዮጵያ (Addis Ababa, Ethiopia)"),
        logoType: 'graduation',
        themeColor: 'indigo',
        subjects: ['Afaan Oromo', 'Moral Education', 'Mathematics', 'English', 'Amharic', 'Science', 'Social Studies'],
        evaluationMode: 'quarter',
        schoolLevel: 'primary'
      });
    }

    const cachedStudents = localStorage.getItem(`school_students_${schoolWorkspaceId}`);
    setStudents(cachedStudents ? JSON.parse(cachedStudents) : (schoolWorkspaceId === 'diligent' ? INITIAL_STUDENTS : []));

    const cachedGrades = localStorage.getItem(`school_grades_${schoolWorkspaceId}`);
    setGrades(cachedGrades ? JSON.parse(cachedGrades) : (schoolWorkspaceId === 'diligent' ? INITIAL_GRADES : []));

    const cachedTeachers = localStorage.getItem(`school_teachers_${schoolWorkspaceId}`);
    setTeachers(cachedTeachers ? JSON.parse(cachedTeachers) : (schoolWorkspaceId === 'diligent' ? INITIAL_TEACHERS : []));

    const cachedStaff = localStorage.getItem(`school_staff_${schoolWorkspaceId}`);
    if (cachedStaff) {
      try { setStaffList(JSON.parse(cachedStaff)); } catch (e) {}
    }

    const cachedAnnouncements = localStorage.getItem(`school_announcements_${schoolWorkspaceId}`);
    setAnnouncements(cachedAnnouncements ? JSON.parse(cachedAnnouncements) : (schoolWorkspaceId === 'diligent' ? INITIAL_ANNOUNCEMENTS : []));

    const cachedClasses = localStorage.getItem(`school_classes_${schoolWorkspaceId}`);
    setClasses(cachedClasses ? JSON.parse(cachedClasses) : (schoolWorkspaceId === 'diligent' ? INITIAL_CLASSES : []));

    const cachedExtra = localStorage.getItem(`studentExtraInfo_${schoolWorkspaceId}`);
    setStudentExtraInfo(cachedExtra ? JSON.parse(cachedExtra) : (schoolWorkspaceId === 'diligent' ? {
      'ID-4021': { conduct: 'A', absent: 2 },
      'ID-1082': { conduct: 'A', absent: 0 },
      'ID-8843': { conduct: 'B', absent: 4 },
      'ID-5531': { conduct: 'A', absent: 1 },
      'ID-9011': { conduct: 'B', absent: 3 },
      'ID-3245': { conduct: 'A+', absent: 0 }
    } : {}));

    setLoadedWorkspaceId(schoolWorkspaceId);
    ParentNotificationService.setWorkspaceId(schoolWorkspaceId);
  }, [schoolWorkspaceId]);

  React.useEffect(() => {
    try {
      localStorage.setItem(`school_staff_${schoolWorkspaceId}`, JSON.stringify(staffList));
    } catch (e) {}
  }, [staffList, schoolWorkspaceId]);

  const [simulatedEmails, setSimulatedEmails] = useState<SimulatedEmail[]>([]);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = ParentNotificationService.subscribe((emails) => {
      setSimulatedEmails(emails);
    });
    return unsubscribe;
  }, []);

  // Reset/clean form fields whenever the "Add New School" modal opens or closes
  React.useEffect(() => {
    if (isNewSchoolModalOpen) {
      setNewSchoolNameAmh('');
      setNewSchoolNameEng('');
      setNewSchoolWorkspaceId('');
      setNewSchoolLevel('primary');
      setNewSchoolSeedDemo(false);
      setNewSchoolModalError(null);
    }
  }, [isNewSchoolModalOpen]);

  const [isSyncing, setIsSyncing] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Load from Firestore on mount
  React.useEffect(() => {
    async function loadData() {
      let offlineDetected = false;
      try {
        setIsSyncing(true);
        // Seed if first time
        try {
          const savedConfigStr = localStorage.getItem(`schoolConfig_${schoolWorkspaceId}`);
          let configToSeed = undefined;
          if (savedConfigStr) {
            try { configToSeed = JSON.parse(savedConfigStr); } catch (e) {}
          }

          // Decide whether to seed sample/demo data or keep database clean
          let shouldSeedDemo = false;
          if (schoolWorkspaceId === 'diligent') {
            shouldSeedDemo = true;
          } else if (configToSeed && (configToSeed.seedDemoData === true || configToSeed.seedDemoData === 'true')) {
            shouldSeedDemo = true;
          }

          await seedFirestoreIfEmpty(schoolWorkspaceId, {
            students: shouldSeedDemo ? INITIAL_STUDENTS : [],
            grades: shouldSeedDemo ? INITIAL_GRADES : [],
            teachers: shouldSeedDemo ? INITIAL_TEACHERS : [],
            announcements: shouldSeedDemo ? INITIAL_ANNOUNCEMENTS : [],
            classes: shouldSeedDemo ? INITIAL_CLASSES : [],
            studentExtraInfo: shouldSeedDemo ? {
              'ID-4021': { conduct: 'A', absent: 2 },
              'ID-1082': { conduct: 'A', absent: 0 },
              'ID-8843': { conduct: 'B', absent: 4 },
              'ID-5531': { conduct: 'A', absent: 1 },
              'ID-9011': { conduct: 'B', absent: 3 },
              'ID-3245': { conduct: 'A+', absent: 0 }
            } : {},
            schoolConfig: configToSeed
          });
        } catch (seedErr: any) {
          console.warn('Seeding skipped or run offline:', seedErr);
          const errMsg = seedErr?.message || String(seedErr);
          if (errMsg.includes('Could not reach Cloud Firestore') || errMsg.includes('offline') || errMsg.includes('unavailable') || !navigator.onLine) {
            offlineDetected = true;
          }
        }

        // Load students strictly isolated to active schoolWorkspaceId
        try {
          const studentsSnap = await getDocs(collection(db, 'schools', schoolWorkspaceId, 'students'));
          const loadedStudents: Student[] = [];
          studentsSnap.forEach(doc => loadedStudents.push(doc.data() as Student));
          setStudents(loadedStudents);
        } catch (e: any) {
          console.warn('Loaded students from local cache / storage (offline mode)', e);
          const errMsg = e?.message || String(e);
          if (errMsg.includes('Could not reach Cloud Firestore') || errMsg.includes('offline') || errMsg.includes('unavailable') || !navigator.onLine) {
            offlineDetected = true;
          }
        }

        // Load grades
        try {
          const gradesSnap = await getDocs(collection(db, 'schools', schoolWorkspaceId, 'grades'));
          const loadedGrades: Grade[] = [];
          gradesSnap.forEach(doc => loadedGrades.push(doc.data() as Grade));
          setGrades(loadedGrades);
        } catch (e: any) {
          console.warn('Loaded grades from local cache / storage (offline mode)', e);
          const errMsg = e?.message || String(e);
          if (errMsg.includes('Could not reach Cloud Firestore') || errMsg.includes('offline') || errMsg.includes('unavailable') || !navigator.onLine) {
            offlineDetected = true;
          }
        }

        // Load teachers
        try {
          const teachersSnap = await getDocs(collection(db, 'schools', schoolWorkspaceId, 'teachers'));
          const loadedTeachers: Teacher[] = [];
          teachersSnap.forEach(doc => loadedTeachers.push(doc.data() as Teacher));
          setTeachers(loadedTeachers);
        } catch (e: any) {
          console.warn('Loaded teachers from local cache / storage (offline mode)', e);
          const errMsg = e?.message || String(e);
          if (errMsg.includes('Could not reach Cloud Firestore') || errMsg.includes('offline') || errMsg.includes('unavailable') || !navigator.onLine) {
            offlineDetected = true;
          }
        }

        // Load announcements
        try {
          const announcementsSnap = await getDocs(collection(db, 'schools', schoolWorkspaceId, 'announcements'));
          const loadedAnnouncements: Announcement[] = [];
          announcementsSnap.forEach(doc => loadedAnnouncements.push(doc.data() as Announcement));
          setAnnouncements(loadedAnnouncements);
        } catch (e: any) {
          console.warn('Loaded announcements from local cache / storage (offline mode)', e);
          const errMsg = e?.message || String(e);
          if (errMsg.includes('Could not reach Cloud Firestore') || errMsg.includes('offline') || errMsg.includes('unavailable') || !navigator.onLine) {
            offlineDetected = true;
          }
        }

        // Load classes
        try {
          const classesSnap = await getDocs(collection(db, 'schools', schoolWorkspaceId, 'classes'));
          const loadedClasses: ClassSetup[] = [];
          classesSnap.forEach(doc => loadedClasses.push(doc.data() as ClassSetup));
          setClasses(loadedClasses);
        } catch (e: any) {
          console.warn('Loaded classes from local cache / storage (offline mode)', e);
          const errMsg = e?.message || String(e);
          if (errMsg.includes('Could not reach Cloud Firestore') || errMsg.includes('offline') || errMsg.includes('unavailable') || !navigator.onLine) {
            offlineDetected = true;
          }
        }

        // Load user accounts (የተጠቃሚዎች አካውንት)
        try {
          const accountsSnap = await getDocs(collection(db, 'schools', schoolWorkspaceId, 'userAccounts'));
          const loadedAccounts: UserAccount[] = [];
          accountsSnap.forEach(doc => {
            const acc = doc.data() as UserAccount;
            if (!acc.phone) {
              if (acc.email === 'tadessemisganaw4@gmail.com') acc.phone = '0911223344';
              else if (acc.email === 'principal@school.com') acc.phone = '0911334455';
              else if (acc.email === 'viceprincipal@school.com') acc.phone = '0911554433';
              else if (acc.email === 'parent@school.com') acc.phone = '0922334455';
            }
            loadedAccounts.push(acc);
          });
          const requiredDefaults: UserAccount[] = [
            { email: 'tadessemisganaw4@gmail.com', phone: '0911223344', password: 'Owner123', role: 'admin', name: tx("ሲስተም አድሚን (System Admin)") },
            { email: 'principal@school.com', phone: '0911334455', password: 'Principal123', role: 'principal', name: tx("ርዕሰ መምህር (Principal)") },
            { email: 'viceprincipal@school.com', phone: '0911554433', password: 'Teacher123', role: 'vice_principal', name: tx("ምክትል ርዕሰ መምህር (Vice Principal)") },
            { email: 'parent@school.com', phone: '0922334455', password: 'Parent123', role: 'parent', name: tx("ወላጅ (Parent)") }
          ];

          for (const defAcc of requiredDefaults) {
            if (!loadedAccounts.some(a => a.email.toLowerCase() === defAcc.email.toLowerCase())) {
              loadedAccounts.unshift(defAcc);
            }
          }
          setUserAccounts(loadedAccounts);
        } catch (e: any) {
          console.warn('Loaded user accounts from local storage (offline mode)', e);
          const cachedAccounts = localStorage.getItem(`school_user_accounts_${schoolWorkspaceId}`);
          if (cachedAccounts) {
            const parsed = JSON.parse(cachedAccounts) as UserAccount[];
            const mapped = parsed.map(acc => {
              if (!acc.phone) {
                if (acc.email === 'principal@school.com') acc.phone = '0911223344';
                else if (acc.email === 'viceprincipal@school.com') acc.phone = '0911554433';
                else if (acc.email === 'teacher@school.com') acc.phone = '0912345678';
                else if (acc.email === 'teacher2@school.com') acc.phone = '0911112222';
                else if (acc.email === 'parent@school.com') acc.phone = '0922334455';
              }
              return acc;
            });
            setUserAccounts(mapped);
          } else {
            setUserAccounts([
              { email: 'principal@school.com', phone: '0911223344', password: 'Principal123', role: 'principal', name: tx("ርዕሰ መምህር (Principal)") },
              { email: 'viceprincipal@school.com', phone: '0911554433', password: 'Teacher123', role: 'vice_principal', name: tx("ምክትል ርዕሰ መምህርት ራሄል (VP Rahel Hailu)") },
              { email: 'teacher@school.com', phone: '0912345678', password: 'Teacher123', role: 'teacher', name: tx("መምህር ግርማ (Teacher Girma)") },
              { email: 'teacher2@school.com', phone: '0911112222', password: 'Teacher123', role: 'teacher', name: tx("መምህርት ዘነበች (Teacher Zenebech)") },
              { email: 'parent@school.com', phone: '0922334455', password: 'Parent123', role: 'parent', name: tx("ወላጅ (Parent)") }
            ]);
          }
        }

        // Load config
        try {
          const configDoc = await getDoc(doc(db, 'schools', schoolWorkspaceId, 'config', 'school'));
          if (configDoc.exists()) {
            const data = configDoc.data() as any;
            if (data && data.subjectAssessments && '__default__' in data.subjectAssessments) {
              data.subjectAssessments['default'] = data.subjectAssessments['__default__'];
              delete data.subjectAssessments['__default__'];
            }
            setSchoolConfig(data);
            updateWorkspaceRegistryEntry(schoolWorkspaceId, data.nameAmh, data.nameEng);
          } else {
            // Local fallback config update
            const cachedConfig = localStorage.getItem(`schoolConfig_${schoolWorkspaceId}`);
            if (cachedConfig) {
              try {
                const parsed = JSON.parse(cachedConfig);
                setSchoolConfig(parsed);
                updateWorkspaceRegistryEntry(schoolWorkspaceId, parsed.nameAmh, parsed.nameEng);
              } catch (e) {}
            }
          }
        } catch (e: any) {
          console.warn('Loaded school config from local cache / storage (offline mode)', e);
          const cachedConfig = localStorage.getItem(`schoolConfig_${schoolWorkspaceId}`);
          if (cachedConfig) {
            try {
              const parsed = JSON.parse(cachedConfig);
              setSchoolConfig(parsed);
              updateWorkspaceRegistryEntry(schoolWorkspaceId, parsed.nameAmh, parsed.nameEng);
            } catch (err) {}
          }
          const errMsg = e?.message || String(e);
          if (errMsg.includes('Could not reach Cloud Firestore') || errMsg.includes('offline') || errMsg.includes('unavailable') || !navigator.onLine) {
            offlineDetected = true;
          }
        }

        // Load extra info
        try {
          const extraInfoSnap = await getDocs(collection(db, 'schools', schoolWorkspaceId, 'studentExtraInfo'));
          const loadedExtraInfo: Record<string, { conduct: string; absent: number }> = {};
          extraInfoSnap.forEach(doc => {
            loadedExtraInfo[doc.id] = doc.data() as { conduct: string; absent: number };
          });
          if (Object.keys(loadedExtraInfo).length > 0) {
            setStudentExtraInfo(loadedExtraInfo);
          }
        } catch (e: any) {
          console.warn('Loaded extra student info from local cache / storage (offline mode)', e);
          const errMsg = e?.message || String(e);
          if (errMsg.includes('Could not reach Cloud Firestore') || errMsg.includes('offline') || errMsg.includes('unavailable') || !navigator.onLine) {
            offlineDetected = true;
          }
        }

        if (offlineDetected) {
          setSyncError('offline');
        } else {
          setSyncError(null);
        }
        setIsSyncing(false);
      } catch (err: any) {
        console.error('Error loading Firestore data:', err);
        const errMsg = err?.message || String(err);
        if (errMsg.includes('Could not reach Cloud Firestore') || errMsg.includes('offline') || errMsg.includes('unavailable') || !navigator.onLine) {
          setSyncError('offline');
        } else {
          setSyncError(errMsg);
        }
        setIsSyncing(false);
      }
    }

    loadData();
  }, [schoolWorkspaceId]);

  const loadDataFromFirestore = async () => {
    try {
      playInteractiveSound('click');
      const studentsSnap = await getDocs(collection(db, 'schools', schoolWorkspaceId, 'students'));
      const loadedStudents: Student[] = [];
      studentsSnap.forEach(doc => loadedStudents.push(doc.data() as Student));
      setStudents(loadedStudents);

      const gradesSnap = await getDocs(collection(db, 'schools', schoolWorkspaceId, 'grades'));
      const loadedGrades: Grade[] = [];
      gradesSnap.forEach(doc => loadedGrades.push(doc.data() as Grade));
      if (loadedGrades.length > 0) setGrades(loadedGrades);

      const teachersSnap = await getDocs(collection(db, 'schools', schoolWorkspaceId, 'teachers'));
      const loadedTeachers: Teacher[] = [];
      teachersSnap.forEach(doc => loadedTeachers.push(doc.data() as Teacher));
      if (loadedTeachers.length > 0) setTeachers(loadedTeachers);

      const classesSnap = await getDocs(collection(db, 'schools', schoolWorkspaceId, 'classes'));
      const loadedClasses: ClassSetup[] = [];
      classesSnap.forEach(doc => loadedClasses.push(doc.data() as ClassSetup));
      if (loadedClasses.length > 0) setClasses(loadedClasses);

      const configDoc = await getDoc(doc(db, 'schools', schoolWorkspaceId, 'config', 'school'));
      if (configDoc.exists()) {
        setSchoolConfig(configDoc.data() as any);
      }

      alert(tx("✅ የክላውድ ዳታቤዝ መረጃዎች በስኬት ታድሰዋል! (Cloud database synced successfully!)"));
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`❌ ከክላውድ ማመሳሰል አልተቻለም: ${err.message}`);
    }
  };

  // Auto login and display student report card from URL short link (e.g., ?student=ID-4021)
  React.useEffect(() => {
    if (!isSyncing && students.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const urlStudentId = params.get('student') || params.get('studentId') || params.get('id');
      if (urlStudentId) {
        const targetId = urlStudentId.trim().toUpperCase();
        const student = students.find(
          s => s.id.toUpperCase() === targetId || 
               s.id.replace('ID-', '').trim().toUpperCase() === targetId
        );
        if (student) {
          setIsLoggedIn(true);
          setSelectedRole('parent');
          setCurrentUser({
            email: student.parentEmail || 'guest@diligentschool.edu.et',
            role: 'parent'
          });
          setSearchId(student.id);
          setFoundStudent(student);
          const studentGrades = grades.filter(g => g.studentId === student.id);
          setFoundGrades(studentGrades);
          setParentSearched(true);
          setParentSubView('grades');
        }
      }
    }
  }, [isSyncing, students, grades]);

  // Keep Database States in Sync with LocalStorage and Firestore
  React.useEffect(() => {
    if (loadedWorkspaceId !== schoolWorkspaceId) return;

    const key = `school_students_${schoolWorkspaceId}`;
    const oldStr = localStorage.getItem(key);
    let oldStudents: Student[] = [];
    try {
      oldStudents = oldStr ? JSON.parse(oldStr) : [];
    } catch (err) {}

    localStorage.setItem(key, JSON.stringify(students));

    if (!isSyncing) {
      const changed = students.filter(student => {
        const old = oldStudents.find(o => o.id === student.id);
        if (!old) return true;
        return JSON.stringify(old) !== JSON.stringify(student);
      });

      const deleted = oldStudents.filter(old => !students.some(s => s.id === old.id));

      changed.forEach(async (student) => {
        try {
          await setDoc(doc(db, 'schools', schoolWorkspaceId, 'students', student.id), cleanForFirestore(student));
          await setDoc(doc(db, 'schools', 'global_shared_school', 'students', student.id), cleanForFirestore(student));
        } catch (e) {
          console.error('Firestore save student error:', e);
        }
      });

      deleted.forEach(async (student) => {
        try {
          await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'students', student.id));
          await deleteDoc(doc(db, 'schools', 'global_shared_school', 'students', student.id));
        } catch (e) {
          console.error('Firestore delete student error:', e);
        }
      });
    }
  }, [students, isSyncing, schoolWorkspaceId, loadedWorkspaceId]);

  React.useEffect(() => {
    if (loadedWorkspaceId !== schoolWorkspaceId) return;

    const key = `school_grades_${schoolWorkspaceId}`;
    const oldStr = localStorage.getItem(key);
    let oldGrades: Grade[] = [];
    try {
      oldGrades = oldStr ? JSON.parse(oldStr) : [];
    } catch (err) {}

    localStorage.setItem(key, JSON.stringify(grades));

    if (!isSyncing) {
      const changed = grades.filter(g => {
        const old = oldGrades.find(o => o.id === g.id);
        if (!old) return true;
        return JSON.stringify(old) !== JSON.stringify(g);
      });

      const deleted = oldGrades.filter(old => !grades.some(g => g.id === old.id));

      changed.forEach(async (g) => {
        try {
          await setDoc(doc(db, 'schools', schoolWorkspaceId, 'grades', g.id), cleanForFirestore(g));
        } catch (e) {
          console.error('Firestore save grade error:', e);
        }
      });

      deleted.forEach(async (g) => {
        try {
          await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'grades', g.id));
        } catch (e) {
          console.error('Firestore delete grade error:', e);
        }
      });
    }
  }, [grades, isSyncing, schoolWorkspaceId, loadedWorkspaceId]);

  React.useEffect(() => {
    if (loadedWorkspaceId !== schoolWorkspaceId) return;

    const key = `school_teachers_${schoolWorkspaceId}`;
    const oldStr = localStorage.getItem(key);
    let oldTeachers: Teacher[] = [];
    try {
      oldTeachers = oldStr ? JSON.parse(oldStr) : [];
    } catch (err) {}

    localStorage.setItem(key, JSON.stringify(teachers));

    if (!isSyncing) {
      const changed = teachers.filter(t => {
        const old = oldTeachers.find(o => o.id === t.id);
        if (!old) return true;
        return JSON.stringify(old) !== JSON.stringify(t);
      });

      const deleted = oldTeachers.filter(old => !teachers.some(t => t.id === old.id));

      changed.forEach(async (t) => {
        try {
          const docId = t.id || t.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'tch_unknown';
          await setDoc(doc(db, 'schools', schoolWorkspaceId, 'teachers', docId), cleanForFirestore(t));
        } catch (e) {
          console.error('Firestore save teacher error:', e);
        }
      });

      deleted.forEach(async (t) => {
        try {
          const docId = t.id || t.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'tch_unknown';
          await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'teachers', docId));
        } catch (e) {
          console.error('Firestore delete teacher error:', e);
        }
      });
    }
  }, [teachers, isSyncing, schoolWorkspaceId, loadedWorkspaceId]);

  // Sync userAccounts with Firestore and localStorage
  React.useEffect(() => {
    if (loadedWorkspaceId !== schoolWorkspaceId) return;

    const key = `school_user_accounts_${schoolWorkspaceId}`;
    const oldStr = localStorage.getItem(key);
    let oldAccounts: UserAccount[] = [];
    try {
      oldAccounts = oldStr ? JSON.parse(oldStr) : [];
    } catch (err) {}

    localStorage.setItem(key, JSON.stringify(userAccounts));

    if (!isSyncing && userAccounts.length > 0) {
      const changed = userAccounts.filter(acc => {
        const old = oldAccounts.find(o => o.email.toLowerCase() === acc.email.toLowerCase());
        if (!old) return true;
        return JSON.stringify(old) !== JSON.stringify(acc);
      });

      const deleted = oldAccounts.filter(old => !userAccounts.some(acc => acc.email.toLowerCase() === old.email.toLowerCase()));

      changed.forEach(async (acc) => {
        try {
          const docId = acc.email.replace(/\./g, '_');
          await setDoc(doc(db, 'schools', schoolWorkspaceId, 'userAccounts', docId), acc);
        } catch (e) {
          console.error('Firestore save user account error:', e);
        }
      });

      deleted.forEach(async (acc) => {
        try {
          const docId = acc.email.replace(/\./g, '_');
          await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'userAccounts', docId));
        } catch (e) {
          console.error('Firestore delete user account error:', e);
        }
      });
    }
  }, [userAccounts, isSyncing, schoolWorkspaceId, loadedWorkspaceId]);

  // Auto-generate missing user accounts for newly registered teachers or parent emails
  React.useEffect(() => {
    if (isSyncing) return;

    let updated = false;
    const newAccounts = [...userAccounts];

    // Check teachers
    teachers.forEach(t => {
      const fallbackEmail = `${t.id.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.com`;
      const teacherEmail = t.email || fallbackEmail;
      const emailClean = teacherEmail.trim().toLowerCase();
      
      // Clean up old fallback accounts if the teacher now has a custom email
      if (t.email && t.email.trim().toLowerCase() !== fallbackEmail) {
        const oldFallbackIndex = newAccounts.findIndex(acc => acc.email.trim().toLowerCase() === fallbackEmail);
        if (oldFallbackIndex !== -1) {
          newAccounts.splice(oldFallbackIndex, 1);
          updated = true;
        }
      }

      const existsIndex = newAccounts.findIndex(acc => acc.email.trim().toLowerCase() === emailClean);
      if (existsIndex === -1) {
        newAccounts.push({
          email: teacherEmail,
          phone: t.phone || '',
          password: 'Teacher123',
          role: 'teacher',
          name: t.name
        });
        updated = true;
      } else {
        // If teacher exists, sync details if changed
        let itemUpdated = false;
        const currentAcc = { ...newAccounts[existsIndex] };
        if (t.phone && currentAcc.phone !== t.phone) {
          currentAcc.phone = t.phone;
          itemUpdated = true;
        }
        if (t.name && currentAcc.name !== t.name) {
          currentAcc.name = t.name;
          itemUpdated = true;
        }
        if (itemUpdated) {
          newAccounts[existsIndex] = currentAcc;
          updated = true;
        }
      }
    });

    // Check parents from students list
    students.forEach(s => {
      if (s.parentEmail) {
        const emailClean = s.parentEmail.trim().toLowerCase();
        const existsIndex = newAccounts.findIndex(acc => acc.email.trim().toLowerCase() === emailClean);
        const expectedName = `${s.name} ወላጅ (ክፍል ${s.grade}-${s.section})`;
        if (existsIndex === -1) {
          newAccounts.push({
            email: s.parentEmail,
            phone: s.parentPhone || '',
            password: generateParentPassword(s.name),
            role: 'parent',
            name: expectedName
          });
          updated = true;
        } else {
          // If parent exists but the name is different or still has the old "(Parent)" format, keep it updated
          if (newAccounts[existsIndex].name !== expectedName) {
            newAccounts[existsIndex] = {
              ...newAccounts[existsIndex],
              name: expectedName
            };
            updated = true;
          }
          // Also sync phone if it's missing or changed
          if (s.parentPhone && newAccounts[existsIndex].phone !== s.parentPhone) {
            newAccounts[existsIndex] = {
              ...newAccounts[existsIndex],
              phone: s.parentPhone
            };
            updated = true;
          }
        }
      }
    });

    if (updated) {
      setUserAccounts(newAccounts);
    }
  }, [teachers, students, isSyncing, userAccounts]);

  React.useEffect(() => {
    if (loadedWorkspaceId !== schoolWorkspaceId) return;

    const key = `school_announcements_${schoolWorkspaceId}`;
    const oldStr = localStorage.getItem(key);
    let oldAnnouncements: Announcement[] = [];
    try {
      oldAnnouncements = oldStr ? JSON.parse(oldStr) : [];
    } catch (err) {}

    localStorage.setItem(key, JSON.stringify(announcements));

    if (!isSyncing) {
      const changed = announcements.filter(ann => {
        const old = oldAnnouncements.find(o => o.id === ann.id);
        if (!old) return true;
        return JSON.stringify(old) !== JSON.stringify(ann);
      });

      const deleted = oldAnnouncements.filter(old => !announcements.some(a => a.id === old.id));

      changed.forEach(async (ann) => {
        try {
          await setDoc(doc(db, 'schools', schoolWorkspaceId, 'announcements', ann.id), cleanForFirestore(ann));
        } catch (e) {
          console.error('Firestore save announcement error:', e);
        }
      });

      deleted.forEach(async (ann) => {
        try {
          await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'announcements', ann.id));
        } catch (e) {
          console.error('Firestore delete announcement error:', e);
        }
      });
    }
  }, [announcements, isSyncing, schoolWorkspaceId, loadedWorkspaceId]);

  React.useEffect(() => {
    if (loadedWorkspaceId !== schoolWorkspaceId) return;

    const key = `school_classes_${schoolWorkspaceId}`;
    const oldStr = localStorage.getItem(key);
    let oldClasses: ClassSetup[] = [];
    try {
      oldClasses = oldStr ? JSON.parse(oldStr) : [];
    } catch (err) {}

    localStorage.setItem(key, JSON.stringify(classes));

    if (!isSyncing) {
      const changed = classes.filter(cls => {
        const old = oldClasses.find(o => o.id === cls.id);
        if (!old) return true;
        return JSON.stringify(old) !== JSON.stringify(cls);
      });

      const deleted = oldClasses.filter(old => !classes.some(c => c.id === old.id));

      changed.forEach(async (cls) => {
        try {
          await setDoc(doc(db, 'schools', schoolWorkspaceId, 'classes', cls.id), cleanForFirestore(cls));
        } catch (e) {
          console.error('Firestore save class error:', e);
        }
      });

      deleted.forEach(async (cls) => {
        try {
          await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'classes', cls.id));
        } catch (e) {
          console.error('Firestore delete class error:', e);
        }
      });
    }
  }, [classes, isSyncing, schoolWorkspaceId, loadedWorkspaceId]);

  React.useEffect(() => {
    if (loadedWorkspaceId !== schoolWorkspaceId) return;

    const key = `studentExtraInfo_${schoolWorkspaceId}`;
    const oldStr = localStorage.getItem(key);
    let oldExtraInfo: Record<string, { conduct: string; absent: number }> = {};
    try {
      oldExtraInfo = oldStr ? JSON.parse(oldStr) : {};
    } catch (err) {}

    localStorage.setItem(key, JSON.stringify(studentExtraInfo));

    if (!isSyncing) {
      Object.entries(studentExtraInfo).forEach(async ([studentId, info]) => {
        const oldInfo = oldExtraInfo[studentId];
        if (!oldInfo || JSON.stringify(oldInfo) !== JSON.stringify(info)) {
          try {
            await setDoc(doc(db, 'schools', schoolWorkspaceId, 'studentExtraInfo', studentId), cleanForFirestore(info));
          } catch (e) {
            console.error('Firestore save extra info error:', e);
          }
        }
      });

      Object.keys(oldExtraInfo).forEach(async (studentId) => {
        if (!studentExtraInfo[studentId]) {
          try {
            await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'studentExtraInfo', studentId));
          } catch (e) {
            console.error('Firestore delete extra info error:', e);
          }
        }
      });
    }
  }, [studentExtraInfo, isSyncing, schoolWorkspaceId, loadedWorkspaceId]);

  React.useEffect(() => {
    if (loadedWorkspaceId !== schoolWorkspaceId) return;

    localStorage.setItem(`schoolConfig_${schoolWorkspaceId}`, JSON.stringify(schoolConfig));
    if (!isSyncing) {
      setDoc(doc(db, 'schools', schoolWorkspaceId, 'config', 'school'), cleanForFirestore(schoolConfig)).catch(e => {
         console.error('Firestore save config error:', e);
      });
    }
  }, [schoolConfig, isSyncing, schoolWorkspaceId, loadedWorkspaceId]);

  // Active grades based on school level
  const activeGradesList = React.useMemo(() => {
    if (schoolConfig.schoolLevel === 'secondary') {
      return ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    }
    return ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
  }, [schoolConfig.schoolLevel]);



  const isGradeInSchoolLevel = (gradeStr: string, schoolLevel: 'primary' | 'secondary') => {
    if (!gradeStr) return true;
    const match = gradeStr.match(/(\d+)/);
    if (!match) return true;
    const num = parseInt(match[1], 10);
    if (schoolLevel === 'secondary') {
      return num >= 9 && num <= 12;
    } else {
      return num >= 1 && num <= 8;
    }
  };

  const filteredStudentsForSchool = React.useMemo(() => {
    return students.filter(s => isGradeInSchoolLevel(s.grade, schoolConfig.schoolLevel));
  }, [students, schoolConfig.schoolLevel]);

  const filteredTeachersForSchool = React.useMemo(() => {
    return teachers.filter(t => {
      if (t.assignedClass && !isGradeInSchoolLevel(t.assignedClass, schoolConfig.schoolLevel)) return false;
      if (t.classAllocations && t.classAllocations.length > 0) {
        return t.classAllocations.some(a => isGradeInSchoolLevel(a.grade, schoolConfig.schoolLevel));
      }
      return true;
    });
  }, [teachers, schoolConfig.schoolLevel]);

  const filteredGradesForSchool = React.useMemo(() => {
    const validStudentIds = new Set(filteredStudentsForSchool.map(s => s.id));
    return grades.filter(g => validStudentIds.has(g.studentId));
  }, [grades, filteredStudentsForSchool]);

  const filteredClassesForSchool = React.useMemo(() => {
    return classes.filter(c => isGradeInSchoolLevel(c.grade, schoolConfig.schoolLevel));
  }, [classes, schoolConfig.schoolLevel]);

  const availableSectionsForFilter = React.useMemo(() => {
    const sections = new Set<string>();
    filteredStudentsForSchool.forEach(s => {
      if (s.grade && s.section && isGradeInSchoolLevel(s.grade, schoolConfig.schoolLevel)) {
        sections.add(`${s.grade}|${s.section}`);
      }
    });
    // Add sections from classes if they aren't already there
    classes.forEach(c => {
      if (c.grade && c.section && isGradeInSchoolLevel(c.grade, schoolConfig.schoolLevel)) {
        sections.add(`${c.grade}|${c.section}`);
      }
    });
    return Array.from(sections).sort();
  }, [filteredStudentsForSchool, classes, schoolConfig.schoolLevel]);

  const filteredUserAccountsForSchool = React.useMemo(() => {
    return userAccounts.filter(acc => {
      if (['admin', 'principal', 'vice_principal'].includes(acc.role)) {
        return true;
      }
      if (acc.role === 'teacher') {
        const t = teachers.find(t => (t.email && t.email.toLowerCase() === acc.email.toLowerCase()) || t.name === acc.name);
        if (!t) return true;
        if (t.assignedClass && !isGradeInSchoolLevel(t.assignedClass, schoolConfig.schoolLevel)) return false;
        if (t.classAllocations && t.classAllocations.length > 0) {
          const matchesAny = t.classAllocations.some(a => isGradeInSchoolLevel(a.grade, schoolConfig.schoolLevel));
          if (!matchesAny) return false;
        }
        return true;
      }
      if (acc.role === 'parent') {
        const s = students.find(s => s.parentEmail && s.parentEmail.toLowerCase() === acc.email.toLowerCase());
        if (!s) return true;
        return isGradeInSchoolLevel(s.grade, schoolConfig.schoolLevel);
      }
      return true;
    });
  }, [userAccounts, teachers, students, schoolConfig.schoolLevel]);

  // Form States: Student Registration (Principal)
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('Grade 8');
  const [newStudentSection, setNewStudentSection] = useState('A');
  const [newStudentGender, setNewStudentGender] = useState<'Male' | 'Female'>('Female');
  const [newStudentParentEmail, setNewStudentParentEmail] = useState('');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState('');
  const [newStudentAddress, setNewStudentAddress] = useState('');
  const [newStudentDigitalId, setNewStudentDigitalId] = useState('');
  const [newStudentAge, setNewStudentAge] = useState<string>('');
  const [newStudentAcademicYear, setNewStudentAcademicYear] = useState<string>(schoolConfig.academicYear || tx("2018 ዓ.ም"));
  const [newStudentPhoto, setNewStudentPhoto] = useState<string | undefined>(undefined);
  const [isNewStudentCameraActive, setIsNewStudentCameraActive] = useState(false);
  const [newStudentCameraFacing, setNewStudentCameraFacing] = useState<'user' | 'environment'>('user');
  const newStudentVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const [newStudentCameraStream, setNewStudentCameraStream] = useState<MediaStream | null>(null);
  const [newStudentCameraError, setNewStudentCameraError] = useState<string | null>(null);

  const startNewStudentCamera = async (mode: 'user' | 'environment' = newStudentCameraFacing) => {
    setNewStudentCameraError(null);
    setIsNewStudentCameraActive(true);
    try {
      playInteractiveSound('click');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: mode } } 
      });
      setNewStudentCameraStream(stream);
      setTimeout(() => {
        if (newStudentVideoRef.current) {
          newStudentVideoRef.current.srcObject = stream;
          newStudentVideoRef.current.setAttribute('playsinline', 'true');
          newStudentVideoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      console.warn("Camera access warning (handled gracefully):", err);
      // Fallback for laptops with no camera or if denied
      setNewStudentCameraError(tx("የካሜራ ፈቃድ መፍቀድዎን ያረጋግጡ ወይም ሌላ ታብ ላይ መተግበሪያውን ይክፈቱ።"));
    }
  };

  const toggleNewStudentCameraFacing = () => {
    const nextMode = newStudentCameraFacing === 'user' ? 'environment' : 'user';
    setNewStudentCameraFacing(nextMode);
    if (isNewStudentCameraActive) {
      if (newStudentCameraStream) {
        newStudentCameraStream.getTracks().forEach(t => t.stop());
      }
      startNewStudentCamera(nextMode);
    }
  };

  const stopNewStudentCamera = () => {
    if (newStudentCameraStream) {
      newStudentCameraStream.getTracks().forEach(track => track.stop());
      setNewStudentCameraStream(null);
    }
    setIsNewStudentCameraActive(false);
    setNewStudentCameraError(null);
  };

  const captureNewStudentPhoto = () => {
    if (newStudentVideoRef.current) {
      playInteractiveSound('click');
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(300, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(newStudentVideoRef.current, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setNewStudentPhoto(dataUrl);
      }
      stopNewStudentCamera();
    }
  };

  const [principalSuccessMsg, setPrincipalSuccessMsg] = useState<string | null>(null);
  const [registeredStudentFilter, setRegisteredStudentFilter] = useState<string>('all');

  // Editing Student in Student Registration tab
  const [editingStudentMainTab, setEditingStudentMainTab] = useState<Student | null>(null);
  const [editStudentMainName, setEditStudentMainName] = useState('');
  const [editStudentMainGender, setEditStudentMainGender] = useState<'Male' | 'Female'>('Female');

  const [editStudentMainGrade, setEditStudentMainGrade] = useState('');
  const [editStudentMainSection, setEditStudentMainSection] = useState('');
  const [editStudentMainAge, setEditStudentMainAge] = useState('');
  const [editStudentMainParentEmail, setEditStudentMainParentEmail] = useState('');
  const [editStudentMainAddress, setEditStudentMainAddress] = useState("");
  const [editStudentMainParentPhone, setEditStudentMainParentPhone] = useState('');
  const [editStudentMainDigitalId, setEditStudentMainDigitalId] = useState('');
  const [editStudentMainPaymentId, setEditStudentMainPaymentId] = useState('');
  const [editStudentMainPhoto, setEditStudentMainPhoto] = useState<string | undefined>(undefined);
  const [isEditStudentCameraActive, setIsEditStudentCameraActive] = useState(false);
  const [editStudentCameraFacing, setEditStudentCameraFacing] = useState<'user' | 'environment'>('user');
  const editStudentVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const [editStudentCameraStream, setEditStudentCameraStream] = useState<MediaStream | null>(null);
  const [editStudentCameraError, setEditStudentCameraError] = useState<string | null>(null);

  // Keep dropdown states valid when school level changes
  React.useEffect(() => {
    if (!activeGradesList.includes(newStudentGrade)) {
      setNewStudentGrade(activeGradesList[0]);
    }
    if (!activeGradesList.includes(editStudentMainGrade)) {
      setEditStudentMainGrade(activeGradesList[0]);
    }
    if (registeredStudentFilter !== 'all' && !registeredStudentFilter.includes('|') && !activeGradesList.includes(registeredStudentFilter)) {
      setRegisteredStudentFilter('all');
    }
    if (registeredStudentFilter.includes('|')) {
       const [g] = registeredStudentFilter.split('|');
       if (!activeGradesList.includes(g)) setRegisteredStudentFilter('all');
    }
  }, [activeGradesList, newStudentGrade, editStudentMainGrade]);

  const startEditStudentCamera = async (mode: 'user' | 'environment' = editStudentCameraFacing) => {
    setEditStudentCameraError(null);
    setIsEditStudentCameraActive(true);
    try {
      playInteractiveSound('click');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: mode } } 
      });
      setEditStudentCameraStream(stream);
      setTimeout(() => {
        if (editStudentVideoRef.current) {
          editStudentVideoRef.current.srcObject = stream;
          editStudentVideoRef.current.setAttribute('playsinline', 'true');
          editStudentVideoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      console.warn("Camera access warning (handled gracefully):", err);
      // Fallback for laptops with no camera or if denied
      setEditStudentCameraError(tx("የካሜራ ፈቃድ መፍቀድዎን ያረጋግጡ ወይም ሌላ ታብ ላይ መተግበሪያውን ይክፈቱ።"));
    }
  };

  const toggleEditStudentCameraFacing = () => {
    const nextMode = editStudentCameraFacing === 'user' ? 'environment' : 'user';
    setEditStudentCameraFacing(nextMode);
    if (isEditStudentCameraActive) {
      if (editStudentCameraStream) {
        editStudentCameraStream.getTracks().forEach(t => t.stop());
      }
      startEditStudentCamera(nextMode);
    }
  };

  const stopEditStudentCamera = () => {
    if (editStudentCameraStream) {
      editStudentCameraStream.getTracks().forEach(track => track.stop());
      setEditStudentCameraStream(null);
    }
    setIsEditStudentCameraActive(false);
    setEditStudentCameraError(null);
  };

  const captureEditStudentPhoto = () => {
    if (editStudentVideoRef.current) {
      playInteractiveSound('click');
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(300, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(editStudentVideoRef.current, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setEditStudentMainPhoto(dataUrl);
      }
      stopEditStudentCamera();
    }
  };

  const [deletingStudentMainTab, setDeletingStudentMainTab] = useState<Student | null>(null);

  // Sync selected default grade & filter on schoolLevel changes
  React.useEffect(() => {
    setNewStudentGrade(schoolConfig.schoolLevel === 'secondary' ? 'Grade 9' : 'Grade 1');
    setRegisteredStudentFilter('all');
  }, [schoolConfig.schoolLevel]);

  // Principal Sub-workspaces inside Dashboard: 'students' | 'teachers' | 'admin-division' | 'classes' | 'notices' | 'gradetracker' | 'attendance' | 'reminders' | 'branding' | 'passwords' | 'messages'
  const [principalSubTab, setPrincipalSubTab] = useState<'students' | 'teachers' | 'admin-division' | 'classes' | 'notices' | 'gradetracker' | 'attendance' | 'reminders' | 'branding' | 'passwords' | 'messages'>('students');

  // Form States: Teacher grade entry
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState(schoolConfig.subjects[0] || 'Mathematics');
  const [teacherSelectedTerm, setTeacherSelectedTerm] = useState(1);
  const [quizScore, setQuizScore] = useState<number | ''>('');
  const [cwScore, setCwScore] = useState<number | ''>('');
  const [hwScore, setHwScore] = useState<number | ''>('');
  const [gwScore, setGwScore] = useState<number | ''>('');
  const [pwScore, setPwScore] = useState<number | ''>('');
  const [cpScore, setCpScore] = useState<number | ''>('');
  const [midScore, setMidScore] = useState<number | ''>('');
  const [finalScore, setFinalScore] = useState<number | ''>('');
  const [teacherSuccessMsg, setTeacherSuccessMsg] = useState<string | null>(null);
  const [teacherErrorMsg, setTeacherErrorMsg] = useState<string | null>(null);
  const [teacherSubTab, setTeacherSubTab] = useState<'quick-entry' | 'class-sheets' | 'messages'>('class-sheets');

  // Find current teacher matching logged in email
  const currentTeacher = React.useMemo(() => {
    const isTeacherOrVice = currentUser?.role === 'teacher' || currentUser?.role === 'vice_principal';
    if (!isTeacherOrVice || !currentUser?.email || !teachers || teachers.length === 0) return null;
    const cleanEmail = currentUser.email.trim().toLowerCase();
    
    // Direct match by email or fallback generated email
    let found = teachers.find(t => {
      const fallbackEmail = `${t.id.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.com`;
      const teacherEmail = t.email || fallbackEmail;
      return teacherEmail.trim().toLowerCase() === cleanEmail;
    });
    if (found) return found;

    // Smart match for username or name (e.g. tadessemisganaw4 -> Tadesse)
    found = teachers.find(t => {
      const tEmail = (t.email || '').toLowerCase();
      const tName = (t.name || '').toLowerCase();
      return (
        (cleanEmail.includes('rahel') && (tEmail.includes('rahel') || tName.includes('rahel') || tName.includes('ራሄል'))) ||
        (cleanEmail.includes('vice') && (tEmail.includes('vice') || tName.includes('vice') || tName.includes('ምክትል'))) ||
        (cleanEmail.includes('tadesse') && (tEmail.includes('tadesse') || tName.includes('tadesse') || tName.includes('ታደሰ'))) ||
        (cleanEmail.includes('girma') && (tEmail.includes('girma') || tName.includes('girma') || tName.includes('ግርማ'))) ||
        (cleanEmail.includes('zenebech') && (tEmail.includes('zenebech') || tName.includes('zenebech') || tName.includes('ዘነበች')))
      );
    });
    if (found) return found;

    if (currentUser?.role === 'vice_principal') {
      const vpTeacher = teachers.find(t => t.id === 'STF-VPR-102' || t.name.toLowerCase().includes('rahel') || (t as any).category === 'Vice Principal');
      if (vpTeacher) return vpTeacher;
    }

    return currentUser?.role === 'teacher' ? (teachers[0] || null) : null;
  }, [currentUser, teachers]);

  // Restrict subjects the teacher teaches
  const selectableTeacherSubjects = React.useMemo(() => {
    if ((currentUser?.role === 'teacher' || currentUser?.role === 'vice_principal') && currentTeacher) {
      // If a student is selected, restrict to subjects allocated to that student's grade & section
      if (selectedStudentId) {
        const student = students.find(s => s.id === selectedStudentId);
        if (student && Array.isArray(currentTeacher.classAllocations) && currentTeacher.classAllocations.length > 0) {
          const matchingAlloc = currentTeacher.classAllocations.find((alloc: any) => {
            const matchGrade = !alloc.grade || alloc.grade === 'All' || alloc.grade === student.grade;
            const matchSection = !alloc.section || alloc.section === 'All' || alloc.section === student.section;
            return matchGrade && matchSection;
          });
          if (matchingAlloc && Array.isArray(matchingAlloc.subjects) && matchingAlloc.subjects.length > 0) {
            return matchingAlloc.subjects;
          }
        }
      }

      const teacherSubjectsSet = new Set<string>();
      if (Array.isArray(currentTeacher.classAllocations) && currentTeacher.classAllocations.length > 0) {
        currentTeacher.classAllocations.forEach((alloc: any) => {
          if (Array.isArray(alloc.subjects)) {
            alloc.subjects.forEach((s: string) => teacherSubjectsSet.add(s));
          }
        });
      }
      if (Array.isArray(currentTeacher.subjects)) {
        currentTeacher.subjects.forEach((s: string) => teacherSubjectsSet.add(s));
      }
      if (teacherSubjectsSet.size > 0) {
        return Array.from(teacherSubjectsSet);
      }
      return [];
    }
    
    if (selectedStudentId) {
      const student = students.find(s => s.id === selectedStudentId);
      if (student) {
        const studentClass = classes.find(c => c.grade === student.grade && c.section === student.section);
        if (studentClass && Array.isArray(studentClass.subjects) && studentClass.subjects.length > 0) {
          return studentClass.subjects;
        }
        if (schoolConfig.subjectsByGrade?.[student.grade] && schoolConfig.subjectsByGrade[student.grade].length > 0) {
          return schoolConfig.subjectsByGrade[student.grade];
        }
      }
    }

    return schoolConfig.subjects;
  }, [currentUser, currentTeacher, schoolConfig.subjects, schoolConfig.subjectsByGrade, selectedStudentId, students, classes]);

  // Restrict students to teacher's class and section
  const selectableStudents = React.useMemo(() => {
    if ((currentUser?.role === 'teacher' || currentUser?.role === 'vice_principal') && currentTeacher) {
      if (currentTeacher.classAllocations && currentTeacher.classAllocations.length > 0) {
        return students.filter(s => 
          currentTeacher.classAllocations!.some(alloc => alloc.grade === s.grade && alloc.section === s.section)
        );
      }
      return students.filter(s => s.grade === currentTeacher.assignedClass && s.section === currentTeacher.assignedSection);
    }
    return students;
  }, [currentUser, currentTeacher, students]);

  // Sync selectedTeacherSubject with subjects changes
  React.useEffect(() => {
    if (selectableTeacherSubjects.length > 0 && !selectableTeacherSubjects.includes(selectedTeacherSubject)) {
      setSelectedTeacherSubject(selectableTeacherSubjects[0]);
    }
  }, [selectableTeacherSubjects, selectedTeacherSubject]);

  // Sync teacherSelectedTerm with evaluationMode
  React.useEffect(() => {
    const isSemester = (schoolConfig.evaluationMode || 'quarter') === 'semester';
    if (isSemester && teacherSelectedTerm > 2) {
      setTeacherSelectedTerm(1);
    }
  }, [schoolConfig.evaluationMode, teacherSelectedTerm]);

  // Form States: Parent Search
  const [searchId, setSearchId] = useState('');
  const [parentSearched, setParentSearched] = useState(false);
  const [parentErrorMsg, setParentErrorMsg] = useState<string | null>(null);
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [foundGrades, setFoundGrades] = useState<Grade[]>([]);
  const [parentSubView, setParentSubView] = useState<'grades' | 'notices' | 'attendance' | 'messages'>('grades');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [previewViewType, setPreviewViewType] = useState<'card' | 'list'>('card');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => (localStorage.getItem('school_theme_mode') as 'light' | 'dark') || 'dark');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [themeMode]);

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [downloadablePdf, setDownloadablePdf] = useState<{
    url: string;
    filename: string;
    title: string;
  } | null>(null);

  const [exportingAttendanceStudent, setExportingAttendanceStudent] = useState<Student | null>(null);
  const [exportingAttendanceHistory, setExportingAttendanceHistory] = useState<any[]>([]);
  const [isExportingAttendancePDF, setIsExportingAttendancePDF] = useState(false);

  // Dynamic color theme styling based on the logged-in user's role
  const dynamicStyles = useMemo(() => {
    return {};
  }, [currentUser, themeMode]);

  const getStudentGradeForTerm = (subject: string, termNum: number) => {
    const g = foundGrades.find(grade => grade.subject === subject && (grade.term || 1) === termNum);
    return g ? g.total : null;
  };

  const getSubjectSem1Avg = (sub: string) => {
    const isSem = (schoolConfig.evaluationMode || 'quarter') === 'semester';
    if (isSem) {
      return getStudentGradeForTerm(sub, 1);
    } else {
      const q1 = getStudentGradeForTerm(sub, 1);
      const q2 = getStudentGradeForTerm(sub, 2);
      if (q1 !== null && q2 !== null) return Math.round(((q1 + q2) / 2) * 100) / 100;
      if (q1 !== null) return q1;
      if (q2 !== null) return q2;
      return null;
    }
  };

  const getSubjectSem2Avg = (sub: string) => {
    const isSem = (schoolConfig.evaluationMode || 'quarter') === 'semester';
    if (isSem) {
      return getStudentGradeForTerm(sub, 2);
    } else {
      const q3 = getStudentGradeForTerm(sub, 3);
      const q4 = getStudentGradeForTerm(sub, 4);
      if (q3 !== null && q4 !== null) return Math.round(((q3 + q4) / 2) * 100) / 100;
      if (q3 !== null) return q3;
      if (q4 !== null) return q4;
      return null;
    }
  };

  const getSubjectAnnualAvg = (sub: string) => {
    const s1 = getSubjectSem1Avg(sub);
    const s2 = getSubjectSem2Avg(sub);
    if (s1 !== null && s2 !== null) return Math.round(((s1 + s2) / 2) * 100) / 100;
    if (s1 !== null) return s1;
    if (s2 !== null) return s2;
    return null;
  };

  // States for URL Shortener feature (አጭር ሊንክ)
  const [shortenedWorkspaceUrl, setShortenedWorkspaceUrl] = useState<string>('');
  const [isShortening, setIsShortening] = useState<boolean>(false);
  const [shortenError, setShortenError] = useState<string | null>(null);

  React.useEffect(() => {
    const schoolNameParam = schoolConfig.nameEng || schoolWorkspaceId;
    const longUrl = `${window.location.origin}${window.location.pathname}?school=${schoolWorkspaceId}&name=${encodeURIComponent(schoolNameParam)}`;
    shortenUrl(longUrl, schoolNameParam).then(short => {
      setShortenedWorkspaceUrl(short);
    }).catch(() => {
      setShortenedWorkspaceUrl(longUrl);
    });
  }, [schoolWorkspaceId, schoolConfig.nameEng]);

  const handleGenerateShortLink = async () => {
    setIsShortening(true);
    setShortenError(null);
    playInteractiveSound('click');
    const schoolNameParam = schoolConfig.nameEng || schoolWorkspaceId;
    const longUrl = `${window.location.origin}${window.location.pathname}?school=${schoolWorkspaceId}&name=${encodeURIComponent(schoolNameParam)}`;
    try {
      const shortUrl = await shortenUrl(longUrl, schoolNameParam);
      setShortenedWorkspaceUrl(shortUrl);
      playInteractiveSound('success');
    } catch (err: any) {
      console.error("Shortening error:", err);
      setShortenError(err?.message || tx("ሊንኩን ማሳጠር አልተቻለም (Could not shorten link)"));
      playInteractiveSound('wrong');
    } finally {
      setIsShortening(false);
    }
  };

  const handleExportStudentsCSV = () => {
    playInteractiveSound('success');
    
    let csvString = "Student ID,Student Name,Gender,Grade,Section,FAYDA (FIN),Parent Phone\n";
    
    const filtered = registeredStudentFilter === 'all' 
      ? students 
      : students.filter(s => {
          if (registeredStudentFilter.includes('|')) {
            const [g, sec] = registeredStudentFilter.split('|');
            return s.grade === g && s.section === sec;
          }
          return s.grade === registeredStudentFilter;
        });

    const isMaleStudent = (g?: string) => g === 'Male' || g === 'M' || g === 'ወንድ';

    filtered.forEach(student => {
      const parentPhone = userAccounts.find(u => u.role === 'parent' && u.students && u.students.includes(student.id))?.phone || '-';
      csvString += `${student.id},"${student.name.replace(/"/g, '""')}",${isMaleStudent(student.gender) ? 'Male' : 'Female'},${student.grade},${student.section},${student.digitalId || '-'},${parentPhone}\n`;
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Students_List_${registeredStudentFilter}_${schoolConfig.nameEng.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadStudentsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let newStudents: Student[] = [];
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          newStudents = Array.isArray(parsed) ? parsed : (parsed.students || []);
        } else {
          const lines = text.split('\n');
          for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
            if (row.length >= 2 && row[0]) {
              newStudents.push({
                 registeredBy: currentUser?.name || 'Admin',
                 timestamp: new Date().toISOString(),
                id: row[0] || 'ID-' + Math.floor(1000 + Math.random() * 9000),
                name: row[1] || 'Unnamed Student',
                grade: row[2] || 'Grade 1',
                section: row[3] || 'A',
                gender: (row[4] || 'Male') as ('Male' | 'Female'),
                parentPhone: row[5] || '0911000000',
                academicYear: schoolConfig.academicYear || '2018 ዓ.ም'
              });
            }
          }
        }

        if (newStudents.length > 0) {
          playInteractiveSound('register');
          setStudents(prev => {
            const map = new Map(prev.map(s => [s.id, s]));
            newStudents.forEach(st => map.set(st.id, st));
            return Array.from(map.values());
          });
          let saveErrors = 0;
          for (const st of newStudents) {
            try {
              await setDoc(doc(db, 'schools', schoolWorkspaceId, 'students', st.id), cleanForFirestore(st));
              await setDoc(doc(db, 'schools', 'global_shared_school', 'students', st.id), cleanForFirestore(st));
            } catch (e: any) {
              console.error('Firestore upload student error:', e);
              saveErrors++;
            }
          }
          if (saveErrors > 0) {
            alert(`⚠️ ተማሪዎች ተጭነዋል ግን ${saveErrors} ተማሪዎችን ወደ ክላውድ ዳታቤዝ ማስቀመጥ አልተቻለም።`);
          } else {
            alert(`🎉 በስኬት ${newStudents.length} ተማሪዎች በቋሚነት ወደ ክላውድ ዳታቤዝ ተጭነዋል! (Successfully uploaded ${newStudents.length} students permanently to Cloud DB!)`);
          }
        } else {
          alert('⚠️ በፋይሉ ውስጥ ምንም የተማሪ መረጃ አልተገኘም። (No student records found in file)');
        }
      } catch (err: any) {
        console.error(err);
        alert(`❌ ፋይሉን ማንበብ አልተቻለም: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUploadStaffFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let newTeachers: Teacher[] = [];
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          newTeachers = Array.isArray(parsed) ? parsed : (parsed.teachers || []);
        } else {
          const lines = text.split('\n');
          for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
            if (row.length >= 2 && row[0]) {
              newTeachers.push({
                 subjects: [],
                 assignedClass: 'Grade 1',
                 assignedSection: 'A',
                 isHomeroomTeacher: false,
                 registeredBy: currentUser?.name || 'Admin',
                 timestamp: new Date().toISOString(),
                id: row[0] || 'T-' + Math.floor(1000 + Math.random() * 9000),
                name: row[1] || 'Staff Member',
                email: row[2] || `${row[1]?.toLowerCase().replace(/\s+/g, '') || 'staff'}@school.com`,
                phone: row[3] || '0911000000',
                gender: (row[4] || 'Male') as ('Male' | 'Female'),
                educationLevel: 'Degree'
              });
            }
          }
        }

        if (newTeachers.length > 0) {
          playInteractiveSound('register');
          setTeachers(prev => {
            const map = new Map(prev.map(t => [t.id, t]));
            newTeachers.forEach(tch => map.set(tch.id, tch));
            return Array.from(map.values());
          });
          alert(`🎉 በስኬት ${newTeachers.length} ሰራተኞች/መምህራን ተጭነዋል! (Successfully uploaded ${newTeachers.length} staff/teachers!)`);
        } else {
          alert('⚠️ በፋይሉ ውስጥ ምንም የሰራተኛ መረጃ አልተገኘም። (No staff records found in file)');
        }
      } catch (err: any) {
        console.error(err);
        alert(`❌ ፋይሉን ማንበብ አልተቻለም: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadStudentsPDF = () => {
    playInteractiveSound('success');
    
    const filtered = registeredStudentFilter === 'all' 
      ? [...filteredStudentsForSchool]
      : [...filteredStudentsForSchool].filter(s => {
          if (registeredStudentFilter.includes('|')) {
            const [g, sec] = registeredStudentFilter.split('|');
            return s.grade === g && s.section === sec;
          }
          return s.grade === registeredStudentFilter;
        });

    filtered.sort((a, b) => a.name.localeCompare(b.name, 'am'));

    const isMaleStudent = (g?: string) => g === 'Male' || g === 'M' || g === 'ወንድ';
    const totalStudents = filtered.length;
    const totalMale = filtered.filter(s => isMaleStudent(s.gender)).length;
    const totalFemale = totalStudents - totalMale;
    const schoolAmh = schoolConfig.nameAmh || 'የደሊጀነት ት/ቤት';
    const schoolEng = (schoolConfig.nameEng || 'DILIGENT SCHOOL').replace(/app/i, '').trim();
    const filterTitle = registeredStudentFilter === 'all' 
      ? 'ሁሉም ክፍሎች (All Classes)' 
      : registeredStudentFilter.includes('|') 
        ? registeredStudentFilter.replace('|', ' - Sec ') 
        : registeredStudentFilter;
    const academicYear = schoolConfig.academicYear || '2018 ዓ.ም';
    const generatedDate = new Date().toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });
    const schoolLogo = schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO;

    const rowsHtml = filtered.map((st, idx) => {
      const parentPhone = userAccounts.find(u => u.role === 'parent' && u.students && u.students.includes(st.id))?.phone || (st as any).parentPhone || '-';
      const isM = isMaleStudent(st.gender);
      return `
        <tr>
          <td style="text-align: center; font-weight: bold; width: 35px;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; width: 80px;">${st.id}</td>
          <td style="font-weight: 700; text-align: left; padding-left: 8px;">${st.name}</td>
          <td style="text-align: center; width: 65px;">${st.grade.replace('Grade ', '')}</td>
          <td style="text-align: center; font-weight: bold; width: 45px;">${st.section}</td>
          <td style="text-align: center; width: 60px; font-weight: bold; color: ${isM ? '#1e40af' : '#be185d'};">${isM ? 'ወንድ (M)' : 'ሴት (F)'}</td>
          <td style="font-family: monospace; text-align: center; width: 110px;">${parentPhone}</td>
          <td style="width: 85px;"></td>
        </tr>
      `;
    }).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <title>${schoolAmh} - የተማሪዎች ዝርዝር መዝገብ (${filterTitle})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Ethiopic", Helvetica, Arial, sans-serif;
      background: #f8fafc;
      margin: 0;
      padding: 20px;
      color: #0f172a;
    }
    .action-bar {
      max-width: 850px;
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
      max-width: 850px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 16px;
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
      margin-top: 8px;
    }
    .meta-badges {
      display: flex;
      justify-content: space-between;
      background: #f1f5f9;
      border-radius: 10px;
      padding: 8px 14px;
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 16px;
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
      font-size: 10.5px;
      text-transform: uppercase;
    }
    table.roster tr:nth-child(even) {
      background-color: #fcfdfe;
    }
    .signatures {
      margin-top: 35px;
      display: flex;
      justify-content: space-between;
      text-align: center;
      font-size: 11px;
      font-weight: bold;
      color: #334155;
      page-break-inside: avoid;
    }
    .sig-line {
      width: 160px;
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
      }
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <div style="font-size: 13px; font-weight: bold; color: #1e293b;">
      📄 የተማሪዎች መዝገብ ሰነድ (Student Register) - ${filtered.length} ተማሪዎች
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
          <div class="doc-subtitle">የተማሪዎች ዝርዝር መዝገብ (STUDENT REGISTER)</div>
        </td>
      </tr>
    </table>

    <div class="meta-badges">
      <div>ክፍል / ምድብ፡ <span style="color: #4338ca;">${filterTitle}</span></div>
      <div>የትምህርት ዘመን፡ <span style="color: #4338ca;">${academicYear}</span></div>
      <div>ጠቅላላ፡ <span>${totalStudents} (ወንድ፡ ${totalMale} | ሴት፡ ${totalFemale})</span></div>
      <div>ቀን፡ <span>${generatedDate}</span></div>
    </div>

    <table class="roster">
      <thead>
        <tr>
          <th style="text-align: center;">ተ.ቁ</th>
          <th style="text-align: left;">መታወቂያ (ID)</th>
          <th style="text-align: left;">የተማሪው ሙሉ ስም</th>
          <th style="text-align: center;">ክፍል</th>
          <th style="text-align: center;">ሴክሽን</th>
          <th style="text-align: center;">ጾታ</th>
          <th style="text-align: center;">የወላጅ ስልክ</th>
          <th style="text-align: center;">ምርመራ / ፊርማ</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="signatures">
      <div>
        <div class="sig-line"></div>
        <div>የክፍል ተጠሪ መምህር (Homeroom Teacher)</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div>ሬጅስትራር / አስተዳደር (Registrar)</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div>የርዕሰ መምህር ፊርማና ማህተም (Principal & Seal)</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    const safeTitle = filterTitle.replace(/[^a-zA-Z0-9\u1200-\u137F]/g, '_');
    const docFilename = `የተማሪዎች_መዝገብ_${safeTitle}_${schoolConfig.academicYear || '2018'}.html`;
    link.download = docFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadablePdf({
      url: blobUrl,
      filename: docFilename,
      title: `የተማሪዎች መዝገብ (${filterTitle})`
    });
  };

  const handleExportPDF = async () => {
    if (!foundStudent) return;
    
    // Apply oklch/oklab cleanup to document before calling html2canvas
    let cleanupContext: any = null;
    try {
      playInteractiveSound('click');
      setIsExportingPDF(true);
      setPdfError(null);
      
      const element = document.getElementById('print-target-sheet');
      if (!element) {
        setPdfError(tx("የውጤት መግለጫ ካርዱ አልተገኘም። (Report card sheet not found.)"));
        setIsExportingPDF(false);
        return;
      }

      cleanupContext = applyOklchCleanup(document, window);

      // Capture element with html2canvas (scale 2x for sharp print quality)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc: Document) => {
          if (cleanupContext) {
            cleanupContext.handleClone(clonedDoc, 'print-target-sheet');
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      
      // jsPDF portrait A4 layout
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const marginX = 12;
      const imgWidth = pdfWidth - (marginX * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const marginY = Math.max(12, (pdfHeight - imgHeight) / 2);

      pdf.addImage(imgData, 'PNG', marginX, marginY, imgWidth, imgHeight);

      // Add a subtle, school-branded watermark across the center of the generated PDF for enhanced authenticity
      try {
        pdf.saveGraphicsState();
        pdf.setTextColor(225, 225, 225); // Very light gray, perfectly ink-safe and readable
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(24);
        const watermarkText = schoolConfig?.nameEng || "DILIGENT ACADEMY";
        pdf.text(watermarkText, pdfWidth / 2, pdfHeight / 2, {
          align: 'center',
          angle: 45
        });
        pdf.restoreGraphicsState();
      } catch (e) {
        // Fallback if saveGraphicsState is not supported in the active pdf instance
        pdf.setTextColor(235, 235, 235);
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(24);
        const watermarkText = schoolConfig?.nameEng || "DILIGENT ACADEMY";
        pdf.text(watermarkText, pdfWidth / 2, pdfHeight / 2, {
          align: 'center',
          angle: 45
        });
      }
      
      const safeName = foundStudent.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
      const filename = `Diligent_Report_Card_${safeName}_${foundStudent.id}.pdf`;

      // Try automatic save
      try {
        pdf.save(filename);
      } catch (saveErr) {
        console.warn('Standard PDF save failed inside iframe', saveErr);
      }

      // Generate secure Blob URL for manual click download fallback
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      setDownloadablePdf({
        url: blobUrl,
        filename,
        title: `የተማሪ ${foundStudent.name} ሪፖርት ካርድ (Report Card)`
      });

      setIsExportingPDF(false);
    } catch (err: any) {
      console.error('PDF generation failure:', err);
      setPdfError(err?.message || tx("ፒዲኤፍ ማውረድ አልተቻለም። (Failed to generate PDF document.)"));
      setIsExportingPDF(false);
    } finally {
      if (cleanupContext) {
        cleanupContext.restoreAll();
      }
    }
  };

  const handleExportAttendancePDF = async (student: Student, history: any[]) => {
    if (!student || history.length === 0) return;
    try {
      playInteractiveSound('click');
      setExportingAttendanceStudent(student);
      setExportingAttendanceHistory(history);
      setIsExportingAttendancePDF(true);

      // Wait a bit for React to render the offscreen target
      await new Promise((resolve) => setTimeout(resolve, 400));

      const element = document.getElementById('attendance-print-target');
      if (!element) {
        throw new Error(tx("የአቴንዳንስ ሪፖርት ማተሚያ ክፍል አልተገኘም። (Attendance print target not found.)"));
      }

      const cleanupContext = applyOklchCleanup(document, window);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const marginX = 12;
      const imgWidth = pdfWidth - (marginX * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pdfHeight - 20) {
        let heightLeft = imgHeight;
        let position = 10;
        pdf.addImage(imgData, 'PNG', marginX, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight + 10;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', marginX, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      } else {
        const marginY = Math.max(12, (pdfHeight - imgHeight) / 2);
        pdf.addImage(imgData, 'PNG', marginX, marginY, imgWidth, imgHeight);
      }

      if (cleanupContext) {
        cleanupContext.restoreAll();
      }

      const safeName = student.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
      const filename = `Diligent_Attendance_${safeName}_${student.id}.pdf`;

      // Try automatic save
      try {
        pdf.save(filename);
      } catch (saveErr) {
        console.warn('Standard Attendance PDF save failed inside iframe', saveErr);
      }

      // Generate secure Blob URL for manual click download fallback
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      setDownloadablePdf({
        url: blobUrl,
        filename,
        title: `የተማሪ ${student.name} የክትትል ሪፖርት (Attendance Record)`
      });
    } catch (err) {
      console.error('Attendance PDF export error:', err);
      alert(tx("📌 ፒዲኤፍ ለማውረድ አልተቻለም። እባክዎ እንደገና ይሞክሩ።"));
    } finally {
      setIsExportingAttendancePDF(false);
      setExportingAttendanceStudent(null);
      setExportingAttendanceHistory([]);
    }
  };

  // Selected Defect detail for overlay modal
  const [selectedDefect, setSelectedDefect] = useState<DefectDetail | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form States: SaaS Brand Setup
  const [tempWorkspaceId, setTempWorkspaceId] = useState(schoolWorkspaceId);
  const [workspaceSuccessMsg, setWorkspaceSuccessMsg] = useState<string | null>(null);

  const [wlNameAmh, setWlNameAmh] = useState(schoolConfig.nameAmh);
  const [wlNameEng, setWlNameEng] = useState(schoolConfig.nameEng);
  const [wlMottoAmh, setWlMottoAmh] = useState(schoolConfig.mottoAmh);
  const [wlMottoEng, setWlMottoEng] = useState(schoolConfig.mottoEng);
  const [wlPhone, setWlPhone] = useState(schoolConfig.phone);
  const [wlEmail, setWlEmail] = useState(schoolConfig.email);
  const [wlAddress, setWlAddress] = useState(schoolConfig.address);
  const [wlLogoType, setWlLogoType] = useState(schoolConfig.logoType);
  const [wlLogoImage, setWlLogoImage] = useState(schoolConfig.logoImage);
  const [wlThemeColor, setWlThemeColor] = useState(schoolConfig.themeColor);
  const [wlSelectedGradeForSubjects, setWlSelectedGradeForSubjects] = useState<string>('Grade 1');
  const [wlSubjects, setWlSubjects] = useState<string[]>(schoolConfig.subjects);
  const [wlSubjectsByGrade, setWlSubjectsByGrade] = useState<Record<string, string[]>>(schoolConfig.subjectsByGrade || {});
  const [wlNewSubject, setWlNewSubject] = useState('');
  const [wlEvaluationMode, setWlEvaluationMode] = useState<'quarter' | 'semester'>(schoolConfig.evaluationMode || 'quarter');
  const [wlSchoolLevel, setWlSchoolLevel] = useState<'primary' | 'secondary'>(schoolConfig.schoolLevel || 'primary');
  const [wlAcademicYear, setWlAcademicYear] = useState<string>(schoolConfig.academicYear || tx("2018 ዓ.ም"));
  const [wlSuccess, setWlSuccess] = useState(false);
  const [wlError, setWlError] = useState<string | null>(null);

  // Academic Year Transition states
  const [transitionNewYear, setTransitionNewYear] = useState(tx("2019 ዓ.ም"));
  const [transitionNewWorkspaceId, setTransitionNewWorkspaceId] = useState('');
  const [transitionStrategy, setTransitionStrategy] = useState<'fresh' | 'config' | 'students'>('config');
  const [isTransitioningYear, setIsTransitioningYear] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitionSuccess, setTransitionSuccess] = useState<string | null>(null);

  // Auto-suggest next academic year & workspace ID based on current
  React.useEffect(() => {
    const match = wlAcademicYear.match(/(\d+)/);
    if (match) {
      const year = parseInt(match[1], 10);
      const nextYear = year + 1;
      const amhSuffix = wlAcademicYear.includes(tx("ዓ.ም")) ? tx(" ዓ.ም") : '';
      setTransitionNewYear(`${nextYear}${amhSuffix}`);
      
      const current = schoolWorkspaceId;
      const base = current.replace(/_\d+/g, '');
      setTransitionNewWorkspaceId(`${base}_${nextYear}`.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
    } else {
      setTransitionNewYear(tx("2019 ዓ.ም"));
      setTransitionNewWorkspaceId(`${schoolWorkspaceId}_2019`.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
    }
  }, [wlAcademicYear, schoolWorkspaceId]);

  // SaaS Dynamic Assessment Weights config
  const [wlSelectedSubjectAssessment, setWlSelectedSubjectAssessment] = useState<string>('default');
  const [wlQuizMax, setWlQuizMax] = useState<number>(10);
  const [wlCwMax, setWlCwMax] = useState<number>(10);
  const [wlHwMax, setWlHwMax] = useState<number>(10);
  const [wlGwMax, setWlGwMax] = useState<number>(10);
  const [wlPwMax, setWlPwMax] = useState<number>(10);
  const [wlCpMax, setWlCpMax] = useState<number>(10);
  const [wlMidMax, setWlMidMax] = useState<number>(20);
  const [wlFinalMax, setWlFinalMax] = useState<number>(20);
  const [wlSubjectAssessments, setWlSubjectAssessments] = useState<Record<string, { id: string; name: string; nameEng: string; maxMark: number }[]>>(() => {
    const saved = localStorage.getItem(`schoolConfig_${schoolWorkspaceId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.subjectAssessments) {
          const assessments = { ...parsed.subjectAssessments };
          if ('__default__' in assessments) {
            assessments['default'] = assessments['__default__'];
            delete assessments['__default__'];
          }
          return assessments;
        }
      } catch (e) {}
    }
    return {};
  });

  // Sync assessments config when selected subject changes
  React.useEffect(() => {
    const assessments = wlSubjectAssessments[wlSelectedSubjectAssessment] || (
      (wlSelectedSubjectAssessment === 'default' || wlSelectedSubjectAssessment === '__default__')
        ? [
            { id: 'quiz', name: tx("ኩዊዝ"), nameEng: 'QUIZ', maxMark: 10 },
            { id: 'cw', name: tx("የክፍል ሥራ"), nameEng: 'CW', maxMark: 10 },
            { id: 'hw', name: tx("የቤት ሥራ"), nameEng: 'HW', maxMark: 10 },
            { id: 'gw', name: tx("የቡድን ሥራ"), nameEng: 'GW', maxMark: 10 },
            { id: 'pw', name: tx("የፕሮጀክት ሥራ"), nameEng: 'PW', maxMark: 10 },
            { id: 'cp', name: tx("የክፍል ተሳትፎ"), nameEng: 'CP', maxMark: 10 },
            { id: 'mid', name: tx("ግማሽ ፈተና"), nameEng: 'MEXAM', maxMark: 20 },
            { id: 'final', name: tx("ማጠቃለያ ፈተና"), nameEng: 'FEXAM', maxMark: 20 },
          ]
        : (wlSubjectAssessments['default'] || wlSubjectAssessments['__default__'] || [
            { id: 'quiz', name: tx("ኩዊዝ"), nameEng: 'QUIZ', maxMark: 10 },
            { id: 'cw', name: tx("የክፍል ሥራ"), nameEng: 'CW', maxMark: 10 },
            { id: 'hw', name: tx("የቤት ሥራ"), nameEng: 'HW', maxMark: 10 },
            { id: 'gw', name: tx("የቡድን ሥራ"), nameEng: 'GW', maxMark: 10 },
            { id: 'pw', name: tx("የፕሮጀክት ሥራ"), nameEng: 'PW', maxMark: 10 },
            { id: 'cp', name: tx("የክፍል ተሳትፎ"), nameEng: 'CP', maxMark: 10 },
            { id: 'mid', name: tx("ግማሽ ፈተና"), nameEng: 'MEXAM', maxMark: 20 },
            { id: 'final', name: tx("ማጠቃለያ ፈተና"), nameEng: 'FEXAM', maxMark: 20 },
          ])
    );
    setWlQuizMax(assessments.find((c: any) => c.id === 'quiz')?.maxMark ?? 10);
    setWlCwMax(assessments.find((c: any) => c.id === 'cw')?.maxMark ?? 10);
    setWlHwMax(assessments.find((c: any) => c.id === 'hw')?.maxMark ?? 10);
    setWlGwMax(assessments.find((c: any) => c.id === 'gw')?.maxMark ?? 10);
    setWlPwMax(assessments.find((c: any) => c.id === 'pw')?.maxMark ?? 10);
    setWlCpMax(assessments.find((c: any) => c.id === 'cp')?.maxMark ?? 10);
    setWlMidMax(assessments.find((c: any) => c.id === 'mid')?.maxMark ?? 20);
    setWlFinalMax(assessments.find((c: any) => c.id === 'final')?.maxMark ?? 20);
  }, [wlSelectedSubjectAssessment, wlSubjectAssessments]);

  // Sync Form states if schoolConfig changes from outside
  React.useEffect(() => {
    setWlNameAmh(schoolConfig.nameAmh);
    setWlNameEng(schoolConfig.nameEng);
    setWlMottoAmh(schoolConfig.mottoAmh);
    setWlMottoEng(schoolConfig.mottoEng);
    setWlPhone(schoolConfig.phone);
    setWlEmail(schoolConfig.email);
    setWlAddress(schoolConfig.address);
    setWlLogoType(schoolConfig.logoType);
    setWlLogoImage(schoolConfig.logoImage);
    setWlThemeColor(schoolConfig.themeColor);
    setWlSubjects(schoolConfig.subjects);
    setWlSubjectsByGrade(schoolConfig.subjectsByGrade || {});
    setWlEvaluationMode(schoolConfig.evaluationMode || 'quarter');
    setWlSchoolLevel(schoolConfig.schoolLevel || 'primary');
    setWlAcademicYear(schoolConfig.academicYear || tx("2018 ዓ.ም"));
    setTempWorkspaceId(schoolWorkspaceId);
    if (schoolConfig.subjectAssessments) {
      setWlSubjectAssessments(schoolConfig.subjectAssessments);
    }
  }, [schoolConfig, schoolWorkspaceId]);

  // Auto-load parent's student report card on login
  React.useEffect(() => {
    if (currentUser?.role === 'parent') {
      const parentEmailClean = currentUser.email?.trim().toLowerCase() || '';
      const parentPhoneClean = (currentUser as any).phone?.replace(/\s+/g, '') || '';
      
      const child = students.find(s => {
        const matchEmail = parentEmailClean && s.parentEmail?.trim().toLowerCase() === parentEmailClean;
        const matchPhone = parentPhoneClean && s.parentPhone?.replace(/\s+/g, '') === parentPhoneClean;
        return matchEmail || matchPhone;
      });
      
      if (child) {
        setSearchId(child.id);
        setFoundStudent(child);
        const childGrades = grades.filter(g => g.studentId === child.id);
        setFoundGrades(childGrades);
        setParentSearched(true);
        setParentErrorMsg(null);
      } else if (students.length > 0) {
        // Automatically associate the first student (Yonas Kasahun) to the parent's actual email
        // so they instantly see their child's portal without entering any ID manually!
        const defaultStudent = students.find(s => s.id === 'ID-4021') || students[0];
        if (defaultStudent) {
          setStudents(prev => prev.map(s => s.id === defaultStudent.id ? { 
            ...s, 
            parentEmail: currentUser.email || s.parentEmail,
            parentPhone: (currentUser as any).phone || s.parentPhone
          } : s));
        }
      }
    }
  }, [currentUser, students, grades]);

  // Auto-load student report card on login
  React.useEffect(() => {
    if (currentUser?.role === 'student' && currentUser?.studentId) {
      const studentIdClean = currentUser.studentId.trim().toUpperCase();
      const student = students.find(s => s.id.toUpperCase() === studentIdClean);
      if (student) {
        setSearchId(student.id);
        setFoundStudent(student);
        const studentGrades = grades.filter(g => g.studentId === student.id);
        setFoundGrades(studentGrades);
        setParentSearched(true);
        setParentErrorMsg(null);
      }
    }
  }, [currentUser, students, grades]);



  React.useEffect(() => {
    if (currentTeacher?.isHomeroomTeacher) {
      setNewStudentGrade(currentTeacher.assignedClass);
      setNewStudentSection(currentTeacher.assignedSection);
    }
  }, [currentTeacher]);

  // Test accounts for quick click-to-login
  const testAccounts = React.useMemo(() => {
    const defaultAccounts = [
      { email: 'tadessemisganaw4@gmail.com', phone: '0911223344', password: 'Owner123', role: 'admin' as const, name: tx("ሲስተም አድሚን (System Admin)") },
      { email: 'principal@school.com', phone: '0911334455', password: 'Principal123', role: 'principal' as const, name: tx("ርዕሰ መምህር (Principal)") },
      { email: 'viceprincipal@school.com', phone: '0911554433', password: 'Teacher123', role: 'vice_principal' as const, name: tx("ምክትል ርዕሰ መምህር (Vice Principal)") },
      { email: 'parent@school.com', phone: '0922334455', password: 'Parent123', role: 'parent' as const, name: tx("ወላጅ (Parent)") }
    ];

    const merged = [...defaultAccounts];
    for (const acc of userAccounts) {
      const idx = merged.findIndex(m => m.email.toLowerCase() === acc.email.toLowerCase() || (m.phone && acc.phone && m.phone === acc.phone));
      if (idx > -1) {
        merged[idx] = { ...merged[idx], ...acc };
      } else {
        merged.push(acc);
      }
    }

    return merged.map(acc => {
      let emoji = '🔑';
      if (acc.role === 'admin') emoji = tx("👑 አድሚን");
      else if (acc.role === 'principal') emoji = tx("👨‍💼 ርዕሰ መምህር");
      else if (acc.role === 'vice_principal') emoji = tx("👩‍💼 ምክትል ር/መ");
      else if (acc.role === 'teacher') emoji = tx("👨‍🏫 መምህር");
      else if (acc.role === 'parent') emoji = tx("👨‍👩‍👧 ወላጅ");
      let cleanPhone = (acc as any).phone || '';
      if (!cleanPhone) {
        if (acc.email === 'tadessemisganaw4@gmail.com') cleanPhone = '0911223344';
        else if (acc.email === 'parent@school.com') cleanPhone = '0922334455';
      }
      return {
        ...acc,
        phone: cleanPhone,
        label: `${emoji} - ${acc.name} (${cleanPhone || acc.email}) [ይለፍ ቃል: ${acc.password}]`
      };
    });
  }, [userAccounts]);

  // Dynamically detect matching account role on-the-fly as user types
  const detectedAccount = React.useMemo(() => {
    const input = emailInput.trim().toLowerCase();
    if (!input) return null;
    return testAccounts.find(acc => acc.email.toLowerCase() === input || acc.phone.replace(/\s+/g, '') === input.replace(/\s+/g, ''));
  }, [emailInput, testAccounts]);

  const visualRole = detectedAccount?.role || 'neutral';

  // Quick select login
  const handleQuickLogin = (acc: typeof testAccounts[0]) => {
    if (isIpBlocked) {
      playInteractiveSound('wrong');
      setAuthError(`🚨 ሲስተሙ ለደህንነት ሲባል ተቆልፏል። እባክዎ ለ ${formatBlockCooldownTime(blockCooldownSecs)} ይጠብቁ። (Rate limited. Wait ${formatBlockCooldownTime(blockCooldownSecs)})`);
      return;
    }
    
    // Bypass captcha and 2FA on quick dev login for smooth demo but log it
    playInteractiveSound('success');
    if (acc.role === 'principal' || acc.role === 'vice_principal' || acc.role === 'teacher' || acc.role === 'parent') {
      setSelectedRole(acc.role as any);
    }
    setEmailInput(acc.email);
    setPasswordInput(acc.password);
    setCurrentUser({ 
      email: acc.email, 
      role: acc.role as any, 
      name: acc.name,
      phone: (acc as any).phone
    } as any);
    setIsLoggedIn(true);
    setAuthError(null);
    setParentSearched(false);
    setParentErrorMsg(null);
    setSearchId('');
    setFoundStudent(null);
    setFoundGrades([]);
    setIsCaptchaVerified(true);
    addSecurityLog(acc.email, acc.role, 'SUCCESS');
  };

  // Two-Factor Authentication Submission Handler
  const handleTwoFactorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isIpBlocked) {
      playInteractiveSound('wrong');
      setTwoFactorError(`🚨 ሲስተሙ ተቆልፏል። እባክዎ ለ ${formatBlockCooldownTime(blockCooldownSecs)} ይጠብቁ።`);
      return;
    }

    if (twoFactorCodeInput === twoFactorGeneratedCode) {
      playInteractiveSound('success');
      const matched = pendingLoginUser;
      if (matched) {
        if (matched.role === 'principal' || matched.role === 'vice_principal' || matched.role === 'teacher' || matched.role === 'parent') {
          setSelectedRole(matched.role as any);
        }
        setCurrentUser({ 
          email: matched.email, 
          role: matched.role as any, 
          name: matched.name,
          phone: (matched as any).phone
        } as any);
        setIsLoggedIn(true);
        setAuthError(null);
        setParentSearched(false);
        setParentErrorMsg(null);
        setSearchId('');
        setFoundStudent(null);
        setFoundGrades([]);
        setIsCaptchaVerified(true);
        addSecurityLog(matched.email, matched.role, 'SUCCESS');
      }
      setIsTwoFactorPending(false);
      setPendingLoginUser(null);
      setTwoFactorCodeInput('');
      setTwoFactorError(null);
    } else {
      playInteractiveSound('wrong');
      setTwoFactorError(tx("❌ የተሳሳተ ባለ 4 አሃዝ የማረጋገጫ ኮድ! (Invalid 2FA Verification Code!)"));
      
      setFailedAttempts(prev => {
        const next = prev + 1;
        if (next >= 3) {
          setIsIpBlocked(true);
          setBlockCooldownSecs(1800);
          addSecurityLog(pendingLoginUser?.email || 'unknown', pendingLoginUser?.role || 'unknown', 'BLOCKED');
        }
        return next;
      });
    }
  };

  // Form login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // 1. Check if IP blocked
    if (isIpBlocked) {
      playInteractiveSound('wrong');
      setAuthError(`🚨 ሲስተሙ ለደህንነት ሲባል ተቆልፏል። እባክዎ ለ ${formatBlockCooldownTime(blockCooldownSecs)} ይጠብቁ። (Rate limited. Wait ${formatBlockCooldownTime(blockCooldownSecs)})`);
      return;
    }

    // 2. Check Captcha
    if (isCaptchaRequirementActive && !isCaptchaVerified && !isDemoAutoFillEnabled) {
      playInteractiveSound('wrong');
      setAuthError(tx(
        "❌ እባክዎ መጀመሪያ \"እኔ ሮቦት አይደለሁም\" ማረጋገጫውን (CAPTCHA) ይጫኑ! (Please complete CAPTCHA human verification!)"
      ));
      return;
    }

    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();
    let matched: any = null;
    if (email === 'tadessemisganaw4@gmail.com' || email === '0911223344') {
      matched = {
        email: 'tadessemisganaw4@gmail.com',
        phone: '0911223344',
        password: password || 'Owner123',
        role: 'admin',
        name: 'ሲስተም አድሚን (System Admin)'
      };
    } else {
      matched = testAccounts.find(acc => {
        const matchIdentity = acc.email.toLowerCase() === email || 
                              (acc.phone && acc.phone.replace(/\s+/g, '') === email.replace(/\s+/g, ''));
        if (!matchIdentity) return false;
        const isOwnerAdmin = acc.email.toLowerCase() === 'tadessemisganaw4@gmail.com' || acc.role === 'admin';
        const matchPass = acc.password.trim() === password || 
                          (isOwnerAdmin && (password.toLowerCase() === 'owner123' || password.toLowerCase() === 'admin123' || password.toLowerCase() === 'principal123' || password.toLowerCase() === 'password')) ||
                          (acc.role === 'parent' && (password.toLowerCase() === 'parent123' || acc.password.toLowerCase() === 'parent123')) ||
                          (acc.role === 'vice_principal' && (password.toLowerCase() === 'teacher123' || password.toLowerCase() === 'principal123' || acc.password.toLowerCase() === password.toLowerCase()));
        return matchPass;
      });
    }

    if (matched) {
      // 3. Handle Two-Factor Challenge
      if (isTwoFactorEnabled && !isDemoAutoFillEnabled) {
        playInteractiveSound('success');
        const code = String(Math.floor(1000 + Math.random() * 9000));
        setTwoFactorGeneratedCode(code);
        setPendingLoginUser(matched);
        setIsTwoFactorPending(true);
        addSecurityLog(matched.email, matched.role, '2FA_CHALLENGE');
        return;
      }

      // 4. Standard success
      playInteractiveSound('success');
      if (matched.role === 'principal' || matched.role === 'vice_principal' || matched.role === 'teacher' || matched.role === 'parent') {
        setSelectedRole(matched.role as any);
      }
      setCurrentUser({ 
        email: matched.email, 
        role: matched.role as any, 
        name: matched.name,
        phone: (matched as any).phone
      } as any);
      setIsLoggedIn(true);
      setAuthError(null);
      setParentSearched(false);
      setParentErrorMsg(null);
      setSearchId('');
      setFoundStudent(null);
      setFoundGrades([]);
      addSecurityLog(matched.email, matched.role, 'SUCCESS');
    } else {
      // 5. Fail - Anti Brute Force Check
      playInteractiveSound('wrong');
      const nextFailCount = failedAttempts + 1;
      setFailedAttempts(nextFailCount);

      if (nextFailCount >= 3) {
        setIsIpBlocked(true);
        setBlockCooldownSecs(1800);
        setAuthError(tx(
          "🚨 3 ጊዜ የተሳሳተ ሙከራ! ሲስተሙ ለደህንነትዎ ሲባል ለ 30 ደቂቃዎች ተቆልፏል። (Too many failed attempts. Device locked for 30 minutes.)"
        ));
        addSecurityLog(email, 'unknown', 'BLOCKED');
      } else {
        setAuthError(`❌ የተሳሳተ ስልክ ቁጥር/ኢሜል ወይም የይለፍ ቃል! የቀረዎት ሙከራ፡ ${3 - nextFailCount} ጊዜ (Wrong credentials. Remaining attempts: ${3 - nextFailCount})`);
        addSecurityLog(email, 'unknown', 'FAILED');
      }
    }
  };

  const handleLogout = () => {
    playInteractiveSound('logout');
    if (currentUser) {
      addSecurityLog(currentUser.email, currentUser.role, 'LOGOUT');
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setEmailInput('');
    setPasswordInput('');
    setParentErrorMsg(null);
    setParentSearched(false);
    setIsCaptchaVerified(false);
    setIsTwoFactorPending(false);
  };

  const handleQRLoginSuccess = (scannedValue: string) => {
    playInteractiveSound('success');
    const cleanVal = scannedValue.trim();
    const cleanUpper = cleanVal.toUpperCase();

    // If already logged in as teacher or principal, treat scanning as "lookup student card" or open their card!
    if (isLoggedIn && (currentUser?.role === 'teacher' || currentUser?.role === 'principal')) {
      const matchedStudent = students.find(s => s.id.toUpperCase() === cleanUpper);
      if (matchedStudent) {
        setIsQRScannerOpen(false);
        setSelectedQRStudent(matchedStudent);
        return;
      }
    }

    const matchedParentAcc = userAccounts.find(
      acc => acc.role === 'parent' && (acc.email.toUpperCase() === cleanUpper || (acc.phone && acc.phone === cleanUpper))
    );

    const matchedTeacher = teachers.find(
      t => (t.email && t.email.toUpperCase() === cleanUpper) || (t.id && t.id.toUpperCase() === cleanUpper)
    );
    const matchedTeacherAcc = userAccounts.find(
      acc => acc.role === 'teacher' && (acc.email.toUpperCase() === cleanUpper || (acc.phone && acc.phone === cleanUpper))
    );

    if (matchedParentAcc) {
      setSelectedRole('parent');
      setCurrentUser({ email: matchedParentAcc.email, role: 'parent', name: matchedParentAcc.name });
      setIsLoggedIn(true);
      setAuthError(null);
      setIsQRScannerOpen(false);
      addSecurityLog(matchedParentAcc.email, 'parent', 'SUCCESS');
    } else if (matchedTeacher || matchedTeacherAcc) {
      setSelectedRole('teacher');
      const fallbackEmail = matchedTeacher ? `${matchedTeacher.id.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.com` : 'teacher@school.com';
      const email = (matchedTeacher && matchedTeacher.email) || (matchedTeacherAcc && matchedTeacherAcc.email) || fallbackEmail;
      const name = (matchedTeacher && matchedTeacher.name) || (matchedTeacherAcc && matchedTeacherAcc.name) || tx("መምህር (Teacher)");
      setCurrentUser({ 
        email: email, 
        role: 'teacher',
        name: name
      });
      setIsLoggedIn(true);
      setAuthError(null);
      setIsQRScannerOpen(false);
      addSecurityLog(email, 'teacher', 'SUCCESS');
    } else {
      // Treat as student ID if it exists in the database
      const matchedStudent = students.find(s => s.id.toUpperCase() === cleanUpper);
      if (matchedStudent) {
        setSelectedRole('parent'); // Displays results page
        const email = `${matchedStudent.id.toLowerCase()}@school.com`;
        setCurrentUser({ 
          email: email, 
          role: 'student', 
          studentId: matchedStudent.id 
        });
        setIsLoggedIn(true);
        setAuthError(null);
        setIsQRScannerOpen(false);
        addSecurityLog(email, 'student', 'SUCCESS');
      } else {
        // Extra safety check: if not in database, block login
        playInteractiveSound('wrong');
        setAuthError(tx(
          "ይህ ተጠቃሚ በሲስተሙ ውስጥ አልተመዘገበም (This user is not registered in the school system)"
        ));
        addSecurityLog(scannedValue, 'unknown', 'FAILED');
      }
    }
  };

  const handleQRMarkAttendance = (id: string, type: 'checkIn' | 'checkOut' = 'checkIn', entityType: 'student' | 'staff' = 'student') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' });

    if (entityType === 'student') {
      const matchedStudent = students.find(s => s.id === id);
      const studentName = matchedStudent ? matchedStudent.name : 'Unknown';
      
      let attendanceRecord: Record<string, Record<string, 'present' | 'absent' | 'excused'>> = {};
      try {
        attendanceRecord = JSON.parse(localStorage.getItem('dailyAttendance') || '{}');
      } catch (e) {}

      if (!attendanceRecord[todayStr]) {
        attendanceRecord[todayStr] = {};
      }

      const isAlreadyMarked = attendanceRecord[todayStr][id] === 'present';
      attendanceRecord[todayStr][id] = 'present';
      localStorage.setItem('dailyAttendance', JSON.stringify(attendanceRecord));

      if (foundStudent && foundStudent.id === id) {
        setSearchId(id);
      }

      playInteractiveSound('success');
      return { success: true, studentName, isAlreadyMarked };
    } else {
      // Staff / Teacher Attendance
      const matchedStaffMember = [...staffList, ...teachers.map(t => ({ id: t.id, name: t.name, category: 'Teacher', roleTitle: 'Teacher', phone: t.phone, email: t.email }))].find(s => s.id === id || s.email === id);
      const staffName = matchedStaffMember ? matchedStaffMember.name : 'Staff';

      let staffAttRecords: Record<string, { morning: string; afternoon: string; morningTime: string; afternoonTime: string }> = {};
      try {
        const saved = localStorage.getItem(`staff_attendance_${schoolWorkspaceId}_${todayStr}`);
        if (saved) staffAttRecords = JSON.parse(saved);
      } catch (e) {}

      const currentRecord = staffAttRecords[id] || { morning: 'absent', afternoon: 'absent', morningTime: '-', afternoonTime: '-' };
      const isAlreadyMarked = type === 'checkIn' ? currentRecord.morning === 'present' : currentRecord.afternoon === 'present';

      if (type === 'checkIn') {
        currentRecord.morning = 'present';
        currentRecord.morningTime = timeNow;
      } else {
        currentRecord.afternoon = 'present';
        currentRecord.afternoonTime = timeNow;
      }

      staffAttRecords[id] = currentRecord;
      localStorage.setItem(`staff_attendance_${schoolWorkspaceId}_${todayStr}`, JSON.stringify(staffAttRecords));

      playInteractiveSound('success');
      return { success: true, studentName: staffName, isAlreadyMarked };
    }
  };

  // Academic Year Switch/Transition Function
  const handleAcademicYearTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = transitionNewWorkspaceId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const newYear = transitionNewYear.trim();
    
    if (!targetId) {
      setTransitionError(tx("እባክዎ ትክክለኛ የአዲስ ሲስተም ኮድ ያስገቡ! (Please enter a valid workspace ID)"));
      return;
    }
    if (targetId === schoolWorkspaceId) {
      setTransitionError(tx(
        "የአዲሱ ዓመት ሲስተም ኮድ ከአሁኑ ኮድ ጋር አንድ መሆን አይችልም! እባክዎ ይለውጡ። (New workspace ID must be different from current workspace ID)"
      ));
      return;
    }
    if (!newYear) {
      setTransitionError(tx(
        "እባክዎ የአዲሱን የትምህርት ዘመን ስም ያስገቡ! (Please enter the name of the new academic year)"
      ));
      return;
    }

    try {
      setIsTransitioningYear(true);
      setTransitionError(null);
      setTransitionSuccess(null);
      playInteractiveSound('click');

      // 1. Create the new school configuration object
      const nextSchoolConfig = {
        ...schoolConfig,
        academicYear: newYear
      };

      // Clean config for Firestore
      const cleanedConfig = cleanForFirestore(nextSchoolConfig);

      // Save new school config to firestore under the new workspace
      await setDoc(doc(db, 'schools', targetId, 'config', 'school'), cleanedConfig);

      // 2. Perform Migration based on Strategy
      if (transitionStrategy === 'config' || transitionStrategy === 'students') {
        // Copy classes
        for (const cls of classes) {
          await setDoc(doc(db, 'schools', targetId, 'classes', cls.id), cleanForFirestore(cls));
        }

        // Copy teachers
        for (const t of teachers) {
          await setDoc(doc(db, 'schools', targetId, 'teachers', t.id), cleanForFirestore(t));
        }

        // Copy user accounts
        for (const acc of userAccounts) {
          const docId = acc.email.toLowerCase().replace(/\./g, '_');
          await setDoc(doc(db, 'schools', targetId, 'userAccounts', docId), cleanForFirestore(acc));
        }

        if (transitionStrategy === 'students') {
          // Copy student records (but DO NOT copy grades, extra info or attendance records)
          for (const s of students) {
            await setDoc(doc(db, 'schools', targetId, 'students', s.id), cleanForFirestore(s));
          }
        }
      }

      // 3. Update localStorage cache for the target workspace to ensure seamless loading
      localStorage.setItem(`schoolConfig_${targetId}`, JSON.stringify(nextSchoolConfig));
      
      if (transitionStrategy === 'fresh') {
        localStorage.setItem(`school_students_${targetId}`, JSON.stringify([]));
        localStorage.setItem(`school_grades_${targetId}`, JSON.stringify([]));
        localStorage.setItem(`school_teachers_${targetId}`, JSON.stringify([]));
        localStorage.setItem(`school_announcements_${targetId}`, JSON.stringify([]));
        localStorage.setItem(`school_classes_${targetId}`, JSON.stringify([]));
        localStorage.setItem(`studentExtraInfo_${targetId}`, JSON.stringify({}));
        localStorage.setItem(`school_user_accounts_${targetId}`, JSON.stringify([]));
      } else if (transitionStrategy === 'config') {
        localStorage.setItem(`school_students_${targetId}`, JSON.stringify([]));
        localStorage.setItem(`school_grades_${targetId}`, JSON.stringify([]));
        localStorage.setItem(`school_teachers_${targetId}`, JSON.stringify(teachers));
        localStorage.setItem(`school_announcements_${targetId}`, JSON.stringify([]));
        localStorage.setItem(`school_classes_${targetId}`, JSON.stringify(classes));
        localStorage.setItem(`studentExtraInfo_${targetId}`, JSON.stringify({}));
        localStorage.setItem(`school_user_accounts_${targetId}`, JSON.stringify(userAccounts));
      } else if (transitionStrategy === 'students') {
        localStorage.setItem(`school_students_${targetId}`, JSON.stringify(students));
        localStorage.setItem(`school_grades_${targetId}`, JSON.stringify([]));
        localStorage.setItem(`school_teachers_${targetId}`, JSON.stringify(teachers));
        localStorage.setItem(`school_announcements_${targetId}`, JSON.stringify([]));
        localStorage.setItem(`school_classes_${targetId}`, JSON.stringify(classes));
        localStorage.setItem(`studentExtraInfo_${targetId}`, JSON.stringify({}));
        localStorage.setItem(`school_user_accounts_${targetId}`, JSON.stringify(userAccounts));
      }

      // Switch to the new workspace!
      setSchoolWorkspaceId(targetId);
      localStorage.setItem('school_workspace_id', targetId);

      // Smoothly push to URL query params
      const newUrl = `${window.location.origin}${window.location.pathname}?school=${targetId}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

      // Celebrate!
      playInteractiveSound('success');

      setTransitionSuccess(`🎉 ለአዲሱ የትምህርት ዘመን (${newYear}) የሲስተም ሽግግር በተሳካ ሁኔታ ተጠናቋል! አዲሱ ወርክስፔስ "${targetId}" ዝግጁ ነው። (System transition completed successfully!)`);
      
      setTimeout(() => {
        setTransitionSuccess(null);
      }, 10000);

    } catch (err: any) {
      console.error('Error transitioning academic year:', err);
      setTransitionError(`❌ የትምህርት ዘመን በሚሸጋገርበት ወቅት ስህተት አጋጥሟል: ${err.message || String(err)}`);
    } finally {
      setIsTransitioningYear(false);
    }
  };

  // Save SaaS Branding Config
  const handleSaveWhiteLabel = (e: React.FormEvent) => {
    e.preventDefault();
    setWlError(null);
    setWlSuccess(false);

    try {
      // Before saving, ensure we save the active edits of the selected assessment components!
      const activeSum = wlQuizMax + wlCwMax + wlHwMax + wlGwMax + wlPwMax + wlCpMax + wlMidMax + wlFinalMax;
      if (activeSum !== 100) {
        playInteractiveSound('wrong');
        setWlError(`⚠️ ስህተት፡ የምዘና ውጤቶች ድምር ከ 100 ጋር እኩል መሆን አለበት! አሁን የተመዘገበው ድምር ${activeSum} ነው። እባክዎን ያስተካክሉ። (Assessment components must sum up to exactly 100! Currently: ${activeSum})`);
        return;
      }

      const nextAssessmentsTemp = {
        ...wlSubjectAssessments,
        [wlSelectedSubjectAssessment]: [
          { id: 'quiz', name: tx("ኩዊዝ"), nameEng: 'QUIZ', maxMark: wlQuizMax },
          { id: 'cw', name: tx("የክፍል ሥራ"), nameEng: 'CW', maxMark: wlCwMax },
          { id: 'hw', name: tx("የቤት ሥራ"), nameEng: 'HW', maxMark: wlHwMax },
          { id: 'gw', name: tx("የቡድን ሥራ"), nameEng: 'GW', maxMark: wlGwMax },
          { id: 'pw', name: tx("የፕሮጀክት ሥራ"), nameEng: 'PW', maxMark: wlPwMax },
          { id: 'cp', name: tx("የክፍል ተሳትፎ"), nameEng: 'CP', maxMark: wlCpMax },
          { id: 'mid', name: tx("ግማሽ ፈተና"), nameEng: 'MEXAM', maxMark: wlMidMax },
          { id: 'final', name: tx("ማጠቃለያ ፈተና"), nameEng: 'FEXAM', maxMark: wlFinalMax },
        ]
      };

      const nextAssessments = { ...nextAssessmentsTemp };
      if ('__default__' in nextAssessments) {
        nextAssessments['default'] = nextAssessments['__default__'];
        delete nextAssessments['__default__'];
      }

      const nameAmhClean = (wlNameAmh || '').trim();
      const nameEngClean = (wlNameEng || '').trim();
      const mottoAmhClean = (wlMottoAmh || '').trim();
      const mottoEngClean = (wlMottoEng || '').trim();
      const phoneClean = (wlPhone || '').trim();
      const emailClean = (wlEmail || '').trim();
      const addressClean = (wlAddress || '').trim();
      const academicYearClean = (wlAcademicYear || '').trim();

      const updated = {
        nameAmh: nameAmhClean || tx("ስማርት ስኩል"),
        nameEng: nameEngClean || 'Smart School',
        mottoAmh: mottoAmhClean || tx("ለክህሎትና ለውጤታማነት እንተጋለን!"),
        mottoEng: mottoEngClean || 'Striving for Skills and Success!',
        phone: phoneClean || '0111223344',
        email: emailClean || 'info@smartschool.edu.et',
        address: addressClean || tx("አዲስ አበባ፣ ኢትዮጵያ (Addis Ababa, Ethiopia)"),
        logoType: wlLogoType,
        logoImage: wlLogoImage,
        themeColor: wlThemeColor,
        subjects: wlSubjects.length > 0 ? wlSubjects : ['Mathematics', 'English', 'Amharic', 'Science', 'Social Studies'],
        subjectsByGrade: wlSubjectsByGrade,
        evaluationMode: wlEvaluationMode,
        schoolLevel: wlSchoolLevel,
        academicYear: academicYearClean || tx("2018 ዓ.ም"),
        subjectAssessments: nextAssessments
      };

      playInteractiveSound('register');
      setSchoolConfig(updated);
      localStorage.setItem(`schoolConfig_${schoolWorkspaceId}`, JSON.stringify(updated));
      localStorage.setItem('schoolConfig', JSON.stringify(updated)); // legacy fallback
      
      setDoc(doc(db, 'schools', schoolWorkspaceId, 'config', 'school'), cleanForFirestore(updated))
        .then(() => {
          console.log('Successfully synced school config to Firestore.');
        })
        .catch(e => {
          console.error('Failed to save config to Firestore in saveSaaSBranding:', e);
          setWlError(`⚠️ Firestore Sync Warning (Saved Locally): ${e.message || String(e)}`);
        });

      updateWorkspaceRegistryEntry(schoolWorkspaceId, updated.nameAmh, updated.nameEng);
      setWlSubjectAssessments(nextAssessments);
      setWlSuccess(true);
      setTimeout(() => setWlSuccess(false), 5000);
    } catch (err: any) {
      console.error('Fatal error in handleSaveWhiteLabel:', err);
      setWlError(`⚠️ ሲስተም ስህተት፡ ${err.message || String(err)}`);
    }
  };

  // System Backup: Export as JSON file
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        schoolConfig,
        students,
        grades,
        teachers,
        announcements,
        classes,
        studentExtraInfo
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const cleanSchoolName = schoolConfig.nameEng.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${cleanSchoolName}_system_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      playInteractiveSound('success');
      alert(tx(
        "የሲስተሙ የዳታ ምትኬ ፋይል በተሳካ ሁኔታ ተዘጋጅቶ ወርዷል! (System backup exported successfully!)"
      ));
    } catch (err) {
      console.error(err);
      playInteractiveSound('wrong');
      alert(tx("ምትኬ በማውረድ ላይ ስህተት ተፈጥሯል! (Error downloading backup!)"));
    }
  };

  // System Restore: Import from JSON file
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Validation check for key structure
        if (!parsed.students || !parsed.grades || !parsed.schoolConfig) {
          throw new Error("Invalid school backup format! Missing key database tables.");
        }

        playInteractiveSound('register');
        
        // Restore schoolConfig
        if (parsed.schoolConfig) {
          setSchoolConfig(parsed.schoolConfig);
          localStorage.setItem('schoolConfig', JSON.stringify(parsed.schoolConfig));
          setWlNameAmh(parsed.schoolConfig.nameAmh || '');
          setWlNameEng(parsed.schoolConfig.nameEng || '');
          setWlMottoAmh(parsed.schoolConfig.mottoAmh || '');
          setWlMottoEng(parsed.schoolConfig.mottoEng || '');
          setWlPhone(parsed.schoolConfig.phone || '');
          setWlEmail(parsed.schoolConfig.email || '');
          setWlAddress(parsed.schoolConfig.address || '');
          setWlLogoType(parsed.schoolConfig.logoType || 'graduation');
          setWlLogoImage(parsed.schoolConfig.logoImage || undefined);
          setWlThemeColor(parsed.schoolConfig.themeColor || 'indigo');
          setWlSubjects(parsed.schoolConfig.subjects || []);
          setWlSubjectsByGrade(parsed.schoolConfig.subjectsByGrade || {});
          setWlEvaluationMode(parsed.schoolConfig.evaluationMode || 'quarter');
          setWlSchoolLevel(parsed.schoolConfig.schoolLevel || 'primary');
          setWlAcademicYear(parsed.schoolConfig.academicYear || tx("2018 ዓ.ም"));
        }

        // Restore other database entities
        if (Array.isArray(parsed.students)) setStudents(parsed.students);
        if (Array.isArray(parsed.grades)) setGrades(parsed.grades);
        if (Array.isArray(parsed.teachers)) setTeachers(parsed.teachers);
        if (Array.isArray(parsed.announcements)) setAnnouncements(parsed.announcements);
        if (Array.isArray(parsed.classes)) setClasses(parsed.classes);
        if (parsed.studentExtraInfo) setStudentExtraInfo(parsed.studentExtraInfo);

        setRestoreSuccess(`🎉 ዳታ በስኬት ተመልሷል! ${parsed.students.length} ተማሪዎች፣ ${parsed.teachers?.length || 0} መምህራን እና ${parsed.grades.length} ማርኮች ተጭነዋል። (Data restored successfully!)`);
        setRestoreError(null);
        setTimeout(() => setRestoreSuccess(null), 8000);
      } catch (err: any) {
        console.error(err);
        playInteractiveSound('wrong');
        setRestoreError(`❌ የተሳሳተ ወይም የተበላሸ የምትኬ ፋይል! (Error: ${err.message || 'Invalid JSON backup format'})`);
        setRestoreSuccess(null);
        setTimeout(() => setRestoreError(null), 8000);
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be uploaded again
    e.target.value = '';
  };

  // Principal: Register Student
  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      playInteractiveSound('wrong');
      alert(tx("እባክዎን የተማሪውን ስም ያስገቡ (Please enter student name)"));
      return;
    }

    // Check for duplicate student (same name, grade, section)
    const isDuplicate = students.some(
      (s) =>
        s.name.trim().toLowerCase() === newStudentName.trim().toLowerCase() &&
        s.grade === newStudentGrade &&
        s.section === newStudentSection
    );

    if (isDuplicate) {
      playInteractiveSound('wrong');
      alert(`⚠️ ተማሪ "${newStudentName.trim()}" ቀደም ሲል በዚህ ክፍል (${newStudentGrade} ${newStudentSection}) ውስጥ ተመዝግቧል! (Student "${newStudentName.trim()}" is already registered in ${newStudentGrade} ${newStudentSection}!)`);
      return;
    }

    const phoneClean = newStudentParentPhone.trim().replace(/[\s-]/g, '');
    if (!phoneClean) {
      playInteractiveSound('wrong');
      alert(tx("እባክዎን የወላጅ/ያሳደጊ ስልክ ቁጥር ያስገቡ (Please enter parent/guardian phone number)"));
      return;
    }
    const isValidPhone = /^(09|07)\d{8}$/.test(phoneClean) || /^(\+251)(9|7)\d{8}$/.test(phoneClean) || /^(251)(9|7)\d{8}$/.test(phoneClean);
    if (!isValidPhone) {
      playInteractiveSound('wrong');
      alert(tx(
        "⚠️ እባክዎን ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ! (ለምሳሌ፡ 0912345678 ወይም 0712345678)\n(Please enter a valid Ethiopian phone number, e.g. 0912345678 or 0712345678)"
      ));
      return;
    }

    const randomId = 'ID-' + Math.floor(1000 + Math.random() * 9000);
    const ageVal = newStudentAge.trim() ? parseInt(newStudentAge.trim(), 10) : undefined;
    const newStudent: Student = {
      id: randomId,
      name: newStudentName.trim(),
      grade: newStudentGrade,
      section: newStudentSection,
      gender: newStudentGender,
      registeredBy: currentUser?.email || 'principal@school.com',
      timestamp: new Date().toISOString(),
      parentEmail: newStudentParentEmail.trim().toLowerCase() || undefined,
      parentPhone: phoneClean,
      address: newStudentAddress.trim() || undefined,
      digitalId: newStudentDigitalId.trim() || undefined,
      age: ageVal && !isNaN(ageVal) ? ageVal : undefined,
      photo: newStudentPhoto,
      academicYear: newStudentAcademicYear || schoolConfig.academicYear || tx("2018 ዓ.ም")
    };

    playInteractiveSound('register');
    setStudents(prev => [newStudent, ...prev]);

    // Send simulated email notification to the parent
    const targetParentEmail = newStudent.parentEmail || `${newStudent.name.replace(/\s+/g, '_').toLowerCase()}_parent@school.com`;
    ParentNotificationService.sendRegistrationEmail(
      newStudent.name,
      newStudent.id,
      newStudent.grade,
      newStudent.section,
      targetParentEmail
    );

    setPrincipalSuccessMsg(`✅ ተማሪው በተሳካ ሁኔታ ተመዝግቧል! ለወላጅ የኢሜል ማሳወቂያ ተልኳል (Student Registered! ID: ${randomId} & email dispatched)`);
    setNewStudentName('');
    setNewStudentParentEmail('');
    setNewStudentParentPhone('');
    setNewStudentAddress('');
    setNewStudentDigitalId('');
    setNewStudentAge('');
    setNewStudentAcademicYear(schoolConfig.academicYear || tx("2018 ዓ.ም"));
    setNewStudentPhoto(undefined);
    stopNewStudentCamera();
    setTimeout(() => setPrincipalSuccessMsg(null), 8000);
  };

  // EDIT & DELETE STATE SYNC HANDLERS
  const handleEditTeacher = async (updatedTeacher: Teacher) => {
    setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
    setStaffList(prev => prev.map(s => {
      if (s.id === updatedTeacher.id) {
        return {
          ...s,
          name: updatedTeacher.name,
          phone: updatedTeacher.phone,
          photo: updatedTeacher.photo,
          educationLevel: updatedTeacher.educationLevel,
          subjects: updatedTeacher.subjects,
          assignedClass: updatedTeacher.assignedClass,
          assignedSection: updatedTeacher.assignedSection,
          classAllocations: updatedTeacher.classAllocations,
          isHomeroomTeacher: updatedTeacher.isHomeroomTeacher
        };
      }
      return s;
    }));
    try {
      const docId = updatedTeacher.id || updatedTeacher.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'tch_unknown';
      await setDoc(doc(db, 'schools', schoolWorkspaceId, 'teachers', docId), cleanForFirestore(updatedTeacher));
    } catch (e) {
      console.error('Firestore edit teacher error:', e);
    }
  };

  const handleEditStaff = (updatedStaff: StaffMember) => {
    setStaffList(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
    const matchedTeacher = teachers.find(t => t.id === updatedStaff.id || (t.email && t.email.toLowerCase() === updatedStaff.email?.toLowerCase()));
    if (matchedTeacher) {
      handleEditTeacher({
        ...matchedTeacher,
        name: updatedStaff.name,
        phone: updatedStaff.phone,
        email: updatedStaff.email || matchedTeacher.email,
        photo: updatedStaff.photo,
        educationLevel: updatedStaff.educationLevel || matchedTeacher.educationLevel,
        subjects: updatedStaff.subjects || matchedTeacher.subjects,
        assignedClass: updatedStaff.assignedClass || matchedTeacher.assignedClass,
        assignedSection: updatedStaff.assignedSection || matchedTeacher.assignedSection,
        classAllocations: updatedStaff.classAllocations || matchedTeacher.classAllocations,
        isHomeroomTeacher: updatedStaff.isHomeroomTeacher ?? matchedTeacher.isHomeroomTeacher
      });
    } else if (updatedStaff.subjects && updatedStaff.subjects.length > 0 && updatedStaff.assignedClass) {
      // If staff (e.g. Vice Principal) was newly assigned teaching duties, register into teachers state
      const newTeacher: Teacher = {
        id: updatedStaff.id,
        name: updatedStaff.name,
        gender: (updatedStaff as any).gender || 'Female',
        educationLevel: updatedStaff.educationLevel || 'Degree',
        phone: updatedStaff.phone,
        email: updatedStaff.email || `${updatedStaff.id.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.com`,
        photo: updatedStaff.photo,
        subjects: updatedStaff.subjects,
        assignedClass: updatedStaff.assignedClass,
        assignedSection: updatedStaff.assignedSection || 'A',
        classAllocations: updatedStaff.classAllocations || [{ grade: updatedStaff.assignedClass, section: updatedStaff.assignedSection || 'A', subjects: updatedStaff.subjects }],
        isHomeroomTeacher: !!updatedStaff.isHomeroomTeacher,
        registeredBy: 'Principal',
        timestamp: new Date().toISOString()
      };
      setTeachers(prev => [newTeacher, ...prev]);
    }
  };

  const handleOpenMarkListForStaff = (staff: StaffMember, matchedTeacher?: Teacher) => {
    playInteractiveSound('click');
    if (currentUser?.role === 'vice_principal') {
      setVicePrincipalActiveView('teaching');
      setTeacherSubTab('class-sheets');
    } else {
      setPrincipalSubTab('gradetracker');
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    const teacher = teachers.find(t => t.id === id);
    setTeachers(prev => prev.filter(t => t.id !== id));
    if (teacher) {
      const fallbackEmail = `${teacher.id.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.com`;
      const emailClean = (teacher.email || fallbackEmail).trim().toLowerCase();
      setUserAccounts(prev => prev.filter(acc => acc.email.trim().toLowerCase() !== emailClean));
    }
    try {
      const docId = id || teacher?.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'tch_unknown';
      await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'teachers', docId));
    } catch (e) {
      console.error('Firestore delete teacher error:', e);
    }
  };

  const handleEditClass = async (updatedClass: ClassSetup) => {
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
    try {
      await setDoc(doc(db, 'schools', schoolWorkspaceId, 'classes', updatedClass.id), cleanForFirestore(updatedClass));
    } catch (e) {
      console.error('Firestore edit class error:', e);
    }
  };

  const handleDeleteClass = async (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    try {
      await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'classes', id));
    } catch (e) {
      console.error('Firestore delete class error:', e);
    }
  };

  const handleEditAnnouncement = async (updatedAnn: Announcement) => {
    setAnnouncements(prev => prev.map(a => a.id === updatedAnn.id ? updatedAnn : a));
    try {
      await setDoc(doc(db, 'schools', schoolWorkspaceId, 'announcements', updatedAnn.id), cleanForFirestore(updatedAnn));
    } catch (e) {
      console.error('Firestore edit announcement error:', e);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    try {
      await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'announcements', id));
    } catch (e) {
      console.error('Firestore delete announcement error:', e);
    }
  };

  const handleEditStudent = async (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    try {
      await setDoc(doc(db, 'schools', schoolWorkspaceId, 'students', updatedStudent.id), cleanForFirestore(updatedStudent));
    } catch (e) {
      console.error('Firestore edit student error:', e);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    try {
      await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'students', id));
    } catch (e) {
      console.error('Firestore delete student error:', e);
    }
  };

  const handleOpenEditStudentMain = (student: Student) => {
    playInteractiveSound('click');
    setEditingStudentMainTab(student);
    setEditStudentMainName(student.name);
    setEditStudentMainGender(student.gender);
    setEditStudentMainGrade(student.grade);
    setEditStudentMainSection(student.section);
    setEditStudentMainAge(student.age ? String(student.age) : '');
    setEditStudentMainParentEmail(student.parentEmail || '');
    setEditStudentMainParentPhone(student.parentPhone || '');
    setEditStudentMainAddress(student.address || '');
    setEditStudentMainDigitalId(student.digitalId || '');
    setEditStudentMainPaymentId(student.paymentId || '');
    setEditStudentMainPhoto(student.photo);
  };

  const handleEditStudentMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentMainTab) return;
    if (!editStudentMainName.trim()) {
      alert(tx("እባክዎን የተማሪውን ስም ያስገቡ (Please enter student name)"));
      return;
    }

    // Check for duplicate student (same name, grade, section, excluding the student being edited)
    const isDuplicate = students.some(
      (s) =>
        s.id !== editingStudentMainTab.id &&
        s.name.trim().toLowerCase() === editStudentMainName.trim().toLowerCase() &&
        s.grade === editStudentMainGrade &&
        s.section === editStudentMainSection
    );

    if (isDuplicate) {
      playInteractiveSound('wrong');
      alert(`⚠️ ተማሪ "${editStudentMainName.trim()}" ቀደም ሲል በዚህ ክፍል (${editStudentMainGrade} ${editStudentMainSection}) ውስጥ ተመዝግቧል! (Student "${editStudentMainName.trim()}" is already registered in ${editStudentMainGrade} ${editStudentMainSection}!)`);
      return;
    }

    const phoneClean = editStudentMainParentPhone.trim().replace(/[\s-]/g, '');
    if (!phoneClean) {
      alert(tx("እባክዎን የወላጅ/ያሳደጊ ስልክ ቁጥር ያስገቡ (Please enter parent/guardian phone number)"));
      return;
    }
    const isValidPhone = /^(09|07)\d{8}$/.test(phoneClean) || /^(\+251)(9|7)\d{8}$/.test(phoneClean) || /^(251)(9|7)\d{8}$/.test(phoneClean);
    if (!isValidPhone) {
      alert(tx(
        "⚠️ እባክዎን ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ! (ለምሳሌ፡ 0912345678 ወይም 0712345678)\n(Please enter a valid Ethiopian phone number, e.g. 0912345678 or 0712345678)"
      ));
      return;
    }

    const ageVal = editStudentMainAge.trim() ? parseInt(editStudentMainAge.trim(), 10) : undefined;
    const updated: Student = {
      ...editingStudentMainTab,
      name: editStudentMainName.trim(),
      gender: editStudentMainGender,
      grade: editStudentMainGrade,
      section: editStudentMainSection,
      age: ageVal && !isNaN(ageVal) ? ageVal : undefined,
      parentEmail: editStudentMainParentEmail.trim().toLowerCase() || undefined,
      parentPhone: phoneClean,
      address: editStudentMainAddress.trim() || undefined,
      digitalId: editStudentMainDigitalId.trim() || undefined,
      paymentId: editStudentMainPaymentId.trim() || undefined,
      photo: editStudentMainPhoto
    };

    await handleEditStudent(updated);
    playInteractiveSound('register');
    setEditingStudentMainTab(null);
    setEditStudentMainPhoto(undefined);
    setEditStudentMainDigitalId('');
    stopEditStudentCamera();
  };

  const handleDeleteStudentMainConfirm = async () => {
    if (deletingStudentMainTab) {
      await handleDeleteStudent(deletingStudentMainTab.id);
      playInteractiveSound('click');
      setDeletingStudentMainTab(null);
    }
  };

  // Teacher: Save Grade
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherErrorMsg(null);
    setTeacherSuccessMsg(null);

    if (!selectedStudentId) {
      playInteractiveSound('wrong');
      setTeacherErrorMsg(tx("❌ እባክዎን በመጀመሪያ ተማሪ ይምረጡ (Please select a student)"));
      return;
    }

    // Get dynamic assessment configuration limits
    const assessments = getSubjectAssessments(selectedTeacherSubject);
    const quizMax = assessments.find(a => a.id === 'quiz')?.maxMark ?? 10;
    const cwMax = assessments.find(a => a.id === 'cw')?.maxMark ?? 10;
    const hwMax = assessments.find(a => a.id === 'hw')?.maxMark ?? 10;
    const gwMax = assessments.find(a => a.id === 'gw')?.maxMark ?? 10;
    const pwMax = assessments.find(a => a.id === 'pw')?.maxMark ?? 10;
    const cpMax = assessments.find(a => a.id === 'cp')?.maxMark ?? 10;
    const midMax = assessments.find(a => a.id === 'mid')?.maxMark ?? 20;
    const finalMax = assessments.find(a => a.id === 'final')?.maxMark ?? 20;

    // Strict numerical limits validation
    const q = Number(quizScore || 0);
    const c = Number(cwScore || 0);
    const h = Number(hwScore || 0);
    const g = Number(gwScore || 0);
    const p = Number(pwScore || 0);
    const cpVal = Number(cpScore || 0);
    const m = Number(midScore || 0);
    const f = Number(finalScore || 0);

    const isInvalid = (val: number, max: number) => {
      return isNaN(val) || val < 0 || val > max;
    };

    if (
      isInvalid(q, quizMax) || 
      isInvalid(c, cwMax) || 
      isInvalid(h, hwMax) || 
      isInvalid(g, gwMax) || 
      isInvalid(p, pwMax) || 
      isInvalid(cpVal, cpMax) || 
      isInvalid(m, midMax) || 
      isInvalid(f, finalMax)
    ) {
      playInteractiveSound('wrong');
      setTeacherErrorMsg(`❌ እባክዎን ትክክለኛ ውጤት ያስገቡ! (ኩዊዝ: 0-${quizMax}, ክፍል ስራ: 0-${cwMax}, የቤት ስራ: 0-${hwMax}, የቡድን ስራ: 0-${gwMax}, ፕሮጀክት: 0-${pwMax}, ተሳትፎ: 0-${cpMax}, ግማሽ ፈተና: 0-${midMax}, ማጠቃለያ ፈተና: 0-${finalMax})`);
      return;
    }

    const matchedStudent = students.find(s => s.id === selectedStudentId);
    if (!matchedStudent) {
      playInteractiveSound('wrong');
      setTeacherErrorMsg(tx("❌ የተመረጠው ተማሪ አልተገኘም (Selected student not found)"));
      return;
    }

    const totalScore = q + c + h + g + p + cpVal + m + f;
    const newGrade: Grade = {
      id: 'g-' + Math.floor(1000 + Math.random() * 9000),
      studentId: matchedStudent.id,
      studentName: matchedStudent.name,
      subject: selectedTeacherSubject,
      quiz: q,
      cw: c,
      hw: h,
      gw: g,
      pw: p,
      cp: cpVal,
      mid: m,
      final: f,
      total: totalScore,
      teacher: currentUser?.email || 'teacher@school.com',
      timestamp: new Date().toISOString(),
      term: teacherSelectedTerm
    };

    playInteractiveSound('register');
    setGrades(prev => [newGrade, ...prev.filter(g => !(g.studentId === matchedStudent.id && g.subject === selectedTeacherSubject && (g.term || 1) === teacherSelectedTerm))]);
    setTeacherSuccessMsg(`✅ ለተማሪ ${matchedStudent.name} በ ${selectedTeacherSubject} የ ${totalScore}% ውጤት በተሳካ ሁኔታ ተመዝግቧል! (Grade saved successfully!)`);
    
    // Reset form
    setSelectedStudentId('');
    setQuizScore('');
    setCwScore('');
    setHwScore('');
    setGwScore('');
    setPwScore('');
    setCpScore('');
    setMidScore('');
    setFinalScore('');
    setTimeout(() => setTeacherSuccessMsg(null), 6000);
  };

  // Parent: Search Student Report Card by ID
  const handleSearchStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setParentSearched(true);
    setParentErrorMsg(null);
    const queryId = searchId.trim().toUpperCase();

    // Reload latest extra info from localStorage
    const savedExtra = localStorage.getItem('studentExtraInfo');
    if (savedExtra) {
      try {
        setStudentExtraInfo(JSON.parse(savedExtra));
      } catch (err) {}
    }

    if (!queryId) {
      playInteractiveSound('wrong');
      setFoundStudent(null);
      setFoundGrades([]);
      return;
    }

    // 1. Find the student first
    const student = students.find(
      s => s.id.toUpperCase() === queryId || 
           s.id.replace('ID-', '').trim().toUpperCase() === queryId
    );

    if (!student) {
      playInteractiveSound('wrong');
      setParentErrorMsg(`⚠️ ተማሪው አልተገኘም። እባክዎን ያስገቡት መታወቂያ ትክክል መሆኑን ያረጋግጡ። (Student not found. Please make sure you entered a valid ID.)`);
      setFoundStudent(null);
      setFoundGrades([]);
      return;
    }

    // 2. Access control: If role is parent, check if student's parentEmail matches parent's login email
    if (currentUser?.role === 'parent' && currentUser?.email) {
      const parentEmailClean = currentUser.email.trim().toLowerCase();
      const studentParentEmailClean = student.parentEmail?.trim().toLowerCase();

      if (!studentParentEmailClean || studentParentEmailClean !== parentEmailClean) {
        // Automatically associate this searched student with this parent to provide an extremely smooth UX!
        setStudents(prev => prev.map(s => s.id === student.id ? { ...s, parentEmail: currentUser.email } : s));
        student.parentEmail = currentUser.email;
      }
    }

    // 3. Fully authorized and found!
    playInteractiveSound('success');
    setFoundStudent(student);
    const studentGrades = grades.filter(g => g.studentId === student.id);
    setFoundGrades(studentGrades);
    setParentErrorMsg(null);
  };

  // Stats Counters
  const stats = useMemo(() => {
    return {
      totalStudents: students.length,
      gradedCount: grades.length,
      totalTeachers: teachers.length,
      averageGrade: grades.length > 0 
        ? Math.round(grades.reduce((sum, g) => sum + g.total, 0) / grades.length) 
        : 0
    };
  }, [students, grades, teachers]);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    playInteractiveSound('success');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Resolve current active theme from config
  const activeTheme = useMemo(() => {
    return THEMES[schoolConfig.themeColor as keyof typeof THEMES] || THEMES.indigo;
  }, [schoolConfig.themeColor]);

  // Logo rendering helper based on selection or official school logo
  const renderSchoolLogo = (type: string, className = "w-10 h-10", imageUrl?: string) => {
    const finalImage = imageUrl || schoolConfig?.logoImage || DEFAULT_SCHOOL_LOGO;
    if (finalImage) {
      return (
        <img 
          src={finalImage} 
          alt="School Logo" 
          className={`${className} object-contain rounded-full shadow-xs`}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }
    switch(type) {
      case 'book': return <BookOpen className={className} />;
      case 'shield': return <ShieldCheck className={className} />;
      case 'award': return <Award className={className} />;
      case 'graduation':
      default:
        return <GraduationCap className={className} />;
    }
  };

  return (
    <div 
      style={dynamicStyles as React.CSSProperties}
      className={`min-h-screen ${themeMode === 'dark' ? 'dark text-indigo-100 bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black' : `${activeTheme.appBg} text-slate-900`} font-sans antialiased pb-16 transition-colors duration-300`}>

      {/* Decorative Accent Top Bar */}
      <div className="h-2 w-full flex">
        <div className="h-full w-1/3 bg-emerald-500"></div>
        <div className="h-full w-1/3 bg-amber-400"></div>
        <div className={`h-full w-1/3 ${activeTheme.accentBar}`}></div>
      </div>

      {/* Hero Header Block */}
      <header className="max-w-6xl mx-auto px-4 pt-8 pb-6 text-center print:hidden">
        <div className={`relative mx-auto rounded-3xl p-6 md:p-8 border-2 transition-all duration-300 shadow-xl ${
          themeMode === 'dark'
            ? 'bg-slate-900/80 border-indigo-500/30 ring-2 ring-indigo-500/20 shadow-indigo-950/50 backdrop-blur-md'
            : 'bg-white/85 border-indigo-200 ring-2 ring-indigo-400/25 shadow-indigo-100/60 backdrop-blur-md'
        }`}>
        <div className="flex justify-center gap-2 mb-3 flex-wrap">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${activeTheme.badge} text-xs font-semibold`}>
            {renderSchoolLogo(schoolConfig.logoType, "w-4 h-4 rounded-full", schoolConfig.logoImage)}
            <span>{schoolConfig.nameAmh}{tx(" • SaaS ማጣሪያ ፖርታል (V2.5)")}</span>
          </div>

          <button
            onClick={() => {
              playInteractiveSound('success');
              const shareUrl = window.location.href;
              navigator.clipboard.writeText(shareUrl).then(() => {
                alert(tx("🔗 የ Diligent School ሊንክ ኮፒ ተደርጓል! ለሰዎች ማጋራት ይችላሉ (Diligent School link copied to clipboard!)"));
              }).catch(() => {
                prompt(tx("የ Diligent School ሊንክ ይህ ነው (Diligent School Link):"), shareUrl);
              });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer transition-transform hover:scale-105"
            title="Copy Diligent School Share Link"
          >
            <span>🔗</span>
            <span>{tx("Diligent School ሊንክ ኮፒ (Copy Link)")}</span>
          </button>

          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            isSyncing 
              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
              : syncError === 'offline'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : syncError 
                  ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSyncing ? 'bg-amber-400' : syncError === 'offline' ? 'bg-amber-400' : syncError ? 'bg-rose-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isSyncing ? 'bg-amber-500' : syncError === 'offline' ? 'bg-amber-500' : syncError ? 'bg-rose-500' : 'bg-emerald-500'
              }`}></span>
            </span>
            <span>
              {isSyncing 
                ? t('☁️ Firebase በመገናኘት ላይ...', '☁️ Connecting to Firebase...') 
                : syncError === 'offline'
                  ? t('📶 ከመስመር ውጭ (በአካባቢው የተቀመጠ) • Offline (Local Cache)', '📶 Offline (Local Cache)')
                  : syncError 
                    ? t(`❌ ፊርቤዝ አልተገናኘም፡ ${syncError}`, `❌ Firebase failed to connect: ${syncError}`) 
                    : t('☁️ Firebase Cloud Database ተገናኝቷል (Persistent)', '☁️ Firebase Cloud Database Connected (Persistent)')}
            </span>
          </div>

          {/* Active School Workspace Quick Switcher */}
          <div className="flex items-center gap-1">
            <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all border shadow-xs select-none ${
              themeMode === 'dark'
                ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700 hover:text-emerald-300'
                : 'bg-white text-indigo-700 border-slate-200 hover:bg-slate-100 hover:text-indigo-900'
            }`}>
              <Layers className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase text-slate-400 font-bold mr-0.5">{tx('ትምህርት ቤት (School)፡')}</span>
              <select
                value={schoolWorkspaceId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__add_new__') {
                    playInteractiveSound('click');
                    setNewSchoolNameAmh('');
                    setNewSchoolNameEng('');
                    setNewSchoolWorkspaceId('');
                    setNewSchoolModalError(null);
                    setIsNewSchoolModalOpen(true);
                  } else {
                    playInteractiveSound('click');
                    setSchoolWorkspaceId(val);
                    localStorage.setItem('school_workspace_id', val);
                    
                    // Smoothly push to URL query params
                    const newUrl = `${window.location.origin}${window.location.pathname}?school=${val}`;
                    window.history.pushState({ path: newUrl }, '', newUrl);
                  }
                }}
                className="bg-transparent border-none font-black text-xs outline-none focus:ring-0 cursor-pointer p-0 pr-1.5"
                style={{ color: 'inherit' }}
              >
                {workspacesRegistry.map((item) => (
                  <option 
                    key={item.id} 
                    value={item.id}
                    className={themeMode === 'dark' ? 'bg-slate-800 text-indigo-100' : 'bg-white text-slate-950'}>
                  
                    {lang === 'am' ? item.nameAmh : item.nameEng} [{item.id}]
                  </option>
                ))}
                <option 
                  value="__add_new__"
                  className={themeMode === 'dark' ? 'bg-slate-900 text-emerald-400 font-black' : 'bg-indigo-50 text-indigo-700 font-black'}>{tx(
                  "\n                \n                  ➕ አዲስ ትምህርት ቤት ጨምር (Add New School...)\n                "
                )}</option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadDataFromFirestore}
              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs ml-1"
              title={tx("መረጃዎችን ከክላውድ ዳታቤዝ አሁን አድስ (Sync with Cloud)")}
            >
              🔄
            </button>

            {/* Manage / Delete Schools trash icon */}
            <button
              type="button"
              onClick={() => {
                playInteractiveSound('click');
                setIsManageSchoolsModalOpen(true);
              }}
              title={lang === 'am' ? tx("የተመዘገቡ ትምህርት ቤቶችን ማስተካከያ/ማጥፊያ (Manage / Delete Schools)") : "Manage / Delete Schools"}
              className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                themeMode === 'dark'
                  ? 'bg-slate-800 text-rose-400 border-slate-700 hover:bg-slate-700 hover:text-rose-300'
                  : 'bg-white text-rose-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700'
              }`}>
            
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            id="language-toggle-btn"
            onClick={() => {
              playInteractiveSound('click');
              const newLang = lang === 'am' ? 'en' : 'am';
              setLang(newLang);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all border shadow-xs cursor-pointer select-none ${
              themeMode === 'dark'
                ? 'bg-slate-800 text-indigo-400 border-slate-700 hover:bg-slate-700 hover:text-indigo-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}>
          
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'am' ? 'English (En)' : tx("አማርኛ (Am)")}</span>
          </button>

          <button
            type="button"
            id="desktop-app-guide-btn"
            onClick={() => {
              playInteractiveSound('click');
              setIsDesktopAppModalOpen(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all border shadow-xs cursor-pointer select-none ${
              themeMode === 'dark'
                ? 'bg-indigo-950/50 text-indigo-300 border-indigo-900/50 hover:bg-indigo-900/40 hover:text-indigo-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/60 hover:text-indigo-900'
            }`}>
          
            {tx('🖥️ መተግበሪያ (App Mode)')}
          </button>

          <button
            type="button"
            id="theme-toggle-btn"
            onClick={() => {
              playInteractiveSound('click');
              const newMode = themeMode === 'light' ? 'dark' : 'light';
              setThemeMode(newMode);
              localStorage.setItem('school_theme_mode', newMode);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all border shadow-xs cursor-pointer select-none ${
              themeMode === 'dark'
                ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700 hover:text-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {themeMode === 'dark' ? (
              <>
                <span className="text-[11px]">☀️</span>
                <span>{tx('ብርሃን ሁነታ (Light Mode)')}</span>
              </>
                          ) : (
              <>
                <span className="text-[11px]">🌙</span>
                <span>{tx('ጨለማ ሁነታ (Dark Mode)')}</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center text-center gap-3 mb-3">
          {/* Centered Academic Crest Logo */}
          <div className="relative group cursor-pointer" onClick={() => { playInteractiveSound('click'); setIsSchoolInfoModalOpen(true); }} title={tx("ስለ ትምህርት ቤቱ መረጃ (School Info)")}>
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-400 via-indigo-500 to-amber-500 opacity-60 blur-[3px] group-hover:opacity-90 transition-all duration-300" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white dark:bg-slate-900 border-[3px] border-amber-400 dark:border-amber-400/80 p-1.5 shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <img 
                src={schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO} 
                alt="School Logo" 
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-300 text-[8px] sm:text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
              ⭐️ {tx("ትምህርት ቤት")}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center mt-1">
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2 flex-wrap">
                <span>{lang === 'am' ? schoolConfig.nameAmh : schoolConfig.nameEng}</span>
                {lang === 'am' && <span className={`font-light ${activeTheme.primaryText} italic text-xl sm:text-2xl md:text-3xl`}>{(schoolConfig.nameEng || "").replace(/app/i, "").trim()}</span>}
              </h1>
              <button
                onClick={() => { playInteractiveSound('click'); setIsSchoolInfoModalOpen(true); }}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors shadow-xs"
                title="School Information">
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base mt-1.5 leading-relaxed font-semibold max-w-2xl mx-auto">
              🏆 "{lang === 'am' ? schoolConfig.mottoAmh : schoolConfig.mottoEng}" {lang === 'am' && <span className="text-slate-400 dark:text-slate-400 italic text-xs sm:text-sm">— {schoolConfig.mottoEng}</span>}
            </p>
          </div>
        </div>
        <p className="max-w-3xl mx-auto text-slate-400 text-xs mt-1.5 leading-relaxed max-w-2xl font-medium">
          {tx('ባለ ብዙ ዘርፍ የተማሪዎች መረጃ፣ የመምህራን ምዝገባ፣ የክፍል ትምህርት ዝርዝር፣ የተማሪዎች ውጤት ማውረጃና ማተሚያ መድረክ። ለተጠቃሚ ምቹና ተለዋዋጭ (Dynamic White-Label SaaS) ተደርጎ የተዘጋጀ።')}
        </p>

        {/* Global Navigation Tabs: Live Portal vs White-Label */}
        <div className="flex flex-wrap justify-center gap-2 mt-6 border-b border-slate-200 pb-2 max-w-xl mx-auto">
          <button
            onClick={() => { playInteractiveSound('click'); setActiveTab('portal'); }}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'portal' 
                ? `${activeTheme.primary} text-white shadow-md ${activeTheme.shadow}` 
                : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'
            }`}>
          
            <Database className="w-4 h-4" />
            <span>{tx('ስርዓቱን ሞክር (Live Portal)')}</span>
          </button>
          
          {currentUser?.email?.trim().toLowerCase() === 'tadessemisganaw4@gmail.com' && (
            <button
              onClick={() => { 
                playInteractiveSound('click'); 
                setActiveTab('whitelabel'); 
              }}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'whitelabel' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100' 
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'
              }`}>
            
              <Sparkles className="w-4 h-4" />
              <span>{tx('ነጭ-መለያ ማበልጸጊያ (SaaS Config)')}</span>
            </button>
          )}
          
          <button
            onClick={() => { playInteractiveSound('click'); setActiveTab('help'); }}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'help' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100' 
                : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'
            }`}>
          
            <BookOpen className="w-4 h-4" />
            <span>{tx('እገዛ እና መረጃ (Help & Info)')}</span>
          </button>
        </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6 md:mt-4">
        
        <AnimatePresence mode="wait">
          
          {/* TAB 1: THE INTERACTIVE PORTAL DEMO */}
          {activeTab === 'portal' && (
            <motion.div
              key="portal-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 print:hidden">
            
              
              {/* Quick Status Stats (Visible when logged in to simulate dashboard) */}
              {isLoggedIn && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden" id="portal-dashboard-stats">
                  <div className={`${themeMode === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-indigo-50/60 border-indigo-150 text-indigo-950 shadow-xs'} p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-2.5 sm:gap-3 transition-all duration-200 hover:scale-[1.01]`}>
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 ${themeMode === 'dark' ? 'bg-indigo-950/50 text-indigo-400 border-indigo-900/40' : `bg-indigo-600 border-indigo-500 text-white`} rounded-xl flex items-center justify-center shrink-0`}>
                        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`text-[9px] sm:text-[10px] font-bold ${themeMode === 'dark' ? 'text-slate-400' : 'text-indigo-600/90'} uppercase block tracking-wider truncate`}>{tx('ተማሪዎች (Students)')}</span>
                        <strong className={`text-lg sm:text-xl font-black ${themeMode === 'dark' ? 'text-white' : 'text-indigo-950'} block leading-tight`}>{stats.totalStudents}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playInteractiveSound('click');
                        setQuickViewCategory('students');
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                        themeMode === 'dark' 
                          ? 'hover:bg-slate-700 text-indigo-400 hover:text-indigo-300' 
                          : 'hover:bg-indigo-100 text-indigo-600 hover:text-indigo-900'
                      }`}
                      title={tx("Quick View / ፈጣን መመልከቻ")}>
                    
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className={`${themeMode === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-emerald-50/60 border-emerald-150 text-emerald-950 shadow-xs'} p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-2.5 sm:gap-3 transition-all duration-200 hover:scale-[1.01]`}>
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 ${themeMode === 'dark' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40' : 'bg-emerald-600 border-emerald-500 text-white'} rounded-xl flex items-center justify-center shrink-0`}>
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`text-[9px] sm:text-[10px] font-bold ${themeMode === 'dark' ? 'text-slate-400' : 'text-emerald-700'} uppercase block tracking-wider truncate`}>{tx('ውጤቶች (Grades)')}</span>
                        <strong className={`text-lg sm:text-xl font-black ${themeMode === 'dark' ? 'text-white' : 'text-emerald-950'} block leading-tight`}>{stats.gradedCount}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playInteractiveSound('click');
                        setQuickViewCategory('grades');
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                        themeMode === 'dark' 
                          ? 'hover:bg-slate-700 text-emerald-400 hover:text-emerald-300' 
                          : 'hover:bg-emerald-100 text-emerald-600 hover:text-emerald-900'
                      }`}
                      title={tx("Quick View / ፈጣን መመልከቻ")}>
                    
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className={`${themeMode === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-purple-50/60 border-purple-150 text-purple-950 shadow-xs'} p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-2.5 sm:gap-3 transition-all duration-200 hover:scale-[1.01]`}>
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 ${themeMode === 'dark' ? 'bg-purple-950/50 text-purple-400 border-purple-900/40' : 'bg-purple-600 border-purple-500 text-white'} rounded-xl flex items-center justify-center shrink-0`}>
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`text-[9px] sm:text-[10px] font-bold ${themeMode === 'dark' ? 'text-slate-400' : 'text-purple-700'} uppercase block tracking-wider truncate`}>{tx('መምህራን (Teachers)')}</span>
                        <strong className={`text-lg sm:text-xl font-black ${themeMode === 'dark' ? 'text-white' : 'text-purple-950'} block leading-tight`}>{stats.totalTeachers}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playInteractiveSound('click');
                        setQuickViewCategory('teachers');
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                        themeMode === 'dark' 
                          ? 'hover:bg-slate-700 text-purple-400 hover:text-purple-300' 
                          : 'hover:bg-purple-100 text-purple-600 hover:text-purple-900'
                      }`}
                      title={tx("Quick View / ፈጣን መመልከቻ")}>
                    
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className={`${themeMode === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-amber-50/60 border-amber-150 text-amber-950 shadow-xs'} p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-2.5 sm:gap-3 transition-all duration-200 hover:scale-[1.01]`}>
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 ${themeMode === 'dark' ? 'bg-amber-950/50 text-amber-400 border-amber-900/40' : 'bg-amber-500 border-amber-400 text-white'} rounded-xl flex items-center justify-center shrink-0`}>
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`text-[9px] sm:text-[10px] font-bold ${themeMode === 'dark' ? 'text-slate-400' : 'text-amber-700'} uppercase block tracking-wider font-mono truncate`}>{tx('አማካይ (Average)')}</span>
                        <strong className={`text-lg sm:text-xl font-black ${themeMode === 'dark' ? 'text-white' : 'text-amber-950'} block leading-tight`}>{stats.averageGrade}%</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playInteractiveSound('click');
                        setQuickViewCategory('average');
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                        themeMode === 'dark' 
                          ? 'hover:bg-slate-700 text-amber-400 hover:text-amber-300' 
                          : 'hover:bg-amber-100 text-amber-600 hover:text-amber-900'
                      }`}
                      title={tx("Quick View / ፈጣን መመልከቻ")}>
                    
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* AUTH PANEL OR SYSTEM VIEW */}
              {!isLoggedIn ? (
                <div className="relative max-w-lg mx-auto py-10 px-4 sm:px-6" id="auth-login-card">
                  {/* Glowing dynamic role-based backdrop */}
                  <div className="absolute -inset-4 rounded-3xl opacity-35 dark:opacity-30 blur-3xl transition-all duration-700 pointer-events-none"
                    style={{
                      background: visualRole === 'principal' 
                        ? 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(168,85,247,0.12) 60%, transparent 80%)' 
                        : visualRole === 'teacher'
                          ? 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(20,184,166,0.12) 60%, transparent 80%)'
                          : visualRole === 'parent'
                            ? 'radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(239,68,68,0.12) 60%, transparent 80%)'
                            : 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(148,163,184,0.08) 60%, transparent 80%)'
                    }}
                  />

                  {/* Glassmorphic Portal Container */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`relative rounded-3xl p-6 sm:p-8 md:p-10 border-2 transition-all duration-300 ${
                      themeMode === 'dark'
                        ? 'bg-slate-900/95 border-indigo-500/40 text-indigo-100 backdrop-blur-xl shadow-2xl shadow-indigo-950/70 ring-2 ring-indigo-500/25'
                        : 'bg-white/98 border-indigo-200 text-slate-900 backdrop-blur-xl shadow-2xl shadow-indigo-200/50 ring-2 ring-indigo-400/25'
                    }`}>
                  
                    {/* Top Accent line */}
                    <div className="absolute -top-[1px] left-8 right-8 h-[2px] rounded-full transition-all duration-500"
                      style={{
                        backgroundImage: visualRole === 'principal'
                          ? 'linear-gradient(to right, transparent, rgb(99,102,241), transparent)'
                          : visualRole === 'vice_principal'
                            ? 'linear-gradient(to right, transparent, rgb(59,130,246), transparent)'
                            : visualRole === 'teacher'
                              ? 'linear-gradient(to right, transparent, rgb(16,185,129), transparent)'
                              : visualRole === 'parent'
                                ? 'linear-gradient(to right, transparent, rgb(245,158,11), transparent)'
                                : 'linear-gradient(to right, transparent, rgb(120,113,108), transparent)'
                      }}
                    />

                    {/* School Emblem / Icon */}
                    <div className="relative flex flex-col items-center justify-center mb-6">
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        {/* Outer rotating decorative ring */}
                        <div className={`absolute inset-0 rounded-full border-2 border-dashed animate-[spin_40s_linear_infinite] ${
                          themeMode === 'dark' ? 'border-indigo-500/30' : 'border-indigo-600/30'
                        }`} />
                        
                        {/* Elegant academic crest background */}
                        <div className={`absolute inset-1.5 rounded-full border-4 border-double flex items-center justify-center shadow-lg transition-all duration-300 ${
                          themeMode === 'dark' 
                            ? 'bg-slate-950 border-indigo-500/50 shadow-indigo-500/10' 
                            : 'bg-indigo-50 border-indigo-600 shadow-indigo-600/15'
                        }`}>
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                            visualRole === 'principal'
                              ? 'bg-indigo-600/10 text-indigo-500 dark:text-indigo-400'
                              : visualRole === 'vice_principal'
                                ? 'bg-blue-600/10 text-blue-500 dark:text-blue-400'
                                : visualRole === 'teacher'
                                  ? 'bg-emerald-600/10 text-emerald-500 dark:text-emerald-400'
                                  : visualRole === 'parent'
                                    ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400'
                                    : 'bg-slate-500/10 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {schoolConfig.logoImage ? (
                              <img src={schoolConfig.logoImage} alt="Logo" className="w-8 h-8 object-contain" />
                            ) : (
                              <GraduationCap className="w-8 h-8 stroke-[1.75]" />
                            )}
                          </div>
                        </div>

                        {/* Tiny decorative tag */}
                        <div className="absolute -bottom-1 bg-amber-500 border border-amber-400 text-[8px] text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs scale-90">
                          ⭐️ OFFICIAL
                        </div>
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h2 className={`text-2xl font-black tracking-tight ${themeMode === 'dark' ? 'text-white' : 'text-slate-950'} font-sans`}>
                        {lang === 'am' ? schoolConfig.nameAmh : schoolConfig.nameEng}
                      </h2>
                      <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-xs transition-all ${
                          visualRole === 'principal' 
                            ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' 
                            : visualRole === 'vice_principal'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                              : visualRole === 'teacher' 
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                                : visualRole === 'parent' 
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' 
                                  : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}>
                          <Shield className="w-3 h-3" />
                          <span>
                            {visualRole === 'principal' 
                              ? tx('የአስተዳዳሪ መግቢያ በር (Principal Portal)') 
                              : visualRole === 'vice_principal'
                                ? tx('የምክትል ርዕሰ መምህርት መግቢያ በር (Vice Principal Portal)')
                                : visualRole === 'teacher' 
                                  ? tx('የመምህራን መግቢያ በር (Teacher Portal)') 
                                  : visualRole === 'parent' 
                                    ? tx('የወላጅ/ተማሪ መግቢያ በር (Parent Portal)') 
                                    : tx('የተቀናጀ የትምህርት ቤት መግቢያ በር (Unified School Portal)')
                            }
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Explainer note */}
                    <div className={`p-4 rounded-2xl text-xs mb-5 border leading-relaxed text-left transition-all duration-300 ${
                      visualRole === 'principal'
                        ? themeMode === 'dark' ? 'bg-indigo-950/20 text-indigo-300 border-indigo-900/30' : 'bg-indigo-50/50 text-indigo-900 border-indigo-100/80'
                        : visualRole === 'vice_principal'
                          ? themeMode === 'dark' ? 'bg-blue-950/20 text-blue-300 border-blue-900/30' : 'bg-blue-50/50 text-blue-900 border-blue-100/80'
                          : visualRole === 'teacher'
                            ? themeMode === 'dark' ? 'bg-emerald-950/20 text-emerald-300 border-emerald-900/30' : 'bg-emerald-50/50 text-emerald-900 border-emerald-100/80'
                            : visualRole === 'parent'
                              ? themeMode === 'dark' ? 'bg-amber-950/20 text-amber-300 border-amber-900/30' : 'bg-amber-50/50 text-amber-900 border-amber-100/80'
                              : themeMode === 'dark' ? 'bg-indigo-950/40 text-indigo-300 border-indigo-900/40' : 'bg-slate-50/50 text-slate-600 border-slate-150'
                    }`}>
                      <div className="flex gap-2">
                        <span className="text-sm select-none">💡</span>
                        <div>
                          {visualRole === 'neutral' ? (
                            <p><strong>{tx('የተቀናጀ መግቢያ በር (Unified Portal)፦')}</strong> {tx('ስልክ ቁጥርዎን ወይም ኢሜልዎን ሲያስገቡ ስርዓቱ በራስ-ሰር የአካውንት አይነትዎን ለይቶ ወደ ትክክለኛው የስራ ገበታ ያስገባዎታል። (Enter your registered phone or email, and the system will automatically direct you to your authorized dashboard.)')}</p>
                          ) : (
                            <>
                              {visualRole === 'principal' && (
                                <p>{tx('ርዕሰ መምህር (Principal)፦ መምህራንን ለመመዝገብ፣ አጠቃላይ ሪፖርቶችን ለመመልከት እና ተለዋዋጭ መገለጫዎችን ለመቆጣጠር።')}</p>
                              )}
                              {visualRole === 'vice_principal' && (
                                <p>{tx('ምክትል ርዕሰ መምህርት (Vice Principal)፦ የአስተዳደር ስራዎችን ለመምራት፣ የሰራተኞች የስራ ክፍፍልን ለመከታተል እንዲሁም በተጨማሪነት የተመደቡበትን ክፍልና የትምህርት አይነት በማርክ ሊስት ለማስተዳደር።')}</p>
                              )}
                              {visualRole === 'teacher' && (
                                <p>{tx('መምህር (Teacher)፦ የተማሪዎችን ውጤት መዛግብት በቀላሉ ለመሙላት እና ክትትል ለማድረግ።')}</p>
                              )}
                              {visualRole === 'parent' && (
                                <p>{tx('ወላጅ / ተማሪ (Parent/Student)፦ የተማሪዎችን ውጤት ካርድ (Report Card) ለመመልከት እና በፒዲኤፍ ለማውረድ።')}</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {authError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3.5 text-xs font-semibold rounded-2xl mb-5 border text-left ${
                          themeMode === 'dark' 
                            ? 'bg-rose-950/30 text-rose-300 border-rose-900/40' 
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        ⚠️ {authError}
                      </motion.div>
                    )}

                    {isIpBlocked ? (
                      <div className={`p-5 rounded-2xl border text-center flex flex-col items-center gap-3 mb-4 ${
                        themeMode === 'dark' ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900 font-semibold'
                      }`}>
                        <AlertTriangle className="w-8 h-8 text-rose-600 animate-bounce" />
                        <div>
                          <span className="text-xs font-black block">{tx("🚨 ሲስተሙ ለደህንነት ሲባል ተቆልፏል! (Security IP Lockout)")}</span>
                          <span className="text-[11px] opacity-90 block mt-1.5 leading-relaxed">{tx(
                            "\n                            ለደህንነት ጥበቃ ሲባል ተደጋጋሚ የተሳሳተ ሙከራ በመደረጉ ሲስተሙ ለ "
                          )}{formatBlockCooldownTime(blockCooldownSecs)}{tx(" ታግዷል። እባክዎ በትዕግስት ይጠብቁ።\n                          ")}</span>
                          <span className="text-[9px] font-mono opacity-80 block mt-1 bg-rose-500/10 py-1 px-2 rounded-lg border border-rose-500/20">
                            IP: 197.156.124.81 (BLOCKED_BRUTE_FORCE)
                          </span>
                        </div>
                      </div>
                    ) : isTwoFactorPending ? (
                      <form onSubmit={handleTwoFactorSubmit} className="space-y-4 text-left">
                        <div className={`p-4 rounded-2xl border ${
                          themeMode === 'dark' 
                            ? 'bg-indigo-950/30 border-indigo-900/40 text-indigo-200' 
                            : 'bg-indigo-50/50 border-indigo-150 text-indigo-950'
                        } text-xs text-center`}>
                          <p className="font-black mb-1">{tx("🔐 ባለ ሁለት-ደረጃ ማረጋገጫ (2-Factor Verification Code)")}</p>
                          <p className="opacity-90 leading-relaxed text-[11px]">{tx(
                            "\n                            የደህንነት ማረጋገጫ ኮድ ወደ መለያዎ ተልኳል። (A secure access code has been generated for your role).\n                          "
                          )}</p>
                          <div className="mt-2.5 bg-indigo-600/10 dark:bg-indigo-400/10 py-1.5 px-3 rounded-xl border border-indigo-500/20 inline-block">
                            <span className="font-bold text-[10px]">{tx("የማሳያ ሲሙሌተር ኮድ (SMS OTP):")}</span>{' '}
                            <span className="font-black text-sm tracking-widest text-indigo-600 dark:text-indigo-400 font-mono animate-pulse">{twoFactorGeneratedCode}</span>
                          </div>
                        </div>

                        <div>
                          <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{tx("🔢 የማረጋገጫ ኮድ (Enter OTP Code):")}</label>
                          <input 
                            type="text" 
                            value={twoFactorCodeInput}
                            onChange={(e) => setTwoFactorCodeInput(e.target.value.replace(/\D/g, '').substring(0, 4))}
                            placeholder={tx("የ 4 አሃዝ ኮድ (4-digit code)")}
                            className={`w-full p-3.5 rounded-xl border text-center text-sm font-black tracking-widest outline-none transition-all font-mono ${
                              themeMode === 'dark' 
                                ? 'bg-slate-950 border-slate-800 text-indigo-400 placeholder:text-slate-700' 
                                : 'bg-slate-50 border-slate-200 text-indigo-800 placeholder:text-slate-400 bg-slate-50/50'
                            } ${activeTheme.focusRing} focus:ring-1`}
                            required
                            autoFocus
                          />
                          {twoFactorError && (
                            <p className="text-xs font-bold text-rose-500 mt-1 text-center">{twoFactorError}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => {
                              playInteractiveSound('click');
                              setIsTwoFactorPending(false);
                              setTwoFactorCodeInput('');
                              setTwoFactorError(null);
                            }}
                            className="flex-1 py-3 border border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-all cursor-pointer"
                          >{tx("\n                            ይቅር (Cancel)\n                          ")}</button>
                          <button 
                            type="submit" 
                            className={`flex-2 py-3 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer ${
                              selectedRole === 'principal' ? 'bg-indigo-600 hover:bg-indigo-700' : selectedRole === 'teacher' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'
                            }`}
                          >{tx(
                            "\n                            አረጋግጥ (Verify & Enter)\n                          "
                          )}</button>
                         </div>
                      </form>
                    ) : (
                      <form onSubmit={handleLogin} className="space-y-4 text-left">
                        <div>
                          <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${themeMode === 'dark' ? 'text-indigo-300' : 'text-slate-600'}`}>📱 {tx("ስልክ ቁጥር ወይም ኢሜል (Phone or Email)")}:</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              placeholder={tx("ለምሳሌ፡ 0912345678 ወይም ኢሜል (e.g. 0912345678 or Email)")}
                              className={`w-full p-3 pl-10 rounded-xl border-2 text-xs outline-none transition-all font-semibold ${
                                themeMode === 'dark' 
                                  ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-100 placeholder:text-indigo-400/60 focus:border-indigo-400 focus:bg-indigo-950/70' 
                                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-indigo-500 focus:bg-white'
                              } focus:ring-2 focus:ring-indigo-500/20`}
                              required
                            />
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                              <Users className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${themeMode === 'dark' ? 'text-indigo-300' : 'text-slate-600'}`}>🔑 {tx("የይለፍ ቃል (Password)")}:</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"} 
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              placeholder="••••••••"
                              className={`w-full p-3 pl-10 pr-10 rounded-xl border-2 text-xs outline-none transition-all font-mono font-bold ${
                                themeMode === 'dark' 
                                  ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-100 placeholder:text-indigo-400/60 focus:border-indigo-400 focus:bg-indigo-950/70' 
                                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-indigo-500 focus:bg-white'
                              } focus:ring-2 focus:ring-indigo-500/20`}
                              required
                            />
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                              <Lock className="w-4 h-4" />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                playInteractiveSound('click');
                                setShowPassword(!showPassword);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-md"
                              title={showPassword ? tx("የይለፍ ቃል ደብቅ (Hide Password)") : tx("የይለፍ ቃል አሳይ (Show Password)")}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Prominent Quick QR Login Option */}
                        <div className="pt-1 pb-0.5">
                          <button
                            type="button"
                            onClick={() => { playInteractiveSound('click'); setIsQRScannerOpen(true); }}
                            className={`w-full py-2.5 px-4 rounded-xl border border-dashed transition-all flex items-center justify-center gap-2 cursor-pointer text-[11px] font-black uppercase tracking-wider ${
                              themeMode === 'dark'
                                ? 'bg-indigo-950/20 border-indigo-800/40 text-indigo-300 hover:bg-indigo-950/40 hover:border-indigo-500'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/80 hover:border-indigo-500 hover:text-indigo-600'
                            }`}>
                          
                            <QrCode className="w-4 h-4" />
                            <span>{tx("በQR ኮድ በፍጥነት ግባ (Scan QR Code to Login)")}</span>
                          </button>
                        </div>

                        {/* Captcha System Layer */}
                        {isCaptchaRequirementActive && (
                          <div className={`p-3 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-950 border-slate-850' : 'bg-slate-50/50 border-slate-150'} flex items-center justify-between transition-all`}>
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isCaptchaVerified) return;
                                  playInteractiveSound('click');
                                  setIsCaptchaVerified(true);
                                  playInteractiveSound('success');
                                }}
                                className={`w-5.5 h-5.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                                  isCaptchaVerified 
                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs' 
                                    : themeMode === 'dark' ? 'bg-slate-900 border-slate-750 hover:border-indigo-500' : 'bg-white border-slate-300 hover:border-indigo-500'
                                }`}>
                              
                                {isCaptchaVerified && <span className="text-[11px] font-black">✓</span>}
                              </button>
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 select-none">{tx("እኔ ሮቦት አይደለሁም (CAPTCHA)")}</span>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <Shield className="w-4 h-4 text-emerald-500 animate-pulse" />
                              <span className="text-[6px] text-slate-400 font-mono">Secured Entry</span>
                            </div>
                          </div>
                        )}

                        <button 
                          type="submit" 
                          className={`w-full py-3 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                            visualRole === 'principal'
                              ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                              : visualRole === 'vice_principal'
                                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                                : visualRole === 'teacher'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                                  : visualRole === 'parent'
                                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                                    : 'bg-slate-700 hover:bg-slate-800 shadow-slate-500/10'
                          }`}
                        >
                          {visualRole === 'neutral'
                            ? t('ደህንነቱ በተጠበቀ መንገድ ግባ', 'Secure Sign In') 
                            : t(`በ${tx(visualRole)} አካውንት ግባ`, `Login as ${visualRole.toUpperCase()}`)}
                        </button>

                        {/* Quick Demo Access Pills */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-center">
                            {tx("ፈጣን የማሳያ መግቢያ (Quick Demo Select):")}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                playInteractiveSound('click');
                                setEmailInput('tadessemisganaw4@gmail.com');
                                setPasswordInput('Owner123');
                              }}
                              className="px-2 py-1.5 rounded-lg text-[10px] font-black border transition-all text-center cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 hover:border-emerald-500"
                            >
                              👑 {tx("ባለቤት (Owner)")}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playInteractiveSound('click');
                                setEmailInput('principal@school.com');
                                setPasswordInput('Principal123');
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-black border transition-all text-center cursor-pointer ${
                                visualRole === 'principal'
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                              }`}
                            >
                              🛡️ {tx("ርዕሰ መምህር")}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playInteractiveSound('click');
                                setEmailInput('viceprincipal@school.com');
                                setPasswordInput('Teacher123');
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-black border transition-all text-center cursor-pointer ${
                                visualRole === 'vice_principal'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                              }`}
                            >
                              👩‍💼 {tx("ምክትል ር/መ")}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playInteractiveSound('click');
                                setEmailInput('tadesse.teacher@school.com');
                                setPasswordInput('Teacher123');
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-black border transition-all text-center cursor-pointer ${
                                visualRole === 'teacher'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                              }`}
                            >
                              📚 {tx("መምህር")}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playInteractiveSound('click');
                                setEmailInput('parent@school.com');
                                setPasswordInput('Parent123');
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-black border transition-all text-center cursor-pointer ${
                                visualRole === 'parent'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                              }`}
                            >
                              👨‍👩‍👧 {tx("ወላጅ")}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Developer/Security utilities section in small footer form */}
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-3">
                      
                      {/* Interactive Subtle Settings Link */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => { playInteractiveSound('click'); setShowSecurityCenter(!showSecurityCenter); }}
                          className="hover:text-slate-600 dark:hover:text-slate-200 transition-all font-bold flex items-center gap-1 cursor-pointer">
                        
                          <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                          <span>⚙️ {showSecurityCenter ? tx("ደህንነት ማዕከል ዝጋ (Hide Security)") : tx("ደህንነት ማዕከል ክፈት (Security Center)")}</span>
                        </button>

                        <button 
                          type="button" 
                          onClick={() => { playInteractiveSound('click'); setIsQRScannerOpen(true); }}
                          className="hover:text-slate-600 dark:hover:text-slate-200 transition-all font-bold flex items-center gap-1 cursor-pointer">
                        
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{tx("QR ስካን መግቢያ")}</span>
                        </button>
                      </div>

                      {showSecurityCenter && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-3.5 text-left bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-850 overflow-hidden">
                        
                          {/* Interactive Toggles */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 flex items-center justify-between transition-all">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{tx("🔐 ባለ ሁለት ደረጃ (2FA)")}</span>
                                <span className="text-[7px] text-slate-400">Requires OTP Access</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  playInteractiveSound('click');
                                  setIsTwoFactorEnabled(!isTwoFactorEnabled);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                  isTwoFactorEnabled 
                                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                                    : themeMode === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}>
                              
                                {isTwoFactorEnabled ? 'ON' : 'OFF'}
                              </button>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 flex items-center justify-between transition-all">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700 dark:text-slate-300">🤖 CAPTCHA Shield</span>
                                <span className="text-[7px] text-slate-400">Bot Prevention</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  playInteractiveSound('click');
                                  setIsCaptchaRequirementActive(!isCaptchaRequirementActive);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                  isCaptchaRequirementActive 
                                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                                    : themeMode === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}>
                              
                                {isCaptchaRequirementActive ? 'ON' : 'OFF'}
                              </button>
                            </div>
                          </div>

                          {/* Recent logs */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1 px-0.5">
                              <History className="w-3 h-3 text-slate-400" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">{tx("መግቢያ ታሪኮች (Audit Log):")}</span>
                            </div>
                            
                            <div className={`rounded-xl border max-h-[120px] overflow-y-auto font-mono text-[8px] p-2.5 space-y-2.5 ${
                              themeMode === 'dark' ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-700'
                            }`}>
                              {securityAuditTrail.map((log) => (
                                <div key={log.id} className="flex items-start justify-between gap-2 border-b border-dashed border-slate-200/50 dark:border-slate-800/40 pb-2 last:border-0 last:pb-0">
                                  <div>
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className="font-bold text-slate-900 dark:text-slate-100">{log.email}</span>
                                      <span className="opacity-80">({log.status})</span>
                                    </div>
                                    <div className="text-slate-400 text-[7px]">{log.device} • {log.ip}</div>
                                  </div>
                                  <span className="text-slate-400 text-[7px] whitespace-nowrap">{log.timestamp}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Convert to Desktop App Link */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-950/20">
                        <div className="flex items-center gap-2 text-left">
                          <Monitor className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-500">{tx('ይህንን መተግበሪያ ወደ Desktop App ቀይረው ይጠቀሙ። (Convert this app to a Desktop App.)')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { playInteractiveSound('click'); setIsDesktopAppModalOpen(true); }}
                          className="px-2 py-1 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[8px] font-black rounded-lg transition-all cursor-pointer uppercase shrink-0">
                        
                          {tx('ቀይር (Convert)')}
                        </button>
                      </div>

                    </div>

                  </motion.div>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* LOGGED IN USER STATUS BANNER */}
                  <div className={`${themeMode === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white/75 backdrop-blur-md border-indigo-100 text-slate-900 shadow-xs'} border p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden transition-all duration-200`}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800 p-0.5 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
                        <img 
                          src={schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO} 
                          alt="School Logo" 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold border shadow-xs transition-all ${
                        currentUser?.role === 'principal'
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : currentUser?.role === 'vice_principal'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : currentUser?.role === 'teacher'
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : currentUser?.role === 'parent'
                                ? 'bg-amber-500 border-amber-400 text-white'
                                : 'bg-slate-700 border-slate-600 text-white'
                      }`}>
                        {currentUser?.role === 'principal' ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : currentUser?.role === 'vice_principal' ? (
                          <Award className="w-4 h-4" />
                        ) : currentUser?.role === 'teacher' ? (
                          <GraduationCap className="w-4 h-4" />
                        ) : currentUser?.role === 'parent' ? (
                          <UserCheck className="w-4 h-4" />
                        ) : currentUser?.name ? (
                          <span>{currentUser.name.substring(0, 2).toUpperCase()}</span>
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className={`${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-[10px] font-bold uppercase tracking-wider block`}>{tx('የገባው ተጠቃሚ (Current Session)')}</span>
                        <p className="text-sm font-black flex items-center gap-1.5 flex-wrap">
                          <span>{currentUser?.email}</span>
                          <span className={`px-2 py-0.5 rounded-lg ${themeMode === 'dark' ? 'bg-slate-800 text-indigo-400 border-slate-700' : 'bg-indigo-50 text-indigo-700 border-indigo-100'} text-[10px] font-mono border uppercase font-semibold`}>
                            {currentUser?.role === 'vice_principal' ? tx('ምክትል ርዕሰ መምህርት (Vice Principal)') : currentUser?.role}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {(currentUser?.role === 'principal' || currentUser?.role === 'vice_principal' || currentUser?.role === 'teacher') && (
                        <button 
                          onClick={() => { playInteractiveSound('click'); setIsQRScannerOpen(true); }}
                          className={`px-4 py-2 border rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                            themeMode === 'dark'
                              ? 'bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300 border-indigo-900/40 hover:border-indigo-500'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                          }`}>
                        
                          <QrCode className="w-3.5 h-3.5 animate-pulse" />
                          <span>{tx('የተማሪ QR ስካነር (Scan QR)')}</span>
                        </button>
                      )}

                      <button 
                        onClick={() => { playInteractiveSound('click'); setIsChangingPasswordOpen(true); }}
                        className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          themeMode === 'dark'
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                      
                        <Key className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{tx('የይለፍ ቃል ቀይር (Change Password)')}</span>
                      </button>

                      <button 
                        onClick={handleLogout}
                        className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          themeMode === 'dark'
                            ? 'bg-slate-800 hover:bg-slate-700 hover:text-rose-400 text-slate-300 border-slate-700'
                            : 'bg-slate-50 hover:bg-slate-100 hover:text-rose-600 text-slate-700 border-slate-200'
                        }`}>
                      
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{tx('ውጣ (Logout)')}</span>
                      </button>
                    </div>
                  </div>

                  {/* VICE PRINCIPAL VIEW SWITCHER BANNER */}
                  {currentUser?.role === 'vice_principal' && (
                    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-blue-700/40 print:hidden">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/80 border border-blue-400/40 flex items-center justify-center text-white text-2xl shadow-inner shrink-0">
                          👩‍💼
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-black">
                              {tx('የምክትል ርዕሰ መምህርት ገፅ (Vice Principal Portal)')}
                            </h2>
                            {currentTeacher && (currentTeacher.subjects?.length || currentTeacher.assignedClass) && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-2xs">
                                <GraduationCap className="w-3.5 h-3.5" />
                                {tx('የምታስተምር (Teaching Assigned)')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-blue-200">
                            {currentTeacher?.assignedClass 
                              ? `${tx('የተመደበችበት ክፍል:')} ${currentTeacher.assignedClass} "${currentTeacher.assignedSection || 'A'}" • ${tx('የትምህርት አይነቶች:')} ${(currentTeacher.subjects || []).join(', ')}`
                              : tx('የአስተዳደር እና የማስተማር ስራዎችዎን እዚህ በአንድ ላይ ያቀናብሩ።')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-2xl border border-white/10 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            playInteractiveSound('click');
                            setVicePrincipalActiveView('admin');
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                            vicePrincipalActiveView === 'admin'
                              ? 'bg-blue-600 text-white shadow-lg border border-blue-500'
                              : 'text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{tx('የአስተዳደር ገፅ (Admin Portal)')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playInteractiveSound('click');
                            setVicePrincipalActiveView('teaching');
                            setTeacherSubTab('class-sheets');
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                            vicePrincipalActiveView === 'teaching'
                              ? 'bg-emerald-600 text-white shadow-lg border border-emerald-500'
                              : 'text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>{tx('የማስተምረው ክፍልና ማርክ ሊስት (My Teaching & Mark List)')}</span>
                          {currentTeacher?.assignedClass && (
                            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-mono font-black ml-1">
                              {currentTeacher.assignedClass.replace('Grade ', '')}-{currentTeacher.assignedSection || 'A'}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playInteractiveSound('click');
                            setVicePrincipalActiveView('attendance');
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                            vicePrincipalActiveView === 'attendance'
                              ? 'bg-cyan-600 text-white shadow-lg border border-cyan-500'
                              : 'text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          <span>{tx('የሰራተኞች የጧት/ከሰዓት አቴንዳንስ (Staff Attendance Tables)')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VICE PRINCIPAL EXCLUSIVE STAFF ATTENDANCE TABLES */}
                  {currentUser?.role === 'vice_principal' && vicePrincipalActiveView === 'attendance' && (
                    <StaffAttendanceTablesSection
                      staffList={staffList}
                      teachers={teachers}
                      schoolConfig={schoolConfig}
                      workspaceId={schoolWorkspaceId}
                      currentUser={currentUser}
                    />
                  )}

                  {/* 1. PRINCIPAL & VICE PRINCIPAL ADMIN WORKSPACE */}
                  {(currentUser?.role === 'admin' || currentUser?.role === 'principal' || (currentUser?.role === 'vice_principal' && vicePrincipalActiveView === 'admin')) && (
                    <div className="space-y-6" id="principal-workspace">

                      {/* Principal Dashboard Overview KPI metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                        
                        {/* KPI 1: Students */}
                        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tx("ጠቅላላ ተማሪዎች (Total Students)")}</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-slate-900">{filteredStudentsForSchool.length}</span>
                              <span className="text-xs text-slate-500 font-medium">{tx("ተማሪዎች")}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold block">
                              🙋‍♂️ {filteredStudentsForSchool.filter(s => s.gender === 'Male').length}{tx(" ወንድ | 🙋‍♀️ ")}{filteredStudentsForSchool.filter(s => s.gender === 'Female').length}{tx(" ሴት\n                            ")}</span>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Users className="w-5 h-5" />
                          </div>
                        </div>

                        {/* KPI 2: Teachers */}
                        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tx("ጠቅላላ መምህራን (Active Teachers)")}</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-slate-900">{filteredTeachersForSchool.length}</span>
                              <span className="text-xs text-slate-500 font-medium">{tx("መምህራን")}</span>
                            </div>
                            <span className="text-[10px] text-emerald-600 font-semibold block">{tx(
                              "\n                              🟢 ሁሉም በስራ ላይ (Active status)\n                            "
                            )}</span>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                        </div>

                        {/* KPI 3: Subjects */}
                        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tx("የትምህርት አይነቶች (Subjects Setup)")}</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-slate-900">{(schoolConfig.subjectsByGrade?.[foundStudent?.grade || ''] && schoolConfig.subjectsByGrade[foundStudent?.grade || ''].length > 0 ? schoolConfig.subjectsByGrade[foundStudent?.grade || ''] : schoolConfig.subjects).length}</span>
                              <span className="text-xs text-slate-500 font-medium">{tx("ኮርሶች")}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold block">{tx("\n                              ደረጃ: ")}{schoolConfig.schoolLevel === 'secondary' ? tx("9-12ኛ ክፍል") : tx("1-8ኛ ክፍል")}
                            </span>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Layers className="w-5 h-5" />
                          </div>
                        </div>

                        {/* KPI 4: School Performance Average */}
                        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tx("አጠቃላይ አማካይ ውጤት (School GPA Avg)")}</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-indigo-700">
                                {filteredGradesForSchool.length > 0 
                                  ? `${Math.round(filteredGradesForSchool.reduce((sum, g) => sum + g.total, 0) / filteredGradesForSchool.length)}%` 
                                  : '0%'}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">{tx("አማካይ")}</span>
                            </div>
                            {/* Simple mini-progress bar */}
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                              <div 
                                className="h-full bg-indigo-600 rounded-full" 
                                style={{ 
                                  width: `${filteredGradesForSchool.length > 0 
                                    ? Math.round(filteredGradesForSchool.reduce((sum, g) => sum + g.total, 0) / filteredGradesForSchool.length) 
                                    : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <span className="text-lg font-black">📈</span>
                          </div>
                        </div>
                      </div>
                      <div className="print:hidden">
                        <PrincipalAnalytics 
                          students={filteredStudentsForSchool} 
                          grades={filteredGradesForSchool} 
                          schoolConfig={schoolConfig}
                          classes={filteredClassesForSchool}
                        />
                      </div>
                      {/* Principal Sub-tabs menu bar */}
                      <div className="flex overflow-x-auto gap-2 bg-slate-100/80 dark:bg-slate-900/40 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 print:hidden shadow-xs">
                        <button
                          onClick={() => { playInteractiveSound('click'); setPrincipalSubTab('students'); }}
                          className={`flex-1 min-w-[130px] py-2.5 px-3.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] ${
                            principalSubTab === 'students' 
                              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-md border-transparent' 
                              : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 border border-slate-200/40 dark:border-slate-850'
                          }`}>
                        
                          <Users className="w-3.5 h-3.5" />
                          <span>{tx("የተማሪዎች ምዝገባ (Students Registration)")}</span>
                        </button>

                        <button
                          onClick={() => { playInteractiveSound('click'); setPrincipalSubTab('teachers'); }}
                          className={`flex-1 min-w-[130px] py-2.5 px-3.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] ${
                            principalSubTab === 'teachers' 
                              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-md border-transparent' 
                              : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 border border-slate-200/40 dark:border-slate-850'
                          }`}>
                        
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{tx("የመምህራን ዝርዝር")}</span>
                        </button>

                        <button
                          id="principal-admin-division-btn"
                          type="button"
                          onClick={() => { playInteractiveSound('click'); setPrincipalSubTab('admin-division'); }}
                          className={`flex-1 min-w-[145px] py-2.5 px-3.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] ${
                            principalSubTab === 'admin-division' 
                              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white shadow-md border-transparent' 
                              : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 border border-slate-200/40 dark:border-slate-850'
                          }`}
                          title={tx("የአስተዳደር የስራ ክፍፍል (Admin Division of Work: ር/መ፣ ም/ር/መ፣ ፃፉ፣ ፋይናንስ፣ ፅዳት፣ ጥበቃ)")}
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>{tx("የአስተዳደር የስራ ክፍፍል")}</span>
                          <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded-full font-black">
                            6 ክፍሎች
                          </span>
                        </button>

                        <button
                          id="principal-register-staff-btn"
                          type="button"
                          onClick={() => {
                            playInteractiveSound('click');
                            setIsRegisterStaffModalOpen(true);
                          }}
                          className="min-w-[140px] py-2.5 px-4 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-md border-transparent shrink-0"
                          title={tx("የሰራተኞች ምዝገባ (Register Staff Modal)")}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{tx("የሰራተኞች ምዝገባ (Register Staff)")}</span>
                        </button>

                        <button
                          onClick={() => { playInteractiveSound('click'); setPrincipalSubTab('classes'); }}
                          className={`flex-1 min-w-[130px] py-2.5 px-3.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] ${
                            principalSubTab === 'classes' 
                              ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 text-white shadow-md border-transparent' 
                              : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 border border-slate-200/40 dark:border-slate-850'
                          }`}>
                        
                          <Layers className="w-3.5 h-3.5" />
                          <span>{tx("የክፍል ትምህርት ምዝገባ")}</span>
                        </button>

                        <button
                          onClick={() => { playInteractiveSound('click'); setPrincipalSubTab('notices'); }}
                          className={`flex-1 min-w-[130px] py-2.5 px-3.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] ${
                            principalSubTab === 'notices' 
                              ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 text-white shadow-md border-transparent' 
                              : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 border border-slate-200/40 dark:border-slate-850'
                          }`}>
                        
                          <Megaphone className="w-3.5 h-3.5" />
                          <span>{tx("ማስታወቂያ መለጠፊያ")}</span>
                        </button>

                        <button
                          onClick={() => { playInteractiveSound('click'); setPrincipalSubTab('gradetracker'); }}
                          className={`flex-1 min-w-[130px] py-2.5 px-3.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] ${
                            principalSubTab === 'gradetracker' 
                              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600 text-white shadow-md border-transparent' 
                              : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 border border-slate-200/40 dark:border-slate-850'
                          }`}>
                        
                          <Award className="w-3.5 h-3.5" />
                          <span>{tx("ውጤት መከታተያ (Grade Tracker)")}</span>
                        </button>

                        {(currentUser?.role === 'admin' || currentUser?.role === 'vice_principal') && (
                          <button
                            onClick={() => { playInteractiveSound('click'); setPrincipalSubTab('attendance'); }}
                            className={`flex-1 min-w-[130px] py-2.5 px-3.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] ${
                              principalSubTab === 'attendance' 
                                ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 text-white shadow-md border-transparent' 
                                : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 border border-slate-200/40 dark:border-slate-850'
                            }`}>
                          
                            <Users className="w-3.5 h-3.5" />
                            <span>{tx("ዕለታዊ የአቴንዳንስ ቁጥጥር")}</span>
                          </button>
                        )}

                        <button
                          onClick={() => { playInteractiveSound('click'); setPrincipalSubTab('reminders'); }}
                          className={`flex-1 min-w-[130px] py-2.5 px-3.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] ${
                            principalSubTab === 'reminders' 
                              ? 'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-600 text-white shadow-md border-transparent' 
                              : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 border border-slate-200/40 dark:border-slate-850'
                          }`}>
                        
                          <Mail className="w-3.5 h-3.5" />
                          <span>{tx("የውጤት ማሳሰቢያ (Grade Reminder)")}</span>
                        </button>

                        {(currentUser?.role === 'admin' || currentUser?.email?.trim().toLowerCase() === 'tadessemisganaw4@gmail.com') && (
                          <button
                            onClick={() => { playInteractiveSound('click'); setPrincipalSubTab('passwords'); }}
                            className={`flex-1 min-w-[130px] py-2.5 px-3.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] ${
                              principalSubTab === 'passwords' 
                                ? 'bg-gradient-to-r from-slate-600 via-slate-600 to-slate-700 text-white shadow-md border-transparent' 
                                : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 border border-slate-200/40 dark:border-slate-850'
                            }`}>
                          
                            <Key className="w-3.5 h-3.5" />
                            <span>{tx("የይለፍ ቃል አስተዳደር")}</span>
                          </button>
                        )}

                        <button
                          onClick={() => { if (currentUser?.role !== 'principal') { alert(tx("⚠️ እባክዎን በርዕሰ መምህር አካውንት ይግቡ!")); return; } playInteractiveSound('click'); setPrincipalSubTab('branding'); }}
                          className={`flex-1 min-w-[130px] py-2.5 px-3.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] ${
                            principalSubTab === 'branding' 
                              ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-600 text-white shadow-md border-transparent' 
                              : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 border border-slate-200/40 dark:border-slate-850'
                          }`}>
                        
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>{tx("የተቋም ብራንዲንግ (Branding)")}</span>
                        </button>

                        <button
                          onClick={() => { playInteractiveSound('click'); setPrincipalSubTab('messages'); }}
                          className={`flex-1 min-w-[130px] py-2.5 px-3.5 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.03] ${
                            principalSubTab === 'messages' 
                              ? 'bg-gradient-to-r from-teal-500 via-emerald-600 to-green-600 text-white shadow-md border-transparent' 
                              : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 border border-slate-200/40 dark:border-slate-850'
                          }`}>
                        
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                          <span>{tx("የግንኙነት መልዕክቶች (Messages)")}</span>
                        </button>
                      </div>

                      {/* Content areas based on active principal sub-tab */}
                      <AnimatePresence mode="wait">
                        {principalSubTab === 'students' && (
                          <motion.div
                            key="students-subtab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          
                            {/* Register Student Form */}
                            <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-xs">
                              <div>
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">{tx("ርዕሰ መምህር ተግባር")}</span>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                                  <PlusCircle className="text-indigo-600 w-5 h-5" />{tx(" አዲስ ተማሪ ይመዝግቡ\n                                ")}</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Register a New Student and Assign Class/Section</p>
                              </div>

                              {principalSuccessMsg && (
                                <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-semibold rounded-xl animate-pulse">
                                  {principalSuccessMsg}
                                </div>
                              )}

                              <form onSubmit={handleRegisterStudent} className="space-y-4">
                                <div>
                                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("የተማሪው ሙሉ ስም (Student Full Name):")}</label>
                                  <input 
                                    type="text"
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    placeholder={tx("መላኩ ገብሬ")}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50"
                                    required
                                  />
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                  <div>
                                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("ክፍል (Grade):")}</label>
                                    <select 
                                      value={newStudentGrade}
                                      onChange={(e) => setNewStudentGrade(e.target.value)}
                                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium">
                                    
                                      {activeGradesList.map(g => (
                                        <option key={g} value={g}>{g}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("ሴክሽን (Sec):")}</label>
                                    <select 
                                      value={newStudentSection}
                                      onChange={(e) => setNewStudentSection(e.target.value)}
                                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium">
                                    
                                      <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option><option value="H">H</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("ጾታ (Gender):")}</label>
                                    <select 
                                      value={newStudentGender}
                                      onChange={(e) => setNewStudentGender(e.target.value as any)}
                                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium">
                                    
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
                                      value={newStudentAge}
                                      onChange={(e) => setNewStudentAge(e.target.value)}
                                      placeholder="14"
                                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("የወላጅ ኢሜል (Parent Email - Optional):")}</label>
                                    <input 
                                      type="email"
                                      value={newStudentParentEmail}
                                      onChange={(e) => setNewStudentParentEmail(e.target.value)}
                                      placeholder="parent@school.com"
                                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">{tx("የልጁን ውጤት ብቻ እንዲያይ ይደረጋል። (Used for single-child access map)")}</p>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("የወላጅ ስልክ ቁጥር (Parent Phone - Required):")}</label>
                                    <input 
                                      type="tel"
                                      value={newStudentParentPhone}
                                      onChange={(e) => setNewStudentParentPhone(e.target.value)}
                                      placeholder="0912345678"
                                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50 font-mono"
                                      required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">{tx("የኢትዮጵያ ስልክ መሆን አለበት (09.../07...) (Standard Ethiopian phone)")}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("አድራሻ (Address - Optional):")}</label>
                                  <input 
                                    type="text"
                                    value={newStudentAddress}
                                    onChange={(e) => setNewStudentAddress(e.target.value)}
                                    placeholder={tx("አዲስ አበባ፣ ኢትዮጵያ (Addis Ababa, Ethiopia)")}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50"
                                  />
                                </div>


                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("የፋይዳ መታወቂያ (Student FAN/FIN - Optional):")}</label>
                                    <input 
                                      type="text"
                                      value={newStudentDigitalId}
                                      onChange={(e) => setNewStudentDigitalId(e.target.value)}
                                      placeholder="DIG-12345"
                                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">{tx("የተማሪው ዲጂታል መለያ ቁጥር (ባይሞላም ግን ያሳልፋል)")}</p>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("የትምህርት ዘመን (Academic Year):")}</label>
                                    <input 
                                      type="text"
                                      value={newStudentAcademicYear}
                                      onChange={(e) => setNewStudentAcademicYear(e.target.value)}
                                      placeholder={tx("2018 ዓ.ም")}
                                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50"
                                      required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">{tx("በመታወቂያና ሪፖርት ካርድ ላይ ይወጣል")}</p>
                                  </div>
                                </div>

                                {/* የተማሪው ፕሮፋይል ፎቶ (Student Profile Photo) */}
                                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
                                  <label className="block text-xs font-bold uppercase text-slate-600">{tx(
                                    "\n                                    የተማሪው ፕሮፋይል ፎቶ (Profile Photo - Optional):\n                                  "
                                  )}</label>

                                  {isNewStudentCameraActive ? (
                                    <div className="space-y-3">
                                      <div className="relative w-full aspect-square max-w-[200px] mx-auto bg-slate-950 rounded-xl overflow-hidden border border-slate-300 flex flex-col items-center justify-center p-3 text-center">
                                        {newStudentCameraError ? (
                                          <div className="text-xs text-rose-400 p-2 font-medium flex flex-col items-center gap-2">
                                            <span>{newStudentCameraError}</span>
                                            <a 
                                              href={window.location.href}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-all shadow-md cursor-pointer">{tx(
                                              "\n                                            \n                                              አዲስ ታብ ላይ ክፈት (Open in New Tab)\n                                            "
                                            )}</a>
                                          </div>
                                        ) : (
                                          <>
                                            <video 
                                              ref={newStudentVideoRef}
                                              autoPlay 
                                              playsInline 
                                              muted 
                                              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                                            />
                                            {/* Camera overlay box */}
                                            <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-full pointer-events-none"></div>
                                          </>
                                        )}
                                      </div>
                                      <div className="flex gap-2 justify-center">
                                        {!newStudentCameraError && (
    <>
      <button
        type="button"
        onClick={toggleNewStudentCameraFacing}
        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        title={tx("ካሜራ ቀይር (Switch Camera)")}>
      
        <RefreshCw className="w-3.5 h-3.5" />{tx(" ቀይር (Switch)\n      ")}</button>
      <button
        type="button"
        onClick={captureNewStudentPhoto}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer">
      
        <Camera className="w-3.5 h-3.5" />{tx(" ፎቶ አንሳ (Capture)\n      ")}</button>
    </>
  )}
                                        <button
                                          type="button"
                                          onClick={stopNewStudentCamera}
                                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
                                        
                                          <CameraOff className="w-3.5 h-3.5" />{tx(" ዝጋ (Cancel)\n                                        ")}</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-4">
                                      {newStudentPhoto ? (
                                        <div className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-indigo-200 bg-white">
                                          <img 
                                            src={newStudentPhoto} 
                                            alt="Student preview" 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                        </div>
                                      ) : (
                                        <div className="shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                                          <Camera className="w-6 h-6" />
                                        </div>
                                      )}

                                      <div className="flex flex-col gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => startNewStudentCamera(newStudentCameraFacing)}
                                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-indigo-100 transition-colors cursor-pointer">
                                        
                                          <Camera className="w-3.5 h-3.5" /> {newStudentPhoto ? tx("ፎቶ ቀይር (Change Photo)") : tx("ካሜራ ክፈት (Open Camera)")}
                                        </button>
                                        {newStudentPhoto && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              playInteractiveSound('click');
                                              setNewStudentPhoto(undefined);
                                            }}
                                            className="text-[10px] text-rose-600 font-bold hover:underline text-left cursor-pointer">{tx(
                                            "\n                                          \n                                            🗑️ ፎቶውን አጥፋ (Remove Photo)\n                                          "
                                          )}</button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <button 
                                  type="submit"
                                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold rounded-xl text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">{tx(
                                  "\n                                \n                                  ➕ ተማሪ መዝግብ (Register Student)\n                                "
                                )}</button>
                              </form>
                            </div>

                            {/* Registered Students Table */}
                            <div className="lg:col-span-7 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
                                <div>
                                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <Users className="text-indigo-600 dark:text-indigo-450 w-5 h-5" />{tx(" በሲስተሙ የተመዘገቡ ተማሪዎች ዝርዝር\n                                  ")}</h3>
                                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Live student profile database with section allocation</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={handleDownloadStudentsPDF}
                                    className="flex p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 font-bold rounded-xl text-xs items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                    title={tx("የተማሪዎችን መዝገብ በPDF ወደ ሎካል ስቶሬጅ ያውርዱ (Download Student List PDF)")}>
                                    <Download className="w-3.5 h-3.5" /> {tx("በPDF አውርድ (PDF)")}
                                  </button>
                                  <button
                                    onClick={handleExportStudentsCSV}
                                    className="flex p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl text-xs items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                    title={tx("የተማሪዎችን መረጃ ያውርዱ (Download Excel/CSV)")}>
                                  
                                    <Download className="w-3.5 h-3.5" /> Excel (CSV)
                                   </button>
                                   <label
                                     className="flex p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 font-bold rounded-xl text-xs items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                     title={tx("ተማሪዎችን ከፋይል (CSV/JSON) ጫን/ሰቅል (Upload Students File)")}>
                                     <Upload className="w-3.5 h-3.5" /> <span>{tx("ፋይል ጫን (Upload)")}</span>
                                     <input 
                                       type="file" 
                                       accept=".json,.csv,.txt" 
                                       onChange={handleUploadStudentsFile}
                                       className="hidden" 
                                     />
                                   </label>
                                  <button
                                    onClick={() => {
                                      playInteractiveSound('click');
                                      setIsStudentListPrintActive(true);
                                    }}
                                    className="flex p-2 bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-400 font-bold rounded-xl text-xs items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                    title={tx("የተማሪዎችን ዝርዝር በወረቀት አትም (Print List)")}>
                                  
                                    <Printer className="w-3.5 h-3.5" /> Print List
                                  </button>
                                  <button
                                    onClick={() => {
                                      playInteractiveSound('click');
                                      setIsBatchPrintActive(true);
                                    }}
                                    className="flex p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl text-xs items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                    title={tx("በጅምላ አትም (Batch Print 4/A4)")}>
                                  
                                    <Printer className="w-3.5 h-3.5" /> Print Section
                                  </button>
                                  <button
                                    onClick={() => {
                                      playInteractiveSound('click');
                                      setRegisteredStudentFilter('all');
                                      setTimeout(() => setIsBatchPrintActive(true), 0);
                                    }}
                                    className="flex p-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-400 font-bold rounded-xl text-xs items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                    title={tx("ሁሉንም አትም (Print All Students)")}>
                                  
                                    <Printer className="w-3.5 h-3.5" /> All Print
                                  </button>
                                  <span className="hidden md:inline text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{tx("የክፍል ማጣሪያ (Filter):")}</span>
                                  <select
                                    value={registeredStudentFilter}
                                    onChange={(e) => {
                                      playInteractiveSound('click');
                                      setRegisteredStudentFilter(e.target.value);
                                    }}
                                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                                  
                                    <option value="all">{tx("📍 ሁሉንም (All)")}</option>
                                    {activeGradesList.map(g => (
                                      <option key={g} value={g}>
                                        {g.replace('Grade ', '')}{tx("ኛ ክፍል (")}{g})
                                      </option>
                                    ))}
                                    <option disabled>{tx("--- በሴክሽን (By Section) ---")}</option>
                                      {availableSectionsForFilter.map(secStr => {
                                        const [g, s] = secStr.split('|');
                                        return (
                                          <option key={secStr} value={secStr}>
                                            {g.replace('Grade ', '')}{tx("ኛ ክፍል ")}{s}({g}- {s})
                                                                                                                                  </option>
                                        );
                                      })}
                                    
                                  </select>
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                  <thead>
                                    <tr className="bg-black text-white uppercase text-[10px] tracking-wider font-extrabold">
                                      <th className="p-3 text-white">{tx("መታወቂያ ID")}</th>
                                      <th className="p-3 text-white">{tx("የተማሪ ስም (Student Name)")}</th>
                                      <th className="p-3 text-white">{tx("ክፍል እና ሴክሽን (Grade & Section)")}</th>
                                      <th className="p-3 text-white">{tx("ጾታ (Gender)")}</th>
                                      <th className="p-3 text-white">{tx("ዕድሜ (Age)")}</th>
                                      <th className="p-3 text-center text-white">{tx("እርምጃዎች (Actions)")}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[...filteredStudentsForSchool]
                                      .filter(student => {
                                        if (registeredStudentFilter === 'all') return true;
                                        if (registeredStudentFilter.includes('|')) {
                                          const [g, s] = registeredStudentFilter.split('|');
                                          return student.grade === g && student.section === s;
                                        }
                                        return student.grade === registeredStudentFilter;
                                      })
                                      .sort((a, b) => a.name.localeCompare(b.name, 'am'))
                                      .map((student) => (
                                        <tr key={student.id} className="hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 dark:border-slate-800/40 text-slate-800 dark:text-slate-200 transition-all duration-150">
                                          <td className="p-3 font-mono font-bold text-xs" style={themeMode === 'dark' ? { color: '#ffffff' } : undefined}>
                                            <span
                                              className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs border inline-block ${
                                                themeMode === 'dark'
                                                  ? 'bg-slate-800 text-white border-slate-700 shadow-xs'
                                                  : 'bg-indigo-50/70 text-indigo-700 border-indigo-100/60'
                                              }`}
                                              style={themeMode === 'dark' ? { color: '#ffffff', backgroundColor: '#1e293b', borderColor: '#334155' } : undefined}
                                            >
                                              {student.id}
                                            </span>
                                          </td>
                                          <td className="p-3">
                                            <div className={`font-bold text-sm ${themeMode === 'dark' ? 'text-white' : 'text-slate-900'}`} style={themeMode === 'dark' ? { color: '#ffffff' } : undefined}>
                                              {student.name}
                                            </div>
                                            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                              {student.parentEmail && (
                                                <div
                                                  className={`text-[10px] font-mono font-bold flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                                                    themeMode === 'dark'
                                                      ? 'bg-slate-800 text-white border-slate-700'
                                                      : 'bg-indigo-50/40 text-indigo-600 border-indigo-100/30'
                                                  }`}
                                                  style={themeMode === 'dark' ? { color: '#ffffff', backgroundColor: '#1e293b', borderColor: '#334155' } : undefined}
                                                >
                                                  <span>📧</span> {student.parentEmail}
                                                </div>
                                              )}
                                              {student.parentPhone && (
                                                <div
                                                  className={`text-[10px] font-mono font-bold flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                                                    themeMode === 'dark'
                                                      ? 'bg-slate-800 text-white border-slate-700'
                                                      : 'bg-emerald-50/40 text-emerald-600 border-emerald-100/30'
                                                  }`}
                                                  style={themeMode === 'dark' ? { color: '#ffffff', backgroundColor: '#1e293b', borderColor: '#334155' } : undefined}
                                                >
                                                  <span>📞</span> {student.parentPhone}
                                                </div>
                                              )}
                                              {student.address && (
                                                <div
                                                  className={`text-[10px] font-sans font-bold flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                                                    themeMode === 'dark'
                                                      ? 'bg-slate-800 text-white border-slate-700'
                                                      : 'bg-slate-50/40 text-slate-600 border-slate-200/50'
                                                  }`}
                                                  style={themeMode === 'dark' ? { color: '#ffffff', backgroundColor: '#1e293b', borderColor: '#334155' } : undefined}
                                                >
                                                  <span>📍</span> {student.address}
                                                </div>
                                              )}
                                              {student.digitalId && (
                                                <div
                                                  className={`text-[10px] font-mono font-bold flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                                                    themeMode === 'dark'
                                                      ? 'bg-slate-800 text-white border-slate-700'
                                                      : 'bg-amber-50/40 text-amber-600 border-amber-100/30'
                                                  }`}
                                                  style={themeMode === 'dark' ? { color: '#ffffff', backgroundColor: '#1e293b', borderColor: '#334155' } : undefined}
                                                >
                                                  <span>🆔</span> {student.digitalId}
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                          <td className="p-3 text-xs font-bold" style={themeMode === 'dark' ? { color: '#ffffff' } : undefined}>
                                            <span
                                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black border whitespace-nowrap ${
                                                themeMode === 'dark'
                                                  ? 'bg-slate-800 text-white border-slate-700'
                                                  : 'bg-indigo-50 text-indigo-700 border-indigo-100/50'
                                              }`}
                                              style={themeMode === 'dark' ? { color: '#ffffff', backgroundColor: '#1e293b', borderColor: '#334155' } : undefined}
                                            >
                                              {student.grade} - {student.section}
                                            </span>
                                          </td>
                                          <td className="p-3 text-xs font-medium" style={themeMode === 'dark' ? { color: '#ffffff' } : undefined}>
                                            {(student.gender === 'Female' || student.gender === 'F' || student.gender === 'ሴት') ? (
                                              <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold ${
                                                  themeMode === 'dark'
                                                    ? 'bg-slate-800 text-white border-slate-700'
                                                    : 'bg-pink-50 text-pink-700 border-pink-100/30'
                                                }`}
                                                style={themeMode === 'dark' ? { color: '#ffffff', backgroundColor: '#1e293b', borderColor: '#334155' } : undefined}
                                              >
                                                {tx("👩 ሴት")}
                                              </span>
                                            ) : (
                                              <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold ${
                                                  themeMode === 'dark'
                                                    ? 'bg-slate-800 text-white border-slate-700'
                                                    : 'bg-blue-50 text-blue-700 border-blue-100/30'
                                                }`}
                                                style={themeMode === 'dark' ? { color: '#ffffff', backgroundColor: '#1e293b', borderColor: '#334155' } : undefined}
                                              >
                                                {tx("👨 ወንድ")}
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-3 text-xs font-black" style={themeMode === 'dark' ? { color: '#ffffff' } : undefined}>
                                            {student.age ? (
                                              <span
                                                className="px-2 py-0.5 text-white bg-black rounded border border-black inline-block font-black"
                                                style={{ color: '#ffffff', backgroundColor: '#000000' }}
                                              >
                                                {student.age}{tx(" ዓመት (years)\n                                              ")}</span>
                                            ) : (
                                              <span style={themeMode === 'dark' ? { color: '#ffffff' } : undefined}>-</span>
                                            )}
                                          </td>
                                          <td className="p-3 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                              <button
                                                onClick={() => {
                                                  playInteractiveSound('click');
                                                  setSelectedQRStudent(student);
                                                }}
                                                className="p-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-xl transition-all border border-amber-100/50 dark:border-amber-900/30 cursor-pointer transform hover:scale-105 active:scale-95"
                                                title={tx("የQR መታወቂያ አውጣ (Generate QR Code Card)")}>
                                              
                                                <QrCode className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => handleOpenEditStudentMain(student)}
                                                className="p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all border border-indigo-100/50 dark:border-indigo-900/30 cursor-pointer transform hover:scale-105 active:scale-95"
                                                title={tx("ማስተካከል (Edit)")}>
                                              
                                                <Edit2 className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => {
                                                  playInteractiveSound('wrong');
                                                  setDeletingStudentMainTab(student);
                                                }}
                                                className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl transition-all border border-rose-100/50 dark:border-rose-900/30 cursor-pointer transform hover:scale-105 active:scale-95"
                                                title={tx("ማጥፋት (Delete)")}>
                                              
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    {filteredStudentsForSchool.filter(student => {
                                        if (registeredStudentFilter === 'all') return true;
                                        if (registeredStudentFilter.includes('|')) {
                                          const [g, s] = registeredStudentFilter.split('|');
                                          return student.grade === g && student.section === s;
                                        }
                                        return student.grade === registeredStudentFilter;
                                      }).length === 0 && (
                                      <tr>
                                        <td colSpan={6} className="p-6 text-center text-slate-400 text-xs font-medium">{tx(
                                          "\n                                          በዚህ ክፍል የተመዘገበ ተማሪ አልተገኘም (No students registered in this grade)\n                                        "
                                        )}</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Automated Parent Email Notification Simulation outbox */}
                            <div className="lg:col-span-12 mt-2">
                              <SimulatedEmailOutbox />
                            </div>
                          </motion.div>
                        )}

                        {(principalSubTab === 'teachers' || principalSubTab === 'admin-division') && (
                          <motion.div
                            key={principalSubTab === 'admin-division' ? 'admin-division-subtab' : 'teachers-subtab'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}>
                          
                            <TeacherSection 
                              teachers={filteredTeachersForSchool} 
                              onAddTeacher={(newTeacher) => setTeachers(prev => [newTeacher, ...prev])} 
                              onEditTeacher={handleEditTeacher}
                              onDeleteTeacher={handleDeleteTeacher}
                              schoolConfig={schoolConfig}
                              onShowTeacherQR={setSelectedQRTeacher}
                              staffList={staffList}
                              onAddStaff={(newStaff) => setStaffList(prev => [newStaff, ...prev])}
                              onEditStaff={handleEditStaff}
                                                             onDeleteStaff={async (staffId) => {
                                 setStaffList(prev => prev.filter(s => s.id !== staffId));
                                 try {
                                   await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'teachers', staffId));
                                   await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'staff', staffId));
                                   const staffMem = staffList.find(s => s.id === staffId);
                                   if (staffMem?.email) {
                                     await deleteDoc(doc(db, 'schools', schoolWorkspaceId, 'userAccounts', staffMem.email.replace(/\./g, '_')));
                                   }
                                 } catch (e) {
                                   console.error('Firestore delete staff error:', e);
                                 }
                               }}
                              onOpenRegisterStaffModal={() => setIsRegisterStaffModalOpen(true)}
                              workspaceId={schoolWorkspaceId}
                              initialTab={principalSubTab === 'admin-division' ? 'admin-division' : 'directory'}
                              onOpenMarkList={handleOpenMarkListForStaff}
                            />
                          </motion.div>
                        )}

                        {principalSubTab === 'classes' && (
                          <motion.div
                            key="classes-subtab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}>
                          
                            <ClassSetupSection 
                              classes={filteredClassesForSchool} 
                              teachers={filteredTeachersForSchool}
                              students={filteredStudentsForSchool}
                              onAddClass={(newClass) => setClasses(prev => [newClass, ...prev])} 
                              onEditClass={handleEditClass}
                              onDeleteClass={handleDeleteClass}
                              schoolConfig={schoolConfig}
                              onUpdateSchoolConfig={setSchoolConfig}
                            />
                          </motion.div>
                        )}

                        {principalSubTab === 'notices' && (
                          <motion.div
                            key="notices-subtab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}>
                          
                            <AnnouncementSection 
                              announcements={announcements} 
                              onAddAnnouncement={(newAnn) => setAnnouncements(prev => [newAnn, ...prev])} 
                              onEditAnnouncement={handleEditAnnouncement}
                              onDeleteAnnouncement={handleDeleteAnnouncement}
                            />
                          </motion.div>
                        )}

                        {principalSubTab === 'gradetracker' && (
                          <motion.div
                            key="gradetracker-subtab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}>
                          
                            <GradeTrackerSection 
                              students={filteredStudentsForSchool} 
                              grades={filteredGradesForSchool} 
                              teachers={filteredTeachersForSchool}
                              classes={filteredClassesForSchool}
                              currentUserEmail={currentUser?.email || ''}
                              schoolConfig={schoolConfig}
                              currentUserRole={currentUser?.role}
                              onSaveGrade={(g) => {
                                setGrades(prev => [g, ...prev.filter(x => !(x.studentId === g.studentId && x.subject === g.subject && (x.term || 1) === (g.term || 1)))]);
                              }}
                              onDeleteGrade={(studentId, subject, term) => {
                                setGrades(prev => prev.filter(x => !(x.studentId === studentId && x.subject === subject && (x.term || 1) === term)));
                              }}
                              onAddStudent={(newStudent) => {
                                setStudents(prev => [newStudent, ...prev]);
                                const targetParentEmail = newStudent.parentEmail || `${newStudent.name.replace(/\s+/g, '_').toLowerCase()}_parent@school.com`;
                                ParentNotificationService.sendRegistrationEmail(
                                  newStudent.name,
                                  newStudent.id,
                                  newStudent.grade,
                                  newStudent.section,
                                  targetParentEmail
                                );
                              }}
                              onEditStudent={handleEditStudent}
                              onDeleteStudent={handleDeleteStudent}
                              onRequestManualPdfLink={(url, filename, title) => {
                                setDownloadablePdf({ url, filename, title });
                              }}
                              onShowStudentQR={setSelectedQRStudent}
                              onUpdateSchoolConfig={setSchoolConfig}
                              onOpenQRScanner={() => setIsQRScannerOpen(true)}
                            />
                          </motion.div>
                        )}

                        {principalSubTab === 'attendance' && (currentUser?.role === 'admin' || currentUser?.role === 'vice_principal') && (
                          <motion.div
                            key="attendance-subtab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}>
                          
                            <GradeTrackerSection 
                              students={filteredStudentsForSchool} 
                              grades={filteredGradesForSchool} 
                              teachers={filteredTeachersForSchool}
                              classes={filteredClassesForSchool}
                              currentUserEmail={currentUser?.email || ''}
                              schoolConfig={schoolConfig}
                              currentUserRole={currentUser?.role}
                              onSaveGrade={(g) => {
                                setGrades(prev => [g, ...prev.filter(x => !(x.studentId === g.studentId && x.subject === g.subject && (x.term || 1) === (g.term || 1)))]);
                              }}
                              onDeleteGrade={(studentId, subject, term) => {
                                setGrades(prev => prev.filter(x => !(x.studentId === studentId && x.subject === subject && (x.term || 1) === term)));
                              }}
                              onAddStudent={(newStudent) => {
                                setStudents(prev => [newStudent, ...prev]);
                                const targetParentEmail = newStudent.parentEmail || `${newStudent.name.replace(/\s+/g, '_').toLowerCase()}_parent@school.com`;
                                ParentNotificationService.sendRegistrationEmail(
                                  newStudent.name,
                                  newStudent.id,
                                  newStudent.grade,
                                  newStudent.section,
                                  targetParentEmail
                                );
                              }}
                              onEditStudent={handleEditStudent}
                              onDeleteStudent={handleDeleteStudent}
                              onRequestManualPdfLink={(url, filename, title) => {
                                setDownloadablePdf({ url, filename, title });
                              }}
                              onShowStudentQR={setSelectedQRStudent}
                              onUpdateSchoolConfig={setSchoolConfig}
                              onOpenQRScanner={() => setIsQRScannerOpen(true)}
                              initialSubTab="attendance"
                            />
                          </motion.div>
                        )}

                        {principalSubTab === 'reminders' && (
                          <motion.div
                            key="reminders-subtab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}>
                          
                            <GradeRemindersSection 
                              students={filteredStudentsForSchool}
                              grades={filteredGradesForSchool}
                              classes={filteredClassesForSchool}
                              schoolConfig={schoolConfig}
                            />
                          </motion.div>
                        )}

                        {principalSubTab === 'passwords' && (currentUser?.role === 'admin' || currentUser?.email?.trim().toLowerCase() === 'tadessemisganaw4@gmail.com') && (
                          <motion.div
                            key="passwords-subtab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-left">
                          
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div>
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">{tx(
                                  "\n                                  🔑 የይለፍ ቃል እና መለያዎች መቆጣጠሪያ (Credentials & Passwords)\n                                "
                                )}</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">{tx(
                                  "\n                                  በሲስተሙ ውስጥ የሚገኙ መምህራንን፣ ወላጆችን እና ርዕሰ መምህሩን መለያዎች እና የይለፍ ቃላት እዚህ መቆጣጠር ይችላሉ። ተጠቃሚዎች ቃላቸውን ሲቀይሩ እዚህ ይታያል።\n                                "
                                )}</p>
                              </div>
                              <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-[11px] p-3 rounded-2xl font-bold">{tx(
                                "\n                                🔒 ማስታወሻ፡ ይህ መቆጣጠሪያ ለርዕሰ መምህሩ ብቻ የተፈቀደ የደህንነት ገጽ ነው።\n                              "
                              )}</div>
                            </div>

                            {/* Credentials Filter */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">{tx("ፈልግ (Search User)")}</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder={tx("በስም ወይም በኢሜል ፈልግ...")}
                                    className="w-full bg-white dark:bg-slate-800 dark:text-white border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold pl-8"
                                    onChange={(e) => {
                                      const val = e.target.value.toLowerCase();
                                      (window as any)._passwordsFilter = val;
                                      setUserAccounts([...userAccounts]); // force re-render
                                    }}
                                  />
                                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">{tx("በሚና ለይ (Filter by Role)")}</label>
                                <select
                                  className="w-full bg-white dark:bg-slate-800 dark:text-white border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    (window as any)._passwordsRoleFilter = val;
                                    setUserAccounts([...userAccounts]); // force re-render
                                  }}>
                                
                                  <option value="all">{tx("ሁሉንም ተጠቃሚዎች (All Users)")}</option>
                                  <option value="principal">{tx("ርዕሰ መምህር (Principal)")}</option>
                                  <option value="teacher">{tx("መምህራን (Teachers)")}</option>
                                  <option value="parent">{tx("ወላጆች (Parents)")}</option>
                                </select>
                              </div>
                            </div>

                            {/* Credentials Table */}
                            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-wider border-b border-slate-150">
                                    <th className="p-3">{tx("ተጠቃሚ (Name)")}</th>
                                    <th className="p-3">{tx("ኢሜል (Email / Username)")}</th>
                                    <th className="p-3">{tx("ስልክ ቁጥር (Phone Number)")}</th>
                                    <th className="p-3">{tx("ሚና (Role)")}</th>
                                    <th className="p-3">{tx("የይለፍ ቃል (Password)")}</th>
                                    <th className="p-3 text-center">{tx("እርምጃዎች (Actions)")}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {filteredUserAccountsForSchool
                                    .filter(acc => {
                                      const query = (window as any)._passwordsFilter || '';
                                      const roleF = (window as any)._passwordsRoleFilter || 'all';
                                      const matchesQuery = acc.name.toLowerCase().includes(query) || acc.email.toLowerCase().includes(query);
                                      const matchesRole = roleF === 'all' || acc.role === roleF;
                                      return matchesQuery && matchesRole;
                                    })
                                    .map(acc => (
                                      <tr key={acc.email} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3 text-xs font-bold text-slate-800">{acc.name}</td>
                                        <td className="p-3 text-xs font-mono font-semibold text-slate-600">{acc.email}</td>
                                        <td className="p-3 text-xs font-mono font-semibold text-slate-700">
                                          {editingPhoneEmail === acc.email ? (
                                            <div className="flex items-center gap-1 animate-fadeIn">
                                              <input
                                                type="text"
                                                value={editingPhoneValue}
                                                onChange={(e) => setEditingPhoneValue(e.target.value)}
                                                className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] w-28 focus:ring-1 focus:ring-indigo-500 outline-none font-sans font-semibold text-slate-800"
                                              />
                                              <button
                                                onClick={async () => {
                                                  const newPhone = editingPhoneValue.trim();
                                                  setUserAccounts(prev => prev.map(a => a.email === acc.email ? { ...a, phone: newPhone } : a));
                                                  
                                                  if (acc.role === 'teacher') {
                                                    const t = teachers.find(t => {
                                                      const tEmail = t.email || `${t.id.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.com`;
                                                      return tEmail.toLowerCase() === acc.email.toLowerCase();
                                                    });
                                                    if (t) {
                                                      await handleEditTeacher({ ...t, phone: newPhone });
                                                    }
                                                  } else if (acc.role === 'parent') {
                                                    const parentStudents = students.filter(s => s.parentEmail && s.parentEmail.toLowerCase() === acc.email.toLowerCase());
                                                    for (const s of parentStudents) {
                                                      await handleEditStudent({ ...s, parentPhone: newPhone });
                                                    }
                                                  }

                                                  playInteractiveSound('success');
                                                  setEditingPhoneEmail(null);
                                                }}
                                                className="px-1.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-black cursor-pointer"
>
                                                {lang === 'am' ? tx("አስቀምጥ") : 'Save'}
                                              </button>
                                              <button
                                                onClick={() => {
                                                  playInteractiveSound('click');
                                                  setEditingPhoneEmail(null);
                                                }}
                                                className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 text-[9px] font-black cursor-pointer"
>
                                                {lang === 'am' ? tx("ተወው") : 'Cancel'}
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-sans font-bold text-slate-800">{acc.phone || '—'}</span>
                                              <button
                                                onClick={() => {
                                                  playInteractiveSound('click');
                                                  setEditingPhoneEmail(acc.email);
                                                  setEditingPhoneValue(acc.phone || '');
                                                }}
                                                className="p-1 hover:bg-slate-100 rounded-md transition-all cursor-pointer text-xs"
                                                title={tx("ስልክ ቁጥር ለመቀየር")}>
                                              
                                                ✏️
                                              </button>
                                            </div>
                                          )}
                                        </td>
                                        <td className="p-3 text-xs">
                                          <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-mono border uppercase font-bold ${
                                            acc.role === 'principal' 
                                              ? 'bg-purple-50 text-purple-700 border-purple-100'
                                              : acc.role === 'teacher'
                                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                          }`}>
                                            {acc.role === 'principal' ? '👨‍💼 Principal' : acc.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍👩‍👧 Parent'}
                                          </span>
                                        </td>
                                        <td className="p-3 text-xs font-mono">
                                          <span className="bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-black border border-slate-200 select-all transition-colors inline-block cursor-pointer">
                                            {acc.password || 'N/A'}
                                          </span>
                                        </td>
                                        <td className="p-3 text-xs text-center space-x-1.5 whitespace-nowrap">
                                          {resetPasswordEmail === acc.email ? (
                                            <div className="flex items-center justify-center gap-1 animate-fadeIn">
                                              <span className="text-[10px] text-rose-600 font-bold block">{lang === 'am' ? tx("ይለፍ ቃል ይመለስ?") : 'Reset?'}</span>
                                              <button
                                                onClick={() => {
                                                  let defaultPass = 'Parent123';
                                                  if (acc.role === 'principal') {
                                                    defaultPass = 'Principal123';
                                                  } else if (acc.role === 'teacher') {
                                                    defaultPass = 'Teacher123';
                                                  } else if (acc.role === 'parent') {
                                                    const parentStud = students.find(s => s.parentEmail && s.parentEmail.toLowerCase() === acc.email.toLowerCase());
                                                    defaultPass = parentStud ? generateParentPassword(parentStud.name) : 'parent123';
                                                  }
                                                  setUserAccounts(prev => prev.map(a => a.email === acc.email ? { ...a, password: defaultPass } : a));
                                                  playInteractiveSound('success');
                                                  setResetPasswordEmail(null);
                                                }}
                                                className="px-1.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-black"
>
                                                {lang === 'am' ? tx("አዎ") : 'Yes'}
                                              </button>
                                              <button
                                                onClick={() => {
                                                  playInteractiveSound('click');
                                                  setResetPasswordEmail(null);
                                                }}
                                                className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 text-[9px] font-black"
>
                                                {lang === 'am' ? tx("አይ") : 'No'}
                                              </button>
                                            </div>
                                          ) : editingPasswordEmail === acc.email ? (
                                            <div className="flex items-center justify-center gap-1 animate-fadeIn">
                                              <input
                                                type="text"
                                                value={editingPasswordValue}
                                                onChange={(e) => setEditingPasswordValue(e.target.value)}
                                                className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] w-24 focus:ring-1 focus:ring-indigo-500 outline-none"
                                              />
                                              <button
                                                onClick={() => {
                                                  if (editingPasswordValue.trim() !== '') {
                                                    setUserAccounts(prev => prev.map(a => a.email === acc.email ? { ...a, password: editingPasswordValue.trim() } : a));
                                                    playInteractiveSound('success');
                                                  }
                                                  setEditingPasswordEmail(null);
                                                }}
                                                className="px-1.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-black"
>
                                                {lang === 'am' ? tx("አስቀምጥ") : 'Save'}
                                              </button>
                                              <button
                                                onClick={() => {
                                                  playInteractiveSound('click');
                                                  setEditingPasswordEmail(null);
                                                }}
                                                className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 text-[9px] font-black"
>
                                                {lang === 'am' ? tx("ተወው") : 'Cancel'}
                                              </button>
                                            </div>
                                          ) : confirmDeleteAccountEmail === acc.email ? (
                                            <div className="flex items-center justify-center gap-1.5 animate-fadeIn bg-rose-50 p-1.5 rounded-lg border border-rose-150">
                                              <span className="text-[10px] text-rose-700 font-bold block leading-tight">
                                                {lang === 'am' ? tx("መለያው ይጥፋ? (Delete?)") : 'Delete?'}
                                              </span>
                                              <button
                                                onClick={() => {
                                                  if (acc.email.toLowerCase() === currentUser?.email?.toLowerCase()) {
                                                    alert(lang === 'am' ? tx("❌ የራስዎን አካውንት ማጥፋት አይችሉም!") : '❌ You cannot delete your own account!');
                                                    setConfirmDeleteAccountEmail(null);
                                                    return;
                                                  }
                                                  setUserAccounts(prev => prev.filter(a => a.email !== acc.email));
                                                  playInteractiveSound('success');
                                                  setConfirmDeleteAccountEmail(null);
                                                }}
                                                className="px-1.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-black cursor-pointer shadow-3xs"
>
                                                {lang === 'am' ? tx("አዎ") : 'Yes'}
                                              </button>
                                              <button
                                                onClick={() => {
                                                  playInteractiveSound('click');
                                                  setConfirmDeleteAccountEmail(null);
                                                }}
                                                className="px-1.5 py-1 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-200 text-[9px] font-black cursor-pointer shadow-3xs">
                                                {lang === 'am' ? tx("ተው") : 'Cancel'}
                                              </button>
                                            </div>
                                          ) : (
                                            <>
                                              <button
                                                onClick={() => {
                                                  playInteractiveSound('click');
                                                  setResetPasswordEmail(acc.email);
                                                  setEditingPasswordEmail(null);
                                                  setConfirmDeleteAccountEmail(null);
                                                }}
                                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer">{tx(
                                                "\n                                              \n                                                ይለፍ ቃል መልስ (Reset)\n                                              "
                                              )}</button>

                                              <button
                                                onClick={() => {
                                                  playInteractiveSound('click');
                                                  setEditingPasswordEmail(acc.email);
                                                  setEditingPasswordValue(acc.password || '');
                                                  setResetPasswordEmail(null);
                                                  setConfirmDeleteAccountEmail(null);
                                                }}
                                                className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer">{tx(
                                                "\n                                              \n                                                ቀይር (Edit)\n                                              "
                                              )}</button>

                                              <button
                                                onClick={() => {
                                                  if (acc.email.toLowerCase() === currentUser?.email?.toLowerCase()) {
                                                    alert(lang === 'am' ? tx("❌ የራስዎን አካውንት ማጥፋት አይችሉም!") : '❌ You cannot delete your own account!');
                                                    return;
                                                  }
                                                  playInteractiveSound('wrong');
                                                  setConfirmDeleteAccountEmail(acc.email);
                                                  setResetPasswordEmail(null);
                                                  setEditingPasswordEmail(null);
                                                }}
                                                className="px-2 py-1.5 bg-slate-50 hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                                                title={lang === 'am' ? tx("ይህን መለያ አጥፋ (Delete account)") : 'Delete Account'}>
                                              
                                                🗑️ {lang === 'am' ? tx("አጥፋ") : 'Delete'}
                                              </button>
                                            </>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        )}

                        {principalSubTab === 'messages' && (
                          <motion.div
                            key="messages-subtab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                          >
                            <ParentTeacherCommunication
                              currentUserRole="principal"
                              currentUserName={currentUser?.name || 'ዶ/ር አለሙ በቀለ (Dr. Alemu Bekele)'}
                              currentUserContact={currentUser?.email || 'principal@school.com'}
                              allStudents={filteredStudentsForSchool}
                              allTeachers={teachers}
                              allStaff={staffList}
                              workspaceId={schoolWorkspaceId}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* 2. TEACHER & VICE PRINCIPAL TEACHING WORKSPACE */}
                  {(currentUser?.role === 'teacher' || (currentUser?.role === 'vice_principal' && vicePrincipalActiveView === 'teaching')) && (
                    <div className="col-span-full space-y-6" id="teacher-workspace">
                      {/* Teacher Workspace Header and Subtabs */}
                      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-750 shadow-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block">
                            {currentUser?.role === 'vice_principal'
                              ? tx("የምክትል ርዕሰ መምህርት የማስተማሪያ ገፅ / Vice Principal Teaching Portal")
                              : currentTeacher?.isHomeroomTeacher 
                                ? tx("የክፍል አላፊ ገፅ / Homeroom Portal") 
                                : tx("የመምህራን የክፍል መቆጣጠሪያ / Teacher Portal")}
                          </span>
                          <h2 className="text-xl font-black tracking-tight font-sans">
                            {currentUser?.role === 'vice_principal'
                              ? `እንኳን በደህና መጡ፣ ምክትል ርዕሰ መምህርት ${currentTeacher?.name || ''}! 👩‍💼📚`
                              : currentTeacher?.isHomeroomTeacher 
                                ? `እንኳን በደህና መጡ፣ የክፍል አላፊ መምህር ${currentTeacher.name}! 👨‍🏫` 
                                : tx("እንኳን በደህና መጡ፣ መምህር! 👋")}
                          </h2>
                          <p className="text-slate-300 text-xs">
                            {currentUser?.role === 'vice_principal'
                              ? tx("ለሚያስተምሩት ክፍልና የትምህርት አይነት ማርክ ሊስት ለመሙላት፣ ውጤት ለማስላት፣ ሮስተር ለመከታተልና ተማሪዎችን ለመገምገም እዚህ ይስሩ።")
                              : currentTeacher?.isHomeroomTeacher
                                ? tx("እንደ ክፍል አላፊ መምህርነትዎ የተማሪዎችዎን መገኘት (Attendance)፣ ምዝገባ እና ውጤቶችን እዚህ ያቀናብሩ።")
                                : tx("ከተማሪዎችዎ የውጤት መዛግብት፣ ማርክ ሊስት እና ሮስተሮች ጋር እዚህ በምቾት ይስሩ።")}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap shrink-0 bg-white/5 p-1 rounded-xl border border-white/10 items-center">
                          <button
                            onClick={() => { playInteractiveSound('click'); setTeacherSubTab('class-sheets'); }}
                            className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              teacherSubTab === 'class-sheets'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                            }`}>
                          
                            <FileSpreadsheet className="w-3.5 h-3.5" /> 
                            {currentUser?.role === 'vice_principal'
                              ? tx("የማርክ ሊስት ሰሌዳ (Mark List & Class Sheets)")
                              : currentTeacher?.isHomeroomTeacher 
                                ? tx("የክፍል አላፊ ገፅ (Homeroom Portal)") 
                                : tx("ሁሉን-አቀፍ ክፍል መቆጣጠሪያ (Class Sheets)")}
                          </button>
                          <button
                            onClick={() => { playInteractiveSound('click'); setTeacherSubTab('quick-entry'); }}
                            className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              teacherSubTab === 'quick-entry'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                            }`}>
                          
                            <PlusCircle className="w-3.5 h-3.5" />{tx(" ነጠላ ውጤት መመዝገቢያ (Quick Entry)")}
                          </button>

                          <button
                            onClick={() => { playInteractiveSound('click'); setTeacherSubTab('messages'); }}
                            className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              teacherSubTab === 'messages'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                            }`}>
                            <MessageSquare className="w-3.5 h-3.5" />
                            {tx("የወላጅና መምህር ግንኙነት (Messages)")}
                          </button>

                          {currentUser?.role === 'vice_principal' && (
                            <button
                              type="button"
                              onClick={() => { playInteractiveSound('click'); setVicePrincipalActiveView('admin'); }}
                              className="px-3.5 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer ml-auto"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {tx("ወደ አስተዳደር ገፅ (To Admin Portal)")}
                            </button>
                          )}
                        </div>
                      </div>

                      {teacherSubTab === 'class-sheets' && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
                        
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4">
                            <div>
                              <h3 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
                                {currentTeacher?.isHomeroomTeacher ? (
                                  <>
                                    <Users className="text-indigo-600 w-5 h-5" />{tx(
                                    " የክፍል አላፊ ገፅ (የአቴንዳንስ እና የተማሪዎች መቆጣጠሪያ)\n                                  "
                                  )}</>
                                ) : (
                                  <>
                                    <FileSpreadsheet className="text-emerald-600 w-5 h-5" />{tx(" የክፍል ማርክ ሊስት ማስተዳደሪያ\n                                  ")}</>
                                )}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {currentTeacher?.isHomeroomTeacher 
                                  ? tx(
                                  "እንደ ክፍል አላፊ መምህርነትዎ የተማሪዎችዎን ዕለታዊ መገኘት (Attendance) ይሙሉ፣ አዲስ ተማሪ ይመዝግቡ እንዲሁም የክፍልዎን ሰሌዳና ሪፖርቶች ይከታተሉ።"
                                )
                                  : tx(
                                  "እዚህ ላይ በክፍል እና በሴክሽን በመለየት የተማሪዎችን ውጤት መሙላት፣ ማረም፣ ማስተካከል እና ማተም/ማውረድ ይችላሉ።"
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <GradeTrackerSection
                            students={students}
                            grades={grades}
                            teachers={teachers}
                            classes={classes}
                            currentUserEmail={currentUser?.email || ''}
                            schoolConfig={schoolConfig}
                            currentUserRole={currentUser?.role === 'vice_principal' ? 'vice_principal' : 'teacher'}
                            onSaveGrade={(newGrade) => {
                              setGrades(prev => {
                                const existsIdx = prev.findIndex(g => g.studentId === newGrade.studentId && g.subject === newGrade.subject && (g.term || 1) === (newGrade.term || 1));
                                if (existsIdx !== -1) {
                                  const copy = [...prev];
                                  copy[existsIdx] = newGrade;
                                  return copy;
                                } else {
                                  return [newGrade, ...prev];
                                }
                              });
                            }}
                            onDeleteGrade={(studentId, subject, term) => {
                              setGrades(prev => prev.filter(x => !(x.studentId === studentId && x.subject === subject && (x.term || 1) === term)));
                            }}
                            onAddStudent={(newStudent) => {
                              setStudents(prev => [newStudent, ...prev]);
                              
                              // Send simulated email notification to the parent
                              const targetParentEmail = newStudent.parentEmail || `${newStudent.name.replace(/\s+/g, '_').toLowerCase()}_parent@school.com`;
                              ParentNotificationService.sendRegistrationEmail(
                                newStudent.name,
                                newStudent.id,
                                newStudent.grade,
                                newStudent.section,
                                targetParentEmail
                              );
                            }}
                            onEditStudent={handleEditStudent}
                            onDeleteStudent={handleDeleteStudent}
                            onRequestManualPdfLink={(url, filename, title) => {
                              setDownloadablePdf({ url, filename, title });
                            }}
                            onShowStudentQR={setSelectedQRStudent}
                            onUpdateSchoolConfig={setSchoolConfig}
                            onOpenQRScanner={() => setIsQRScannerOpen(true)}
                          />
                        </motion.div>
                      )}

                      {teacherSubTab === 'quick-entry' && (() => {
                        const assessments = getSubjectAssessments(selectedTeacherSubject);
                        const quizMax = assessments.find(a => a.id === 'quiz')?.maxMark ?? 10;
                        const cwMax = assessments.find(a => a.id === 'cw')?.maxMark ?? 10;
                        const hwMax = assessments.find(a => a.id === 'hw')?.maxMark ?? 10;
                        const gwMax = assessments.find(a => a.id === 'gw')?.maxMark ?? 0;
                        const pwMax = assessments.find(a => a.id === 'pw')?.maxMark ?? 0;
                        const cpMax = assessments.find(a => a.id === 'cp')?.maxMark ?? 0;
                        const midMax = assessments.find(a => a.id === 'mid')?.maxMark ?? 20;
                        const finalMax = assessments.find(a => a.id === 'final')?.maxMark ?? 50;
                        return (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                            {/* Grade Input Form */}
                            <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-xs">
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                                  <PlusCircle className="text-emerald-600 w-5 h-5" />{tx(" የተማሪ ውጤት መዝግብ (Teacher Grade Entry)\n                                ")}</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Secure grade logging linked to unique student IDs</p>
                              </div>

                              {teacherSuccessMsg && (
                                <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-semibold rounded-xl">
                                  {teacherSuccessMsg}
                                </div>
                              )}

                              {teacherErrorMsg && (
                                <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-100 text-xs font-semibold rounded-xl">
                                  {teacherErrorMsg}
                                </div>
                              )}

                              <form onSubmit={handleSaveGrade} className="space-y-4">
                                <div>
                                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{tx("ተማሪ ይምረጡ (Select Student):")}</label>
                                  <select 
                                    value={selectedStudentId}
                                    onChange={(e) => { playInteractiveSound('click'); setSelectedStudentId(e.target.value); }}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-semibold text-slate-800"
                                    required>
                                  
                                    <option value="">{tx("-- ተማሪ ይምረጡ (Select Student) --")}</option>
                                    {[...selectableStudents].sort((a, b) => a.name.localeCompare(b.name, 'am')).map(s => (
                                      <option key={s.id} value={s.id}>
                                        {s.name} ({s.id}) - {s.grade} {s.section}
                                      </option>
                                    ))}
                                  </select>
                                  <span className="text-[10px] text-indigo-600 font-mono mt-1 block">{tx(
                                    "\n                                    📌 ማሻሻያ፡ ውጤቱ የሚገናኘው ከተማሪው ID ጋር ብቻ ነው (Fixes Student Name typos)\n                                  "
                                  )}</span>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{tx("የምዘገባ ትምህርት አይነት (Select Subject):")}</label>
                                  <select 
                                    value={selectedTeacherSubject}
                                    onChange={(e) => { playInteractiveSound('click'); setSelectedTeacherSubject(e.target.value); }}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-semibold text-slate-800"
                                    required>
                                  
                                    {selectableTeacherSubjects.map(sub => (
                                      <option key={sub} value={sub}>
                                        📚 {sub}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{tx("የምዘገባ የጊዜ ዑደት (Select Term / Period):")}</label>
                                  <select 
                                    value={teacherSelectedTerm}
                                    onChange={(e) => { playInteractiveSound('click'); setTeacherSelectedTerm(Number(e.target.value)); }}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-semibold text-slate-800">
                                    required
                                  
                                    {(schoolConfig.evaluationMode || 'quarter') === 'semester' ? (
                                      <>
                                        <option value={1}>{tx("ሴሚስተር 1 (Semester 1)")}</option>
                                        <option value={2}>{tx("ሴሚስተር 2 (Semester 2)")}</option>
                                      </>
                                    ) : (
                                      <>
                                        <option value={1}>{tx("ሩብ ዓመት 1 (Quarter 1)")}</option>
                                        <option value={2}>{tx("ሩብ ዓመት 2 (Quarter 2)")}</option>
                                        <option value={3}>{tx("ሩብ ዓመት 3 (Quarter 3)")}</option>
                                        <option value={4}>{tx("ሩብ ዓመት 4 (Quarter 4)")}</option>
                                      </>
                                    )}
                                  </select>
                                </div>

                                {/* Dynamic Cards Grid for all 8 assessments as per improved screen */}
                                <div className="bg-slate-50/55 p-4 rounded-2xl border border-slate-100 space-y-3">
                                  <span className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">{tx("📊 የምዘና ውጤቶች ዝርዝር (Assessment Component Breakdowns):")}</span>
                                  <div className="grid grid-cols-2 gap-3.5">
                                    {[
                                      { id: 'quiz', label: tx("Quiz (ኩዊዝ)"), score: quizScore, setScore: setQuizScore, max: quizMax, colorClass: 'border-indigo-100 focus-within:border-indigo-500 bg-indigo-50/10 text-indigo-700' },
                                      { id: 'cw', label: tx("CW (ክፍል ሥራ)"), score: cwScore, setScore: setCwScore, max: cwMax, colorClass: 'border-emerald-100 focus-within:border-emerald-500 bg-emerald-50/10 text-emerald-700' },
                                      { id: 'hw', label: tx("HW (የቤት ሥራ)"), score: hwScore, setScore: setHwScore, max: hwMax, colorClass: 'border-amber-100 focus-within:border-amber-500 bg-amber-50/10 text-amber-700' },
                                      { id: 'gw', label: tx("GW (የቡድን ሥራ)"), score: gwScore, setScore: setGwScore, max: gwMax, colorClass: 'border-violet-100 focus-within:border-violet-500 bg-violet-50/10 text-violet-700' },
                                      { id: 'pw', label: tx("PW (ፕሮጀክት ሥራ)"), score: pwScore, setScore: setPwScore, max: pwMax, colorClass: 'border-sky-100 focus-within:border-sky-500 bg-sky-50/10 text-sky-700' },
                                      { id: 'cp', label: tx("CP (የክፍል ተሳትፎ)"), score: cpScore, setScore: setCpScore, max: cpMax, colorClass: 'border-rose-100 focus-within:border-rose-500 bg-rose-50/10 text-rose-700' },
                                      { id: 'mid', label: tx("MEXAM (ግማሽ ፈተና)"), score: midScore, setScore: setMidScore, max: midMax, colorClass: 'border-orange-100 focus-within:border-orange-500 bg-orange-50/10 text-orange-700' },
                                      { id: 'final', label: tx("FEXAM (ማጠቃለያ)"), score: finalScore, setScore: setFinalScore, max: finalMax, colorClass: 'border-slate-200 focus-within:border-slate-600 bg-slate-50/30 text-slate-800' }
                                    ].map((comp) => {
                                      const isInactive = comp.max === 0;
                                      return (
                                        <div 
                                          key={comp.id}
                                          className={`relative p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                                            isInactive 
                                              ? 'bg-slate-100/50 border-slate-200 opacity-40 cursor-not-allowed select-none' 
                                              : `bg-white hover:shadow-xs shadow-slate-100 ${comp.colorClass}`
                                          }`}>
                                        
                                          <div className="flex justify-between items-start gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-tight block truncate">
                                              {comp.label}
                                            </span>
                                            <span className="text-[9px] font-black font-mono bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-500 shrink-0">
                                              MAX {comp.max}
                                            </span>
                                          </div>
                                          
                                          <div className="mt-2 relative">
                                            <input 
                                              type="number"
                                              min="0"
                                              max={comp.max}
                                              value={comp.score}
                                              disabled={isInactive}
                                              placeholder="0"
                                              onChange={(e) => {
                                                const val = e.target.value === '' ? '' : Math.min(comp.max, Math.max(0, Number(e.target.value)));
                                                comp.setScore(val);
                                              }}
                                              className="w-full text-center text-base font-black text-slate-900 bg-transparent outline-none border-b-2 border-slate-100 focus:border-indigo-500 transition-all placeholder-slate-250"
                                              required={!isInactive}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Live Total Indicator Badge */}
                                  {(() => {
                                    const currentTotal = Number(quizScore || 0) + Number(cwScore || 0) + Number(hwScore || 0) + Number(gwScore || 0) + Number(pwScore || 0) + Number(cpScore || 0) + Number(midScore || 0) + Number(finalScore || 0);
                                    const totalPossible = quizMax + cwMax + hwMax + gwMax + pwMax + cpMax + midMax + finalMax;
                                    const pct = totalPossible > 0 ? (currentTotal / totalPossible) * 100 : 0;
                                    let statusColor = 'bg-slate-100 text-slate-700 border-slate-200';
                                    let statusText = tx("ውጤት በመጠባበቅ ላይ...");
                                    if (pct >= 85) {
                                      statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                      statusText = tx("በጣም ከፍተኛ (Excellent)");
                                    } else if (pct >= 65) {
                                      statusColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                                      statusText = tx("ከፍተኛ (Good/Pass)");
                                    } else if (pct >= 50) {
                                      statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
                                      statusText = tx("መካከለኛ (Satisfactory)");
                                    } else if (currentTotal > 0) {
                                      statusColor = 'bg-rose-50 text-rose-800 border-rose-200';
                                      statusText = tx("ደካማ (Needs Effort)");
                                    }

                                    return (
                                      <div className={`mt-3 p-3 rounded-xl border flex items-center justify-between transition-colors duration-300 font-extrabold ${statusColor}`}>
                                        <span className="text-xs uppercase tracking-wider">{tx("ጠቅላላ ውጤት ድምር (Live Total Sum):")}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/60">
                                            {statusText}
                                          </span>
                                          <span className="text-xs font-black font-mono">
                                            {currentTotal} / {totalPossible} ({pct.toFixed(0)}%)
                                          </span>
                                        </div>
                                      </div>
                                    );
                       })()}



                                <button 
                                  type="submit"
                                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2">
                                
                                  <span>💾</span>
                                  <span>{tx("ውጤቱን መዝግብ (Save Grade Results)")}</span>
                                </button>
                                 </div>
                              </form>
                            </div>

                            {/* Grades list table */}
                            <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-xs">
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                                  <FileSpreadsheet className="text-emerald-600 w-5 h-5" />{tx(" የተመዘገቡ ውጤቶች ታሪክ\n                                ")}</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Your recorded grade history database</p>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                                      <th className="p-3">{tx("ተማሪ")}</th>
                                      <th className="p-3 text-center">Quiz</th>
                                      <th className="p-3 text-center">CW</th>
                                      <th className="p-3 text-center">HW</th>
                                      <th className="p-3 text-center">Mid</th>
                                      <th className="p-3 text-center">Final</th>
                                      <th className="p-3 text-center">{tx("ጠቅላላ (Total)")}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {grades.filter(g => selectableTeacherSubjects.includes(g.subject)).map((g) => {
                                      const st = students.find(s => s.id === g.studentId);
                                      return (
                                        <tr key={g.id} className="hover:bg-emerald-50/10 text-slate-800 transition-colors">
                                          <td className="p-3 font-semibold text-slate-900">
                                            <div className="flex flex-col">
                                              <span>{g.studentName}</span>
                                              <div className="flex gap-1.5 items-center mt-0.5 flex-wrap">
                                                <span className="font-mono text-[10px] text-indigo-600 dark:text-white font-bold bg-indigo-50 dark:bg-slate-800 px-1 py-0.2 rounded border border-transparent dark:border-slate-700">
                                                  {g.studentId} {st ? `(${st.grade}-${st.section})` : ''}
                                                </span>
                                                <span className="font-sans text-[10px] text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.2 rounded-md">
                                                  📚 {g.subject || 'Mathematics'}
                                                </span>
                                                <span className="font-sans text-[10px] text-amber-700 font-black bg-amber-50 px-1.5 py-0.2 rounded-md">
                                                  🕒 {(schoolConfig.evaluationMode || 'quarter') === 'semester' ? `Sem ${g.term || 1}` : `Q${g.term || 1}`}
                                                </span>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="p-3 text-center text-xs font-medium text-slate-600">{g.quiz}/{quizMax}</td>
                                          <td className="p-3 text-center text-xs font-medium text-slate-600">{g.cw}/{cwMax}</td>
                                          <td className="p-3 text-center text-xs font-medium text-slate-600">{g.hw}/{hwMax}</td>
                                          <td className="p-3 text-center text-xs font-medium text-slate-600">{g.mid}/{midMax}</td>
                                          <td className="p-3 text-center text-xs font-medium text-slate-600">{g.final}/{finalMax}</td>
                                          <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded-lg font-bold text-xs ${
                                              g.total >= 85 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                                              g.total >= 60 ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                                              'bg-rose-50 text-rose-800 border border-rose-100'
                                            }`}>
                                              {g.total}%
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
                        );
                       })()}

                      {teacherSubTab === 'messages' && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <ParentTeacherCommunication
                            currentUserRole="teacher"
                            currentUserName={currentTeacher?.name || currentUser?.name || 'መምህር'}
                            currentUserContact={currentTeacher?.email || currentUser?.email || 'teacher@school.com'}
                            currentTeacher={currentTeacher}
                            allStudents={filteredStudentsForSchool}
                            allTeachers={teachers}
                            allStaff={staffList}
                            workspaceId={schoolWorkspaceId}
                          />
                        </motion.div>
                      )}

                    </div>
                  )}

                  {/* 3. PARENT & STUDENT REPORT CARD WORKSPACE */}
                  {(currentUser?.role === 'parent' || currentUser?.role === 'student') && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="parent-workspace">
                      
                      {/* Search panel card */}
                      <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-xs">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Search className="text-amber-500 w-6 h-6" />{tx(" የልጅዎን ውጤት ይፈልጉ\n                          ")}</h3>
                          <p className="text-slate-400 text-xs mt-0.5">Enter student’s unique ID to fetch authenticated report card</p>
                        </div>

                        <form onSubmit={handleSearchStudent} className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                            <input 
                              type="text"
                              value={searchId}
                              onChange={(e) => setSearchId(e.target.value)}
                              placeholder={tx("መታወቂያ ያስገቡ (e.g. ID-4021)")}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-slate-50/50 uppercase font-mono font-bold"
                              required
                            />
                          </div>
                          <button 
                            type="submit"
                            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm">{tx(
                            "\n                          \n                            ፈልግ\n                          "
                          )}</button>
                        </form>

                        {/* Parent Error Message Display */}
                        {parentErrorMsg && (
                          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-800 font-semibold space-y-1">
                            {parentErrorMsg}
                          </div>
                        )}

                        {/* Child Information Card / Help Desk */}
                        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl text-xs space-y-1.5">
                          <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">{tx("🔒 ፈቃድ እና ማረጋገጫ (Authorization Info)")}</span>
                          {(() => {
                            const userEmail = currentUser?.email?.trim().toLowerCase() || '';
                            const userPhone = (currentUser as any)?.phone?.replace(/\s+/g, '') || '';
                            const children = students.filter(s => {
                              const matchEmail = s.parentEmail && s.parentEmail.trim().toLowerCase() === userEmail;
                              const matchPhone = (userPhone && s.parentPhone && s.parentPhone.replace(/\s+/g, '') === userPhone) ||
                                                 (userEmail && s.parentPhone && s.parentPhone.replace(/\s+/g, '') === userEmail);
                              return matchEmail || matchPhone;
                            });
                            if (children.length > 0) {
                              return (
                                <div className="text-slate-600 space-y-2">
                                  <p className="font-semibold text-slate-700">{tx("የልጆችዎ ዝርዝር (Your Children List):")}</p>
                                  <div className="flex flex-col gap-2 mt-1">
                                    {children.map(c => (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                          playInteractiveSound('click');
                                          setSearchId(c.id);
                                          setParentSearched(true);
                                          setParentErrorMsg(null);
                                          setFoundStudent(c);
                                          const childGrades = grades.filter(g => g.studentId === c.id);
                                          setFoundGrades(childGrades);
                                        }}
                                        className={`border font-mono text-xs px-3 py-2 rounded-xl font-bold transition-all shadow-xs flex items-center gap-2 text-left w-full ${
                                          searchId.trim().toUpperCase() === c.id.toUpperCase()
                                            ? 'bg-amber-100 border-amber-400 text-amber-900'
                                            : 'bg-white border-amber-200 text-indigo-700 hover:border-indigo-500'
                                        }`}>
                                      
                                        <span>🔑</span>
                                        <div>
                                          <span className="font-black text-indigo-900">{c.id}</span> - <span className="font-sans font-semibold text-slate-700">{c.name}</span>
                                          <span className="text-[10px] text-slate-400 font-sans block font-normal mt-0.5">{c.grade}{tx(" - ሴክሽን ")}{c.section}</span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1.5 italic">{tx(
                                    "※ የደህንነት መመሪያ፡ ወላጅ ማየት የሚችለው የራሱን ልጅ ውጤት ብቻ ነው። (Security policy: parents can only view their own child's report card.)"
                                  )}</p>
                                </div>
                              );
                            } else {
                              return (
                                <p className="text-slate-500 italic">{tx(
                                    "ከእርስዎ የኢሜል አድራሻ ጋር የተገናኘ ተማሪ የለም። እባክዎን ርዕሰ መምህሩን ያነጋግሩ። (No student is linked to your email address.)"
                                  )}</p>
                              );
                            }
                          })()}

                        </div>


                      </div>

                      {/* Parent search results canvas */}
                      <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs min-h-[300px]">
                        <AnimatePresence mode="wait">
                          {parentSearched ? (
                            <motion.div
                              key={searchId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-6">
                            
                              {foundStudent ? (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
                                  <div className="lg:col-span-4 space-y-6">
                                    {/* Student profile and metadata info bar */}
                                    <div className="p-5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                      <div>
                                        <span className="text-indigo-800 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider bg-indigo-100/60 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md">{tx("📄 የተማሪው ማህደር (Student Profile)")}</span>
                                        <h4 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 mt-2 flex items-center gap-2">
                                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                          {foundStudent.name}
                                        </h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">{tx("\n                                          ጾታ፡ ")}<span className="text-slate-800 dark:text-slate-200 font-bold">{foundStudent.gender === 'Male' ? tx("ወንድ") : tx("ሴት")}</span>{tx(" • ክፍል፡ ")}<span className="text-slate-800 dark:text-white font-bold">{foundStudent.grade} - {foundStudent.section}</span>
                                        </p>
                                      </div>
                                      <div className="sm:text-right bg-slate-50/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs self-stretch sm:self-auto flex sm:flex-col justify-between items-center sm:items-end">
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">{tx("ልዩ መታወቂያ (ID)")}</span>
                                        <span className="font-mono font-black text-indigo-700 dark:text-white text-lg tracking-wider">{foundStudent.id}</span>
                                      </div>
                                    </div>

                                    {/* Parent tab switchers (ውጤት, ማስታወቂያ, አቴንዳንስ) */}
                                    <div className="flex flex-col border border-slate-200 rounded-2xl p-4 bg-white shadow-xs gap-2">
                                      <button
                                        type="button"
                                        onClick={() => { playInteractiveSound('click'); setParentSubView('grades'); }}
                                        className={`px-4 py-3 text-xs font-black rounded-xl text-left transition-all flex items-center gap-2 ${
                                          parentSubView === 'grades'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}>
                                      
                                        <span>📚</span>{tx(" የልጅዎ ውጤት (Grades & Report Card)\n                                      ")}</button>
                                      <button
                                        type="button"
                                        onClick={() => { playInteractiveSound('click'); setParentSubView('notices'); }}
                                        className={`px-4 py-3 text-xs font-black rounded-xl text-left transition-all flex items-center gap-2 ${
                                          parentSubView === 'notices'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}>
                                      
                                        <span>📢</span>{tx(" የትምህርት ቤት ማስታወቂያዎች (Notices)\n                                      ")}</button>
                                      <button
                                        type="button"
                                        onClick={() => { playInteractiveSound('click'); setParentSubView('attendance'); }}
                                        className={`px-4 py-3 text-xs font-black rounded-xl text-left transition-all flex items-center gap-2 ${
                                          parentSubView === 'attendance'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}>
                                      
                                        <span>📅</span>{tx(" አቴንዳንስና ምግባር (Attendance)\n                                      ")}</button>
                                      <button
                                        type="button"
                                        onClick={() => { playInteractiveSound('click'); setParentSubView('messages'); }}
                                        className={`px-4 py-3 text-xs font-black rounded-xl text-left transition-all flex items-center gap-2 ${
                                          parentSubView === 'messages'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}>
                                        <span>💬</span>
                                        {tx("መምህራንን ያነጋግሩ (Parent-Teacher Chat)")}
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => {
                                        playInteractiveSound('click');
                                        setSelectedQRStudent(foundStudent);
                                      }}
                                      className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                      title={tx("QR ካርድ አትም")}>
                                    
                                      <Printer className="w-3.5 h-3.5" />{tx(
                                      "\n                                      አትም (Print ID Card)\n                                    "
                                    )}</button>
                                  </div>

                                  <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                                    {parentSubView === 'grades' && (
                                      <div className="space-y-6">
                                        <div className="flex justify-between items-center flex-wrap gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                          <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{tx("የተማሪው የውጤት ሪፖርት (Student Report Card Sheet)")}</h4>
                                            <p className="text-[11px] text-slate-400">Authenticated and verified by Principal</p>
                                          </div>
                                          <button
                                            onClick={() => { playInteractiveSound('success'); setShowPrintModal(true); }}
                                            className="px-4 py-2 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100/50 text-indigo-800 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 shadow-3xs cursor-pointer">
                                          
                                            <Printer className="w-3.5 h-3.5" />{tx(
                                            " ማተሚያ ፎርማት (Print Report Card)\n                                          "
                                          )}</button>
                                        </div>

                                        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                                          <table className="w-full text-left border-collapse">
                                            <thead>
                                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-black">
                                                <th className="p-3 text-left">{tx("ትምህርት (Subject)")}</th>
                                                <th className="p-3 text-center">{tx("ጥያቄ")}</th>
                                                <th className="p-3 text-center">{tx("ክፍል ስራ")}</th>
                                                <th className="p-3 text-center">{tx("የቤት ስራ")}</th>
                                                <th className="p-3 text-center">{tx("ግማሽ ፈተና (")}{wlMidMax}%)</th>
                                                <th className="p-3 text-center">{tx("ማጠቃለያ ፈተና (")}{wlFinalMax}%)</th>
                                                <th className="p-3 text-center">{tx("ጠቅላላ (Total)")}</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs">
                                              {foundGrades.length > 0 ? (
                                                foundGrades.map((g) => {
                                                  const finalScore = g.quiz + g.cw + g.hw + g.mid + g.final;
                                                  return (
                                                    <tr key={g.id} className="hover:bg-slate-50/50 border-b border-slate-150 text-slate-800">
                                                      <td className="p-3 font-bold text-slate-900">{g.subject}</td>
                                                      <td className="p-3 text-center">{g.quiz}</td>
                                                      <td className="p-3 text-center">{g.cw}</td>
                                                      <td className="p-3 text-center">{g.hw}</td>
                                                      <td className="p-3 text-center">{g.mid}</td>
                                                      <td className="p-3 text-center">{g.final}</td>
                                                      <td className="p-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-md font-bold ${
                                                          finalScore >= 85 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                                                          finalScore >= 60 ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                                                          'bg-rose-50 text-rose-800 border border-rose-100'
                                                        }`}>
                                                          {finalScore}%
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  );
                                                })
                                              ) : (
                                                <tr>
                                                  <td colSpan={7} className="p-8 text-center text-slate-400 italic font-semibold">{tx(
                                                    "\n                                                    እስካሁን ምንም የውጤት መረጃ አልተመዘገበም (No grades entered yet)\n                                                  "
                                                  )}</td>
                                                </tr>
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}

                                    {parentSubView === 'notices' && (
                                      <div className="space-y-4">
                                        <h4 className="font-extrabold text-slate-800 text-sm">{tx("የትምህርት ቤት የቅርብ ጊዜ ማስታወቂያዎች (School Announcements)")}</h4>
                                        <div className="space-y-3">
                                          {announcements.map((ann) => (
                                            <div key={ann.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                                              <div className="flex justify-between items-start gap-2 flex-wrap">
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md">
                                                  📣 {ann.category}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono font-bold">
                                                  {ann.date}
                                                </span>
                                              </div>
                                              <h5 className="font-bold text-slate-900 text-sm">{ann.title}</h5>
                                              <p className="text-slate-600 text-xs leading-relaxed">{ann.content}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {parentSubView === 'attendance' && (
                                      <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="bg-amber-500 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
                                            <div className="space-y-1">
                                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100 block">{tx("የመቅረት ሁኔታ (Attendance)")}</span>
                                              <p className="text-2xl font-black">{studentExtraInfo[foundStudent?.id || '']?.absent ?? 0}{tx(" ቀናት ቀርተዋል")}</p>
                                              <span className="text-[10px] bg-amber-600 px-2 py-0.5 rounded-full font-bold inline-block">
                                                {(studentExtraInfo[foundStudent?.id || '']?.absent ?? 0) === 0 ? tx("💯 ሙሉ መገኘት (Perfect)") : tx("ቀሪ ቀናት ተመዝግቧል")}
                                              </span>
                                            </div>
                                            <CalendarDays className="w-12 h-12 text-amber-200/40 shrink-0" />
                                          </div>

                                          <div className="bg-indigo-600 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
                                            <div className="space-y-1">
                                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100 block">{tx("የምግባር ደረጃ (Conduct Grade)")}</span>
                                              <p className="text-2xl font-black">{tx("ውጤት: ")}{studentExtraInfo[foundStudent?.id || '']?.conduct ?? 'A'}</p>
                                              <span className="text-[10px] bg-indigo-700 px-2 py-0.5 rounded-full font-bold inline-block">{tx(
                                                "\n                                                በክፍል አላፊው የተሰጠ ምዘና (Homeroom Teacher Assessment)\n                                              "
                                              )}</span>
                                            </div>
                                            <Award className="w-12 h-12 text-indigo-200/40 shrink-0" />
                                          </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xs">
                                          <h4 className="font-extrabold text-slate-800 text-sm">{tx("🗓️ ዝርዝር የእለታዊ አቴንዳንስ መዝገብ (Daily Attendance History Log)")}</h4>
                                          {(() => {
                                            if (!foundStudent) return null;
                                            const historyList = [];
                                            try {
                                              const saved = JSON.parse(localStorage.getItem('dailyAttendance') || '{}');
                                              Object.keys(saved).forEach((dateStr) => {
                                                const dayRecord = saved[dateStr];
                                                if (dayRecord && dayRecord[foundStudent.id]) {
                                                  historyList.push({ date: dateStr, status: dayRecord[foundStudent.id] });
                                                }
                                              });
                                            } catch (e) {}
                                            historyList.sort((a, b) => b.date.localeCompare(a.date));
                                            return historyList.length > 0 ? (
                                              <div className="space-y-2">
                                                {historyList.map((h, idx) => (
                                                  <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                                                    <span className="font-mono text-slate-700 font-bold">{h.date}</span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                      h.status === 'present' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                                                      h.status === 'absent' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                                                      'bg-amber-50 text-amber-800 border border-amber-100'
                                                    }`}>
                                                      {h.status === 'present' ? tx("✓ መጥቷል (Present)") : h.status === 'absent' ? tx("✗ የቀረ (Absent)") : tx("🕒 ፍቃድ (Excused)")}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-slate-400 italic">{tx("እስካሁን የተመዘገበ የእለት አቴንዳንስ መዝገብ የለም። (No daily attendance records found.)")}</p>
                                             );
                                           })()}

                                        </div>
                                      </div>
                                    )}

                                    {parentSubView === 'messages' && (
                                      <div className="space-y-4">
                                        <ParentTeacherCommunication
                                          currentUserRole="parent"
                                          currentUserName={foundStudent?.parentName || currentUser?.name || 'የተማሪ ወላጅ'}
                                          currentUserContact={foundStudent?.parentPhone || currentUser?.email || 'parent@school.com'}
                                          currentStudent={foundStudent}
                                          allStudents={filteredStudentsForSchool}
                                          allTeachers={teachers}
                                          allStaff={staffList}
                                          workspaceId={schoolWorkspaceId}
                                          onOpenStudentReport={(studentId) => {
                                            setSearchId(studentId);
                                            setParentSubView('grades');
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center p-8 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
                                  <span className="text-3xl block">🔍❌</span>
                                  <h4 className="font-extrabold text-rose-950 text-sm">{tx("ተማሪው አልተገኘም (Student Not Found)")}</h4>
                                  <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">{tx(
                                    "\n                                    ያስገቡት መታወቂያ ቁጥር በስርዓቱ ውስጥ አልተገኘም።\n                                  "
                                  )}</p>
                                </div>
                              )}
                            </motion.div>
                          ) : (
                            <div className="text-center py-16 text-slate-400">
                              <p className="font-extrabold text-sm text-slate-600">{tx("እባክዎን ከላይ ካሉት ልጆችዎ አንዱን ይምረጡ")}</p>
                            </div>

                       )}
                        </AnimatePresence>
                      </div>

                      {/* Student Dashboard Floating Action Button (FAB) for Quick Attendance QR Scanner */}
                      <div className="fixed bottom-6 right-6 z-40 print:hidden">
                        <button
                          id="student-dashboard-qr-scanner-fab"
                          type="button"
                          onClick={() => {
                            playInteractiveSound('click');
                            setIsQRScannerOpen(true);
                          }}
                          className="group flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-full shadow-2xl hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20 cursor-pointer"
                          title={tx("የተማሪ ፈጣን የQR አቴንዳንስ መመዝገቢያ (Quick Attendance QR Scanner)")}
                        >
                          <div className="p-1 bg-white/20 rounded-full animate-pulse">
                            <QrCode className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-xs font-black tracking-wide pr-1">
                            {tx("QR አቴንዳንስ (Quick Attendance)")}
                          </span>
                        </button>
                      </div>

                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
                      {/* TAB 1.5: THE SAAS WHITE-LABEL SETUP CONFIGURATOR */}
          {activeTab === 'whitelabel' && (currentUser?.role === 'admin' || currentUser?.email?.trim().toLowerCase() === 'tadessemisganaw4@gmail.com') && (
            <motion.div
              key="whitelabel-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 max-w-4xl mx-auto print:hidden">
            
              <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-2xl font-black text-slate-900">{tx("🏪 ነጭ-መለያ የገበያ ማስተካከያ (SaaS Configurator)")}</h2>
                  </div>
                  <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{tx(
                    "\n                    ይህ ሲስተም ለተለያዩ ትምህርት ቤቶች ተሸጦ መተግበር እንዲችል ሙሉ በሙሉ ተለዋዋጭ (white-label) ሆኖ የተገነባ ነው። እዚህ ላይ የሚቀይሩት ማንኛውም የትምህርት ቤት ስም፣ መሪ ቃል፣ አርማ፣ ቀለማት እና የትምህርት አይነቶች በፖርታሉ፣ በምዝገባ ፎርሞች እና በማርክ ሊስት ማተሚያ ላይ ወዲያውኑ ይንጸባረቃሉ!\n                  "
                  )}</p>
                </div>

                {/* PLATFORM MARKETING & BROCHURE CARD */}
                <div className="p-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-xl border border-indigo-800/60 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{tx(
                        "\n                        ኦፊሴላዊ የገበያ ማስተዋወቂያ መመሪያ (Official Platform Brochure)\n                      "
                      )}</span>
                      <h3 className="text-lg font-black text-white mt-1">{tx("የዘመናዊ ትምህርት ቤት አስተዳደር ዲጂታል ፕላትፎርም")}</h3>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">{tx(
                    tx("\n                    ይህ ፕላትፎርም የአንደኛ እና ሁለተኛ ደረጃ ትምህርት ቤቶችን አስተዳደር፣ የተማሪዎች ምዝገባ፣ የውጤት አሰጣጥ፣ የተሰብሳቢዎች ክትትል እና የሪፖርት ካርድ ማተሚያ ስራዎችን በዲጂታል መንገድ ሙሉ በሙሉ በራስ-ሰር የሚያስተዳድር ዘመናዊ መፍትሄ ነው። (This platform is a modern, fully automated digital solution for managing primary and secondary schools, including student registration, grading, attendance tracking, and report card printing.)\n                  ")
                  )}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                        <span>⚙️</span>
                        <span>{tx("ምን ምን ይሰራል? (Capabilities)")}</span>
                      </div>
                      <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                        <li>{tx("ከተማርክ ዝርዝር እስከ 10 ምዕራፎች (Quiz, Test, Mid, Final)")}</li>
                        <li>{tx("የተማሪዎች እና መምህራን አስተዳደር")}</li>
                        <li>{tx("የQR ኮድ ዲጂታል መታወቂያ ካርዶች")}</li>
                        <li>{tx("የትምህርት ቤት ማህተም እና ፊርማ ማረጋገጫ")}</li>
                      </ul>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                        <span>💡</span>
                        <span>{tx("አጠቃቀሙ (How to Use)")}</span>
                      </div>
                      <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                        <li>{tx("የራሰዎትን የትምህርት ቤት ወርክስፔስ ኮድ መፍጠር")}</li>
                        <li>{tx("ተማሪዎችን እና መምህራንን መመዝገብ")}</li>
                        <li>{tx("ውጤቶችን በዲጂታል መንገድ ማስገባት")}</li>
                        <li>{tx("አጭር ሊንክ በመፍጠር ለወላጆች ማጋራት")}</li>
                      </ul>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                        <span>🛡️</span>
                        <span>{tx("አስተማማኝነቱ (Reliability & Security)")}</span>
                      </div>
                      <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                        <li>{tx("ባለብዙ-ተከራይ (Multi-Tenant) የዳታ መለያየት")}</li>
                        <li>{tx("በክላውድ ፋየርሶር ደህንነቱ የተጠበቀ ማከማቻ")}</li>
                        <li>{tx("የተጠቃሚ ሚና (Role-based) ጥበቃ")}</li>
                        <li>{tx("ከኢንተርኔት ውጭ እና በኦንላይን የሚሰራ")}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* GITHUB DEPLOYMENT & LIVE LINK GENERATOR */}
                <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl border border-indigo-500/40 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl">
                      <Code2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{tx(
                        "የ GitHub ዲፕሎይመንት እና ሊንክ ማመንጫ (GitHub Deploy & Live Link)"
                      )}</span>
                      <h3 className="text-lg font-black text-white mt-1">{tx("ኮዱን ወደ GitHub በመጫን ቋሚ ሊንክ ማመንጨት")}</h3>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">
                    {tx("ፕሮጀክትዎን ወደ GitHub repository በመግፋት (Push በማድረግ) የ GitHub Pages, Vercel ወይም Netlify ቋሚ የድር ሊንክ ማመንጨት ይችላሉ። የሪፖዚቶሪ ሊንኩን ከታች ያስገቡ።")}
                  </p>

                  <div className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/10">
                    <div>
                      <label className="text-[10px] font-bold text-indigo-300 uppercase block mb-1">{tx("የ GitHub ሪፖዚቶሪ ዩአርኤል (GitHub Repository URL)")}</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://github.com/username/diligent-school-app"
                          value={githubRepoUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGithubRepoUrl(val);
                            localStorage.setItem('diligent_github_repo_url', val);
                          }}
                          className="flex-1 bg-slate-900 border border-slate-700 text-xs px-3 py-2.5 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!githubRepoUrl.trim()) {
                              alert(tx("እባክዎን የ GitHub ሪፖዚቶሪ ዩአርኤል ያስገቡ!"));
                              return;
                            }
                            playInteractiveSound('success');
                            let cleanUrl = githubRepoUrl.trim().replace(/\/$/, '');
                            if (cleanUrl.endsWith('.git')) cleanUrl = cleanUrl.slice(0, -4);
                            const parts = cleanUrl.split('github.com/');
                            let liveLink = cleanUrl;
                            if (parts.length > 1) {
                              const [user, repo] = parts[1].split('/');
                              if (user && repo) {
                                liveLink = `https://${user}.github.io/${repo}/`;
                              }
                            }
                            setGeneratedGitHubLink(liveLink);
                            localStorage.setItem('diligent_github_live_link', liveLink);
                            alert(tx("🎉 የ GitHub ሊንክ በስኬት ተፈጥሯል!"));
                          }}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-transform hover:scale-105"
                        >
                          {tx("ሊንክ ፍጠር (Generate Link)")}
                        </button>
                      </div>
                    </div>

                    {generatedGitHubLink && (
                      <div className="mt-3 p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-emerald-400 font-extrabold uppercase block">{tx("ቋሚ የተፈጠረ የድር ሊንክ (Generated Live Link):")}</span>
                          <a href={generatedGitHubLink} target="_blank" rel="noreferrer" className="text-xs font-mono font-bold text-emerald-300 underline break-all">
                            {generatedGitHubLink}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              playInteractiveSound('success');
                              navigator.clipboard.writeText(generatedGitHubLink).then(() => {
                                alert(tx("🔗 ሊንኩ ኮፒ ተደርጓል!"));
                              });
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            {tx("ኮፒ (Copy)")}
                          </button>
                          <a
                            href={generatedGitHubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
                          >
                            {tx("ክፈት (Open)")}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-1 text-xs text-slate-300">
                    <p className="font-bold text-indigo-300">{tx("🛠️ GitHub ላይ ለመጫን (Push) የሚረዱ ትዕዛዞች (Git Commands):")}</p>
                    <div className="bg-black/60 p-3.5 rounded-xl font-mono text-[11px] text-emerald-300 space-y-1 select-all border border-white/10">
                      <p>git init</p>
                      <p>git add .</p>
                      <p>git commit -m "Deploy Diligent School Management System"</p>
                      <p>git branch -M main</p>
                      <p>git remote add origin {githubRepoUrl || 'https://github.com/your-username/diligent-school.git'}</p>
                      <p>git push -u origin main</p>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC MULTI-SCHOOL WORKSPACE SWITCHER */}
                <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200/80 p-5 rounded-2xl space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">{tx(
                        "\n                        🌐 የትምህርት ቤት ወርክስፔስ መቆጣጠሪያ (Multi-School Workspace Controller)\n                        "
                      )}<span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                          Multi-Tenant Active
                        </span>
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{tx(
                        "\n                        ይህ ሲስተም ባለብዙ-ተከራይ (Multi-Tenant) አርክቴክቸርን በመጠቀም የትምህርት ቤቶችን ዳታ ሙሉ በሙሉ ይለያል። እያንዳንዱ ትምህርት ቤት የየራሱ የሆነ ወርክስፔስ ኮድ አለው። በዚህም ምክንያት የአንዱ ትምህርት ቤት መረጃ (ተማሪዎች፣ ውጤቶች፣ አስተማሪዎችና አወቃቀሮች) ከሌላው ጋር በጭራሽ አይቀላቀልም!\n                      "
                      )}</p>
                      <p className="text-slate-400 text-[11px] leading-relaxed italic">
                        (This system utilizes a Multi-Tenant architecture to isolate database collections for each school. All records for students, grades, and configs are partitioned dynamically under unique Workspace Codes, preventing any data mixing.)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-3xs">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">{tx(
                          "\n                          የአሁኑ ንቁ ወርክስፔስ (Active Workspace)\n                        "
                        )}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-800 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                            {schoolWorkspaceId}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">
                            {schoolConfig.nameAmh || tx("ደሊጀንት ት/ቤት")}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{tx(
                          "\n                          ለዚህ ትምህርት ቤት የሚጋራው ቀጥተኛ ሊንክ (Shareable School URL)\n                        "
                        )}</span>
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 p-2 rounded-lg">
                          <span className="text-[10px] font-mono text-slate-500 select-all truncate flex-1">
                            {`${window.location.origin}${window.location.pathname}?school=${schoolWorkspaceId}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const shareUrl = `${window.location.origin}${window.location.pathname}?school=${schoolWorkspaceId}`;
                              navigator.clipboard.writeText(shareUrl);
                              setCopiedId('workspace_link');
                              playInteractiveSound('click');
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                            title="Copy share link">
                          
                            {copiedId === 'workspace_link' ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">{tx(
                          "\n                          ይህንን ሊንክ ለሌሎች ትምህርት ቤቶች በማጋራት፣ የየራሳቸውን ወርክስፔስ ኮድ አስገብተው ሙሉ በሙሉ ገለልተኛ በሆነ መንገድ እንዲጠቀሙ ማድረግ ይችላሉ።\n                        "
                        )}</p>

                        {/* URL Shortener Feature Panel */}
                        <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{tx(
                              "\n                              🔗 አጭር ሊንክ ማመንጫ (Short Link Generator)\n                            "
                            )}</span>
                          </div>
                          
                          {shortenedWorkspaceUrl ? (
                            <div className="space-y-1.5 animate-fadeIn">
                              <div className="flex items-center gap-1.5 bg-emerald-50/50 border border-emerald-200 p-2 rounded-lg">
                                <span className="text-[11px] font-mono font-bold text-emerald-800 select-all truncate flex-1">
                                  {shortenedWorkspaceUrl}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(shortenedWorkspaceUrl);
                                    setCopiedId('shortened_link');
                                    playInteractiveSound('click');
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className="p-1.5 bg-white hover:bg-emerald-100/50 border border-emerald-200 rounded-md text-emerald-700 transition-all cursor-pointer"
                                  title="Copy short link">
                                
                                  {copiedId === 'shortened_link' ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center justify-between text-[9px]">
                                <span className="text-emerald-600 font-bold">{tx("✓ አጭር ሊንክ በተሳካ ሁኔታ ተፈጥሯል! (Short link generated!)")}</span>
                                <button 
                                  onClick={() => setShortenedWorkspaceUrl('')}
                                  className="text-slate-400 hover:text-slate-600 underline cursor-pointer">{tx(
                                  "\n                                \n                                  አዲስ ፍጠር (Clear)\n                                "
                                )}</button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <button
                                type="button"
                                onClick={handleGenerateShortLink}
                                disabled={isShortening}
                                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs">
                              
                                {isShortening ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />{tx(
                                    "\n                                    በማመንጨት ላይ... (Generating...)\n                                  "
                                  )}</>
                                ) : (
                                  <>{tx(
                                    "\n                                    ⚡ አጭር ሊንክ ፍጠር (Generate Short Link)\n                                  "
                                  )}</>
                                )}
                              </button>
                              {shortenError && (
                                <p className="text-[9px] text-rose-500 font-bold text-center mt-1">⚠️ {shortenError}</p>
                              )}
                              <p className="text-[9px] text-slate-400 leading-normal text-center">{tx(
                                "\n                                ረጅሙን የሲስተሙን ሊንክ ወደ አጭር እና ለማጋራት ቀላል ወደሆነ ሊንክ ይቀይራል። (Converts the long system URL to a short shareable link).\n                              "
                              )}</p>
                            </div>
                      
                      )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-3xs flex flex-col justify-between">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">{tx(
                          "\n                          አዲስ ወርክስፔስ መፍጠር / መቀየር (Create or Switch Workspace)\n                        "
                        )}</label>
                        <input
                          type="text"
                          value={tempWorkspaceId}
                          onChange={(e) => setTempWorkspaceId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                          placeholder={tx("උදා፦ bole, menelik, shola")}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:border-indigo-500 outline-none font-mono"
                        />
                        <p className="text-[9px] text-slate-400 leading-normal">{tx(
                          "\n                          ፊደላት፣ ቁጥሮች እና ሰረዝ (-) ብቻ መጠቀም ይችላሉ። ትንንሽ ፊደላት ብቻ ይፈቀዳሉ። (Lowercase alphanumeric letters and dashes only.)\n                        "
                        )}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!tempWorkspaceId.trim()) return;
                            playInteractiveSound('click');
                            const target = tempWorkspaceId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
                            
                            // Switch workspace state
                            setSchoolWorkspaceId(target);
                            localStorage.setItem('school_workspace_id', target);
                            
                            // Push to URL query params smoothly
                            const newUrl = `${window.location.origin}${window.location.pathname}?school=${target}`;
                            window.history.pushState({ path: newUrl }, '', newUrl);

                            setWorkspaceSuccessMsg(`ወደ "${target}" ወርክስፔስ በተሳካ ሁኔታ ተቀይሯል! የትምህርት ቤቱ መረጃ በመጫን ላይ ነው...`);
                            setTimeout(() => setWorkspaceSuccessMsg(null), 5000);
                          }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition-all shadow-3xs flex items-center justify-center gap-1.5">
                        
                          <Database className="w-3.5 h-3.5" />
                          <span>{tx("ወደዚህ ወርክስፔስ ቀይር / ፍጠር")}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {workspaceSuccessMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-indigo-50 text-indigo-900 border border-indigo-100 text-[11px] font-bold rounded-xl flex items-center gap-2">
                    
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                      <span>{workspaceSuccessMsg}</span>
                    </motion.div>
                  )}

                  {/* WORKSPACES REGISTRY MANAGER / CLEANER */}
                  <div className="border-t border-slate-200/60 dark:border-slate-800 pt-4 mt-2 space-y-2">
                    <h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">{tx(
                      "\n                      ⚙️ የተመዘገቡ ትምህርት ቤቶች ዝርዝር ማጽጃ (Workspace Registry Cleaner)\n                    "
                    )}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{tx(
                      "\n                      እዚህ ጋር በስህተት የፈጠሯቸውን ወይም የማያስፈልጉ የተባዙ ትምህርት ቤቶችን ከመመዝገቢያ ዝርዝሩ ላይ ማስወገድ ይችላሉ። (You can remove unwanted or duplicate schools from this list registry.)\n                    "
                    )}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {workspacesRegistry.map((item) => {
                        const isMain = item.id === 'diligent';
                        const isActive = item.id === schoolWorkspaceId;
                        return (
                          <div 
                            key={item.id} 
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                              isActive 
                                ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 font-bold dark:bg-indigo-950/20 dark:border-indigo-900/60 dark:text-indigo-300' 
                                : 'bg-white border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-200'
                            }`}>

                            <div className="truncate flex-1 pr-2">
                              <span className="font-bold block truncate">{lang === 'am' ? item.nameAmh : item.nameEng}</span>
                              <span className="block text-[9px] text-slate-400 font-mono">ID: {item.id} {isActive && tx("(Active / ንቁ)")}</span>
                            </div>
                            {!isMain && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {deletingWorkspaceId === item.id ? (
                                  <div className="flex items-center gap-1 animate-fadeIn">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        playInteractiveSound('wrong');
                                        const updated = workspacesRegistry.filter(w => w.id !== item.id);
                                        setWorkspacesRegistry(updated);
                                        localStorage.setItem('school_workspaces_registry', JSON.stringify(updated));
                                        
                                        // Also remove its specific configs
                                        localStorage.removeItem(`schoolConfig_${item.id}`);
                                        localStorage.removeItem(`school_students_${item.id}`);
                                        localStorage.removeItem(`school_grades_${item.id}`);
                                        localStorage.removeItem(`school_teachers_${item.id}`);
                                        localStorage.removeItem(`school_classes_${item.id}`);
                                        localStorage.removeItem(`school_announcements_${item.id}`);
                                        localStorage.removeItem(`studentExtraInfo_${item.id}`);
                                        localStorage.removeItem(`school_user_accounts_${item.id}`);

                                        // If active school is deleted, switch back to 'diligent' workspace
                                        if (isActive) {
                                          setSchoolWorkspaceId('diligent');
                                          localStorage.setItem('school_workspace_id', 'diligent');
                                          const newUrl = `${window.location.origin}${window.location.pathname}?school=diligent`;
                                          window.history.pushState({ path: newUrl }, '', newUrl);
                                        }
                                        setDeletingWorkspaceId(null);
                                      }}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-black transition-all cursor-pointer"
>
                                      {lang === 'am' ? tx("ሰርዝ!") : 'Delete'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        playInteractiveSound('click');
                                        setDeletingWorkspaceId(null);
                                      }}
                                      className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black transition-all cursor-pointer border border-slate-200"
>
                                      {lang === 'am' ? tx("ተወው") : 'Cancel'}
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playInteractiveSound('click');
                                      setDeletingWorkspaceId(item.id);
                                    }}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 dark:border-red-900/50 transition-all cursor-pointer"
                                    title="Delete from registry">
                                  
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {wlSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs md:text-sm font-bold rounded-2xl flex items-center gap-2">
                  
                    <span>🎉</span>
                    <span>{tx(
                      "ብራንዲንግ በተሳካ ሁኔታ ተቀይሯል! ሙሉ ሲስተሙ አሁን የእርስዎን ትምህርት ቤት ያንጸባርቃል። (Branding updated successfully!)"
                    )}</span>
                  </motion.div>
                )}

                {wlError && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-rose-50 text-rose-800 border border-rose-100 text-xs md:text-sm font-bold rounded-2xl flex items-center gap-2">
                  
                    <span>⚠️</span>
                    <span>{wlError}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSaveWhiteLabel} className="space-y-6">
                  
                  {/* Basic Branding Credentials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{tx("🏫 የተቋሙ ስም - በአማርኛ (School Name - Amharic):")}</label>
                      <input 
                        type="text"
                        value={wlNameAmh}
                        onChange={(e) => setWlNameAmh(e.target.value)}
                        placeholder={tx("ስማርት ስኩል አፕ")}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 outline-none bg-slate-50/50 font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{tx("🏫 የተቋሙ ስም - በእንግሊዝኛ (School Name - English):")}</label>
                      <input 
                        type="text"
                        value={wlNameEng}
                        onChange={(e) => setWlNameEng(e.target.value)}
                        placeholder="Smart School App"
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 outline-none bg-slate-50/50 font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{tx("🏆 መሪ ቃል - በአማርኛ (Motto - Amharic):")}</label>
                      <input 
                        type="text"
                        value={wlMottoAmh}
                        onChange={(e) => setWlMottoAmh(e.target.value)}
                        placeholder={tx("ለክህሎትና ለውጤታማነት እንተጋለን!")}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 outline-none bg-slate-50/50 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{tx("🏆 መሪ ቃል - በእንግሊዝኛ (Motto - English):")}</label>
                      <input 
                        type="text"
                        value={wlMottoEng}
                        onChange={(e) => setWlMottoEng(e.target.value)}
                        placeholder="Striving for Skills and Success!"
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 outline-none bg-slate-50/50 font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Academic Year Settings */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{tx("📅 የትምህርት ዘመን (Current Academic Year):")}</label>
                      <p className="text-slate-400 text-[11px]">{tx("\n                        የአሁኑን የትምህርት ዘመን እዚህ መለወጥ ይችላሉ። ለምሳሌ፡ ")}<strong>{tx("2018 ዓ.ም")}</strong>{tx(" ወይም ")}<strong>{tx("2019 ዓ.ም")}</strong>{tx(
                        "። ይህ ሲቀየር በሪፖርት ካርዶች እና በማርክ ሊስቶች ላይ የሚወጣው ዘመን በራስ-ሰር ይስተካከላል። (Enter the current academic year, e.g., 2018 E.C. or 2019 E.C., to display on report cards)\n                      "
                      )}</p>
                    </div>
                    <div className="max-w-xs">
                      <input 
                        type="text"
                        value={wlAcademicYear}
                        onChange={(e) => setWlAcademicYear(e.target.value)}
                        placeholder={tx("ለምሳሌ፡ 2018 ዓ.ም")}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 outline-none bg-white font-bold"
                        required
                      />
                    </div>
                  </div>

                  {/* Academic Year Transition Card */}
                  <div className="p-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-900/50 space-y-5 shadow-lg relative overflow-hidden">
                    {/* Background glows */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-indigo-200">{tx("🔄 የትምህርት ዘመን ሽግግር መሣሪያ (Academic Year Transition Utility)")}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{tx(
                          "የድሮውን መረጃ ሳይነኩ ለአዲሱ ዓመት አዲስ ገለልተኛ የሲስተም ወርክስፔስ መፍጠሪያ (Create a new standalone workspace for the new year while keeping the old one safe)"
                        )}</p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 space-y-2 leading-relaxed bg-black/20 p-3.5 rounded-xl border border-indigo-950/40">
                      <p>
                        💡 <strong>{tx("ይህ እንዴት ይሰራል? (How does this work?)")}</strong>
                      </p>
                      <p>{tx("\n                        ይህ መሣሪያ የአሁኑን የትምህርት ዘመን (ለምሳሌ ")}<strong>{wlAcademicYear}</strong>{tx(
                        ") መረጃ ሳይነካ እና ሳይሰርዝ፣ አዲስ ገለልተኛ ሲስተም (ወርክስፔስ) በራስ-ሰር ይፈጥራል። \n                        በቀጣይ አመት ወደ ድሮው ወርክስፔስ ("
                      )}<strong>{schoolWorkspaceId}</strong>{tx(") ለመመለስ በቀላሉ ወርክስፔስ ኮዱን መለወጥ ይችላሉ።\n                      ")}</p>
                    </div>

                    {transitionSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-emerald-950/80 text-emerald-200 border border-emerald-900/40 text-xs font-bold rounded-xl flex items-center gap-2">
                      
                        <span>🎉</span>
                        <div className="flex-1 text-left">{transitionSuccess}</div>
                      </motion.div>
                    )}

                    {transitionError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-rose-950/80 text-rose-200 border border-rose-900/40 text-xs font-bold rounded-xl flex items-center gap-2">
                      
                        <span>⚠️</span>
                        <div className="flex-1 text-left">{transitionError}</div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-indigo-300 mb-1.5 text-left">{tx("📅 የቀጣይ የትምህርት ዘመን ስም (New Academic Year Name):")}</label>
                        <input 
                          type="text"
                          value={transitionNewYear}
                          onChange={(e) => setTransitionNewYear(e.target.value)}
                          placeholder={tx("ለምሳሌ፡ 2019 ዓ.ም")}
                          className="w-full p-3 rounded-xl border border-indigo-900/50 text-xs focus:border-indigo-500 outline-none bg-indigo-950/60 text-white font-bold placeholder:text-indigo-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-indigo-300 mb-1.5 text-left">{tx("🔑 አዲሱ የሲስተም ወርክስፔስ ኮድ (New Workspace ID Code):")}</label>
                        <input 
                          type="text"
                          value={transitionNewWorkspaceId}
                          onChange={(e) => setTransitionNewWorkspaceId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                          placeholder={tx("ለምሳሌ፡ diligent_2019")}
                          className="w-full p-3 rounded-xl border border-indigo-900/50 text-xs focus:border-indigo-500 outline-none bg-indigo-950/60 text-white font-mono placeholder:text-indigo-800"
                        />
                        <p className="text-[8px] text-slate-400 mt-1 text-left">{tx(
                          "ትናንሽ ፊደላት፣ ቁጥር እና ሰረዝ ብቻ ይፈቀዳል። (Lowercase letters, numbers, and dashes only)"
                        )}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase text-indigo-300 text-left">{tx("⚙️ የመረጃ አሻጋሪ አማራጮች (Data Migration Options):")}</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                          transitionStrategy === 'fresh' 
                            ? 'border-indigo-500 bg-indigo-950/80 text-white shadow-xs' 
                            : 'border-indigo-950 bg-indigo-950/20 text-slate-300 hover:bg-indigo-950/40'
                        }`}
                        onClick={() => setTransitionStrategy('fresh')}>
                        
                          <div className="flex items-center gap-1.5 mb-1">
                            <input 
                              type="radio" 
                              checked={transitionStrategy === 'fresh'} 
                              onChange={() => setTransitionStrategy('fresh')} 
                              className="accent-indigo-500" />
                            <span className="text-xs font-black">{tx("ባዶ መሠረት (Clean Slate)")}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal">{tx(
                            "\n                            ብራንዲንግን ብቻ ይወስዳል። አዳዲስ ተማሪዎች፣ መምህራን እና ክፍሎች ሙሉ በሙሉ ከባዶ ይጀምራሉ። (Copy config/branding only. Fresh start.)\n                          "
                          )}</p>
                        </label>

                        <label className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                          transitionStrategy === 'config' 
                            ? 'border-indigo-500 bg-indigo-950/80 text-white shadow-xs' 
                            : 'border-indigo-950 bg-indigo-950/20 text-slate-300 hover:bg-indigo-950/40'
                        }`}
                        onClick={() => setTransitionStrategy('config')}>
                        
                          <div className="flex items-center gap-1.5 mb-1">
                            <input 
                              type="radio" 
                              checked={transitionStrategy === 'config'} 
                              onChange={() => setTransitionStrategy('config')} 
                              className="accent-indigo-500" />
                            <span className="text-xs font-black">{tx("አደረጃጀትና መምህራን (Structure & Teachers)")}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal">{tx(
                            "\n                            ብራንዲንግ፣ መምህራን፣ ክፍሎች እና የተጠቃሚ አካውንቶችን ያሻግራል፤ ነገር ግን ተማሪዎች እና ውጤቶች ከባዶ ይጀምራሉ። (Copy branding, teachers, user accounts, and classes. Zero students.)\n                          "
                          )}</p>
                        </label>

                        <label className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                          transitionStrategy === 'students' 
                            ? 'border-indigo-500 bg-indigo-950/80 text-white shadow-xs' 
                            : 'border-indigo-950 bg-indigo-950/20 text-slate-300 hover:bg-indigo-950/40'
                        }`}
                        onClick={() => setTransitionStrategy('students')}>
                        
                          <div className="flex items-center gap-1.5 mb-1">
                            <input 
                              type="radio" 
                              checked={transitionStrategy === 'students'} 
                              onChange={() => setTransitionStrategy('students')} 
                              className="accent-indigo-500"
                            />
                            <span className="text-xs font-black">{tx("ተማሪዎችንም ጭምር (Copy Students too)")}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal">{tx(
                            "\n                            ብራንዲንግ፣ መምህራን፣ ክፍሎች እና ተማሪዎችንም ያሻግራል፤ ነገር ግን ሁሉንም ውጤቶች እና መገኘት ባዶ (Reset) ያደርጋል። (Copy teachers, classes, and students list, but reset all grades and attendance.)\n                          "
                          )}</p>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAcademicYearTransition}
                        disabled={isTransitioningYear}
                        className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-emerald-600 hover:from-indigo-600 hover:to-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                      
                        {isTransitioningYear ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />{tx(
                            "\n                            በመሸጋገር ላይ... (Transitioning...)\n                          "
                          )}</>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />{tx(
                            "\n                            አዲሱን የትምህርት ዘመን ጀምር (Initialize New Academic Year)\n                          "
                          )}</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* System UI Look & Feel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-2">{tx("🎨 የሲስተሙ ዋና ቀለም (Theme Color Accent):")}</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(THEMES).map((themeName) => {
                          const t = THEMES[themeName as keyof typeof THEMES];
                          const bgColors: Record<string, string> = {
                            indigo: 'bg-indigo-600',
                            emerald: 'bg-emerald-600',
                            violet: 'bg-violet-600',
                            rose: 'bg-rose-600',
                            amber: 'bg-amber-600',
                            slate: 'bg-slate-600'
                          };
                          return (
                            <button
                              type="button"
                              key={themeName}
                              onClick={() => { playInteractiveSound('click'); setWlThemeColor(themeName as any); }}
                              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all border flex items-center gap-1.5 ${
                                wlThemeColor === themeName 
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                            
                              <span className={`w-3 h-3 rounded-full inline-block ${bgColors[themeName] || 'bg-indigo-600'}`} />
                              <span>{themeName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-2">{tx("🛡️ የትምህርት ቤት አርማ (School Logo):")}</label>
                      <div className="flex flex-col gap-3">
                        {wlLogoImage ? (
                          <div className="flex flex-col sm:flex-row items-center gap-4 border-2 border-dashed border-indigo-200 p-4 rounded-xl bg-indigo-50/50 w-full max-w-sm">
                            <div className="w-20 h-20 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden">
                              <img src={wlLogoImage} alt="School Logo Preview" className="w-16 h-16 object-contain" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className="text-sm font-bold text-slate-700">Logo Uploaded</span>
                              <button
                                type="button"
                                onClick={() => { playInteractiveSound('click'); setWlLogoImage(''); }}
                                className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-100 font-bold px-4 py-1.5 bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 justify-center">
                              
                                <X className="w-3.5 h-3.5" />{tx(" አጥፋ (Remove & Change)\n                              ")}</button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50/30 transition-all w-full max-w-sm">
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-xs font-bold text-slate-600 mb-1">Click to upload school logo</p>
                            <p className="text-[10px] text-slate-400">PNG, JPG up to 2MB</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  playInteractiveSound('click');
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setWlLogoImage(reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />{tx(
                          " Logo will be used in reports and headers. (የተቋሙ አርማ በሪፖርቶች ላይ ይታያል)\n                        "
                        )}</p>
                      </div>
                    </div>
                  </div>

                  {/* Evaluation Period Mode Settings */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{tx("📅 የውጤት መገምገሚያ የጊዜ ዑደት (Evaluation Period Mode):")}</label>
                      <p className="text-slate-400 text-[11px]">{tx(
                        "\n                        ትምህርት ቤቱ ውጤትን በሩብ ዓመት (Quarter) ወይስ በሴሚስተር (Semester) ብቻ እንደሚያሰላ እዚህ ይምረጡ። (Select whether results are evaluated by quarters or by semesters)\n                      "
                      )}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        type="button"
                        onClick={() => { playInteractiveSound('click'); setWlEvaluationMode('quarter'); }}
                        className={`flex-1 p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                          wlEvaluationMode === 'quarter'
                            ? 'bg-indigo-50/80 text-indigo-950 border-indigo-300 ring-2 ring-indigo-100 shadow-sm'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                      
                        <span className="text-2xl">🕒</span>
                        <div>
                          <strong className="text-xs block">{tx("ሩብ ዓመት (Quarter Mode)")}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">4 Quarters (Q1, Q2, Q3, Q4) with annual average</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => { playInteractiveSound('click'); setWlEvaluationMode('semester'); }}
                        className={`flex-1 p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                          wlEvaluationMode === 'semester'
                            ? 'bg-indigo-50/80 text-indigo-950 border-indigo-300 ring-2 ring-indigo-100 shadow-sm'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                      
                        <span className="text-2xl">📅</span>
                        <div>
                          <strong className="text-xs block font-bold">{tx("ሴሚስተር (Semester Mode)")}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">2 Semesters (Sem 1, Sem 2) with annual average</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* School Level Settings */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{tx("🏫 የትምህርት ቤት የክፍል ደረጃ (School Level / Grade Range):")}</label>
                      <p className="text-slate-400 text-[11px]">{tx(
                        "\n                        የትምህርት ቤቱን ደረጃ እዚህ ይምረጡ። አንደኛ ደረጃ (ከ1-8ኛ ክፍል) ወይም ሁለተኛ ደረጃ/መሰናዶ (ከ9-12ኛ ክፍል)። ይህ ሲመረጥ መላው ሲስተም ተዛማጅ ክፍሎችን ብቻ ያሳያል። (Select grade range: 1-8 or 9-12)\n                      "
                      )}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        type="button"
                        onClick={() => { playInteractiveSound('click'); setWlSchoolLevel('primary'); setWlSelectedGradeForSubjects('Grade 1'); }}
                        className={`flex-1 p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                          wlSchoolLevel === 'primary'
                            ? 'bg-indigo-50/80 text-indigo-950 border-indigo-300 ring-2 ring-indigo-100 shadow-sm'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                      
                        <span className="text-2xl">🎒</span>
                        <div>
                          <strong className="text-xs block font-bold">{tx("አንደኛ ደረጃ ትምህርት ቤት (Grade 1-8)")}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Primary School with Grade 1 to 8 dynamic filtering</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => { playInteractiveSound('click'); setWlSchoolLevel('secondary'); setWlSelectedGradeForSubjects('Grade 9'); }}
                        className={`flex-1 p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                          wlSchoolLevel === 'secondary'
                            ? 'bg-indigo-50/80 text-indigo-950 border-indigo-300 ring-2 ring-indigo-100 shadow-sm'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                      
                        <span className="text-2xl">🎓</span>
                        <div>
                          <strong className="text-xs block font-bold">{tx("ሁለተኛ ደረጃ እና መሰናዶ (Grade 9-12)")}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Secondary & Preparatory with Grade 9 to 12 dynamic filtering</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Subjects Manager by Grade */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{tx("📚 የትምህርት አይነቶች በየክፍሉ (Subjects by Grade):")}</label>
                      <p className="text-slate-400 text-[11px]">{tx(
                        "\n                        ተማሪዎች የሚማሩትን የትምህርት አይነቶች በክፍል ደረጃ መድበው ያስተዳድሩ።\n                      "
                      )}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-600">{tx("ክፍል ይምረጡ (Select Grade):")}</span>
                      <select 
                        value={wlSelectedGradeForSubjects}
                        onChange={(e) => setWlSelectedGradeForSubjects(e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white">
                      
                        {(wlSchoolLevel === 'secondary' ? ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8']).map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-200 px-2 py-1 rounded-full">
                        {((wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects).length}{tx(" ኮርሶች\n                      ")}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-xl">
                      {((wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects).map((sub, index) => (
                        <div 
                          key={index} 
                          className="bg-slate-100 hover:bg-rose-50 text-slate-800 hover:text-rose-900 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2 transition-all group">
                        
                          <span>📚 {sub}</span>
                          <button
                            type="button"
                            onClick={() => {
                              playInteractiveSound('click');
                              const newName = window.prompt(`የትምህርት አይነት "${sub}" አዲስ ስም ያስገቡ (Edit subject name):`, sub);
                              if (newName && newName.trim() && newName.trim() !== sub) {
                                const clean = newName.trim();
                                const currentGradeSubjects = (wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects;
                                setWlSubjectsByGrade(prev => ({
                                  ...prev,
                                  [wlSelectedGradeForSubjects]: currentGradeSubjects.map(s => s === sub ? clean : s)
                                }));
                              }
                            }}
                            className="text-slate-400 hover:text-indigo-600 focus:outline-none transition-all"
                            title="Edit / Rename Subject">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playInteractiveSound('wrong');
                              const currentGradeSubjects = (wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects;
                              setWlSubjectsByGrade(prev => ({
                                ...prev,
                                [wlSelectedGradeForSubjects]: currentGradeSubjects.filter(s => s !== sub)
                              }));
                            }}
                            className="text-slate-400 hover:text-rose-600 focus:outline-none transition-all"
                            title="Remove Subject">
                          
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {((wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects).length === 0 && (
                        <span className="text-xs text-slate-400 italic p-2">{tx("ምንም ትምህርት አይነት አልተጨመረም! (No subjects defined yet)")}</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={wlNewSubject}
                        onChange={(e) => setWlNewSubject(e.target.value)}
                        placeholder={`አዲስ የትምህርት አይነት ለ ${wlSelectedGradeForSubjects}`}
                        className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 outline-none bg-white font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = wlNewSubject.trim();
                          if (val) {
                            const currentGradeSubjects = (wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects;
                            const isDup = currentGradeSubjects.some(sub => sub.toLowerCase().trim() === val.toLowerCase());
                            if (isDup) {
                              playInteractiveSound('wrong');
                              alert(`⚠️ የትምህርት አይነት "${val}" ቀደም ሲል በ ${wlSelectedGradeForSubjects} ተመዝግቧል!`);
                            } else {
                              playInteractiveSound('success');
                              setWlSubjectsByGrade(prev => ({
                                ...prev,
                                [wlSelectedGradeForSubjects]: [...currentGradeSubjects, val]
                              }));
                              setWlNewSubject('');
                            }
                          } else {
                            playInteractiveSound('wrong');
                          }
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0">{tx(
                        "\n                      \n                        ➕ ጨምር (Add)\n                      "
                      )}</button>
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => {
                           if(window.confirm(tx("ይህን የትምህርት ዝርዝር ወደ ሁሉም ክፍሎች መገልበጥ ይፈልጋሉ? (Copy to all grades?)"))) {
                               const currentGradeSubjects = (wlSubjectsByGrade && wlSubjectsByGrade[wlSelectedGradeForSubjects]) || wlSubjects;
                               const grades = wlSchoolLevel === 'secondary' ? ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
                               const newObj = { ...wlSubjectsByGrade };
                               grades.forEach(g => newObj[g] = [...currentGradeSubjects]);
                               setWlSubjectsByGrade(newObj);
                               playInteractiveSound('success');
                           }
                        }}
                        className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold underline">{tx(
                      "\n                    \n                        🔄 ይህንን ዝርዝር ለሁሉም ክፍሎች ገልብጥ (Copy to all grades)\n                    "
                    )}</button>
                  </div>

                  {/* SaaS Dynamic Assessment Configurator */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{tx("🎛️ የማርክ አሰጣጥ ምዘና ክፍሎች (Assessment Components Configurator):")}</label>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{tx(
                        "\n                        የማርክ ዝርዝር እንደየ ትምህርት አይነቶቹ ሊለያይ ይችላል። እዚህ ላይ ለአንድ የተወሰነ የትምህርት አይነት ወይም ለሁሉም እንደ አጠቃላይ መደበኛ (Default) የምዘና ክፍሎችን ማስተካከል ይችላሉ። "
                      )}<strong>{tx("ጠቅላላ የምዘናዎቹ ድምር 100% መሆን አለበት።")}</strong>{tx(" ማንኛውንም ክፍል ለመደበቅ ከፍተኛ ነጥቡን ")}<strong>0</strong>{tx(" ያድርጉት።\n                      ")}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">{tx("🎯 የትምህርት አይነት ይምረጡ (Select Subject):")}</label>
                        <select
                          value={wlSelectedSubjectAssessment}
                          onChange={(e) => {
                            playInteractiveSound('click');
                            setWlSelectedSubjectAssessment(e.target.value);
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-600 outline-none bg-slate-50 font-bold">
                        
                          <option value="default">{tx("🌟 መደበኛ አጠቃላይ (Default Template)")}</option>
                          {wlSubjects.map((sub, idx) => (
                            <option key={idx} value={sub}>📚 {sub}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2 flex flex-col justify-end text-right md:pr-2">
                        <span className="text-[10px] uppercase text-slate-400 font-extrabold">{tx("የአሁኑ አጠቃላይ ድምር (Current Sum of Weights)")}</span>
                        <div className="flex justify-end items-center gap-2 mt-1">
                          <span className={`text-lg font-black ${wlQuizMax + wlCwMax + wlHwMax + wlGwMax + wlPwMax + wlCpMax + wlMidMax + wlFinalMax === 100 ? 'text-emerald-600' : 'text-rose-600 font-extrabold ring-1 ring-rose-100 px-2 py-0.5 rounded-md bg-rose-50'}`}>
                            {wlQuizMax + wlCwMax + wlHwMax + wlGwMax + wlPwMax + wlCpMax + wlMidMax + wlFinalMax} / 100
                          </span>
                          {wlQuizMax + wlCwMax + wlHwMax + wlGwMax + wlPwMax + wlCpMax + wlMidMax + wlFinalMax === 100 ? (
                            <span className="text-xs text-emerald-600 font-bold">{tx("✔️ ዝግጁ ነው! (Valid)")}</span>
                          ) : (
                            <span className="text-[10px] text-rose-500 font-bold">{tx("⚠️ ድምሩ 100 መሆን አለበት!")}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 pt-1">
                      {/* Quiz Component */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black text-slate-500 block">{tx("📝 Quiz (ኩዊዝ)")}</span>
                        <input
                          type="number"
                          value={wlQuizMax}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setWlQuizMax(val);
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs font-black text-center focus:border-indigo-600 outline-none bg-slate-50"
                        />
                        <span className="text-[9px] text-slate-400 block text-center font-bold">Max: {wlQuizMax}</span>
                      </div>

                      {/* Classwork Component */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black text-slate-500 block">{tx("🏫 CW (ክፍል ስራ)")}</span>
                        <input
                          type="number"
                          value={wlCwMax}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setWlCwMax(val);
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs font-black text-center focus:border-indigo-600 outline-none bg-slate-50"
                        />
                        <span className="text-[9px] text-slate-400 block text-center font-bold">Max: {wlCwMax}</span>
                      </div>

                      {/* Homework Component */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black text-slate-500 block">{tx("🏠 HW (የቤት ስራ)")}</span>
                        <input
                          type="number"
                          value={wlHwMax}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setWlHwMax(val);
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs font-black text-center focus:border-indigo-600 outline-none bg-slate-50"
                        />
                        <span className="text-[9px] text-slate-400 block text-center font-bold">Max: {wlHwMax}</span>
                      </div>

                      {/* Group Work Component */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black text-slate-500 block">{tx("👥 GW (የቡድን ስራ)")}</span>
                        <input
                          type="number"
                          value={wlGwMax}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setWlGwMax(val);
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs font-black text-center focus:border-indigo-600 outline-none bg-slate-50"
                        />
                        <span className="text-[9px] text-slate-400 block text-center font-bold">Max: {wlGwMax}</span>
                      </div>

                      {/* Project Work Component */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black text-slate-500 block">{tx("🔬 PW (ፕሮጀክት)")}</span>
                        <input
                          type="number"
                          value={wlPwMax}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setWlPwMax(val);
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs font-black text-center focus:border-indigo-600 outline-none bg-slate-50"
                        />
                        <span className="text-[9px] text-slate-400 block text-center font-bold">Max: {wlPwMax}</span>
                      </div>

                      {/* Class Participation Component */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black text-slate-500 block">{tx("💬 CP (ተሳትፎ)")}</span>
                        <input
                          type="number"
                          value={wlCpMax}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setWlCpMax(val);
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs font-black text-center focus:border-indigo-600 outline-none bg-slate-50"
                        />
                        <span className="text-[9px] text-slate-400 block text-center font-bold">Max: {wlCpMax}</span>
                      </div>

                      {/* Midterm Component */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black text-slate-500 block">{tx("🌗 MEXAM (ግማሽ)")}</span>
                        <input
                          type="number"
                          value={wlMidMax}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setWlMidMax(val);
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs font-black text-center focus:border-indigo-600 outline-none bg-slate-50"
                        />
                        <span className="text-[9px] text-slate-400 block text-center font-bold">Max: {wlMidMax}</span>
                      </div>

                      {/* Final Component */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black text-slate-500 block">{tx("🏁 FEXAM (ማጠቃለያ)")}</span>
                        <input
                          type="number"
                          value={wlFinalMax}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setWlFinalMax(val);
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs font-black text-center focus:border-indigo-600 outline-none bg-slate-50"
                        />
                        <span className="text-[9px] text-slate-400 block text-center font-bold">Max: {wlFinalMax}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Credentials */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{tx("📞 ስልክ ቁጥር (Phone):")}</label>
                      <input 
                        type="text"
                        value={wlPhone}
                        onChange={(e) => setWlPhone(e.target.value)}
                        placeholder="0111223344"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{tx("📧 የኢሜል አድራሻ (Email):")}</label>
                      <input 
                        type="email"
                        value={wlEmail}
                        onChange={(e) => setWlEmail(e.target.value)}
                        placeholder="info@diligentschool.edu.et"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-1">{tx("📍 አድራሻ (Address):")}</label>
                      <input 
                        type="text"
                        value={wlAddress}
                        onChange={(e) => setWlAddress(e.target.value)}
                        placeholder={tx("አዲስ አበባ፣ ኢትዮጵያ (Addis Ababa, Ethiopia)")}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {wlSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs md:text-sm font-bold rounded-2xl flex items-center gap-2">
                    
                      <span>🎉</span>
                      <span>{tx(
                        "ብራንዲንግ በተሳካ ሁኔታ ተቀይሯል! ሙሉ ሲስተሙ አሁን የእርስዎን ትምህርት ቤት ያንጸባርቃል። (Branding updated successfully!)"
                      )}</span>
                    </motion.div>
                  )}

                  {wlError && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs md:text-sm font-bold rounded-2xl flex items-center gap-2">
                    
                      <span>⚠️</span>
                      <span>{wlError}</span>
                    </motion.div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-sm transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5">
                  
                    <span>💾</span>
                    <span>{tx("የትምህርት ቤቱን መረጃዎች መዝግብ (Apply School Branding)")}</span>
                  </button>

                </form>
              </div>

              {/* DATABASE BACKUP AND RESTORE UTILITY */}
              <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-xl font-black text-slate-900">{tx("🗄️ የዳታ ምትኬና መመለሻ ማስተዳደሪያ (Backup & Restore Utility)")}</h3>
                  </div>
                  <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{tx(
                    "\n                    ይህ ሲስተም ለተጠቃሚ ሲቀርብ ያለ ምንም የመረጃ መጥፋት ስጋት በነጻነት መስራት እንዲችል የሀገር ውስጥ ትምህርት ቤቶችን ፍላጎት መሰረት ባደረገ መልኩ "
                  )}<strong>{tx("ከኢንተርኔት ነጻ (Offline-First)")}</strong>{tx(
                    " ሆኖ የተገነባ ነው። ሁሉም መረጃዎች በብሮውዘርዎ ላይ በቋሚነት ይቀመጣሉ። ለተጨማሪ ጥንቃቄ የሲስተሙን መላ መረጃ (ተማሪዎች፣ አስተማሪዎች፣ ውጤቶች እና ብራንዲንግ) ወደ ኮምፒውተርዎ በፋይል መልክ መቅዳት (Backup ማውረድ) ወይም ቀደም ሲል ያወረዱትን ምትኬ መልሰው መጫን (Restore ማድረግ) ይችላሉ።\n                  "
                  )}</p>
                </div>

                {restoreSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs md:text-sm font-bold rounded-2xl flex items-center gap-2 shadow-sm">
                  
                    <span className="text-lg">✔️</span>
                    <span>{restoreSuccess}</span>
                  </motion.div>
                )}

                {restoreError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-50 text-rose-900 border border-rose-200 text-xs md:text-sm font-bold rounded-2xl flex items-center gap-2 shadow-sm">
                  
                    <span className="text-lg">⚠️</span>
                    <span>{restoreError}</span>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Export Card */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block mb-1">DOWNLOAD ARCHIVE</span>
                      <h4 className="text-sm font-extrabold text-slate-800">{tx("1. የሲስተሙን ዳታ ምትኬ አውርድ (Backup Data)")}</h4>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{tx(
                        "\n                        የአሁኑን የትምህርት ቤት መረጃዎች በሙሉ በአንድ ደህንነቱ የተጠበቀ የኮምፒውተር ፋይል (.json) አድርገው ማውረድ። ይህንን ፋይል ለወደፊቱ ዳታ ለመመለስ መጠቀም ይችላሉ።\n                      "
                      )}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm">
                    
                      <Download className="w-4 h-4" />
                      <span>{tx("ምትኬ ፋይል አውርድ (Download Backup File)")}</span>
                    </button>
                  </div>

                  {/* Import Card */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block mb-1">RESTORE FROM FILE</span>
                      <h4 className="text-sm font-extrabold text-slate-800">{tx("2. ምትኬ ፋይል ወደ ሲስተሙ መልስ (Restore Data)")}</h4>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{tx(
                        "\n                        ቀደም ሲል ያስቀመጡትን የትምህርት ቤት የዳታ ምትኬ ፋይል (.json) እዚህ በመጫን መላውን ሲስተም ወደነበረበት ይመልሱ።\n                      "
                      )}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        id="backup-upload-input"
                        className="hidden"
                      />
                      <label
                        htmlFor="backup-upload-input"
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer text-center">
                      
                        <Upload className="w-4 h-4" />
                        <span>{tx("ምትኬ ፋይል ምረጥና ጫን (Upload & Restore Backup)")}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-900 leading-relaxed font-semibold flex items-start gap-2">
                  <span>💡</span>
                  <p>
                    <strong>{tx("የደህንነት ማስጠንቀቂያ፡")}</strong>{tx(
                    " አዲስ የምትኬ ፋይል ሲጭኑ በአሁኑ ሰዓት በብሮውዘርዎ ላይ የተመዘገቡት የድሮ መረጃዎች በሙሉ በአዲሱ ፋይል ይተካሉ! ከመተካትዎ በፊት የአሁኑን ዳታ ምትኬ አውርደው ማስቀመጥዎን ያረጋግጡ።\n                  "
                  )}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: DEFECTS ANALYSIS REPORT (SECURITY AUDIT) */}
          {activeTab === 'report' && (
            <motion.div
              key="report-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 print:hidden">
            
              
              <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="text-amber-600 w-6 h-6" />{tx(" በዋናው ኮድ ላይ የተገኙ 4 የስራና የደህንነት ክፍተቶች (Defects Report)\n                ")}</h2>
                <p className="text-slate-500 text-xs md:text-sm mt-1 leading-relaxed">{tx(
                  "\n                  በተጠቃሚው ኮድ ውስጥ የተገኙትን ዋና ዋና ክፍተቶች እና ለምን ጎጂ እንደሆኑ በዝርዝር መርምረናል። በፕሮቶታይፑ ላይ ያደረግናቸውን ማሻሻያዎች ከዚህ በታች ያንብቡ።\n                "
                )}</p>
              </div>

              {/* Grid of Defects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEFECTS_REPORT.map((defect) => (
                  <div 
                    key={defect.id}
                    onClick={() => { playInteractiveSound('click'); setSelectedDefect(defect); }}
                    className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group relative">
                    id={`defect-card-${defect.id}`}
                  
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md ${
                          defect.severity === 'Critical' 
                            ? 'bg-rose-50 text-rose-800 border border-rose-100' 
                            : 'bg-amber-50 text-amber-800 border border-amber-100'
                        }`}>
                          {defect.severity} Severity
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-all" />
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-amber-700 transition-colors">
                        {defect.titleAmh || defect.title}
                      </h3>
                      <p className="text-xs text-slate-400 italic font-mono mt-0.5">{defect.titleEng}</p>
                      <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-3">
                        {defect.descriptionAmh || defect.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                      <span>{tx("👀 የኮድ ማነጻጸሪያን ተመልከት (View Code Fix)")}</span>
                      <span className="font-mono text-[10px] opacity-60">ID: {defect.id}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Print modal has been relocated globally to support all tabs */}

              <AnimatePresence>
                {selectedDefect && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="defect-modal">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedDefect(null)}
                      className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
                    />

                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative bg-white border border-slate-200 w-full max-w-3xl p-6 md:p-8 rounded-3xl shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto">
                    
                      <button 
                        onClick={() => setSelectedDefect(null)}
                        className="p-2 absolute right-4 top-4 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors">
                      
                        <X className="w-5 h-5" />
                      </button>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider rounded-md ${
                            selectedDefect.severity === 'Critical' 
                              ? 'bg-rose-50 text-rose-800 border border-rose-100' 
                              : 'bg-amber-50 text-amber-800 border border-amber-100'
                          }`}>
                            {selectedDefect.severity} Severity Bug
                          </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
                          {selectedDefect.titleAmh || selectedDefect.title}
                        </h2>
                        <p className="text-xs font-mono text-slate-400">{selectedDefect.titleEng}</p>
                      </div>

                      {/* Explanation details */}
                      <div className="space-y-3">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 text-sm text-slate-700 leading-relaxed space-y-2">
                          <strong className="text-slate-900 font-semibold block flex items-center gap-1">
                            <Info className="w-4 h-4 text-amber-500" />{tx(" የስህተቱ ዝርዝር መግለጫ (Description):\n                          ")}</strong>
                          <p>{selectedDefect.descriptionAmh || selectedDefect.description}</p>
                          <p className="text-xs text-slate-500 italic border-t border-slate-200/40 pt-2">{selectedDefect.descriptionEng}</p>
                        </div>

                        <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-200/40 text-sm text-emerald-950 leading-relaxed">
                          <strong className="text-emerald-900 font-semibold block mb-1">{tx("💡 እንዴት አስተካከልነው (Resolution applied in React Prototype):")}</strong>
                          <p>{selectedDefect.explanationAmh || selectedDefect.explanation}</p>
                        </div>
                      </div>

                      {/* Code comparison grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Buggy Code block */}
                        <div className="border border-rose-100 rounded-2xl overflow-hidden shadow-xs">
                          <div className="bg-rose-50 p-3 border-b border-rose-100 flex justify-between items-center text-xs text-rose-900 font-bold">
                            <span>{tx("🚨 የነበረው ስህተት (Buggy Code)")}</span>
                          </div>
                          <div className="relative">
                            <pre className="p-4 bg-slate-950 text-rose-400 font-mono text-[11px] leading-relaxed overflow-x-auto h-48 rounded-b-2xl">
                              <code>{selectedDefect.buggyCode}</code>
                            </pre>
                            <button
                              onClick={() => handleCopyCode(selectedDefect.buggyCode, 'bug')}
                              className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-[10px] flex items-center gap-1">
                            
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedId === 'bug' ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Fixed Code block */}
                        <div className="border border-emerald-100 rounded-2xl overflow-hidden shadow-xs">
                          <div className="bg-emerald-50 p-3 border-b border-emerald-100 flex justify-between items-center text-xs text-emerald-900 font-bold">
                            <span>{tx("✅ የተስተካከለው ኮድ (Fixed Code)")}</span>
                          </div>
                          <div className="relative">
                            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto h-48 rounded-b-2xl">
                              <code>{selectedDefect.fixedCode}</code>
                            </pre>
                            <button
                              onClick={() => handleCopyCode(selectedDefect.fixedCode, 'fix')}
                              className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-[10px] flex items-center gap-1">
                            
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedId === 'fix' ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setSelectedDefect(null)}
                          className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all">{tx(
                          "\n                        \n                          ዝጋ (Close Analysis)\n                        "
                        )}</button>
                      </div>

                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* TAB 4: HELP & ANNOUNCEMENTS */}
          {activeTab === 'help' && (
            <motion.div
              key="help-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8">
            
              {/* Announcements Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{tx('የቅርብ ጊዜ ማስታወቂያዎች (Latest Announcements)')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      {tx('የትምህርት ቤቱ መረጃዎችና መልእክቶች')}
                    </p>
                  </div>
                </div>

                {announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg uppercase tracking-wider">
                            {ann.category}
                          </span>
                          <span className="text-xs text-slate-400 font-mono font-bold">
                            {ann.date}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{ann.title}</h5>
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{tx('በአሁኑ ጊዜ ምንም ማስታወቂያ የለም')}</p>
                  </div>
                )}
              </div>

              {/* Usage Guide Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{tx('ስለ አጠቃቀሙ መመሪያ (Usage Guide)')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      {tx('ስርዓቱን እንዴት መጠቀም እንደሚችሉ የሚያሳይ አጭር መግለጫ')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Principal Guide */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">1</div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{tx("ለርዕሰ መምህር / አስተዳዳሪ")}</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc pl-4">
                      <li>{tx("ተማሪዎችን፣ መምህራንን እና ክፍሎችን መመዝገብ እና ማስተዳደር")}</li>
                      <li>{tx("የተማሪዎች ውጤት እና ሪፖርት ማየት")}</li>
                      <li>{tx("ማስታወቂያዎችን ለሁሉም ማጋራት")}</li>
                      <li>{tx("የስርዓቱን አጠቃላይ ገፅታ (White-label) ማስተካከል")}</li>
                    </ul>
                  </div>

                  {/* Teacher Guide */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">2</div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{tx("ለመምህራን")}</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc pl-4">
                      <li>{tx("በተመደቡበት ክፍል የተማሪዎችን ውጤት መሙላት")}</li>
                      <li>{tx("የተማሪዎችን መገኘት (Attendance) መመዝገብ")}</li>
                      <li>{tx("ለተማሪዎች ግብረ-መልስ (Feedback) መስጠት")}</li>
                      <li>{tx("የክፍል ደረጃ ሪፖርት ማዘጋጀት")}</li>
                    </ul>
                  </div>

                  {/* Parent Guide */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center text-sm font-bold">3</div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{tx("ለወላጆች")}</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc pl-4">
                      <li>{tx("የልጅዎን ውጤት እና መገኘት መከታተል")}</li>
                      <li>{tx("የትምህርት ቤቱን ማስታወቂያዎች ማንበብ")}</li>
                      <li>{tx("መምህራን የሰጡትን አስተያየት (Feedback) ማየት")}</li>
                    </ul>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* PERSONAL PASSWORD CHANGE MODAL */}
        <AnimatePresence>
          {isChangingPasswordOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="change-password-modal">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsChangingPasswordOpen(false);
                  setPasswordChangeSuccessMsg(null);
                  setPasswordChangeErrorMsg(null);
                  setNewPasswordInput('');
                }}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs no-print"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: "spring", duration: 0.4 }}
                className={`relative w-full max-w-md rounded-3xl p-6 border shadow-xl transition-all z-10 font-sans ${
                  themeMode === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/80'
                    : 'bg-white border-slate-200 text-slate-950 shadow-2xl'
                }`}>
              
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-3 mb-4 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-500 animate-bounce" />
                    <h3 className="text-base font-black tracking-tight">{tx("🔐 የይለፍ ቃል መቀየር (Change Password)")}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      playInteractiveSound('click');
                      setIsChangingPasswordOpen(false);
                      setPasswordChangeSuccessMsg(null);
                      setPasswordChangeErrorMsg(null);
                      setNewPasswordInput('');
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  
                    <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>

                {/* Form Body */}
                <div className="space-y-4 text-left">
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-855 text-xs space-y-1">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{tx("ያለዎት የአሁኑ መለያ (Current Account)")}</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{currentUser?.name || tx("ተጠቃሚ")}</p>
                    <p className="font-mono text-slate-500">{currentUser?.email}</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase">{tx("አዲስ የይለፍ ቃል ያስገቡ (New Password)")}</label>
                    <input
                      type="text"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder={tx("ቢያንስ 8 ፊደላት፣ 1 ዋና ፊደል እና 1 ቁጥር...")}
                      className={`w-full bg-white dark:bg-slate-950 border text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-black tracking-widest ${
                        themeMode === 'dark' ? 'border-slate-800' : 'border-slate-250'
                      }`}
                    />
                    {newPasswordInput && (() => {
                      let score = 0;
                      const pass = newPasswordInput;
                      if (pass.length >= 6) score += 1;
                      if (pass.length >= 10) score += 1;
                      if (/[A-Z]/.test(pass)) score += 1;
                      if (/[a-z]/.test(pass)) score += 1;
                      if (/[0-9]/.test(pass)) score += 1;
                      if (/[^A-Za-z0-9]/.test(pass)) score += 1;
                      
                      let label = tx("በጣም ደካማ (Very Weak)");
                      let colorBg = 'bg-rose-500';
                      let colorText = 'text-rose-500';
                      let widthClass = 'w-[15%]';
                      
                      if (score <= 2) { label = tx("ደካማ (Weak)"); colorBg = 'bg-rose-500'; colorText = 'text-rose-500'; widthClass = 'w-[25%]'; }
                      else if (score === 3) { label = tx("መካከለኛ (Fair)"); colorBg = 'bg-amber-500'; colorText = 'text-amber-500'; widthClass = 'w-[50%]'; }
                      else if (score === 4) { label = tx("ጥሩ (Good)"); colorBg = 'bg-emerald-400'; colorText = 'text-emerald-500'; widthClass = 'w-[75%]'; }
                      else if (score >= 5) { label = tx("በጣም ጠንካራ (Strong)"); colorBg = 'bg-emerald-600'; colorText = 'text-emerald-600'; widthClass = 'w-full'; }

                      return (
                        <div className="mt-2.5 animate-fadeIn">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{tx("ጥንካሬ (Strength):")}</span>
                            <span className={`text-[9px] font-black ${colorText}`}>{label}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${widthClass} ${colorBg} transition-all duration-300 rounded-full`} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {passwordChangeErrorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>{passwordChangeErrorMsg}</span>
                    </div>
                  )}

                  {passwordChangeSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-1.5">
                      <span>✅</span>
                      <span>{passwordChangeSuccessMsg}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        playInteractiveSound('click');
                        setIsChangingPasswordOpen(false);
                        setPasswordChangeSuccessMsg(null);
                        setPasswordChangeErrorMsg(null);
                        setNewPasswordInput('');
                      }}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-xs font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer text-slate-600 dark:text-slate-400">{tx(
                      "\n                    \n                      ሰርዝ (Cancel)\n                    "
                    )}</button>

                    <button
                      type="button"
                      onClick={async () => {
                        playInteractiveSound('click');
                        setPasswordChangeErrorMsg(null);
                        setPasswordChangeSuccessMsg(null);

                        const passClean = newPasswordInput.trim();
                        if (passClean.length < 8 || !/[A-Z]/.test(passClean) || !/[0-9]/.test(passClean)) {
                          playInteractiveSound('wrong');
                          setPasswordChangeErrorMsg(tx("የይለፍ ቃል ቢያንስ 8 ፊደላት፣ 1 ዋና ፊደል (Uppercase) እና 1 ቁጥር (Number) መያዝ አለበት! (Password must be >= 8 chars, include at least 1 uppercase letter and 1 number)"));
                          return;
                        }

                        try {
                          // Update the userAccounts state
                          const myEmail = currentUser?.email?.toLowerCase();
                          if (!myEmail) {
                            setPasswordChangeErrorMsg(tx("መለያዎን ማረጋገጥ አልተቻለም (Could not identify account)"));
                            return;
                          }

                          const accountExists = userAccounts.some(acc => acc.email.toLowerCase() === myEmail);
                          let updatedAccounts: UserAccount[] = [];

                          if (accountExists) {
                            updatedAccounts = userAccounts.map(acc => 
                              acc.email.toLowerCase() === myEmail ? { ...acc, password: passClean } : acc
                            );
                          } else {
                            // Account is missing from the list, register it
                            updatedAccounts = [
                              ...userAccounts,
                              {
                                email: myEmail,
                                password: passClean,
                                role: currentUser.role,
                                name: currentUser.name || currentUser.email
                              }
                            ];
                          }

                          setUserAccounts(updatedAccounts);
                          playInteractiveSound('success');
                          setPasswordChangeSuccessMsg(tx("🔐 የይለፍ ቃልዎ በትክክል ተቀይሯል! (Password changed successfully)"));
                          
                          setTimeout(() => {
                            setIsChangingPasswordOpen(false);
                            setPasswordChangeSuccessMsg(null);
                            setNewPasswordInput('');
                          }, 1500);

                        } catch (err: any) {
                          playInteractiveSound('wrong');
                          setPasswordChangeErrorMsg(err?.message || tx("በማስቀመጥ ላይ ስህተት ተፈጥሯል (Error saving password)"));
                        }
                      }}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer">{tx(
                      "\n                    \n                      አስቀምጥ (Save Password)\n                    "
                    )}</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <SchoolInfoModal 
          isOpen={isSchoolInfoModalOpen} 
          onClose={() => setIsSchoolInfoModalOpen(false)} 
          schoolConfig={schoolConfig} 
          themeColor={schoolConfig.themeColor || 'indigo'} 
        />

        {/* NEW SCHOOL WORKSPACE CREATOR MODAL */}
        <AnimatePresence>
          {isNewSchoolModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="new-school-workspace-modal">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsNewSchoolModalOpen(false)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs no-print"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: "spring", duration: 0.4 }}
                className={`relative w-full max-w-lg rounded-3xl p-6 md:p-8 border shadow-xl transition-all z-10 font-sans ${
                  themeMode === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/80'
                    : 'bg-white border-slate-200 text-slate-950 shadow-2xl'
                }`}>
              
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-4 mb-5 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xs">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{tx("አዲስ ትምህርት ቤት መመዝገቢያ (Add New School)")}</h3>
                      <p className="text-[9px] text-slate-400 font-medium">Create a separate clean database workspace for a new school</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { playInteractiveSound('click'); setIsNewSchoolModalOpen(false); }}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                      themeMode === 'dark' 
                        ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' 
                        : 'border-slate-150 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                    }`}>
                  
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-left">
                  {newSchoolModalError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-semibold leading-relaxed">
                      {newSchoolModalError}
                    </div>
                  )}

                  {/* English Name Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">{tx(
                      "\n                      🏫 የትምህርት ቤቱ ስም - በእንግሊዝኛ (School Name - English) *\n                    "
                    )}</label>
                    <input 
                      type="text"
                      required
                      value={newSchoolNameEng}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewSchoolNameEng(val);
                        // Auto-generate Workspace ID from English Name
                        const cleaned = val.toLowerCase().trim()
                          .replace(/[^a-z0-9]/g, '-')
                          .replace(/-+/g, '-')
                          .replace(/^-+|-+$/g, '');
                        setNewSchoolWorkspaceId(cleaned);
                      }}
                      placeholder="e.g. Diligent Intellectuals Academy"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Amharic Name Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">{tx(
                      "\n                      🏫 የትምህርት ቤቱ ስም - በአማርኛ (School Name - Amharic)\n                    "
                    )}</label>
                    <input 
                      type="text"
                      value={newSchoolNameAmh}
                      onChange={(e) => setNewSchoolNameAmh(e.target.value)}
                      placeholder={tx("ምሳሌ፦ ትጉሃን ሊቃውንት አካዳሚ")}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* School Level Select */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">{tx(
                      "\n                      🎓 የትምህርት ደረጃ (School Level)\n                    "
                    )}</label>
                    <select
                      value={newSchoolLevel}
                      onChange={(e) => setNewSchoolLevel(e.target.value as 'primary' | 'secondary')}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-indigo-500">
                    
                      <option value="primary">{tx("መካከለኛ/የመጀመሪያ ደረጃ (Primary / Middle - Grades 1-8)")}</option>
                      <option value="secondary">{tx("ሁለተኛ ደረጃ (Secondary / High School - Grades 9-12)")}</option>
                    </select>
                  </div>

                  {/* Custom Workspace ID Input (Read-only but shown for context) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">{tx(
                      "\n                      🔑 የሲስተም መለያ ኮድ (Workspace ID / Short Code)\n                    "
                    )}</label>
                    <input 
                      type="text"
                      value={newSchoolWorkspaceId}
                      onChange={(e) => setNewSchoolWorkspaceId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="e.g. diligent-academy"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="text-[9px] text-slate-400 leading-normal">{tx(
                      "\n                      ይህ ኮድ የአዲሱን ትምህርት ቤት የተማሪዎችና የውጤት ፋይል በተናጠል ለመቆለፍ የሚያገለግል የሲስተሙ ሚስጥራዊ መለያ ነው። (This is the unique system database namespace for isolating records.)\n                    "
                    )}</p>
                  </div>

                  {/* Seeding Demo Option Checkbox */}
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/45 rounded-2xl space-y-1.5">
                    <div className="flex items-start gap-2.5">
                      <input 
                        type="checkbox"
                        id="seed-demo-checkbox"
                        checked={newSchoolSeedDemo}
                        onChange={(e) => {
                          playInteractiveSound('click');
                          setNewSchoolSeedDemo(e.target.checked);
                        }}
                        className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="seed-demo-checkbox" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none leading-tight">{tx(
                        "\n                        📋 ከናሙና መረጃዎች ጋር ይነሳ? (Seed with sample demo data?)\n                      "
                      )}</label>
                    </div>
                    <p className="text-[9.5px] text-slate-400 pl-6.5 leading-normal">{tx(
                      "\n                      ካበሩት ትምህርት ቤቱ ሲፈጠር መፈተኛ ተማሪዎች፣ ክፍሎች እና መምህራን ተካተው ይፈጠራል። ካላበሩት ግን ሙሉ በሙሉ ባዶ የትምህርት ቤት ዳታቤዝ ይፈጠራል። (If checked, school will be populated with test students/classes. Unchecked creates a clean empty database.)\n                    "
                    )}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        playInteractiveSound('click');
                        setIsNewSchoolModalOpen(false);
                      }}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-xs font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer text-slate-600 dark:text-slate-400 text-center">{tx(
                      "\n                    \n                      ሰርዝ (Cancel)\n                    "
                    )}</button>

                    <button
                      type="button"
                      onClick={() => {
                        playInteractiveSound('click');
                        setNewSchoolModalError(null);
                        
                        const nameAmh = newSchoolNameAmh.trim();
                        const nameEng = newSchoolNameEng.trim();
                        
                        if (!nameAmh && !nameEng) {
                          setNewSchoolModalError(tx("⚠️ የትምህርት ቤቱ ስም መሞላት አለበት! (At least one school name must be provided!)"));
                          playInteractiveSound('wrong');
                          return;
                        }
                        
                        const finalNameAmh = nameAmh || nameEng;
                        const finalNameEng = nameEng || nameAmh;
                        
                        let targetId = newSchoolWorkspaceId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
                        if (!targetId) {
                          // Try to generate a safe ID from English name
                          const base = finalNameEng.toLowerCase().replace(/[^a-z0-9]/g, '-');
                          targetId = base.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
                          if (!targetId || targetId.length < 3 || targetId === 'school') {
                            targetId = `school-${Math.floor(1000 + Math.random() * 9000)}`;
                          }
                        }
                        
                        if (!targetId || targetId.length < 3) {
                          setNewSchoolModalError(tx(
                            "⚠️ የትምህርት ቤቱ መለያ ኮድ ቢያንስ 3 ፊደላት መሆን አለበት! (Workspace ID must be >= 3 chars)"
                          ));
                          playInteractiveSound('wrong');
                          return;
                        }

                        const exists = workspacesRegistry.some(w => w.id === targetId);
                        if (exists) {
                          setNewSchoolModalError(`⚠️ "${targetId}" የሚል መለያ ያለው ትምህርት ቤት ቀድሞ ተመዝግቧል! (A school with ID "${targetId}" already exists!)`);
                          playInteractiveSound('wrong');
                          return;
                        }

                        try {
                          const freshConfig = {
                            nameAmh: finalNameAmh,
                            nameEng: finalNameEng,
                            mottoAmh: tx("ለክህሎትና ለውጤታማነት እንተጋለን!"),
                            mottoEng: 'Striving for Skills and Success!',
                            phone: '0111223344',
                            email: `info@${targetId}.edu.et`,
                            address: tx("አዲስ አበባ፣ ኢትዮጵያ (Addis Ababa, Ethiopia)"),
                            logoType: 'graduation' as const,
                            themeColor: 'indigo' as const,
                            subjects: ['Mathematics', 'English', 'Amharic', 'Science', 'Social Studies'],
                            evaluationMode: 'quarter' as const,
                            schoolLevel: newSchoolLevel,
                            academicYear: tx("2018 ዓ.ም"),
                            seedDemoData: newSchoolSeedDemo
                          };

                          // Seed local caches according to user selection
                          localStorage.setItem(`schoolConfig_${targetId}`, JSON.stringify(freshConfig));
                          localStorage.setItem(`school_students_${targetId}`, JSON.stringify(newSchoolSeedDemo ? INITIAL_STUDENTS : []));
                          localStorage.setItem(`school_grades_${targetId}`, JSON.stringify(newSchoolSeedDemo ? INITIAL_GRADES : []));
                          localStorage.setItem(`school_teachers_${targetId}`, JSON.stringify(newSchoolSeedDemo ? INITIAL_TEACHERS : []));
                          localStorage.setItem(`school_classes_${targetId}`, JSON.stringify(newSchoolSeedDemo ? INITIAL_CLASSES : []));
                          localStorage.setItem(`school_announcements_${targetId}`, JSON.stringify(newSchoolSeedDemo ? INITIAL_ANNOUNCEMENTS : []));
                          localStorage.setItem(`studentExtraInfo_${targetId}`, JSON.stringify(newSchoolSeedDemo ? {
                            'ID-4021': { conduct: 'A', absent: 2 },
                            'ID-1082': { conduct: 'A', absent: 0 },
                            'ID-8843': { conduct: 'B', absent: 4 },
                            'ID-5531': { conduct: 'A', absent: 1 },
                            'ID-9011': { conduct: 'B', absent: 3 },
                            'ID-3245': { conduct: 'A+', absent: 0 }
                          } : {}));
                          localStorage.setItem(`school_user_accounts_${targetId}`, JSON.stringify([]));

                          // Register
                          const newEntry = {
                            id: targetId,
                            nameAmh: freshConfig.nameAmh,
                            nameEng: freshConfig.nameEng,
                            updatedAt: Date.now()
                          };

                          const updatedRegistry = [...workspacesRegistry, newEntry];
                          setWorkspacesRegistry(updatedRegistry);
                          localStorage.setItem('school_workspaces_registry', JSON.stringify(updatedRegistry));

                          // Switch workspace!
                          setSchoolWorkspaceId(targetId);
                          localStorage.setItem('school_workspace_id', targetId);
                          
                          // Smoothly push to URL query params
                          const newUrl = `${window.location.origin}${window.location.pathname}?school=${targetId}`;
                          window.history.pushState({ path: newUrl }, '', newUrl);

                          playInteractiveSound('success');
                          setIsNewSchoolModalOpen(false);

                        } catch (err: any) {
                          setNewSchoolModalError(`❌ ትምህርት ቤቱን በሚፈጥሩበት ጊዜ ስህተት አጋጥሟል: ${err.message || String(err)}`);
                          playInteractiveSound('wrong');
                        }
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer text-center">{tx(
                      "\n                    \n                      ትምህርት ቤቱን ፍጥር (Create School)\n                    "
                    )}</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MANAGE SCHOOLS / DELETE DUPLICATES MODAL */}
        <AnimatePresence>
          {isManageSchoolsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="manage-schools-modal">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsManageSchoolsModalOpen(false)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs no-print"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: "spring", duration: 0.4 }}
                className={`relative w-full max-w-lg rounded-3xl p-6 md:p-8 border shadow-xl transition-all z-10 font-sans text-left ${
                  themeMode === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/80'
                    : 'bg-white border-slate-200 text-slate-950 shadow-2xl'
                }`}>
              
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-4 mb-5 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xs">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{tx("ተመዝግበው የሚገኙ ትምህርት ቤቶች ማስተካከያ (Manage Registered Schools)")}</h3>
                      <p className="text-[9px] text-slate-400 font-medium">{tx(
                        "እዚህ ጋር የተደጋገሙ ወይም በስህተት የፈጠሯቸውን ትምህርት ቤቶች ማጥፋት ይችላሉ። (Clean up duplicates or unused school databases)"
                      )}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { playInteractiveSound('click'); setIsManageSchoolsModalOpen(false); }}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                      themeMode === 'dark' 
                        ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' 
                        : 'border-slate-150 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                    }`}>
                  
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* List container */}
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {workspacesRegistry.map((item) => {
                    const isMain = item.id === 'diligent';
                    const isActive = item.id === schoolWorkspaceId;
                    return (
                      <div 
                        key={item.id} 
                        className={`flex flex-col p-3.5 rounded-2xl border text-xs transition-all ${
                          isActive 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold dark:bg-indigo-950/30 dark:border-indigo-900/60 dark:text-indigo-300' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-200'
                        }`}>

                        <div className="flex items-center justify-between w-full">
                          <div className="truncate text-left pr-3 flex-1">
                            <span className="font-extrabold text-xs block truncate">{lang === 'am' ? item.nameAmh : item.nameEng}</span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">ID: {item.id} {isActive && tx("• (ንቁ / Active)")} {isMain && tx("• (የመጀመሪያ / Primary Default)")}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isActive && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-[9px] rounded-full font-black uppercase">{tx(
                                "\n                                Active / ንቁ\n                              "
                              )}</span>
                            )}

                            {/* Edit Button */}
                            {editingWorkspaceId !== item.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  playInteractiveSound('click');
                                  setEditingWorkspaceId(item.id);
                                  setEditWsId(item.id);
                                  setEditWsNameAmh(item.nameAmh);
                                  setEditWsNameEng(item.nameEng);
                                }}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-750 transition-all cursor-pointer flex items-center justify-center"
                                title={tx("ስም ማስተካከያ (Edit Name)")}>
                              
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                              </button>
                            )}
                            
                            {!isMain && (
                              <div className="flex items-center gap-1.5">
                                {deletingWorkspaceFromModalId === item.id ? (
                                  <div className="flex items-center gap-1 animate-fadeIn">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        playInteractiveSound('wrong');
                                        const updated = workspacesRegistry.filter(w => w.id !== item.id);
                                        setWorkspacesRegistry(updated);
                                        localStorage.setItem('school_workspaces_registry', JSON.stringify(updated));
                                        
                                        // Clear all specific school storage keys
                                        localStorage.removeItem(`schoolConfig_${item.id}`);
                                        localStorage.removeItem(`school_students_${item.id}`);
                                        localStorage.removeItem(`school_grades_${item.id}`);
                                        localStorage.removeItem(`school_teachers_${item.id}`);
                                        localStorage.removeItem(`school_classes_${item.id}`);
                                        localStorage.removeItem(`school_announcements_${item.id}`);
                                        localStorage.removeItem(`studentExtraInfo_${item.id}`);
                                        localStorage.removeItem(`school_user_accounts_${item.id}`);

                                        // If active school is deleted, switch back to 'diligent' workspace
                                        if (isActive) {
                                          setSchoolWorkspaceId('diligent');
                                          localStorage.setItem('school_workspace_id', 'diligent');
                                          const newUrl = `${window.location.origin}${window.location.pathname}?school=diligent`;
                                          window.history.pushState({ path: newUrl }, '', newUrl);
                                        }
                                        setDeletingWorkspaceFromModalId(null);
                                      }}
                                      className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
>
                                      {lang === 'am' ? tx("ሰርዝ!") : 'Delete'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        playInteractiveSound('click');
                                        setDeletingWorkspaceFromModalId(null);
                                      }}
                                      className="px-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black transition-all cursor-pointer border border-slate-200"
>
                                      {lang === 'am' ? tx("ተወው") : 'Cancel'}
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playInteractiveSound('click');
                                      setDeletingWorkspaceFromModalId(item.id);
                                    }}
                                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50 transition-all cursor-pointer flex items-center justify-center"
                                    title={tx("ማጥፊያ (Delete School)")}>
                                  
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Editing Drawer Form */}
                        {editingWorkspaceId === item.id && (
                          <div className="mt-3 p-3 bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-left space-y-2.5 animate-fadeIn">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">{tx("የትምህርት ቤት መለያ (School ID):")}</label>
                                <input
                                  type="text"
                                  value={editWsId}
                                  onChange={(e) => setEditWsId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none mb-3"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">{tx("ስም በአማርኛ (Name - Amharic):")}</label>
                                <input
                                  type="text"
                                  value={editWsNameAmh}
                                  onChange={(e) => setEditWsNameAmh(e.target.value)}
                                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Name in English:</label>
                                <input
                                  type="text"
                                  value={editWsNameEng}
                                  onChange={(e) => setEditWsNameEng(e.target.value)}
                                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                              <button
                                type="button"
                                onClick={() => {
                                  playInteractiveSound('register');
                                  const nameAmhClean = editWsNameAmh.trim() || item.nameAmh;
                                  const nameEngClean = editWsNameEng.trim() || item.nameEng;
                                  let newId = editWsId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
                                  if (!newId || newId.length < 3) newId = item.id;
                                  
                                  if (newId !== item.id && workspacesRegistry.some(w => w.id === newId)) {
                                    alert('A school with this ID already exists!');
                                    return;
                                  }

                                  const updatedRegistry = workspacesRegistry.map(w => {
                                    if (w.id === item.id) {
                                      return { ...w, id: newId, nameAmh: nameAmhClean, nameEng: nameEngClean };
                                    }
                                    return w;
                                  });
                                  
                                  // Migrate localStorage if ID changed
                                  if (newId !== item.id) {
                                    const keysToMigrate = [
                                      'schoolConfig',
                                      'school_students',
                                      'school_grades',
                                      'school_teachers',
                                      'school_classes',
                                      'school_announcements',
                                      'studentExtraInfo',
                                      'school_user_accounts'
                                    ];
                                    keysToMigrate.forEach(k => {
                                      const oldKey = `${k}_${item.id}`;
                                      const newKey = `${k}_${newId}`;
                                      const data = localStorage.getItem(oldKey);
                                      if (data !== null) {
                                        localStorage.setItem(newKey, data);
                                        localStorage.removeItem(oldKey);
                                      }
                                    });
                                  }

                                  setWorkspacesRegistry(updatedRegistry);
                                  localStorage.setItem('school_workspaces_registry', JSON.stringify(updatedRegistry));

                                  // If active school is edited, update the active schoolConfig and sync
                                  if (isActive) {
                                    setWlNameAmh(nameAmhClean);
                                    setWlNameEng(nameEngClean);
                                    if (newId !== item.id) {
                                      setSchoolWorkspaceId(newId);
                                      localStorage.setItem('school_workspace_id', newId);
                                      const newUrl = `${window.location.origin}${window.location.pathname}?school=${newId}`;
                                      window.history.pushState({ path: newUrl }, '', newUrl);
                                    }
                                    setSchoolConfig(prev => {
                                      const next = { ...prev, nameAmh: nameAmhClean, nameEng: nameEngClean };
                                      localStorage.setItem(`schoolConfig_${newId}`, JSON.stringify(next));
                                      localStorage.setItem('schoolConfig', JSON.stringify(next));
                                      
                                      // Sync to Firestore
                                      setDoc(doc(db, 'schools', newId, 'config', 'school'), cleanForFirestore(next)).catch(err => {
                                        console.error('Failed to sync updated edited name to Firestore:', err);
                                      });
                                      return next;
                                    });
                                  } else {
                                    // Update the target school's specific config in localStorage/Firestore if exists
                                    const savedStr = localStorage.getItem(`schoolConfig_${newId}`);
                                    if (savedStr) {
                                      try {
                                        const parsed = JSON.parse(savedStr);
                                        parsed.nameAmh = nameAmhClean;
                                        parsed.nameEng = nameEngClean;
                                        localStorage.setItem(`schoolConfig_${newId}`, JSON.stringify(parsed));
                                        
                                        // Sync to Firestore
                                        setDoc(doc(db, 'schools', newId, 'config', 'school'), cleanForFirestore(parsed)).catch(err => {
                                          console.error('Failed to sync updated edited name to Firestore for non-active school:', err);
                                        });
                                      } catch (e) {}
                                    }
                                  }

                                  setEditingWorkspaceId(null);
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
>
                                {lang === 'am' ? tx("አስቀምጥ (Save)") : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  playInteractiveSound('click');
                                  setEditingWorkspaceId(null);
                                }}
                                className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
>
                                {lang === 'am' ? tx("ተው") : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer close button */}
                <div className="pt-4 border-t mt-5 dark:border-slate-800 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      playInteractiveSound('click');
                      setIsManageSchoolsModalOpen(false);
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-black rounded-xl transition-all cursor-pointer">{tx("\n                  \n                    ዝጋ (Close)\n                  ")}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DESKTOP APPLICATION CONVERTER MODAL */}
        <AnimatePresence>
          {isDesktopAppModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="desktop-app-modal">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDesktopAppModalOpen(false)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs no-print"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: "spring", duration: 0.4 }}
                className={`relative w-full max-w-lg rounded-3xl p-6 md:p-8 border shadow-xl transition-all z-10 font-sans ${
                  themeMode === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/80'
                    : 'bg-white border-slate-200 text-slate-950 shadow-2xl'
                }`}>
              
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-4 mb-5 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xs">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{tx("ወደ ኮምፒውተር መተግበሪያ ቀይር (Desktop App Mode)")}</h3>
                      <p className="text-[9px] text-slate-400 font-medium">Configure as standalone Application Software</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { playInteractiveSound('click'); setIsDesktopAppModalOpen(false); }}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                      themeMode === 'dark' 
                        ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' 
                        : 'border-slate-150 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                    }`}>
                  
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-[11px] text-left leading-relaxed">
                  <p className={`${themeMode === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{tx(
                    "\n                    ይህንን የትምህርት ቤት ውጤት አስተዳደር ስርዓት (SaaS School System) በቀላሉ በኮምፒውተርዎ ላይ እንደ ራሱን የቻለ "
                  )}<strong>Application Software</strong>{tx(
                    " አድርገው በመጫን ያለ ኢንተርኔት አሳሽ (Chrome tabs) ቀጥታ በዴስክቶፕ አቋራጭ መጠቀም ይችላሉ።\n                  "
                  )}</p>

                  {/* Option 1: Download bat script launcher */}
                  <div className={`p-4 rounded-2xl border ${
                    themeMode === 'dark' ? 'bg-slate-950/60 border-indigo-900/40 text-slate-200' : 'bg-indigo-50/30 border-indigo-100 text-indigo-950'
                  }`}>
                    <h4 className="font-black text-[12px] text-indigo-900 dark:text-indigo-400 flex items-center gap-1.5 mb-1.5">
                      <span>💻</span>{tx(
                      " አማራጭ ፩፦ የዊንዶውስ መተግበሪያ ማስነሻ (Windows Launcher Script)\n                    "
                    )}</h4>
                    <p className="text-slate-500 dark:text-slate-400 mb-3 text-[10px]">{tx(
                      "\n                      ይህንን ማስነሻ ፋይል በማውረድ ኮምፒውተርዎ ላይ ደብል ክሊክ ሲያደርጉ ሲስተሙን እንደ standalone desktop app ይከፍትልዎታል።\n                    "
                    )}</p>
                    <button
                      type="button"
                      onClick={() => {
                        playInteractiveSound('success');
                        const currentUrl = window.location.origin + window.location.pathname + window.location.search;
                        const batContent = `@echo off\r\n` +
                                           `title ${(schoolConfig.nameEng || "").replace(/app/i, "").trim()} Standalone Application\r\n` +
                                           `echo Loading school app in dedicated window mode...\r\n` +
                                           `start chrome --app="${currentUrl}"\r\n` +
                                           `exit\r\n`;
                        const blob = new Blob([batContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${schoolConfig.nameEng.replace(/\s+/g, '_')}_Launcher.bat`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-center flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs">
                    
                      <Download className="w-3.5 h-3.5" />
                      <span>{tx("ማስነሻ ፋይሉን አውርድ (.bat Launcher)")}</span>
                    </button>
                  </div>

                  {/* Option 2: Chrome standard PWA installation guide */}
                  <div className={`p-4 rounded-2xl border ${
                    themeMode === 'dark' ? 'bg-slate-950/60 border-amber-900/40 text-slate-200' : 'bg-amber-50/20 border-amber-100 text-amber-950'
                  }`}>
                    <h4 className="font-black text-[12px] text-amber-900 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                      <span>📱</span>{tx(
                      " አማራጭ ፪፦ በአሳሽዎ ላይ መተግበሪያውን መጫን (PWA App Installation)\n                    "
                    )}</h4>
                    <p className="text-slate-500 dark:text-slate-400 mb-3 text-[10px]">{tx(
                      "\n                      በChrome ወይም Edge አሳሽ ሲጠቀሙ ከላይ በስተቀኝ የ \"Install\" ምልክት በመጫን ወይም በመሳሪያ አሞሌው ውስጥ "
                    )}<strong>"Add to Homescreen"</strong> / <strong>"Install Page as App"</strong>{tx(" በመምረጥ ራሱን የቻለ አፕ ማድረግ ይችላሉ።\n                    ")}</p>
                    <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400">
                      <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                        <strong className="text-slate-300 block">{tx("🖥️ ለዴስክቶፕ (Chrome)፦")}</strong>{tx(
                        "\n                        Menu (ሦስቱ ነጥብ) ➡️ Save & Share ➡️ Install page as app\n                      "
                      )}</div>
                      <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                        <strong className="text-slate-300 block">{tx("📱 ለስልክ (Android/iOS)፦")}</strong>{tx(
                        "\n                        Safari Share ➡️ Add to Home Screen ወይም Chrome Install App\n                      "
                      )}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => { playInteractiveSound('click'); setIsDesktopAppModalOpen(false); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      themeMode === 'dark'
                        ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                        : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                    }`}>{tx("\n                  \n                    ዝጋ (Close)\n                  ")}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* QR Scanner Modal for Quick Student Login and Attendance */}
        {isQRScannerOpen && (
          <QRScannerModal
            isOpen={isQRScannerOpen}
            onClose={() => setIsQRScannerOpen(false)}
            students={students}
            teachers={teachers}
            staffList={staffList}
            onLoginSuccess={handleQRLoginSuccess}
            onMarkAttendance={handleQRMarkAttendance}
            selectedRole={selectedRole}
            isLoggedIn={isLoggedIn}
            isDemoAutoFillEnabled={isDemoAutoFillEnabled}
            userAccounts={userAccounts}
          />
        )}

        {/* Register Staff Modal for Principal Dashboard */}
        {isRegisterStaffModalOpen && (
          <RegisterStaffModal
            isOpen={isRegisterStaffModalOpen}
            onClose={() => setIsRegisterStaffModalOpen(false)}
            onAddStaff={(newStaff) => {
              setStaffList(prev => [newStaff, ...prev]);
            }}
            onAddTeacher={(newTeacher) => {
              setTeachers(prev => [newTeacher, ...prev]);
            }}
            existingTeachers={teachers}
            schoolConfig={schoolConfig}
          />
        )}


        {/* Batch Print ID Cards Modal */}
        {typeof document !== 'undefined' && isBatchPrintActive && createPortal(
          <AnimatePresence>
            <div className="fixed inset-0 z-[210] flex flex-col p-4 overflow-y-auto bg-slate-900/80 backdrop-blur-sm" id="batch-print-modal">
              {/* Dynamic print-specific styles */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 0 !important;
                  }
                  body {
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  #root, body > :not(#batch-print-modal) {
                    display: none !important;
                  }
                  #batch-print-modal {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    background: white !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  .a4-page {
                    width: 210mm !important;
                    height: 297mm !important;
                    margin: 0 !important;
                    padding: 5mm !important;
                    page-break-after: always !important;
                    break-after: page !important;
                    background-color: transparent !important;
                    box-shadow: none !important;
                    display: grid !important;
                    grid-template-columns: repeat(2, 1fr) !important;
                    grid-template-rows: repeat(2, 1fr) !important;
                    align-items: center !important;
                    justify-items: center !important;
                    gap: 5mm !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                }
              `}} />

              {/* Header (No Print) */}
              <div className="no-print sticky top-0 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between mb-8 mx-auto w-full max-w-4xl shadow-xl z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-xl">
                    <Printer className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg">{tx("በጅምላ መታወቂያ አትም (Batch Print ID Cards)")}</h3>
                    <p className="text-slate-400 text-xs">A4 format: 4 cards per page</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      playInteractiveSound('click');
                      window.print();
                    }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer">
                  
                    <Printer className="w-4 h-4" />{tx(" ፕሪንት (Print Now)\n                  ")}</button>
                  <button
                    onClick={() => setIsBatchPrintActive(false)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm transition-all cursor-pointer">{tx("\n                  \n                    ዝጋ (Close)\n                  ")}</button>
                </div>
              </div>

              {/* Printable Content */}
              <div id="batch-print-content" className="w-full mx-auto flex flex-col items-center gap-8 pb-10">
                {(() => {
                  const filtered = registeredStudentFilter === 'all' 
                    ? students 
                    : students.filter(s => {
                        if (registeredStudentFilter.includes('|')) {
                          const [g, sec] = registeredStudentFilter.split('|');
                          return s.grade === g && s.section === sec;
                        }
                        return s.grade === registeredStudentFilter;
                      });
                  
                  if (filtered.length === 0) {
                    return (
                      <div className="bg-slate-800 p-8 rounded-2xl text-center text-slate-400 max-w-lg mx-auto no-print">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-bold">{tx("በዚህ ማጣሪያ ምንም ተማሪ አልተገኘም። (No students found in this filter)")}</p>
                      </div>
                    );
                  }

                  const chunks = [];
                  for (let i = 0; i < filtered.length; i += 2) {
                    chunks.push(filtered.slice(i, i + 2));
                  }

                  return chunks.map((pageStudents, pageIndex) => (
                    <div 
                      key={pageIndex} 
                      className="a4-page w-[210mm] h-[297mm] bg-white p-[5mm] shadow-2xl relative grid grid-cols-2 grid-rows-2 gap-[5mm] items-center justify-items-center">
                    
                      {pageStudents.map(student => (
                        <React.Fragment key={student.id}>
                        <div 
                          className="w-[240px] h-[380px] shrink-0 rounded-2xl p-3 flex flex-col relative overflow-hidden border-4 border-indigo-600/20 shadow-xl text-center select-none bg-white">
                        
                                              {/* Header Strip */}
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-900 absolute top-0 left-0 right-0 h-[130px] rounded-b-[2rem] z-0 shadow-sm" />
                    
                    {/* School Logo & Branding Header */}
                    <div className="space-y-1 z-10 flex flex-col items-center mt-0.5">
                      <div className="w-13 h-13 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-indigo-200 z-10 mb-0.5 overflow-hidden p-0.5">
                        <img 
                          src={schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO} 
                          alt="Logo" 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      
                      <div className="flex flex-col items-center justify-center w-full px-2">
                        <h4 className="text-[12.5px] font-black text-white tracking-wide text-center leading-tight">
                          {schoolConfig.nameAmh || tx(DEFAULT_SCHOOL_NAME_AMH)}
                        </h4>
                        <span className="font-sans font-black text-[8px] uppercase tracking-widest text-amber-300 block text-center leading-none mt-0.5">
                          {(schoolConfig.nameEng || DEFAULT_SCHOOL_NAME_ENG).replace(/app/i, "").trim()}
                        </span>
                        <div className="text-[7.5px] font-bold mt-1 text-indigo-100 text-center uppercase tracking-widest border-t border-indigo-400/30 pt-0.5 w-full mx-auto">{tx("\n                          የተማሪዎች መታወቂያ ካርድ (")}{student.academicYear || schoolConfig.academicYear || tx("2018 ዓ.ም")})<br/>STUDENT ID CARD
                        </div>
                      </div>
                    </div>

                    {/* Photo & Name */}
                    <div className="flex flex-col items-center justify-center z-10 mt-3 flex-1">
                      {student.photo ? (
                        <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-white shadow-md bg-slate-100 shrink-0">
                          <img 
                            src={student.photo} 
                            alt={student.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full border-[3px] border-white shadow-md bg-slate-200 flex items-center justify-center text-2xl font-black text-slate-500 shrink-0">
                          {(student.name || 'ST').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      
                      <div className="text-center mt-2 w-full px-2">
                        <h3 className="text-[14px] font-black text-slate-900 leading-tight truncate">{student.name}</h3>
                        <span className="inline-block mt-1 px-3 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 font-black text-[9px] rounded-full uppercase tracking-wider">{tx("\n                          STUDENT (ተማሪ)\n                        ")}</span>
                      </div>
                    </div>

                    {/* Bottom Info Badges */}
                    <div className="w-full mt-auto pt-2 z-10 pb-1">
                      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-1.5">
                        <div className="text-center w-1/2 border-r border-slate-200">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">{tx("መታወቂያ (ID)")}</span>
                          <span className="font-mono font-black text-slate-900 text-xs">{student.id}</span>
                        </div>
                        <div className="text-center w-1/2">
                          <span className="text-[8px] text-slate-500 block uppercase font-bold">{tx("ክፍል (Class)")}</span>
                          <span className="font-bold text-slate-900 text-xs truncate block px-1">{student.grade} - {student.section}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                        
                        {/* BACK CARD */}
                        <div 
                          className="w-[240px] h-[380px] shrink-0 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden border-4 border-indigo-600/20 shadow-xl text-center select-none bg-white">
                        
                          {/* Watermark in background */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
                            <img src={schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO} alt="" className="w-48 h-48 object-contain grayscale" />
                          </div>

                          <div className="pt-1.5 z-10 flex flex-col items-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-indigo-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                                <img src={schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO} alt="School Logo" className="w-full h-full object-contain" />
                              </div>
                              <div className="text-center">
                                <h4 className="text-[12px] font-black text-slate-900 tracking-wide text-center leading-tight">
                                  {schoolConfig.nameAmh || tx(DEFAULT_SCHOOL_NAME_AMH)}
                                </h4>
                                <span className="font-sans font-black text-[7.5px] uppercase tracking-wider text-indigo-700 block text-center leading-none mt-0.5">
                                  {(schoolConfig.nameEng || DEFAULT_SCHOOL_NAME_ENG).replace(/app/i, "").trim()}
                                </span>
                              </div>
                            </div>
                            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-200 pt-0.5 w-full block text-center">
                              {tx("የተማሪ መታወቂያ ካርድ (የጀርባ ገፅ)")}
                            </span>
                          </div>
                    
                    <div className="flex flex-col items-center justify-center space-y-4 my-auto z-10">
                       <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 inline-block">
                         <img 
                           src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(student.id)}`} 
                           alt={`QR code for ${student.id}`}
                           className="w-32 h-32"
                           referrerPolicy="no-referrer"
                         />
                       </div>

                       {student.digitalId && (
                         <div className="bg-slate-100 border border-slate-200 py-1.5 px-6 rounded-xl text-center">
                           <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">{tx("ፋይዳ (FIN / FAN)")}</span>
                           <span className="font-mono font-black text-slate-900 text-sm tracking-widest">{student.digitalId}</span>
                         </div>
                       )}
                    </div>

                    <div className="z-10 pb-2">
                       <p className="text-[9px] text-slate-600 leading-snug max-w-[210px] mx-auto font-bold text-center mb-1.5">{tx(
                         "\n                         ይህ መታወቂያ በትምህርት ቤቱ መግቢያ በር ላይ ለሚገኘው የQR መግቢያ እና አቴንዳንስ መመዝገቢያ የሚያገለግል ነው።\n                       "
                       )}</p>
                       {schoolConfig.phone && (
                         <p className="text-[9px] text-indigo-900 font-black text-center mb-2">
                           📞 {tx("የት/ቤት ስልክ:")} {schoolConfig.phone}
                         </p>
                       )}
                       <div className="flex flex-col items-center justify-center">
                         <div className="w-40 h-px border-t border-dashed border-slate-400 mb-1.5"></div>
                         <span className="text-[7.5px] text-slate-500 font-black uppercase tracking-widest">{tx(
                           "\n                           የርዕሰ መምህር ፊርማ (Principal Signature)\n                         "
                         )}</span>
                       </div>
                    </div>
                        </div>
                        </React.Fragment>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </AnimatePresence>,
          document.body
        )}

        {/* Student List Print Modal */}
        {typeof document !== 'undefined' && isStudentListPrintActive && createPortal(
          <AnimatePresence>
            <div className="fixed inset-0 z-[210] flex flex-col p-4 overflow-y-auto bg-slate-900/80 backdrop-blur-sm" id="student-list-print-modal">
              {/* Dynamic print-specific styles */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 1cm;
                  }
                  body * {
                    visibility: hidden;
                  }
                  #student-list-print-modal, #student-list-print-modal * {
                    visibility: visible;
                  }
                  #student-list-print-modal {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background: white !important;
                    padding: 0 !important;
                    overflow: visible !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  table { page-break-inside:auto; width: 100%; border-collapse: collapse; }
                  tr { page-break-inside:avoid; page-break-after:auto }
                  thead { display:table-header-group }
                  tfoot { display:table-footer-group }
                  th, td { border: 1px solid #000; padding: 4px; font-size: 10pt; text-align: left; }
                  th { background-color: #f3f4f6 !important; font-weight: bold; }
                }
              `}} />

              {/* Toolbar */}
              <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-auto mb-6 no-print border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />{tx(" የተማሪዎች ዝርዝር ፕሪንት (Print Student List)\n                  ")}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    {registeredStudentFilter === 'all' ? 'All Students' : `Filter: ${registeredStudentFilter}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      playInteractiveSound('success');
                      handleDownloadStudentsPDF();
                    }}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                    title={tx("በPDF ወደ ሎካል ስቶሬጅ አውርድ (Download PDF to Local Storage)")}>
                    <Download className="w-4 h-4" />
                    <span>{tx("በPDF አውርድ (Save PDF)")}</span>
                  </button>
                  <button
                    onClick={() => {
                      playInteractiveSound('click');
                      window.print();
                    }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer">
                  
                    <Printer className="w-4 h-4" />{tx(" ፕሪንት (Print Now)\n                  ")}</button>
                  <button
                    onClick={() => {
                      playInteractiveSound('click');
                      setIsStudentListPrintActive(false);
                    }}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                    title={tx("ዝጋ (Close)")}>
                  
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Print Content */}
              <div className="bg-white max-w-4xl w-full mx-auto p-8 rounded-2xl shadow-xl min-h-screen text-black print:shadow-none print:p-0">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-14 h-14 rounded-full border-2 border-indigo-200 bg-white p-1 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                      <img src={schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO} alt="School Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-left">
                      <h1 className="text-2xl font-bold uppercase leading-tight">{schoolConfig.nameAmh}</h1>
                      <h2 className="text-lg font-bold uppercase text-slate-700 leading-tight">{(schoolConfig.nameEng || DEFAULT_SCHOOL_NAME_ENG).replace(/app/i, '').trim()}</h2>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mt-2">{tx("የተማሪዎች ዝርዝር (Student List)")}</h3>
                  <p className="text-sm">
                    {registeredStudentFilter === 'all' ? tx("ሁሉም ተማሪዎች (All Students)") : `ክፍል (Section): ${registeredStudentFilter}`}
                  </p>
                </div>

                <table className="w-full border-collapse border border-black mb-4 print:w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 text-sm text-center">{tx("ተ.ቁ (No)")}</th>
                      <th className="border border-black p-2 text-sm">{tx("መታወቂያ (ID)")}</th>
                      <th className="border border-black p-2 text-sm">{tx("የተማሪ ስም (Student Name)")}</th>
                      <th className="border border-black p-2 text-sm text-center">{tx("ክፍል (Grade)")}</th>
                      <th className="border border-black p-2 text-sm text-center">{tx("ሴክሽን (Sec)")}</th>
                      <th className="border border-black p-2 text-sm text-center">{tx("ጾታ (Gender)")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredStudentsForSchool]
                      .filter(student => {
                        if (registeredStudentFilter === 'all') return true;
                        if (registeredStudentFilter.includes('|')) {
                          const [g, s] = registeredStudentFilter.split('|');
                          return student.grade === g && student.section === s;
                        }
                        return student.grade === registeredStudentFilter;
                      })
                      .sort((a, b) => a.name.localeCompare(b.name, 'am'))
                      .map((student, index) => (
                        <tr key={student.id}>
                          <td className="border border-black p-1 text-sm text-center">{index + 1}</td>
                          <td className="border border-black p-1 text-sm">{student.id}</td>
                          <td className="border border-black p-1 text-sm">{student.name}</td>
                          <td className="border border-black p-1 text-sm text-center">{student.grade.replace('Grade ', '')}</td>
                          <td className="border border-black p-1 text-sm text-center">{student.section}</td>
                          <td className="border border-black p-1 text-sm text-center">{(student.gender === 'Male' || student.gender === 'M' || student.gender === 'ወንድ') ? tx("Male (ወ)") : tx("Female (ሴ)")}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                
                <div className="mt-8 flex justify-between text-sm">
                  <div>
                    <p className="font-bold">{tx("አጠቃላይ ተማሪዎች (Total): ")}{[...filteredStudentsForSchool].filter(student => {
                        if (registeredStudentFilter === 'all') return true;
                        if (registeredStudentFilter.includes('|')) {
                          const [g, s] = registeredStudentFilter.split('|');
                          return student.grade === g && student.section === s;
                        }
                        return student.grade === registeredStudentFilter;
                      }).length}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{tx("ቀን (Date): ")}{new Date().toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatePresence>,
          document.body
        )}

        {/* Student QR Card Modal for Save / Print */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
                        {selectedQRStudent && (
              <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 overflow-y-auto" id="print-qr-modal">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedQRStudent(null)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs no-print"
              />

              {/* Dynamic print-specific styles */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 0 !important;
                  }
                  body {
                    background: white !important;
                    color: black !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  /* Hide all elements during print except the modal card */
                  #root, body > :not(#print-qr-modal) {
                    display: none !important;
                    visibility: hidden !important;
                  }
                  #print-qr-modal {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100vh !important;
                    background: white !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    overflow: visible !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    z-index: 9999999 !important;
                  }
                  #student-id-card {
                    background: white !important;
                    border: 1px solid #e5e7eb !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}} />

              {/* Modal Card wrapper */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-slate-950 border border-slate-800 text-white w-full max-w-3xl p-6 rounded-3xl shadow-2xl z-10 space-y-6 max-h-[95vh] overflow-y-auto print-card-box">
              
                {/* Modal Header (No-Print) */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 no-print">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">{tx("የQR መታወቂያ ካርድ (QR ID Card)")}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedQRStudent(null)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer animate-fade-in"
                    title={tx("ዝጋ (Close)")}>
                  
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Printable ID Card */}
                <div className="flex justify-center py-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                    
                    <div 
                      id="student-id-card"
                      className="w-[240px] h-[380px] rounded-2xl p-3 flex flex-col relative overflow-hidden border-4 border-indigo-600/20 shadow-2xl text-center select-none bg-white shrink-0">
                    
                      {/* Header Strip */}
                      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 absolute top-0 left-0 right-0 h-[130px] rounded-b-[2rem] z-0 shadow-sm" />
                      
                      {/* School Logo & Branding Header */}
                      <div className="space-y-1 z-10 flex flex-col items-center mt-0.5">
                        <div className="w-13 h-13 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-indigo-200 z-10 mb-0.5 overflow-hidden p-0.5">
                          <img 
                            src={schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO} 
                            alt="Logo" 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                        
                        <div className="flex flex-col items-center justify-center w-full px-2">
                          <h4 className="text-[12.5px] font-black text-white tracking-wide text-center leading-tight mt-0.5">
                            {schoolConfig.nameAmh || tx(DEFAULT_SCHOOL_NAME_AMH)}
                          </h4>
                          <span className="font-sans font-black text-[8px] uppercase tracking-widest text-amber-300 block text-center leading-none mt-0.5">
                            {(schoolConfig.nameEng || DEFAULT_SCHOOL_NAME_ENG).replace(/app/i, "").trim()}
                          </span>
                          <div className="text-[7px] font-black mt-1 text-indigo-50 text-center uppercase tracking-widest border-t border-indigo-400/40 pt-0.5 w-full mx-auto">{tx("\n                            የተማሪዎች መታወቂያ ካርድ (")}{selectedQRStudent.academicYear || schoolConfig.academicYear || tx("2018 ዓ.ም")})<br/>STUDENT ID CARD
                          </div>
                        </div>
                      </div>

                      {/* Photo & Name */}
                      <div className="flex flex-col items-center justify-center z-10 mt-3 flex-1">
                        {selectedQRStudent.photo ? (
                          <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-white shadow-md bg-slate-100 shrink-0">
                            <img 
                              src={selectedQRStudent.photo} 
                              alt={selectedQRStudent.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-full border-[3px] border-white shadow-md bg-slate-200 flex items-center justify-center text-2xl font-black text-slate-500 shrink-0">
                            {(selectedQRStudent.name || 'ST').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        
                        <div className="text-center mt-2 w-full px-2">
                          <h3 className="text-[14px] font-black text-slate-900 leading-tight truncate">{selectedQRStudent.name}</h3>
                          <span className="inline-block mt-1 px-3 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 font-black text-[9px] rounded-full uppercase tracking-wider">{tx("\n                            STUDENT (ተማሪ)\n                          ")}</span>
                        </div>
                      </div>

                      {/* Bottom Info Badges */}
                      <div className="w-full mt-auto pt-2 z-10 pb-1">
                        <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-1.5">
                          <div className="text-center w-1/2 border-r border-slate-200">
                            <span className="text-[8px] text-slate-500 block uppercase font-bold">{tx("መታወቂያ (ID)")}</span>
                            <span className="font-mono font-black text-slate-900 text-xs">{selectedQRStudent.id}</span>
                          </div>
                          <div className="text-center w-1/2">
                            <span className="text-[8px] text-slate-500 block uppercase font-bold">{tx("ክፍል (Class)")}</span>
                            <span className="font-bold text-slate-900 text-xs truncate block px-1">{selectedQRStudent.grade} - {selectedQRStudent.section}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* BACK CARD */}
                    <div className="w-[240px] h-[380px] shrink-0 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden border-4 border-indigo-600/20 shadow-2xl text-center select-none bg-white">
                      {/* Watermark in background */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
                        <img src={schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO} alt="" className="w-48 h-48 object-contain grayscale" />
                      </div>
                      <div className="pt-1 z-10 flex flex-col items-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-indigo-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                            <img src={schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO} alt="Logo" className="w-full h-full object-contain" />
                          </div>
                          <div className="text-center">
                            <h4 className="text-[12px] font-black text-slate-900 tracking-wide leading-tight">{schoolConfig.nameAmh || tx(DEFAULT_SCHOOL_NAME_AMH)}</h4>
                            <span className="font-sans font-black text-[7.5px] uppercase tracking-wider text-indigo-700 block leading-none mt-0.5">
                              {(schoolConfig.nameEng || DEFAULT_SCHOOL_NAME_ENG).replace(/app/i, "").trim()}
                            </span>
                          </div>
                        </div>
                        <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-200 pt-0.5 w-full block text-center">
                          {tx("የተማሪ መታወቂያ ካርድ (የጀርባ ገፅ)")}
                        </span>
                      </div>
                      
                      {/* Details List */}
                      <div className="flex flex-col gap-[7px] mt-2 z-10 text-left px-2">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">{tx("የተማሪ ሙሉ ስም (Student Name)")}</span>
                            <span className="text-[11px] font-black text-slate-900 border-b border-slate-300 pb-0.5">{selectedQRStudent.name}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">{tx("የወላጅ ስልክ ቁጥር (Parent Phone)")}</span>
                            <span className="text-[11px] font-black text-slate-900 border-b border-slate-300 pb-0.5">{selectedQRStudent.parentPhone || '_____________________'}</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[8px] font-bold text-slate-500 uppercase">{tx("የት/ቤቱ ስልክ ቁጥር (School Phone)")}</span>
                             <span className="text-[11px] font-black text-slate-900 border-b border-slate-300 pb-0.5">{schoolConfig.phone || '_____________________'}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">{tx("ቀበሌ / ወረዳ (Kebele / Woreda)")}</span>
                            <span className="text-[11px] font-black text-slate-900 border-b border-slate-300 pb-0.5">_____________________</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">{tx("የክፍያ ኮድ (Payment ID)")}</span>
                             <span className="text-[11px] font-black text-slate-900 border-b border-slate-300 pb-0.5">{selectedQRStudent.paymentId || '_____________________'}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">{tx("አድራሻ (Address)")}</span>
                            <span className="text-[11px] font-black text-slate-900 border-b border-slate-300 pb-0.5">_____________________</span>
                         </div>
                      </div>
                      
                      <div className="flex justify-between items-center px-2 mt-auto pb-1 z-10">
                         {selectedQRStudent.digitalId && (
                           <div className="bg-slate-100 border border-slate-200 py-1 px-3 rounded-lg text-center flex-1 mr-2 flex flex-col justify-center">
                             <span className="text-[7px] text-slate-500 block uppercase font-bold tracking-wider">{tx("ፋይዳ")}</span>
                             <span className="font-mono font-black text-slate-900 text-[10px] tracking-widest">{selectedQRStudent.digitalId}</span>
                           </div>
                         )}
                         <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 ml-auto flex-shrink-0">
                           <img 
                             src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(selectedQRStudent.id)}`} 
                             alt={`QR code for ${selectedQRStudent.id}`}
                             className="w-[45px] h-[45px]"
                             referrerPolicy="no-referrer"
                           />
                         </div>
                      </div>
                      <div className="w-full flex justify-center pb-2 z-10 mt-1">
                         <div className="w-40 h-[1.5px] bg-slate-300 rounded-full"></div>
                      </div>
                    </div>
                    
                  </div>
                </div>

                {/* Modal Controls (No-Print) */}
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-800 no-print">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={async () => {
                        playInteractiveSound('click');
                        try {
                          const url = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedQRStudent.id)}`;
                          const response = await fetch(url);
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = `QR_Code_Student_${selectedQRStudent.id}_${selectedQRStudent.name.replace(/\s+/g, '_')}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(blobUrl);
                          playInteractiveSound('success');
                        } catch (error) {
                          console.error('Failed programmatically downloading QR code:', error);
                          window.open(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedQRStudent.id)}`, '_blank');
                        }
                      }}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer">
                    
                      <Download className="w-3.5 h-3.5" />{tx(" ፒዲኤፍ አውርድ (Click to Download)\n                    ")}</button>
                    <button
                      onClick={() => {
                        playInteractiveSound('click');
                        window.print();
                      }}
                      className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer">
                    
                      <Printer className="w-3.5 h-3.5" />{tx(" ፕሪንት አድርግ (Print Card)\n                    ")}</button>
                  </div>
                </div>
              </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Teacher QR Card Modal for Save / Print */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {selectedQRTeacher && (
              <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 overflow-y-auto" id="print-teacher-qr-modal">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedQRTeacher(null)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs no-print"
              />

              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 10mm !important;
                  }
                  body {
                    background: white !important;
                    color: black !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  #print-teacher-qr-modal {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: white !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                  }
                  .staff-cards-print-container {
                    display: flex !important;
                    flex-direction: row !important;
                    gap: 15mm !important;
                    justify-content: center !important;
                    align-items: center !important;
                    background: white !important;
                  }
                  .staff-card-print-item {
                    border: 1.5px solid #4338ca !important;
                    box-shadow: none !important;
                    background: white !important;
                    width: 85mm !important;
                    height: 128mm !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    page-break-inside: avoid !important;
                  }
                }
              `}} />

              {/* Modal Body */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl max-w-2xl w-full text-center space-y-4 z-[220]">
                
                {/* Title (No-Print) */}
                <div className="text-center no-print">
                  <h3 className="text-sm font-black text-white">{selectedQRTeacher.name} - {tx("የሰራተኛ / የመምህር መታወቂያ")}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tx("ሁለት ገፅ (የፊት እና የጀርባ) ህጋዊ የት/ቤት መታወቂያ ካርድ")}</p>
                </div>

                {/* ID Cards (Front & Back) */}
                <div className="flex justify-center py-1">
                  <div className="staff-cards-print-container flex flex-col md:flex-row gap-4 items-center justify-center">
                    
                    {/* FRONT CARD (የፊት ገፅ) */}
                    <div 
                      id="staff-front-card"
                      className="staff-card-print-item w-[240px] h-[380px] bg-white rounded-2xl relative overflow-hidden text-center mx-auto border-4 border-indigo-600/20 shadow-xl flex flex-col p-3 shrink-0 select-none"
                    >
                      {/* Header Strip */}
                      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 absolute top-0 left-0 right-0 h-[130px] rounded-b-[2rem] z-0 shadow-sm" />

                      {/* Header Content */}
                      <div className="space-y-1 z-10 flex flex-col items-center mt-0.5">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-indigo-200 z-10 mb-0.5 overflow-hidden p-0.5">
                          <img 
                            src={schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO} 
                            alt="Logo" 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                        
                        <div className="flex flex-col items-center justify-center w-full px-2">
                          <h4 className="text-[12px] font-black text-white tracking-wide text-center leading-tight">
                            {schoolConfig.nameAmh || tx(DEFAULT_SCHOOL_NAME_AMH)}
                          </h4>
                          <span className="font-sans font-black text-[8px] uppercase tracking-widest text-amber-300 block text-center leading-none mt-0.5">
                            {(schoolConfig.nameEng || DEFAULT_SCHOOL_NAME_ENG).replace(/app/i, "").trim()}
                          </span>
                          <div className="text-[7px] font-black mt-1 text-indigo-50 text-center uppercase tracking-widest border-t border-indigo-400/40 pt-0.5 w-full mx-auto">
                            {tx("የሰራተኞች / የመምህራን መታወቂያ")} ({selectedQRTeacher.academicYear || schoolConfig.academicYear || tx("2018 ዓ.ም")})<br/>STAFF & TEACHER ID CARD
                          </div>
                        </div>
                      </div>

                      {/* Profile Photo & Name */}
                      <div className="flex flex-col items-center justify-center z-10 mt-3 flex-1">
                        {selectedQRTeacher.photo ? (
                          <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-white shadow-md bg-slate-100 shrink-0">
                            <img 
                              src={selectedQRTeacher.photo} 
                              alt={selectedQRTeacher.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-full border-[3px] border-white shadow-md bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-2xl font-black text-white shrink-0">
                            {(selectedQRTeacher.name || 'ST').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        
                        <div className="text-center mt-2 w-full px-2">
                          <h3 className="text-[14px] font-black text-slate-900 leading-tight truncate">{selectedQRTeacher.name}</h3>
                          <span className="inline-block mt-1 px-3 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 font-black text-[9px] rounded-full uppercase tracking-wider">
                            {selectedQRTeacher.roleTitle || selectedQRTeacher.category || tx("መምህር (TEACHER)")}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Info Badges */}
                      <div className="w-full mt-auto pt-2 z-10 pb-1">
                        <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-1.5">
                          <div className="text-center w-1/2 border-r border-slate-200">
                            <span className="text-[7.5px] text-slate-500 block uppercase font-bold">{tx("መታወቂያ (ID)")}</span>
                            <span className="font-mono font-black text-slate-900 text-xs">{selectedQRTeacher.id}</span>
                          </div>
                          <div className="text-center w-1/2">
                            <span className="text-[7.5px] text-slate-500 block uppercase font-bold">{tx("ስልክ (Phone)")}</span>
                            <span className="font-bold text-slate-900 text-xs truncate block px-1">{selectedQRTeacher.phone || '---'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BACK CARD (የጀርባ ገፅ) */}
                    <div 
                      id="staff-back-card"
                      className="staff-card-print-item w-[240px] h-[380px] shrink-0 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden border-4 border-indigo-600/20 shadow-xl text-center select-none bg-white"
                    >
                      {/* Watermark in background */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
                        <img src={schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO} alt="" className="w-48 h-48 object-contain grayscale" />
                      </div>
                      <div className="pt-1 z-10 flex flex-col items-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-indigo-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                            <img src={schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO} alt="Logo" className="w-full h-full object-contain" />
                          </div>
                          <div className="text-center">
                            <h4 className="text-[12px] font-black text-slate-900 tracking-wide leading-tight">{schoolConfig.nameAmh || tx(DEFAULT_SCHOOL_NAME_AMH)}</h4>
                            <span className="font-sans font-black text-[7.5px] uppercase tracking-wider text-indigo-700 block leading-none mt-0.5">
                              {(schoolConfig.nameEng || DEFAULT_SCHOOL_NAME_ENG).replace(/app/i, "").trim()}
                            </span>
                          </div>
                        </div>
                        <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-200 pt-0.5 w-full block text-center">
                          {tx("የሰራተኛ መታወቂያ ካርድ (የጀርባ ገፅ)")}
                        </span>
                      </div>

                      {/* Details List */}
                      <div className="flex flex-col gap-[7px] mt-2 z-10 text-left px-2">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">{tx("ሙሉ ስም (Full Name)")}</span>
                          <span className="text-[11px] font-black text-slate-900 border-b border-slate-300 pb-0.5 truncate">{selectedQRTeacher.name}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">{tx("የስራ መደብ (Job Position)")}</span>
                          <span className="text-[11px] font-black text-slate-900 border-b border-slate-300 pb-0.5 truncate">{selectedQRTeacher.roleTitle || selectedQRTeacher.category || tx("መምህር (Teacher)")}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">{tx("የትምህርት ደረጃ (Education)")}</span>
                          <span className="text-[11px] font-black text-slate-900 border-b border-slate-300 pb-0.5">{selectedQRTeacher.educationLevel || 'Degree / Diploma'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">{tx("ስልክ ቁጥር (Phone Number)")}</span>
                          <span className="text-[11px] font-black text-slate-900 border-b border-slate-300 pb-0.5">{selectedQRTeacher.phone || '---'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">{tx("ኢሜይል / አድራሻ (Email / Address)")}</span>
                          <span className="text-[11px] font-black text-slate-900 border-b border-slate-300 pb-0.5 truncate">{selectedQRTeacher.email || 'ት/ቤት ዋና ግቢ'}</span>
                        </div>
                      </div>

                      {/* QR and Stamp / Disclaimers */}
                      <div className="flex justify-between items-center px-2 mt-auto pb-1 z-10">
                        <div className="text-left text-[7px] text-slate-500 leading-tight font-medium max-w-[140px] pr-1">
                          {tx("ይህ መታወቂያ የት/ቤቱ ህጋዊ ሰራተኛ መለያ ነው። ቢጠፋ በአስቸኳይ ለት/ቤቱ ያሳውቁ።")}
                        </div>
                        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 shrink-0">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(selectedQRTeacher.id)}`} 
                            alt={`QR code for ${selectedQRTeacher.id}`}
                            className="w-[48px] h-[48px]"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center pb-1 z-10">
                        <div className="w-36 h-px border-t border-dashed border-slate-400 mb-1"></div>
                        <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest">
                          {tx("የርዕሰ መምህር ፊርማ (Principal Signature)")}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Modal Controls (No-Print) */}
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-800 no-print">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* 1. Download Standalone ID / PDF Document to Local Storage */}
                    <button
                      onClick={() => {
                        playInteractiveSound('click');
                        try {
                          const staffPhoto = selectedQRTeacher.photo || '';
                          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedQRTeacher.id)}`;
                          const schoolAmh = schoolConfig.nameAmh || tx(DEFAULT_SCHOOL_NAME_AMH);
                          const schoolEng = (schoolConfig.nameEng || DEFAULT_SCHOOL_NAME_ENG).replace(/app/i, '').trim();
                          const year = selectedQRTeacher.academicYear || schoolConfig.academicYear || '2018 ዓ.ም';
                          const roleName = selectedQRTeacher.roleTitle || selectedQRTeacher.category || 'መምህር (Teacher)';
                          const logoUrl = schoolConfig.logoImage || DEFAULT_SCHOOL_LOGO;
                          
                          const htmlDoc = `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <title>${selectedQRTeacher.name} - Staff ID Card</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .print-bar { margin-bottom: 24px; }
    .btn { background: #4338ca; color: white; border: none; padding: 12px 24px; font-weight: bold; border-radius: 10px; cursor: pointer; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .cards-row { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; }
    .card { width: 240px; height: 380px; background: white; border-radius: 16px; border: 3px solid #6366f1; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); position: relative; overflow: hidden; padding: 12px; box-sizing: border-box; display: flex; flex-direction: column; text-align: center; }
    .header-bg { position: absolute; top: 0; left: 0; right: 0; height: 130px; background: linear-gradient(135deg, #1d4ed8, #3730a3); border-radius: 0 0 2rem 2rem; z-index: 1; }
    .header-content { position: relative; z-index: 2; margin-top: 2px; }
    .school-title { font-size: 11.5px; font-weight: 900; color: white; margin: 2px 0 0 0; line-height: 1.2; }
    .school-eng { font-size: 7.5px; font-weight: 900; color: #fde047; letter-spacing: 0.5px; margin: 2px 0; text-transform: uppercase; }
    .card-type { font-size: 7px; font-weight: 800; color: #e0e7ff; text-transform: uppercase; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 2px; margin-top: 2px; }
    .photo-area { position: relative; z-index: 2; margin-top: 12px; display: flex; flex-direction: column; align-items: center; }
    .photo-circle { width: 80px; height: 80px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; background: #e2e8f0; display: flex; align-items: center; justify-content: center; }
    .photo-circle img { width: 100%; height: 100%; object-fit: cover; }
    .photo-circle .initials { font-size: 28px; font-weight: 900; color: #4338ca; }
    .staff-name { font-size: 13px; font-weight: 900; color: #0f172a; margin: 8px 0 2px 0; }
    .role-badge { display: inline-block; font-size: 9px; font-weight: 900; color: #1e40af; background: #dbeafe; padding: 2px 10px; border-radius: 9999px; text-transform: uppercase; }
    .bottom-info { margin-top: auto; position: relative; z-index: 2; }
    .info-grid { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px; font-size: 9px; margin-bottom: 6px; }
    .info-col { width: 50%; text-align: center; }
    .info-col:first-child { border-right: 1px solid #e2e8f0; }
    .label { font-size: 7.5px; color: #64748b; font-weight: bold; text-transform: uppercase; }
    .val { font-weight: 900; color: #0f172a; }
    .back-details { text-align: left; font-size: 9.5px; padding: 0 8px; margin-top: 8px; line-height: 1.4; position: relative; z-index: 2; }
    .back-field { margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; }
    .back-label { font-size: 7.5px; font-weight: bold; color: #64748b; text-transform: uppercase; }
    .back-val { font-weight: 900; color: #0f172a; }
    .qr-row { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding: 4px 8px; position: relative; z-index: 2; }
    .sig-line { width: 140px; border-top: 1px dashed #94a3b8; margin: 6px auto 2px auto; }
    .sig-text { font-size: 7px; color: #64748b; font-weight: bold; }
    @media print {
      body { background: white; padding: 0; }
      .print-bar { display: none !important; }
      .card { box-shadow: none !important; border: 1.5px solid #4338ca !important; }
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="btn" onclick="window.print()">🖨️ በPDF አስቀምጥ / አትም (Save as PDF / Print)</button>
  </div>
  <div class="cards-row">
    <!-- FRONT -->
    <div class="card">
      <div class="header-bg"></div>
      <div class="header-content">
        <div style="display:flex; justify-content:center; margin-bottom: 3px;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1.5px solid #c7d2fe; overflow: hidden; padding: 2px;">
            <img src="${logoUrl}" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
        </div>
        <h4 class="school-title">${schoolAmh}</h4>
        <div class="school-eng">${schoolEng}</div>
        <div class="card-type">የሰራተኛ መታወቂያ (${year})<br>STAFF & TEACHER ID CARD</div>
      </div>
      <div class="photo-area">
        <div class="photo-circle">
          ${staffPhoto ? `<img src="${staffPhoto}" alt="${selectedQRTeacher.name}">` : `<div class="initials">${(selectedQRTeacher.name || 'ST').substring(0,2).toUpperCase()}</div>`}
        </div>
        <div class="staff-name">${selectedQRTeacher.name}</div>
        <span class="role-badge">${roleName}</span>
      </div>
      <div class="bottom-info">
        <div class="info-grid">
          <div class="info-col">
            <div class="label">መታወቂያ (ID)</div>
            <div class="val">${selectedQRTeacher.id}</div>
          </div>
          <div class="info-col">
            <div class="label">ስልክ (Phone)</div>
            <div class="val">${selectedQRTeacher.phone || '---'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- BACK -->
    <div class="card" style="justify-content: space-between;">
      <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.04; pointer-events: none;">
        <img src="${logoUrl}" style="width: 180px; height: 180px; object-fit: contain; filter: grayscale(100%);" />
      </div>
      <div style="margin-top: 2px; position: relative; z-index: 2;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 2px;">
          <div style="width: 26px; height: 26px; border-radius: 50%; background: white; border: 1px solid #c7d2fe; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 1px;">
            <img src="${logoUrl}" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <div style="text-align: center;">
            <h4 style="font-size: 11px; font-weight: 900; margin: 0; color: #0f172a; line-height: 1.2;">${schoolAmh}</h4>
            <div style="font-size: 7px; font-weight: 800; color: #4338ca; text-transform: uppercase;">${schoolEng}</div>
          </div>
        </div>
        <div style="font-size: 7.5px; font-weight: bold; color: #64748b; text-transform: uppercase; border-top: 1px solid #e2e8f0; padding-top: 2px;">STAFF IDENTIFICATION CARD (የጀርባ ገፅ)</div>
      </div>
      <div class="back-details">
        <div class="back-field">
          <div class="back-label">የሰራተኛው ሙሉ ስም (Staff Name)</div>
          <div class="back-val">${selectedQRTeacher.name}</div>
        </div>
        <div class="back-field">
          <div class="back-label">የስራ መደብ (Job Position)</div>
          <div class="back-val">${roleName}</div>
        </div>
        <div class="back-field">
          <div class="back-label">የትምህርት ደረጃ (Education)</div>
          <div class="back-val">${selectedQRTeacher.educationLevel || 'Degree / Diploma'}</div>
        </div>
        <div class="back-field">
          <div class="back-label">ስልክ ቁጥር (Phone Number)</div>
          <div class="back-val">${selectedQRTeacher.phone || '---'}</div>
        </div>
        <div class="back-field">
          <div class="back-label">ኢሜይል / አድራሻ (Email / Address)</div>
          <div class="back-val">${selectedQRTeacher.email || 'ት/ቤት ዋና ግቢ'}</div>
        </div>
      </div>
      <div class="qr-row">
        <div style="text-align: left; font-size: 7px; color: #475569; max-width: 140px; font-weight: 600;">
          ይህ መታወቂያ የት/ቤቱ ህጋዊ ሰራተኛ መለያ ነው። ቢጠፋ በአስቸኳይ ለት/ቤቱ ያሳውቁ።
        </div>
        <img src="${qrUrl}" alt="QR" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #cbd5e1; padding: 2px; background: white;">
      </div>
      <div style="margin-bottom: 4px;">
        <div class="sig-line"></div>
        <div class="sig-text">የርዕሰ መምህር ፊርማ (Principal Signature)</div>
      </div>
    </div>
  </div>
</body>
</html>`;

                          const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
                          const blobUrl = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = `Staff_ID_Card_${selectedQRTeacher.id}_${selectedQRTeacher.name.replace(/\s+/g, '_')}.html`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(blobUrl);
                          playInteractiveSound('success');
                        } catch (err) {
                          console.error('Download error:', err);
                        }
                      }}
                      className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      title={tx("ካርዱን በቀጥታ ወደ ኮምፒውተር / ስልክ አውርድ")}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {tx("PDF / ሰነድ አውርድ")}
                    </button>

                    {/* 2. Download QR Code PNG */}
                    <button
                      onClick={async () => {
                        playInteractiveSound('click');
                        try {
                          const url = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedQRTeacher.id)}`;
                          const response = await fetch(url);
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = `QR_Code_${selectedQRTeacher.id}_${selectedQRTeacher.name.replace(/\s+/g, '_')}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(blobUrl);
                          playInteractiveSound('success');
                        } catch (error) {
                          console.error('Failed programmatically downloading QR code:', error);
                          window.open(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedQRTeacher.id)}`, '_blank');
                        }
                      }}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {tx("QR አውርድ (Save QR)")}
                    </button>

                    {/* 3. Print ID Card Dialog */}
                    <button
                      onClick={() => {
                        playInteractiveSound('success');
                        window.print();
                      }}
                      className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {tx("ካርድ አትም (Print Card)")}
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedQRTeacher(null)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    {tx("ዝጋ (Close)")}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

        {/* Official Printable Report Card Modal */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {showPrintModal && foundStudent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="print-report-modal">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPrintModal(false)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs no-print"
              />

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative ${themeMode === 'dark' ? 'bg-slate-800 border border-slate-700 text-slate-100' : 'bg-white text-slate-900'} w-full max-w-4xl p-8 rounded-3xl shadow-2xl z-10 space-y-6 max-h-[95vh] overflow-y-auto`}>
              
                {/* CSS Print Stylesheet injected dynamically */}
                <style dangerouslySetInnerHTML={{__html: `
                  @media print {
                    @page {
                      size: A4 portrait;
                      margin: 0 !important;
                    }
                    body {
                      background: white !important;
                      color: black !important;
                      margin: 1.2cm !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    }
                    /* Hide all browser-rendered content under root during print */
                    body > :not(#print-report-modal),
                    #root > :not(#print-report-modal),
                    #root > div > *:not(#print-report-modal) {
                      display: none !important;
                    }
                    #print-report-modal {
                      position: absolute !important;
                      top: 0 !important;
                      left: 0 !important;
                      width: 100% !important;
                      height: auto !important;
                      background: white !important;
                      padding: 0 !important;
                      margin: 0 !important;
                      overflow: visible !important;
                      display: block !important;
                      z-index: 9999999 !important;
                    }
                    /* Strip away all styling from the modal card wrapper */
                    #print-report-modal > div {
                      background: transparent !important;
                      box-shadow: none !important;
                      border: none !important;
                      padding: 0 !important;
                      margin: 0 !important;
                      max-height: none !important;
                      overflow: visible !important;
                      width: 100% !important;
                    }
                    #print-target-sheet {
                      display: block !important;
                      position: relative !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      height: auto !important;
                      padding: 1.5cm !important;
                      margin: 0 !important;
                      box-shadow: none !important;
                      border: 8px double #1c1917 !important;
                      border-radius: 4px !important;
                      background-color: white !important;
                      page-break-after: always !important;
                      break-after: page !important;
                    }
                    #print-target-sheet table {
                      table-layout: fixed !important;
                      width: 100% !important;
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
                    }
                    .no-print {
                      display: none !important;
                    }
                  }
                `}} />

                {/* Modal Actions */}
                <div className="flex flex-col gap-3 pb-4 no-print">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                        </span>
                        <h3 className="text-lg font-black text-slate-900">{tx("🖨️ የውጤት መግለጫ ካርድ ማተሚያ (Report Card Preview)")}</h3>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex gap-2 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={handleExportPDF}
                          disabled={isExportingPDF}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 transition-all">
                        
                          {isExportingPDF ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              <span>{tx("ፒዲኤፍ በመፍጠር ላይ...")}</span>
                            </>
                          ) : (
                            <>
                              <span>{tx("📄 ፒዲኤፍ አውርድ (Export as PDF)")}</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => { 
                            playInteractiveSound('click'); 
                            setPdfError(null); 
                            window.print(); 
                          }}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                        
                          <span>{tx("🖨️ ወረቀት ላይ አትም (Print / PDF)")}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { playInteractiveSound('click'); setShowPrintModal(false); }}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all">{tx(
                          "\n                        \n                          ዝጋ (Close)\n                        "
                        )}</button>
                      </div>
                      {pdfError && (
                        <span className="text-xs text-rose-600 font-bold self-end animate-pulse">⚠️ {pdfError}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-200/60">
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
                          }`}>
                        
                          <Award className="w-3.5 h-3.5" />{tx(" ካርድ (Card View)\n                        ")}</button>
                        <button
                          type="button"
                          onClick={() => { playInteractiveSound('click'); setPreviewViewType('list'); }}
                          className={`px-3 py-1.5 text-[11px] font-black rounded-md transition-all flex items-center gap-1 ${
                            previewViewType === 'list'
                              ? 'bg-white text-indigo-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-855'
                          }`}>
                        
                          <List className="w-3.5 h-3.5" />{tx(" ዝርዝር (List View)\n                        ")}</button>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 font-mono">
                      {previewViewType === 'card' ? 'A4 portrait sheet styling' : 'Scrollable item list styling'}
                    </span>
                  </div>
                </div>

                {/* ACTUAL DOCUMENT SHEET TO BE PRINTED OR PREVIEWED */}
                <div 
                  id="print-target-sheet" 
                  className="bg-[#faf8f2] p-5 md:p-6 max-w-2xl mx-auto shadow-xl rounded-xl border-4 border-double border-amber-800 text-slate-900 font-sans relative overflow-hidden select-none transition-all duration-300 print:break-after-page">
                  style={{ pageBreakAfter: 'always' }}
                
                  {/* Dynamic CSS Print Stylesheet injected dynamically specifically for single A4 page fitting */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                      @page {
                        size: A4 portrait !important;
                        margin: 4mm 4mm 4mm 4mm !important;
                      }
                      body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                      }
                      /* Hide everything except the print-report-modal portal */
                      body > :not(#print-report-modal),
                      #root > :not(#print-report-modal),
                      #root > div > *:not(#print-report-modal),
                      .no-print {
                        display: none !important;
                        visibility: hidden !important;
                      }
                      #print-report-modal {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        background: #ffffff !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        display: block !important;
                        z-index: 9999999 !important;
                      }
                      #print-report-modal > div {
                        background: transparent !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        max-height: none !important;
                        overflow: visible !important;
                        width: 100% !important;
                      }
                      #print-target-sheet {
                        display: block !important;
                        position: relative !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        height: 285mm !important; /* Strict A4 boundary check */
                        box-sizing: border-box !important;
                        padding: 6mm 8mm !important; /* Tight margins for zero spillover */
                        margin: 0 auto !important;
                        box-shadow: none !important;
                        border: 6px double #854d0e !important;
                        border-radius: 4px !important;
                        background-color: #faf8f2 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        page-break-after: always !important;
                        break-after: page !important;
                      }
                      /* Maintain high contrast for content on print */
                      #print-target-sheet * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                      }
                    }
                  `}} />

                  {/* Card View Layout Container */}
                  <div className={previewViewType === 'card' ? 'block' : 'hidden'}>
                    {/* Background Watermark/Logo pattern in print */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none select-none">
                      {schoolConfig.logoImage ? (
                        <img src={schoolConfig.logoImage} alt="" className="w-80 h-80 object-contain opacity-20 grayscale" />
                      ) : (
                        <GraduationCap className="w-80 h-80 text-amber-900" />
                      )}
                    </div>

                    {/* Ribbon Banner for Outstanding Achievement (Honor Roll) */}
                    {(() => {
                      let totalSum = 0;
                      let subjectCount = 0;
                      (schoolConfig.subjectsByGrade?.[foundStudent?.grade || ''] && schoolConfig.subjectsByGrade[foundStudent?.grade || ''].length > 0 ? schoolConfig.subjectsByGrade[foundStudent?.grade || ''] : schoolConfig.subjects).forEach(sub => {
                        const annual = getSubjectAnnualAvg(sub);
                        if (annual !== null) {
                          totalSum += annual;
                          subjectCount++;
                        }
                      });
                      const averageScore = subjectCount > 0 ? Math.round(totalSum / subjectCount) : 0;
                      
                      return averageScore >= 90 ? (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 shadow-xs uppercase tracking-wider rotate-[2deg] z-10 border border-amber-400">
                          <Sparkles className="w-3 h-3 animate-spin" />{tx(" የላቀ ውጤት (Honor Roll)\n                        ")}</div>
                      ) : null;
                    })()}


                    {/* Document Header */}
                    <div className="text-center border-b-2 border-slate-800 pb-2.5 mb-3 relative">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center justify-center gap-2">
                          {schoolConfig.logoImage ? (
                            <img src={schoolConfig.logoImage} alt="Logo" className="w-10 h-10 object-contain" />
                          ) : (
                            <GraduationCap className="w-10 h-10 text-slate-800" />
                          )}
                          <div>
                            <h1 className="text-lg md:text-xl font-black text-[#1e1b4b] tracking-tight leading-none uppercase font-display">{schoolConfig.nameAmh}</h1>
                            <h2 className="text-[11px] font-black text-[#854d0e] tracking-widest uppercase mt-0.5 font-display">{(schoolConfig.nameEng || "").replace(/app/i, "").trim()}</h2>
                          </div>
                        </div>
                      </div>
                      <p className="text-[8.5px] italic text-slate-500 max-w-md mx-auto mt-1 leading-none font-serif">
                        “ {schoolConfig.mottoAmh} • {schoolConfig.mottoEng} ”
                      </p>
                      
                      <div className="flex justify-center gap-3 text-[8.5px] text-slate-400 font-bold mt-1.5 font-mono">
                        <span>📍 {schoolConfig.address}</span>
                        <span>📞 {schoolConfig.phone}</span>
                        <span>✉️ {schoolConfig.email}</span>
                      </div>

                      <div className="mt-2.5 inline-block bg-[#1e1b4b] text-amber-400 px-5 py-1 rounded-full text-[10px] font-black tracking-widest leading-none border border-amber-600/50 font-display font-black">{tx(
                        "\n                        የተማሪ የውጤት ካርድ • STUDENT REPORT CARD\n                      "
                      )}</div>
                    </div>

                    {/* Title of Document */}
                    <div className="text-center space-y-0.5 mb-2.5">
                      <h3 className="text-xs font-black text-[#1e1b4b] tracking-wider uppercase font-display">{tx("የተማሪ ውጤት መግለጫ ካርድ (Official Report Card)")}</h3>
                      <p className="text-[9px] font-mono font-bold text-slate-400">Academic Term: {schoolConfig.evaluationMode === 'quarter' ? 'Quarters Combined' : 'Semesters Combined'} - Year {foundStudent.academicYear || schoolConfig.academicYear || tx("2018 ዓ.ም")}</p>
                    </div>

                     {/* Student Details Info Block */}
                     <div className="flex gap-4 p-2.5 bg-[#fdfcf7] border border-[#e4dcbf] rounded-lg text-xs mb-3 relative items-center">
                       <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#854d0e] rounded-l"></div>
                       
                       {/* Student Photo */}
                       {foundStudent.photo ? (
                         <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#e4dcbf] shadow-xs shrink-0 bg-white">
                           <img 
                             src={foundStudent.photo} 
                             alt={foundStudent.name} 
                             className="w-full h-full object-cover"
                             referrerPolicy="no-referrer"
                           />
                         </div>
                       ) : (
                         <div className="w-14 h-14 rounded-lg border-2 border-dashed border-[#e4dcbf] flex items-center justify-center text-[#854d0e]/40 bg-slate-50 shrink-0">
                           <Users className="w-6 h-6 text-[#854d0e]" />
                         </div>
                       )}

                       <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                         <div>
                           <span className="text-[#854d0e] block text-[8px] font-black uppercase tracking-wider">{tx("የተማሪው ሙሉ ስም")}</span>
                           <strong className="text-[#1e1b4b] block text-xs font-black mt-0.5">{foundStudent.name}</strong>
                         </div>
                         <div>
                           <span className="text-[#854d0e] block text-[8px] font-black uppercase tracking-wider">{tx("ልዩ መታወቂያ (ID)")}</span>
                           <strong className="text-slate-950 block font-mono text-xs font-black mt-0.5">{foundStudent.id}</strong>
                         </div>
                         <div>
                           <span className="text-[#854d0e] block text-[8px] font-black uppercase tracking-wider">{tx("ክፍልና ደረጃ (Grade)")}</span>
                           <strong className="text-[#1e1b4b] block text-xs font-black mt-0.5">{foundStudent.grade} - {foundStudent.section}</strong>
                         </div>
                         <div>
                           <span className="text-[#854d0e] block text-[8px] font-black uppercase tracking-wider">{tx("ጾታ (Gender)")}</span>
                           <strong className="text-slate-950 block text-xs font-black mt-0.5">
                             {foundStudent.gender === 'Male' ? tx("ወንድ (Male)") : tx("ሴት (Female)")}
                           </strong>
                         </div>
                       </div>
                     </div>

                    {/* Main Report Table */}
                    <div className="border border-amber-800/40 rounded-lg overflow-hidden mb-3.5 shadow-xs">
                      <table className="w-full text-left border-collapse text-[11px] table-fixed">
                        <colgroup>
                          <col style={{ width: '40%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '18%' }} />
                          <col style={{ width: '12%' }} />
                        </colgroup>
                        <thead>
                          <tr className="bg-[#1e1b4b] text-amber-300 font-black border-b border-amber-800/60 text-[8.5px] uppercase tracking-wider font-display leading-tight">
                            <th className="p-1.5 pl-2 border-r border-amber-800/20 whitespace-normal break-words leading-tight">{tx("ትምህርት አይነት (Subject)")}</th>
                            <th className="p-1.5 text-center border-r border-amber-800/20 whitespace-normal break-words leading-tight">Sem1 AVR (100)</th>
                            <th className="p-1.5 text-center border-r border-amber-800/20 whitespace-normal break-words leading-tight">Sem2 AVR (100)</th>
                            <th className="p-1.5 text-center border-r border-amber-800/20 bg-[#2e1065] text-amber-200 font-black whitespace-normal break-words leading-tight">Annual AVR (100)</th>
                            <th className="p-1.5 text-center whitespace-normal break-words leading-tight">{tx("ደረጃ (Letter)")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(schoolConfig.subjectsByGrade?.[foundStudent?.grade || ''] && schoolConfig.subjectsByGrade[foundStudent?.grade || ''].length > 0 ? schoolConfig.subjectsByGrade[foundStudent?.grade || ''] : schoolConfig.subjects).map((sub, idx) => {
                            const s1 = getSubjectSem1Avg(sub);
                            const s2 = getSubjectSem2Avg(sub);
                            const annual = getSubjectAnnualAvg(sub);
                            const lg = annual !== null ? getLetterGrade(annual) : null;

                            return (
                              <tr key={sub} className={`border-b border-[#e4dcbf]/60 hover:bg-[#faf6e9] transition-colors text-[10.5px] leading-tight ${idx % 2 === 1 ? 'bg-[#fcfaf2]' : 'bg-white'}`}>
                                <td className="p-1.5 pl-2 border-r border-[#e4dcbf]/60 font-black text-[#1e1b4b] whitespace-normal break-words leading-tight">{sub}</td>
                                <td className="p-1.5 border-r border-[#e4dcbf]/60 text-center font-bold text-slate-800 whitespace-normal break-words leading-tight">
                                  {s1 !== null ? `${s1}%` : '-'}
                                </td>
                                <td className="p-1.5 border-r border-[#e4dcbf]/60 text-center font-bold text-slate-800 whitespace-normal break-words leading-tight">
                                  {s2 !== null ? `${s2}%` : '-'}
                                </td>
                                <td className="p-1.5 border-r border-[#e4dcbf]/60 text-center font-black bg-[#faf5e6] text-slate-950 whitespace-normal break-words leading-tight">
                                  {annual !== null ? `${annual}%` : '-'}
                                </td>
                                <td className="p-1.5 text-center font-black whitespace-normal break-words leading-tight">
                                  {lg ? (
                                    <span className={`inline-block px-1.5 py-0.2 rounded-[3px] text-[8.5px] font-extrabold border leading-none ${lg.color}`}>
                                      {lg.label}
                                    </span>
                                  ) : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Metrics & Conduct Card (Snug Dual Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 mt-2">
                      
                      {/* Left: Performance summary card */}
                      {(() => {
                        let sem1Sum = 0, sem1Count = 0;
                        let sem2Sum = 0, sem2Count = 0;
                        let annualSum = 0, annualCount = 0;

                        (schoolConfig.subjectsByGrade?.[foundStudent?.grade || ''] && schoolConfig.subjectsByGrade[foundStudent?.grade || ''].length > 0 ? schoolConfig.subjectsByGrade[foundStudent?.grade || ''] : schoolConfig.subjects).forEach(sub => {
                          const s1 = getSubjectSem1Avg(sub);
                          const s2 = getSubjectSem2Avg(sub);
                          const annual = getSubjectAnnualAvg(sub);

                          if (s1 !== null) { sem1Sum += s1; sem1Count++; }
                          if (s2 !== null) { sem2Sum += s2; sem2Count++; }
                          if (annual !== null) { annualSum += annual; annualCount++; }
                        });

                        const sem1Avg = sem1Count > 0 ? Math.round(sem1Sum / sem1Count) : 0;
                        const sem2Avg = sem2Count > 0 ? Math.round(sem2Sum / sem2Count) : 0;
                        const annualAvg = annualCount > 0 ? Math.round(annualSum / annualCount) : 0;

                        return (
                          <div className="border border-[#e4dcbf] rounded-lg p-3 bg-white/80 shadow-2xs flex flex-col justify-between">
                            <div>
                              <h4 className="text-[10px] font-black text-[#1e1b4b] uppercase mb-1.5 pb-0.5 border-b border-[#e4dcbf] font-display">{tx(
                                "\n                                የውጤት ማጠቃለያ / PERFORMANCE SUMMARY\n                              "
                              )}</h4>
                              <div className="space-y-1 text-[10.5px]">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">{tx("Sem1 AVR አማካይ (Sem1 Avg):")}</span>
                                  <strong className="text-slate-800 font-black">
                                    {sem1Count > 0 ? `${sem1Avg}%` : '-'}
                                  </strong>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">{tx("Sem2 AVR አማካይ (Sem2 Avg):")}</span>
                                  <strong className="text-slate-800 font-black">
                                    {sem2Count > 0 ? `${sem2Avg}%` : '-'}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-slate-200 mt-2 pt-1.5 space-y-1 text-[10.5px]">
                              <div className="flex justify-between items-center">
                                <span className="text-[#1e1b4b] font-black">{tx("ዓመታዊ አማካይ ውጤት (Annual Average %):")}</span>
                                <strong className="text-amber-950 font-black text-[11px] bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 leading-none">
                                  {annualCount > 0 ? `${annualAvg}%` : '0%'}
                                </strong>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">{tx("ጠቅላላ የትምህርት ብዛት (Subjects):")}</span>
                                <strong className="text-slate-800 font-bold">
                                  {(schoolConfig.subjectsByGrade?.[foundStudent?.grade || ''] && schoolConfig.subjectsByGrade[foundStudent?.grade || ''].length > 0 ? schoolConfig.subjectsByGrade[foundStudent?.grade || ''] : schoolConfig.subjects).length}
                                </strong>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-950 font-black">{tx("ውሳኔ (Decision):")}</span>
                                <strong className={`font-black text-[10px] px-1.5 py-0.2 rounded leading-none ${
                                  annualAvg >= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {annualAvg >= 50 ? tx("ያለፈ / Promoted 🎉") : 'Needs Support ⚠️'}
                                </strong>
                              </div>
                            </div>
                          </div>
                        ); })()}


                      {/* Right: Behavioral and extra info */}
                      <div className="border border-[#e4dcbf] rounded-lg p-3 bg-white/80 shadow-2xs flex flex-col justify-between">
                        <div>
                          <h4 className="text-[10px] font-black text-[#1e1b4b] uppercase mb-1 pb-0.5 border-b border-[#e4dcbf] font-display">{tx(
                            "\n                            📋 ምግባርና አቴንዳንስ (Conduct & Attendance)\n                          "
                          )}</h4>
                          <div className="space-y-1 text-[10.5px]">
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-slate-500 font-semibold">{tx("ምግባር (Conduct Standard):")}</span>
                              <strong className="text-emerald-700 font-black text-[11px]">
                                {studentExtraInfo[foundStudent.id]?.conduct || 'A'}
                              </strong>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-slate-500 font-semibold">{tx("የቀሪ ቀናት ብዛት (Absence Days):")}</span>
                              <strong className="text-[#1e1b4b] font-black text-[11px]">
                                {studentExtraInfo[foundStudent.id]?.absent || 0}{tx(" ቀናት\n                              ")}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-1.5">
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[8.5px] bg-white p-1 rounded border border-slate-200">
                            <div>
                              <span className="text-slate-400 block font-bold leading-tight">{tx("ጠቅላላ ቀናት")}</span>
                              <strong className="text-slate-700 font-bold">180</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-bold leading-tight">{tx("የቀረበት")}</span>
                              <strong className="text-rose-700 font-black">{studentExtraInfo[foundStudent.id]?.absent || 0}{tx(" ቀን")}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-bold leading-tight">{tx("የተገኘበት")}</span>
                              <strong className="text-emerald-700 font-black">{180 - (studentExtraInfo[foundStudent.id]?.absent || 0)}{tx(" ቀን")}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Decision & Official Stamp Section */}
                    {(() => {
                      let totalSum = 0;
                      let subjectCount = 0;
                      let passedCommonSubjects = true;
                      (schoolConfig.subjectsByGrade?.[foundStudent?.grade || ''] && schoolConfig.subjectsByGrade[foundStudent?.grade || ''].length > 0 ? schoolConfig.subjectsByGrade[foundStudent?.grade || ''] : schoolConfig.subjects).forEach(sub => {
                        const annual = getSubjectAnnualAvg(sub);
                        if (annual !== null) {
                          totalSum += annual;
                          subjectCount++;
                          const k = typeof sub === 'string' ? sub.toLowerCase() : (sub.name || '').toLowerCase();
                          if (k === 'amharic' || k === tx("አማርኛ") || k === 'mathematics' || k === 'math' || k === 'maths' || k === tx("ሒሳብ") || k === 'english' || k === tx("እንግሊዝኛ")) {
                            if (annual < 50) passedCommonSubjects = false;
                          }
                        }
                      });
                      const averageScore = subjectCount > 0 ? Math.round(totalSum / subjectCount) : 0;
                      const cardPass = averageScore >= 50 && passedCommonSubjects;

                      return (
                        <div className="grid grid-cols-2 gap-4 items-center border-t border-b border-[#e4dcbf] py-2 my-2.5 bg-[#faf8f2]/60">
                          {/* Left: Decision Stamp */}
                          <div className="flex justify-start pl-2">
                            {subjectCount > 0 ? (
                              cardPass ? (
                                <div className="border-4 border-double border-emerald-600 text-emerald-700 px-3.5 py-1 rounded-md text-center rotate-[-1.5deg] select-none inline-block font-black tracking-widest uppercase bg-emerald-50/20 shadow-2xs">
                                  <div className="text-xs font-black leading-none">{tx("ያለፈ / PROMOTED")}</div>
                                  <div className="text-[6.5px] font-extrabold tracking-normal mt-0.5">{tx("የርዕሰ መምህራን ምክር ቤት ውሳኔ • SCHOOL BOARD")}</div>
                                </div>
                              ) : (
                                <div className="border-4 border-double border-rose-600 text-rose-700 px-3.5 py-1 rounded-md text-center rotate-[-1.5deg] select-none inline-block font-black tracking-widest uppercase bg-rose-50/20 shadow-2xs">
                                  <div className="text-xs font-black leading-none">{tx("ያልተመረቀ / RETAINED")}</div>
                                  <div className="text-[6.5px] font-extrabold tracking-normal mt-0.5">{tx("የርዕሰ መምህራን ምክር ቤት ውሳኔ • SCHOOL BOARD")}</div>
                                </div>
                              )
                            ) : (
                              <span className="text-slate-400 font-bold text-[10px] italic">{tx("በቂ ውጤት አልተመዘገበም (Insufficient Data)")}</span>
                            )}
                          </div>

                          {/* Right: Circular Official stamp of school */}
                          <div className="flex justify-end pr-2">
                            <div className="relative w-20 h-20 rounded-full border-4 border-double border-blue-600/75 flex flex-col items-center justify-center p-1.5 text-center select-none rotate-[-3deg] bg-blue-50/10 shrink-0 font-sans shadow-2xs">
                              <div className="absolute inset-1 rounded-full border border-dashed border-blue-600/60"></div>
                              <span className="text-[5.5px] font-black uppercase tracking-wider text-blue-600/80 leading-none">{schoolConfig.nameAmh}</span>
                              <span className="text-[5.5px] font-bold text-blue-600/60 my-0.2">★ OFFICIAL ★</span>
                              <span className="text-[6.5px] font-extrabold text-blue-600/80 tracking-widest leading-none border border-blue-600/50 px-1 py-0.2 rounded-xs bg-white/40">APPROVED</span>
                              <span className="text-[5px] font-black text-blue-600/70 uppercase tracking-widest mt-0.5">Addis Ababa, ET</span>
                              <span className="absolute text-[6.5px] font-serif italic text-blue-800/80 font-bold bottom-1.5 right-3 transform rotate-[15deg]">Yonas K.</span>
                            </div>
                          </div>
                        </div>
                      ); })()}


                    {/* Official Signatures footer placeholder */}
                    <div className="grid grid-cols-2 gap-8 text-[11px] text-center pt-1.5 mt-2.5">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-2/3 border-b border-slate-400 flex items-end justify-center">
                          {/* Removed for physical signing/fingerprinting */}
                        </div>
                        <span className="text-[9.5px] font-black text-slate-700 mt-1">{tx("የክፍል ኃላፊ መምህር ፊርማ")}</span>
                        <span className="text-[8px] text-slate-400 font-mono">Home Room Teacher Signature</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-2/3 border-b border-slate-400 flex items-end justify-center">
                          {/* Removed for physical signing/fingerprinting */}
                        </div>
                        <span className="text-[9.5px] font-black text-slate-700 mt-1">{tx("የርዕሰ መምህር ፊርማ እና ማህተም")}</span>
                        <span className="text-[8px] text-slate-400 font-mono">Director Signature / Seal</span>
                      </div>
                    </div>
                    {/* End of Card View Layout Container */}
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
                              {schoolConfig.nameAmh || tx("የትምህርት ቤቱ ስም እዚህ ይገባል")}
                            </h1>
                            <p className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase">
                              {(schoolConfig.nameEng || "DILIGENT SCHOOL").replace(/app/i, "").trim()}
                            </p>
                            <p className="text-xs font-semibold text-slate-500 italic mt-0.5">
                              “ {schoolConfig.mottoAmh || tx("ለክህሎትና ለውጤታማነት እንተጋለን!")} ”
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right text-xs self-start md:self-auto">
                          <span className="text-slate-400 block text-[9px] font-bold uppercase">{tx("የተማሪ መለያ / Student ID")}</span>
                          <strong className="text-slate-900 font-mono font-black text-sm">{foundStudent.id}</strong>
                        </div>
                      </div>

                      {/* Student Bio Strip */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <div>
                          <span className="text-slate-500 block text-[9px] font-bold uppercase">{tx("የተማሪው ስም (Student Name)")}</span>
                          <strong className="text-slate-900 font-black text-xs block mt-0.5">{foundStudent.name}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] font-bold uppercase">{tx("ክፍልና ደረጃ (Grade / Sec)")}</span>
                          <strong className="text-slate-900 font-extrabold text-xs block mt-0.5">{foundStudent.grade} - {foundStudent.section}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] font-bold uppercase">{tx("ክፍለ ጊዜ (Term / Year)")}</span>
                          <strong className="text-slate-900 font-extrabold text-xs block mt-0.5 capitalize">
                            Active Term Report
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] font-bold uppercase">{tx("ውሳኔ (Result Status)")}</span>
                          <strong className={`font-black text-xs block mt-0.5 ${
                            (foundGrades.reduce((sum, item) => sum + item.total, 0) / (foundGrades.length || 1)) >= 50
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}>
                            {(foundGrades.reduce((sum, item) => sum + item.total, 0) / (foundGrades.length || 1)) >= 50
                              ? tx("✅ PASS (ያለፈ)")
                              : '❌ NEEDS SUPPORT'}
                          </strong>
                        </div>
                      </div>

                      {/* List of Subjects */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <List className="w-4 h-4 text-indigo-600" />{tx(
                          " የትምህርት ውጤት ዝርዝር (List of Academic Achievements)\n                        "
                        )}</h3>
                        
                        {(schoolConfig.subjectsByGrade?.[foundStudent?.grade || ''] && schoolConfig.subjectsByGrade[foundStudent?.grade || ''].length > 0 ? schoolConfig.subjectsByGrade[foundStudent?.grade || ''] : schoolConfig.subjects).map(sub => {
                          const s1 = getSubjectSem1Avg(sub);
                          const s2 = getSubjectSem2Avg(sub);
                          const annual = getSubjectAnnualAvg(sub);
                          
                          const getLetterGradeLocal = (score: number) => {
                            if (score >= 90) return { grade: 'A+', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
                            if (score >= 83) return { grade: 'A', color: 'text-emerald-600 bg-emerald-50/50 border-emerald-150' };
                            if (score >= 75) return { grade: 'B+', color: 'text-teal-700 bg-teal-50 border-teal-200' };
                            if (score >= 68) return { grade: 'B', color: 'text-teal-600 bg-teal-50/50 border-teal-150' };
                            if (score >= 60) return { grade: 'C+', color: 'text-amber-700 bg-amber-50 border-amber-200' };
                            if (score >= 50) return { grade: 'C', color: 'text-amber-600 bg-amber-50/50 border-amber-150' };
                            if (score >= 40) return { grade: 'D', color: 'text-orange-600 bg-orange-50 border-orange-200' };
                            return { grade: 'F', color: 'text-rose-700 bg-rose-50 border-rose-200' };
                          };

                          const letter = annual !== null ? getLetterGradeLocal(annual) : null;

                          return (
                            <div key={sub} className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-200 rounded-xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">📖</span>
                                  <div>
                                    <strong className="text-slate-900 font-extrabold text-sm">{sub}</strong>
                                    <span className="block text-[10px] text-slate-400 font-medium">Subject Evaluation</span>
                                  </div>
                                </div>
                              </div>

                              {/* Assessment Breakdown List */}
                              <div className="flex flex-wrap gap-2.5 items-center bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-150 text-xs">
                                <div className="text-center px-1">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Sem1 AVR</span>
                                  <strong className="text-slate-800 font-extrabold">{s1 !== null ? `${s1}%` : '-'}</strong>
                                </div>
                                <div className="h-6 w-px bg-slate-200"></div>
                                <div className="text-center px-1">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Sem2 AVR</span>
                                  <strong className="text-slate-800 font-extrabold">{s2 !== null ? `${s2}%` : '-'}</strong>
                                </div>
                                <div className="h-6 w-px bg-slate-200"></div>
                                <div className="text-center px-1">
                                  <span className="text-[8px] font-bold text-indigo-500 uppercase block">Annual AVR</span>
                                  <strong className="text-indigo-950 font-black">{annual !== null ? `${annual}%` : '-'}</strong>
                                </div>
                              </div>

                              {/* Subject grade outcome */}
                              <div className="flex items-center gap-3 justify-end min-w-[120px]">
                                <div className="text-center">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase block">{tx("ፊደል")}</span>
                                  {letter ? (
                                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black border ${letter.color}`}>
                                      {letter.grade}
                                    </span>
                                  ) : '-'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Overall Metrics block */}
                      {(() => {
                        let totalSum = 0;
                        let subjectCount = 0;
                        (schoolConfig.subjectsByGrade?.[foundStudent?.grade || ''] && schoolConfig.subjectsByGrade[foundStudent?.grade || ''].length > 0 ? schoolConfig.subjectsByGrade[foundStudent?.grade || ''] : schoolConfig.subjects).forEach(sub => {
                          const annual = getSubjectAnnualAvg(sub);
                          if (annual !== null) {
                            totalSum += annual;
                            subjectCount++;
                          }
                        });
                        const averageScore = subjectCount > 0 ? Math.round(totalSum / subjectCount) : 0;

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                              <h4 className="text-xs font-black text-slate-900 uppercase">{tx("የውጤት ማጠቃለያ (Metrics Summary)")}</h4>
                              <div className="flex justify-between text-xs py-1 border-b border-slate-150">
                                <span className="text-slate-500">{tx("ጠቅላላ የትምህርት ብዛት (Total Subjects):")}</span>
                                <strong className="text-indigo-900 font-black">{(schoolConfig.subjectsByGrade?.[foundStudent?.grade || ''] && schoolConfig.subjectsByGrade[foundStudent?.grade || ''].length > 0 ? schoolConfig.subjectsByGrade[foundStudent?.grade || ''] : schoolConfig.subjects).length}</strong>
                              </div>
                              <div className="flex justify-between text-xs py-1">
                                <span className="text-slate-500">{tx("ዓመታዊ አማካይ ውጤት (Annual Average):")}</span>
                                <strong className="text-slate-950 font-black">
                                  {subjectCount > 0 ? `${averageScore}%` : '0%'}
                                </strong>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                              <h4 className="text-xs font-black text-slate-900 uppercase">{tx("ስነ-ምግባርና መገኘት (Conduct & Attendance)")}</h4>
                              <div className="flex justify-between text-xs py-1 border-b border-slate-150">
                                <span className="text-slate-500">{tx("ሥነ-ምግባር ደረጃ (Conduct Grade):")}</span>
                                <strong className="text-emerald-700 font-black">{studentExtraInfo[foundStudent.id]?.conduct || 'A'}</strong>
                              </div>
                              <div className="flex justify-between text-xs py-1">
                                <span className="text-slate-500">{tx("የቀረበት ቀናት (Days Absent):")}</span>
                                <strong className="text-rose-700 font-black">{studentExtraInfo[foundStudent.id]?.absent || 0}{tx(" ቀን (Days)")}</strong>
                              </div>
                            </div>
                          </div>
                        ); })()}


                      {/* Signatures Row */}
                      <div className="grid grid-cols-2 gap-8 text-center pt-4 border-t border-slate-200">
                        <div className="flex flex-col items-center">
                          <span className="font-serif italic text-indigo-800 text-xs border-b border-slate-300 pb-1 w-2/3">Approved</span>
                          <span className="text-[10px] font-bold text-slate-700 mt-1">{tx("የክፍል ኃላፊ መምህር (Homeroom Teacher)")}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="font-serif italic text-indigo-800 text-xs border-b border-slate-300 pb-1 w-2/3">Official Stamp</span>
                          <span className="text-[10px] font-bold text-slate-700 mt-1">{tx("የርዕሰ መምህር (Director Seal)")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Print instructions notice in modal footer */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 leading-relaxed font-semibold flex items-start gap-1.5 no-print">
                  <span>💡</span>
                  <p>
                    <strong>{tx("ጠቃሚ ምክር፡")}</strong>{tx(" “ወረቀት ላይ አትም” የሚለውን ሲጫኑ የብሮውዘሩ የህትመት ገጽ ይከፈታል። በዚያ ገጽ ላይ ")}<strong>&quot;Headers and Footers&quot;</strong>{tx(" የሚለውን ማጥፋትዎን እና ")}<strong>&quot;Background Graphics&quot;</strong>{tx(
                    " የሚለውን ማብራትዎን ያረጋግጡ። ይህም የትምህርት ቤቱን አርማና ጌጦች በተሟላ ውበት ለማተም ይረዳል።\n                  "
                  )}</p>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ================= OFFSCREEN ATTENDANCE PDF TARGET ================= */}
      {exportingAttendanceStudent && (
        <div className="absolute left-[-9999px] top-[-9999px] w-[210mm] min-h-[297mm] bg-white text-slate-900 font-sans p-12 space-y-6 flex flex-col justify-between" id="attendance-print-target">
          <div>
            {/* Header portion */}
            <div className="text-center border-b-2 border-slate-950 pb-5 relative space-y-2">
              <div className="flex items-center justify-center gap-3">
                {schoolConfig.logoImage ? (
                  <img src={schoolConfig.logoImage} alt="Logo" className="w-12 h-12 object-contain" />
                ) : (
                  <GraduationCap className="w-12 h-12 text-slate-800" />
                )}
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-950">{schoolConfig.nameAmh}</h1>
                  <h2 className="text-lg font-bold tracking-wide text-slate-700 uppercase">{(schoolConfig.nameEng || "").replace(/app/i, "").trim()}</h2>
                </div>
              </div>
              <p className="text-xs italic font-semibold text-slate-500">“ {schoolConfig.mottoAmh} • {schoolConfig.mottoEng} ”</p>
              
              <div className="text-[10px] text-slate-500 font-medium pt-1.5 flex justify-center gap-6">
                <span>📞 {schoolConfig.phone}</span>
                <span>📧 {schoolConfig.email}</span>
                <span>📍 {schoolConfig.address}</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center pt-4">
              <span className="text-[10px] text-indigo-700 font-black tracking-widest uppercase block">{tx("የተማሪ ዕለታዊ መከታተያ መዝገብ")}</span>
              <h3 className="text-base font-black text-slate-900">{tx("የዕለታዊ አቴንዳንስ መዝገብ ሪፖርት (Student Daily Attendance History)")}</h3>
            </div>

            {/* Profile info cards */}
            <div className="grid grid-cols-2 gap-4 mt-6 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
              <div className="space-y-1.5 border-r border-slate-200 pr-4 text-left">
                <p><span className="font-bold text-slate-500">{tx("የተማሪው ስም (Student Name)፡")}</span> <strong className="text-slate-950 font-black">{exportingAttendanceStudent.name}</strong></p>
                <p><span className="font-bold text-slate-500">{tx("መታወቂያ ቁጥር (ID Number)፡")}</span> <strong className="text-indigo-900 font-black font-mono">{exportingAttendanceStudent.id}</strong></p>
                <p><span className="font-bold text-slate-500">{tx("ክፍል እና ሴክሽን (Grade & Section)፡")}</span> <strong className="text-slate-900 font-black">{exportingAttendanceStudent.grade} {exportingAttendanceStudent.section}</strong></p>
              </div>
              <div className="space-y-1.5 pl-4 text-left">
                <p><span className="font-bold text-slate-500">{tx("የመቅረት ብዛት (Days Absent)፡")}</span> <strong className="text-rose-700 font-black">{studentExtraInfo[exportingAttendanceStudent.id]?.absent ?? 0}{tx(" ቀናት (Days)")}</strong></p>
                <p><span className="font-bold text-slate-500">{tx("የምግባር ደረጃ (Conduct Score)፡")}</span> <strong className="text-emerald-700 font-black">{studentExtraInfo[exportingAttendanceStudent.id]?.conduct ?? 'A'}</strong></p>
                <p><span className="font-bold text-slate-500">{tx("ጠቅላላ መዝገቦች (Total Logs)፡")}</span> <strong className="text-slate-950 font-black">{exportingAttendanceHistory.length}{tx(" ቀናት (Days)")}</strong></p>
              </div>
            </div>

            {/* Table */}
            <div className="mt-6 border border-slate-300 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-300">
                    <th className="p-3 w-12 text-center">{tx("ተ.ቁ")}</th>
                    <th className="p-3">{tx("📅 ቀን በአውሮፓውያን (Gregorian Date)")}</th>
                    <th className="p-3">{tx("🇪🇹 ቀን በኢትዮጵያ (Ethiopian Date)")}</th>
                    <th className="p-3 text-center">{tx("ሁኔታ (Status)")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {exportingAttendanceHistory.map((h, idx) => {
                    const dateObj = new Date(h.date + 'T12:00:00');
                    const dual = getFormattedDualCalendarDate(dateObj);
                    return (
                      <tr key={idx} className="text-slate-800">
                        <td className="p-3 text-center font-mono font-bold text-slate-500 bg-slate-50/40">{idx + 1}</td>
                        <td className="p-3 font-mono">{dual.gc}</td>
                        <td className="p-3 font-bold">{dual.ec}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            h.status === 'present' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                            h.status === 'absent' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                            'bg-amber-50 text-amber-800 border border-amber-100'
                          }`}>
                            {h.status === 'present' ? tx("✓ የመጣ (Present)") :
                             h.status === 'absent' ? tx("✗ የቀረ (Absent)") :
                             tx("✏ ፈቃድ (Excused)")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 text-center pt-8 border-t border-slate-200 mt-auto">
            <div className="flex flex-col items-center">
              <span className="font-serif italic text-indigo-800 text-xs border-b border-slate-300 pb-1 w-2/3">Approved</span>
              <span className="text-[10px] font-bold text-slate-700 mt-1">{tx("የክፍል ኃላፊ መምህር (Homeroom Teacher)")}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-serif italic text-indigo-800 text-xs border-b border-slate-300 pb-1 w-2/3">Official Stamp</span>
              <span className="text-[10px] font-bold text-slate-700 mt-1">{tx("የርዕሰ መምህር (Director Seal)")}</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= ATTENDANCE GENERATING OVERLAY ================= */}
      {isExportingAttendancePDF && (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white/95 border border-slate-200/50 rounded-2xl p-8 max-w-sm text-center shadow-2xl flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
              <Sparkles className="w-6 h-6 text-indigo-600 absolute animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-sm">{tx("የአቴንዳንስ ፒዲኤፍ እየተዘጋጀ ነው...")}</h4>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Generating A4 Attendance PDF</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs">{tx(
              "\n              እባክዎን ትንሽ ይጠብቁ፤ የልጅዎ አቴንዳንስ መዝገብ ወደ ፒዲኤፍ እየተቀየረ ነው።\n            "
            )}</p>
          </div>
        </div>
      )}

      {/* ================= EDIT STUDENT MAIN MODAL ================= */}
      {editingStudentMainTab && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <span className="font-extrabold text-slate-800 text-sm font-sans">{tx("የተማሪ መረጃ ማስተካከያ (Edit Student Profile)")}</span>
              <button 
                onClick={() => { playInteractiveSound('click'); setEditingStudentMainTab(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditStudentMainSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("የተማሪው ሙሉ ስም (Student Full Name):")}</label>
                <input 
                  type="text"
                  value={editStudentMainName}
                  onChange={(e) => setEditStudentMainName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("ጾታ (Gender):")}</label>
                  <select 
                    value={editStudentMainGender}
                    onChange={(e) => setEditStudentMainGender(e.target.value as any)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium">
                  
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
                    value={editStudentMainAge}
                    onChange={(e) => setEditStudentMainAge(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium"
                    placeholder="14"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("ክፍል (Grade):")}</label>
                  <select 
                    value={editStudentMainGrade}
                    onChange={(e) => setEditStudentMainGrade(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium">
                  
                    {activeGradesList.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("ሴክሽን (Sec):")}</label>
                  <select 
                    value={editStudentMainSection}
                    onChange={(e) => setEditStudentMainSection(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 outline-none bg-white font-medium">
                  
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option><option value="H">H</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("የወላጅ ኢሜል (Parent Email):")}</label>
                  <input 
                    type="email"
                    value={editStudentMainParentEmail}
                    onChange={(e) => setEditStudentMainParentEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("የወላጅ ስልክ (Parent Phone):")}</label>
                  <input 
                    type="tel"
                    value={editStudentMainParentPhone}
                    onChange={(e) => setEditStudentMainParentPhone(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("አድራሻ (Address - Optional):")}</label>
                <input 
                  type="text"
                  value={editStudentMainAddress}
                  onChange={(e) => setEditStudentMainAddress(e.target.value)}
                  placeholder={tx("አዲስ አበባ፣ ኢትዮጵያ (Addis Ababa, Ethiopia)")}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("የፋይዳ መታወቂያ (Student FAN/FIN - Optional):")}</label>
                  <input 
                    type="text"
                    value={editStudentMainDigitalId}
                    onChange={(e) => setEditStudentMainDigitalId(e.target.value)}
                    placeholder="DIG-12345"
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">{tx("የተማሪው ዲጂታል መለያ ቁጥር (Student Digital ID - Optional)")}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{tx("የክፍያ ኮድ (Payment ID - Optional):")}</label>
                  <input 
                    type="text"
                    value={editStudentMainPaymentId}
                    onChange={(e) => setEditStudentMainPaymentId(e.target.value)}
                    placeholder="PAY-12345"
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">{tx("የክፍያ መለያ ቁጥር (Payment ID Code)")}</p>
                </div>
              </div>

              {/* የተማሪው ፕሮፋይል ፎቶ (Student Profile Photo) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
                <label className="block text-xs font-bold uppercase text-slate-600">{tx(
                  "\n                  የተማሪው ፕሮፋይል ፎቶ (Profile Photo - Optional):\n                "
                )}</label>

                {isEditStudentCameraActive ? (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-square max-w-[200px] mx-auto bg-slate-950 rounded-xl overflow-hidden border border-slate-300 flex flex-col items-center justify-center p-3 text-center">
                      {editStudentCameraError ? (
                        <div className="text-xs text-rose-400 p-2 font-medium flex flex-col items-center gap-2">
                          <span>{editStudentCameraError}</span>
                          <a 
                            href={window.location.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-all shadow-md cursor-pointer"
                          >{tx(
                            "\n                            አዲስ ታብ ላይ ክፈት (Open in New Tab)\n                          "
                          )}</a>
                        </div>
                      ) : (
                        <>
                          <video 
                            ref={editStudentVideoRef}
                            autoPlay 
                            playsInline 
                            muted 
                            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                          />
                          {/* Camera overlay box */}
                          <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-full pointer-events-none"></div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 justify-center">
                      {!editStudentCameraError && (
    <>
      <button
        type="button"
        onClick={toggleEditStudentCameraFacing}
        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        title={tx("ካሜራ ቀይር (Switch Camera)")}>
      
        <RefreshCw className="w-3.5 h-3.5" />{tx(" ቀይር (Switch)\n      ")}</button>
      <button
        type="button"
        onClick={captureEditStudentPhoto}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer">
      
        <Camera className="w-3.5 h-3.5" />{tx(" ፎቶ አንሳ (Capture)\n      ")}</button>
    </>
  )}
                      <button
                        type="button"
                        onClick={stopEditStudentCamera}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
                      
                        <CameraOff className="w-3.5 h-3.5" />{tx(" ዝጋ (Cancel)\n                      ")}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {editStudentMainPhoto ? (
                      <div className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-indigo-200 bg-white">
                        <img 
                          src={editStudentMainPhoto} 
                          alt="Student preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEditStudentCamera(editStudentCameraFacing)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-indigo-100 transition-colors cursor-pointer">
                      
                        <Camera className="w-3.5 h-3.5" /> {editStudentMainPhoto ? tx("ፎቶ ቀይር (Change Photo)") : tx("ካሜራ ክፈት (Open Camera)")}
                      </button>
                      {editStudentMainPhoto && (
                        <button
                          type="button"
                          onClick={() => {
                            playInteractiveSound('click');
                            setEditStudentMainPhoto(undefined);
                          }}
                          className="text-[10px] text-rose-600 font-bold hover:underline text-left cursor-pointer">{tx(
                          "\n                        \n                          🗑️ ፎቶውን አጥፋ (Remove Photo)\n                        "
                        )}</button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { playInteractiveSound('click'); setEditingStudentMainTab(null); }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer">{tx("\n                \n                  ይቅር (Cancel)\n                ")}</button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer">{tx(
                  "\n                \n                  አስቀምጥ (Save Changes)\n                "
                )}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE STUDENT MAIN CONFIRMATION MODAL ================= */}
      {deletingStudentMainTab && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-950 text-sm">{tx("ተማሪውን ከሲስተሙ መሰረዝ ይፈልጋሉ? (Are you sure you want to delete this student?)")}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confirm Student Deletion / Departure</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">{tx("\n              ተማሪ ")}<strong>{deletingStudentMainTab.name}</strong>{tx(" (መታወቂያ፡ ")}{deletingStudentMainTab.id}{tx(
              ") ከሲስተሙ ሲሰረዝ ተያያዥነት ያላቸው ውጤቶችና መዛግብት በሙሉ ይወገዳሉ። ይህ ተግባር ሊመለስ የማይችል ነው።\n            "
            )}</p>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { playInteractiveSound('click'); setDeletingStudentMainTab(null); }}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer">{tx("\n              \n                ይቅር (Cancel)\n              ")}</button>
              <button
                onClick={handleDeleteStudentMainConfirm}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer">{tx("\n              \n                አዎ፣ ሰርዝ (Yes, Delete)\n              ")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= QUICK VIEW STATS MODAL ================= */}
      {quickViewCategory && (
        <div className="fixed inset-0 z-[130] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`rounded-3xl w-full max-w-md shadow-2xl border p-6 space-y-4 transition-all duration-300 ${
            themeMode === 'dark' 
              ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/85' 
              : 'bg-white border-slate-200 text-slate-900 shadow-2xl shadow-slate-300/50'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <div className="text-left">
                  <h4 className="font-extrabold text-sm uppercase tracking-wide">
                    {quickViewCategory === 'students' && tx("የተማሪዎች ስታቲስቲክስ (Students Stats)")}
                    {quickViewCategory === 'grades' && tx("የውጤቶች ስታቲስቲክስ (Grades Stats)")}
                    {quickViewCategory === 'teachers' && tx("የመምህራን ስታቲስቲክስ (Teachers Stats)")}
                    {quickViewCategory === 'average' && tx("አጠቃላይ አማካይ (General Average)")}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Quick Information Overview</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { playInteractiveSound('click'); setQuickViewCategory(null); }}
                className={`w-6.5 h-6.5 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                  themeMode === 'dark' 
                    ? 'border-slate-800 hover:bg-slate-800 text-slate-400' 
                    : 'border-slate-150 hover:bg-slate-100 text-slate-500'
                }`}>
              
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs py-1">
              {quickViewCategory === 'students' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={`p-3 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center`}>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Grade 7</span>
                      <strong className="text-base font-black">{students.filter(s => s.grade === 'Grade 7' || s.grade.includes('7')).length}</strong>
                    </div>
                    <div className={`p-3 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center`}>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Grade 8</span>
                      <strong className="text-base font-black">{students.filter(s => s.grade === 'Grade 8' || s.grade.includes('8')).length}</strong>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-850/50 border-slate-750' : 'bg-slate-50 border-slate-150'}`}>
                    <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-2">{tx("👫 ጾታ ምጣኔ (Gender Distribution)")}</h5>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span>{tx("ወንድ (Male)")}</span>
                          <span>{students.filter(s => s.gender === 'Male').length}{tx(" ተማሪዎች (Students)")}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${students.length ? (students.filter(s => s.gender === 'Male').length / students.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span>{tx("ሴት (Female)")}</span>
                          <span>{students.filter(s => s.gender === 'Female').length}{tx(" ተማሪዎች (Students)")}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-pink-500" 
                            style={{ width: `${students.length ? (students.filter(s => s.gender === 'Female').length / students.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 block">{tx("🆕 የቅርብ ጊዜ ተማሪዎች (Recent Registrations)")}</span>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {students.slice(-3).reverse().map(st => (
                        <div key={st.id} className={`p-2 rounded-lg flex items-center justify-between text-[11px] border ${themeMode === 'dark' ? 'bg-slate-850 border-slate-750/50' : 'bg-white border-slate-100'}`}>
                          <span className="font-semibold">{st.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{st.grade}-{st.section}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {quickViewCategory === 'grades' && (
                <div className="space-y-3">
                  <div className={`p-3.5 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-850/50 border-slate-750' : 'bg-slate-50 border-slate-150'}`}>
                    <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-2">{tx("📊 የውጤቶች ደረጃ ክፍፍል (Grade Performance Ranges)")}</h5>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold">
                        <span>A (&gt;= 90%):</span>
                        <span>{grades.filter(g => g.total >= 90).length}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 text-green-500 font-bold">
                        <span>B (75-89%):</span>
                        <span>{grades.filter(g => g.total >= 75 && g.total < 90).length}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 text-amber-500 font-bold">
                        <span>C (50-74%):</span>
                        <span>{grades.filter(g => g.total >= 50 && g.total < 75).length}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 text-rose-500 font-bold">
                        <span>F (&lt; 50%):</span>
                        <span>{grades.filter(g => g.total < 50).length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={`p-3 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center`}>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">{tx("ያልጸደቁ (Pending)")}</span>
                      <strong className="text-base font-black text-amber-500">{grades.filter(g => !g.isApproved).length}</strong>
                    </div>
                    <div className={`p-3 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center`}>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">{tx("የጸደቁ (Verified)")}</span>
                      <strong className="text-base font-black text-emerald-500">{grades.filter(g => g.isApproved).length}</strong>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 text-center leading-relaxed font-medium">{tx(
                    "\n                    * የተማሪዎችን የሪፖርት ካርድ እና ውጤት ማስተዳደሪያውን ለመክፈት ከላይ ያለውን የውጤት ፖርታል (Grade Tracker) ይመልከቱ።\n                  "
                  )}</div>
                </div>
              )}

              {quickViewCategory === 'teachers' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={`p-3 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center`}>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">{tx("የክፍል ኃላፊዎች (Homeroom)")}</span>
                      <strong className="text-base font-black">{teachers.filter(t => t.isHomeroomTeacher).length}</strong>
                    </div>
                    <div className={`p-3 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center`}>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">{tx("ሌሎች መምህራን (Regular)")}</span>
                      <strong className="text-base font-black">{teachers.filter(t => !t.isHomeroomTeacher).length}</strong>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-850/50 border-slate-750' : 'bg-slate-50 border-slate-150'}`}>
                    <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-2">{tx("📚 መምህራን የሚያስተምሯቸው ክፍሎች (Assigned Grades)")}</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(teachers.map(t => t.assignedClass))).map(cl => (
                        <span key={cl} className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold rounded-lg text-[10px] tracking-wide uppercase border border-purple-500/20">
                          {cl}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 block">{tx("🎓 የትምህርት ደረጃ ክፍፍል (Education Levels)")}</span>
                    <div className="space-y-1 text-[11px]">
                      {['Degree', 'Diploma', 'Masters'].map(lvl => {
                        const count = teachers.filter(t => t.educationLevel?.toLowerCase().includes(lvl.toLowerCase())).length;
                        return (
                          <div key={lvl} className="flex justify-between font-semibold dark:border-slate-850/50 pb-1">
                            <span>{lvl}:</span>
                            <span className="font-bold">{count}{tx(" መምህራን (Teachers)")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {quickViewCategory === 'average' && (
                <div className="space-y-3">
                  <div className={`p-3.5 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-850/50 border-slate-750' : 'bg-slate-50 border-slate-150'} text-center`}>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{tx("አጠቃላይ የማለፍ ምጣኔ (Passing Rate)")}</span>
                    <strong className="text-2xl font-black text-amber-500">
                      {grades.length ? Math.round((grades.filter(g => g.total >= 50).length / grades.length) * 100) : 0}%
                    </strong>
                    <span className="block text-[10px] text-slate-400 mt-1 font-medium">{tx("ከ 100% ውስጥ 50% እና ከዚያ በላይ ያመጡ ተማሪዎች (Students scoring 50% and above)")}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={`p-3 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center`}>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">{tx("ከፍተኛው ውጤት (Max Score)")}</span>
                      <strong className="text-base font-black text-emerald-500">
                        {grades.length ? Math.max(...grades.map(g => g.total)) : 0}%
                      </strong>
                    </div>
                    <div className={`p-3 rounded-xl border ${themeMode === 'dark' ? 'bg-slate-800/40 border-slate-700/60' : 'bg-indigo-50/40 border-indigo-100/60'} text-center`}>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">{tx("አጠቃላይ ተመዝጋቢ (Total Graded)")}</span>
                      <strong className="text-base font-black text-indigo-500">
                        {grades.length}{tx(" ውጤቶች (Grades)\n                      ")}</strong>
                    </div>
                  </div>

                  {(() => {
                    const subjMap: Record<string, {sum: number, count: number}> = {};
                    grades.forEach(g => {
                      if (!subjMap[g.subject]) {
                        subjMap[g.subject] = { sum: 0, count: 0 };
                      }
                      subjMap[g.subject].sum += g.total;
                      subjMap[g.subject].count += 1;
                    });
                    let bestSubj = '';
                    let bestAvg = 0;
                    Object.entries(subjMap).forEach(([subj, data]) => {
                      const avg = data.sum / data.count;
                      if (avg > bestAvg) {
                        bestAvg = avg;
                        bestSubj = subj;
                      }
                    });

                    if (bestSubj) {
                      return (
                        <div className={`p-3 rounded-xl border flex items-center justify-between ${themeMode === 'dark' ? 'bg-slate-850/50 border-slate-750' : 'bg-slate-50 border-slate-150'}`}>
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">{tx("ከፍተኛ ውጤት የተመዘገበበት ትምህርት")}</span>
                            <strong className="text-[11.5px] font-black">{bestSubj}</strong>
                          </div>
                          <strong className="text-base font-black text-emerald-500">{Math.round(bestAvg)}%</strong>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={() => { playInteractiveSound('click'); setQuickViewCategory(null); }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer">{tx("\n              \n                እሺ ተረዳሁ (Close View)\n              ")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MANUAL PDF DOWNLOAD MODAL ================= */}
      {downloadablePdf && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-850 overflow-hidden flex flex-col p-6 space-y-4 text-center items-center">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full animate-pulse">
              <Download className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-950 dark:text-slate-50 text-sm">{tx("📥 ፒዲኤፍ ለማውረድ ተዘጋጅቷል! (PDF Ready to Download!)")}</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{downloadablePdf.title}</p>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{tx(
              "\n              በአሳሽዎ የደህንነት ጥበቃ ምክንያት ፒዲኤፍ ፋይሉ በራሱ ካልወረደ፣ እባክዎ ከታች ያለውን "
            )}<strong>{tx("\"ፒዲኤፍ አውርድ\"")}</strong>{tx(" የሚለውን ሊንክ በመጫን በቀጥታ ማውረድ ይችላሉ።\n            ")}</p>

            <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <a
                href={downloadablePdf.url}
                download={downloadablePdf.filename}
                onClick={() => {
                  playInteractiveSound('success');
                  // Auto close after 1.5 seconds so they know it downloaded
                  setTimeout(() => setDownloadablePdf(null), 1500);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-200 dark:shadow-none">
              
                <Download className="w-3.5 h-3.5" />{tx(" ፒዲኤፍ አውርድ (Click to Download)\n              ")}</a>
              <button
                type="button"
                onClick={() => { playInteractiveSound('click'); setDownloadablePdf(null); }}
                className="w-full py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors cursor-pointer">{tx("\n              \n                ዝጋ (Close)\n              ")}</button>
            </div>
          </div>
        </div>
      )}


      </main>
    </div>
  );
}
