import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  Printer, 
  Download, 
  RefreshCw, 
  Sun, 
  Sunset, 
  Check, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { StaffMember, Teacher } from '../schoolData';
import { playInteractiveSound } from './AudioEngine';
import { useLanguage } from './LanguageContext';

interface StaffAttendanceTablesSectionProps {
  staffList: StaffMember[];
  teachers: Teacher[];
  schoolConfig?: any;
  workspaceId?: string;
  currentUser?: any;
}

export const StaffAttendanceTablesSection: React.FC<StaffAttendanceTablesSectionProps> = ({
  staffList,
  teachers,
  schoolConfig,
  workspaceId = 'default',
  currentUser
}) => {
  const { tx } = useLanguage();
  const [activeSession, setActiveSession] = useState<'morning' | 'afternoon' | 'both'>('both');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { morning: string; afternoon: string; morningTime: string; afternoonTime: string }>>(() => {
    try {
      const saved = localStorage.getItem(`staff_attendance_${workspaceId}_${selectedDate}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Combine staff and teachers
  const allStaff = useMemo<StaffMember[]>(() => {
    const map = new Map<string, StaffMember>();
    staffList.forEach(s => map.set(s.id, s));
    teachers.forEach(t => {
      if (!map.has(t.id)) {
        map.set(t.id, {
          id: t.id,
          name: t.name,
          category: 'Main Teacher',
          roleTitle: 'ዋና መምህር (Teacher)',
          phone: t.phone || '-',
          email: t.email,
          gender: t.gender,
          educationLevel: t.educationLevel || 'Degree',
          registeredBy: t.registeredBy || 'Principal',
          timestamp: t.timestamp || new Date().toISOString()
        });
      }
    });
    return Array.from(map.values());
  }, [staffList, teachers]);

  // Save records on change
  const handleStatusChange = (staffId: string, session: 'morning' | 'afternoon', status: string) => {
    playInteractiveSound('click');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAttendanceRecords(prev => {
      const updated = {
        ...prev,
        [staffId]: {
          morning: session === 'morning' ? status : (prev[staffId]?.morning || 'present'),
          afternoon: session === 'afternoon' ? status : (prev[staffId]?.afternoon || 'present'),
          morningTime: session === 'morning' ? timeNow : (prev[staffId]?.morningTime || '02:30 AM'),
          afternoonTime: session === 'afternoon' ? timeNow : (prev[staffId]?.afternoonTime || '08:30 PM')
        }
      };
      localStorage.setItem(`staff_attendance_${workspaceId}_${selectedDate}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Auto-fill all staff attendance
  const handleAutoFill = () => {
    playInteractiveSound('success');
    const autoFilled: Record<string, { morning: string; afternoon: string; morningTime: string; afternoonTime: string }> = {};
    allStaff.forEach(st => {
      // Randomly or standardly assign present/late with realistic times
      const isLate = Math.random() < 0.15;
      autoFilled[st.id] = {
        morning: isLate ? 'late' : 'present',
        afternoon: 'present',
        morningTime: isLate ? '03:15 AM' : '02:15 AM',
        afternoonTime: '08:00 PM'
      };
    });
    setAttendanceRecords(autoFilled);
    localStorage.setItem(`staff_attendance_${workspaceId}_${selectedDate}`, JSON.stringify(autoFilled));
  };

  // Verify access: Vice Principal only (or Principal)
  if (!currentUser || (currentUser.role !== 'vice_principal' && currentUser.role !== 'principal')) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-8 rounded-3xl text-center space-y-3">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-600 animate-bounce" />
        <h3 className="text-lg font-black">{tx("እገዳ: ይህ ገፅ ለምክትል ርዕሰ መምህር ብቻ የተፈቀደ ነው")}</h3>
        <p className="text-xs">{tx("Access Restricted: This Staff Attendance dual-table is exclusively available on the Vice Principal's portal.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-900/40 p-4 sm:p-6 rounded-3xl border border-slate-800 backdrop-blur-md text-white shadow-2xl">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
              {tx("ምክትል ርዕሰ መምህር ልዩ ገፅ (Vice Principal Exclusive)")}
            </span>
            <h2 className="text-lg font-black text-white mt-0.5">
              {tx("የሰራተኞች የጧት እና የከሰዓት አቴንዳንስ ሰንጠረዥ (Staff Morning & Afternoon Attendance)")}
            </h2>
            <p className="text-xs text-slate-400">
              {tx("የመግቢያ (ጧት) እና የመውጫ (ከሰዓት) ሰንጠረዦች በАውቶማቲክ የመሙላት እና የመቀያየር አገልግሎት።")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleAutoFill}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
            title={tx("ሁሉንም ሰራተኞች በሰንጠረዡ አውቶማቲክ ሞላ (Auto-Fill Attendance)")}
          >
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>{tx("አውቶማቲክ ሙላ (Auto-Fill)")}</span>
          </button>

          <button
            onClick={() => { playInteractiveSound('click'); window.print(); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{tx("አትም (Print)")}</span>
          </button>
        </div>
      </div>

      {/* Session Switcher Tabs (Morning, Afternoon, Both) */}
      <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => { playInteractiveSound('click'); setActiveSession('both'); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSession === 'both' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{tx("ሁለቱን ሰንጠረዥ አሳይ (Both Tables)")}</span>
        </button>

        <button
          onClick={() => { playInteractiveSound('click'); setActiveSession('morning'); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSession === 'morning' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-300" />
          <span>{tx("የጧት ሰንጠረዥ (Morning / Check-In)")}</span>
        </button>

        <button
          onClick={() => { playInteractiveSound('click'); setActiveSession('afternoon'); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSession === 'afternoon' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sunset className="w-3.5 h-3.5 text-orange-300" />
          <span>{tx("የከሰዓት ሰንጠረዥ (Afternoon / Check-Out)")}</span>
        </button>
      </div>

      {/* Tables Grid / Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TABLE 1: MORNING (ጧት / መግቢያ) */}
        {(activeSession === 'both' || activeSession === 'morning') && (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{tx("1. የጧት መግቢያ አቴንዳንስ ሰንጠረዥ (Morning Check-In)")}</h3>
                  <p className="text-[11px] text-slate-400">{selectedDate} • {allStaff.length} {tx("ሰራተኞች")}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {tx("ሰዓት: 02:00 - 02:30 AM")}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                    <th className="p-3 font-bold">{tx("ተ.ቁ")}</th>
                    <th className="p-3 font-bold">{tx("የሰራተኛ ስም (Staff Name)")}</th>
                    <th className="p-3 font-bold">{tx("የስራ መደብ (Role)")}</th>
                    <th className="p-3 font-bold text-center">{tx("መግቢያ ሰዓት")}</th>
                    <th className="p-3 font-bold text-center">{tx("ሁኔታ (Status)")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allStaff.map((staff, idx) => {
                    const record = attendanceRecords[staff.id] || { morning: 'present', morningTime: '02:15 AM' };
                    return (
                      <tr key={staff.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-black text-white">{staff.name}</td>
                        <td className="p-3 text-slate-300">{staff.roleTitle || staff.category || 'Staff'}</td>
                        <td className="p-3 text-center font-mono text-cyan-400">{record.morningTime || '02:15 AM'}</td>
                        <td className="p-3 text-center">
                          <select
                            value={record.morning || 'present'}
                            onChange={(e) => handleStatusChange(staff.id, 'morning', e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold outline-none border cursor-pointer ${
                              record.morning === 'present' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                              record.morning === 'late' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                              record.morning === 'absent' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                              'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            <option value="present" className="bg-slate-900 text-emerald-300">{tx("🟢 ተገኝቷል (Present)")}</option>
                            <option value="late" className="bg-slate-900 text-amber-300">{tx("🟡 ዘግይቷል (Late)")}</option>
                            <option value="absent" className="bg-slate-900 text-rose-300">{tx("🔴 ቀርቷል (Absent)")}</option>
                            <option value="leave" className="bg-slate-900 text-purple-300">{tx("🔵 ፈቃድ (Leave)")}</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABLE 2: AFTERNOON (ከሰዓት / መውጫ) */}
        {(activeSession === 'both' || activeSession === 'afternoon') && (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                  <Sunset className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{tx("2. የከሰዓት መውጫ አቴንዳንስ ሰንጠረዥ (Afternoon Check-Out)")}</h3>
                  <p className="text-[11px] text-slate-400">{selectedDate} • {allStaff.length} {tx("ሰራተኞች")}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {tx("ሰዓት: 11:00 - 11:30 PM")}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                    <th className="p-3 font-bold">{tx("ተ.ቁ")}</th>
                    <th className="p-3 font-bold">{tx("የሰራተኛ ስም (Staff Name)")}</th>
                    <th className="p-3 font-bold">{tx("የስራ መደብ (Role)")}</th>
                    <th className="p-3 font-bold text-center">{tx("መውጫ ሰዓት")}</th>
                    <th className="p-3 font-bold text-center">{tx("ሁኔታ (Status)")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allStaff.map((staff, idx) => {
                    const record = attendanceRecords[staff.id] || { afternoon: 'present', afternoonTime: '08:30 PM' };
                    return (
                      <tr key={staff.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-black text-white">{staff.name}</td>
                        <td className="p-3 text-slate-300">{staff.roleTitle || staff.category || 'Staff'}</td>
                        <td className="p-3 text-center font-mono text-teal-400">{record.afternoonTime || '08:30 PM'}</td>
                        <td className="p-3 text-center">
                          <select
                            value={record.afternoon || 'present'}
                            onChange={(e) => handleStatusChange(staff.id, 'afternoon', e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold outline-none border cursor-pointer ${
                              record.afternoon === 'present' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                              record.afternoon === 'late' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                              record.afternoon === 'absent' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                              'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            <option value="present" className="bg-slate-900 text-emerald-300">{tx("🟢 ተገኝቷል (Present)")}</option>
                            <option value="late" className="bg-slate-900 text-amber-300">{tx("🟡 ዘግይቷል (Late)")}</option>
                            <option value="absent" className="bg-slate-900 text-rose-300">{tx("🔴 ቀርቷል (Absent)")}</option>
                            <option value="leave" className="bg-slate-900 text-purple-300">{tx("🔵 ፈቃድ (Leave)")}</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
