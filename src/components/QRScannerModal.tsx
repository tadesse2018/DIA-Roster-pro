import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Camera, 
  QrCode, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  CalendarDays,
  UserCheck,
  Users,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsQR from 'jsqr';
import { Student, Teacher } from '../schoolData';
import { playInteractiveSound } from './AudioEngine';
import { useLanguage } from './LanguageContext';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  staffList?: any[];
  onLoginSuccess: (studentId: string) => void;
  onMarkAttendance: (id: string, type: 'checkIn' | 'checkOut', entityType: 'student' | 'staff') => { success: boolean; studentName: string; isAlreadyMarked: boolean };
  selectedRole?: 'principal' | 'teacher' | 'parent';
  isLoggedIn?: boolean;
  isDemoAutoFillEnabled?: boolean;
  userAccounts?: any[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  staffList = [],
  onLoginSuccess,
  onMarkAttendance,
  selectedRole,
  isLoggedIn = false,
  isDemoAutoFillEnabled = false,
  userAccounts = []
}) => {
  const { tx } = useLanguage();
  const [scanMode, setScanMode] = useState<'login' | 'attendance'>(isLoggedIn ? 'attendance' : 'login');
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false); // Continuous scanning for attendance
  const [attendanceType, setAttendanceType] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showStaffQRs, setShowStaffQRs] = useState<boolean>(false);

  // Success Feedbacks for Attendance Scanner
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    studentName: string;
    studentId: string;
    message: string;
    timestamp: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [manualStudentId, setManualStudentId] = useState('');

  // Initialize and query cameras
  useEffect(() => {
    if (!isOpen) return;

    const initDevices = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
        
        if (videoInputs.length > 0) {
          // Default to the environment/back camera if available, otherwise first camera
          const backCam = videoInputs.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedDeviceId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
        }
      } catch (err) {
        console.warn('Error enumerating cameras:', err);
      }
    };

    initDevices();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Restart camera when facingMode changes
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    }
  }, [facingMode, isOpen]);

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setErrorMsg(null);
    setCameraPermission('prompt');

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this environment');
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode } }
        });
      } catch (fallbackErr) {
        // Fallback to basic video constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setCameraPermission('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        videoRef.current.play().catch(() => {});
        setIsScanning(true);
        // Start decoding loop
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn('Camera capture notice (handled gracefully):', err?.message || err);
      setCameraPermission('denied');
      setErrorMsg(tx(
        "ካሜራውን መክፈት አልተቻለም። እባክዎን የካሜራ ፈቃድ መፍቀድዎን ያረጋግጡ ወይም የQR ፎቶ ይጫኑ/መታወቂያ በእጅ ያስገቡ። (Unable to open camera. Please grant camera permission, upload a QR photo, or enter ID manually below.)"
      ));
      playInteractiveSound('wrong');
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Switch to the next available camera
  const switchCamera = () => {
    playInteractiveSound('click');
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Process camera frame using jsQR
  const tick = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        // Draw offscreen for QR decoding
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          // Detected QR Code!
          const scannedId = code.data.trim().toUpperCase();
          handleScannedCode(scannedId);
          return; // Stop scanning after successful read to prevent spamming
        }
      }
    }

    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(tick);
    }
  };

  // Handle scanned student ID or staff role QR
  const handleScannedCode = (studentId: string) => {
    const cleanVal = studentId.trim().toUpperCase();

    if (scanMode === 'login') {
      const isPrincipal = ['ROLE-PRINCIPAL', 'PRINCIPAL', 'PRINCIPAL@SCHOOL.COM'].includes(cleanVal);
      
      const isTeacherRole = ['ROLE-TEACHER', 'TEACHER', 'TEACHER@SCHOOL.COM'].includes(cleanVal);
      const matchedTeacher = teachers.find(t => (t.email && t.email.toUpperCase() === cleanVal) || (t.id && t.id.toUpperCase() === cleanVal));
      const matchedTeacherAcc = userAccounts?.find(acc => acc.role === 'teacher' && (acc.email.toUpperCase() === cleanVal || (acc.phone && acc.phone === cleanVal)));
      const isValidTeacher = isTeacherRole || !!matchedTeacher || !!matchedTeacherAcc;

      const isParentRole = ['ROLE-PARENT', 'PARENT', 'PARENT@SCHOOL.COM'].includes(cleanVal);
      const matchedStudent = students.find(s => s.id && s.id.toUpperCase() === cleanVal);
      const matchedParentAcc = userAccounts?.find(acc => acc.role === 'parent' && (acc.email.toUpperCase() === cleanVal || (acc.phone && acc.phone === cleanVal)));
      const isValidParentStudent = isParentRole || !!matchedStudent || !!matchedParentAcc;

      // No longer restricting login QR scanning by selected tab. Scanning any valid credential automatically switches the role and logs the user in.

      if (isPrincipal) {
        playInteractiveSound('success');
        onLoginSuccess('principal@school.com');
        stopCamera();
        onClose();
        return;
      }

      if (isValidTeacher) {
        playInteractiveSound('success');
        const resolvedEmail = (matchedTeacher && matchedTeacher.email) || (matchedTeacherAcc && matchedTeacherAcc.email) || 'teacher@school.com';
        onLoginSuccess(resolvedEmail);
        stopCamera();
        onClose();
        return;
      }

      if (isValidParentStudent) {
        playInteractiveSound('success');
        const resolvedValue = matchedStudent ? matchedStudent.id : ((matchedParentAcc && matchedParentAcc.email) || 'parent@school.com');
        onLoginSuccess(resolvedValue);
        stopCamera();
        onClose();
        return;
      }

      // If we reach here in login mode, this is not a registered system user!
      playInteractiveSound('wrong');
      setScanResult({
        success: false,
        studentId,
        studentName: tx("ያልተመዘገበ ተጠቃሚ (Unregistered User)"),
        message: `ይህ መለያ ወይም የQR ኮድ "${studentId.substring(0, 40)}${studentId.length > 40 ? '...' : ''}" በሲስተሙ ውስጥ አልተመዘገበም። እባክዎ በትክክል መመዝገቡን ያረጋግጡ። (This QR code/value is not registered in the school database. Login is restricted only to registered Principals, Teachers, Parents, and Students.)`,
        timestamp: new Date().toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      return;
    }

    // --- Attendance Scan Mode (Only for Students) ---

    // Validate student ID format (Must start with 'ID-' followed by digits)
    const isFormatValid = /^ID-\d+$/i.test(studentId);
    
    if (!isFormatValid) {
      playInteractiveSound('wrong');
      setScanResult({
        success: false,
        studentId,
        studentName: tx("ያልተፈቀደ የQR ኮድ (Invalid QR Code)"),
        message: `የQR ኮዱ ፎርማት ልክ አይደለም። የተማሪ መታወቂያ በ 'ID-' መጀመር አለበት። ያገኙት እሴት: "${studentId.substring(0, 30)}${studentId.length > 30 ? '...' : ''}" (The QR code format is invalid. School student IDs must start with 'ID-'. Scanned value: "${studentId.substring(0, 30)}${studentId.length > 30 ? '...' : ''}")`,
        timestamp: new Date().toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      // Resume scanning after 4 seconds if in Continuous Kiosk Mode, otherwise let user clear
      if (isKioskMode && scanMode === 'attendance') {
        setTimeout(() => {
          setScanResult(null);
          resumeScanning();
        }, 4000);
      }
      return;
    }

    // Attendance Mode: record attendance for Student or Staff/Teacher
    const matchedStudent = students.find(s => s.id.toUpperCase() === studentId.toUpperCase());
    const matchedTeacher = teachers.find(t => (t.id && t.id.toUpperCase() === studentId.toUpperCase()) || (t.email && t.email.toUpperCase() === studentId.toUpperCase()));
    const matchedStaff = staffList.find(st => (st.id && st.id.toUpperCase() === studentId.toUpperCase()) || (st.email && st.email.toUpperCase() === studentId.toUpperCase()));

    if (!matchedStudent && !matchedTeacher && !matchedStaff) {
      playInteractiveSound('wrong');
      setScanResult({
        success: false,
        studentId,
        studentName: tx("ያልተመዘገበ መታወቂያ (Not Found)"),
        message: `መታወቂያ "${studentId}" በሲስተሙ ውስጥ አልተገኘም። እባክዎ በትክክል መመዝገቡን ያረጋግጡ። (ID "${studentId}" was not found in student or staff database.)`,
        timestamp: new Date().toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      if (isKioskMode && scanMode === 'attendance') {
        setTimeout(() => {
          setScanResult(null);
          resumeScanning();
        }, 4000);
      }
      return;
    }

    const entityType = matchedStudent ? 'student' : 'staff';
    const entityName = matchedStudent ? matchedStudent.name : (matchedTeacher ? matchedTeacher.name : matchedStaff?.name || 'Staff');
    const entityId = matchedStudent ? matchedStudent.id : (matchedTeacher ? matchedTeacher.id : matchedStaff?.id || studentId);

    if (entityType === 'student' && attendanceType === 'checkOut') {
      playInteractiveSound('wrong');
      setScanResult({
        success: false,
        studentId: entityId,
        studentName: entityName,
        message: tx("ተማሪዎች መግቢያ (Check-in) ብቻ ይመዝገቧል! የመውጫ አቴንዳንስ ለሰራተኞች ብቻ ነው። (Students are check-in only! Check-out is for staff only.)"),
        timestamp: new Date().toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      if (isKioskMode && scanMode === 'attendance') {
        setTimeout(() => {
          setScanResult(null);
          resumeScanning();
        }, 4000);
      }
      return;
    }

    const record = onMarkAttendance(entityId, attendanceType, entityType);
    
    setScanResult({
      success: true,
      studentId: entityId,
      studentName: entityName,
      message: entityType === 'student'
        ? (record.isAlreadyMarked ? `የዛሬ መግቢያ አቴንዳንስ ቀደም ብሎ ተመዝግቧል!` : `የተማሪ መግቢያ (Check-in) በተሳካ ሁኔታ ተመዝግቧል!`)
        : (attendanceType === 'checkIn'
            ? `የሰራተኛ መግቢያ (Staff Check-in) በተሳካ ሁኔታ ተመዝግቧል!`
            : `የሰራተኛ መውጫ (Staff Check-out) በተሳካ ሁኔታ ተመዝግቧል!`),
      timestamp: new Date().toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    // Automatically reset scanner to scan next student in continuous mode
    if (isKioskMode) {
      setTimeout(() => {
        setScanResult(null);
        resumeScanning();
      }, 2500);
    }
  };

  const resumeScanning = () => {
    setScanResult(null);
    setIsScanning(true);
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(tick);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = img.width;
        offCanvas.height = img.height;
        const ctx = offCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            setErrorMsg(null);
            handleScannedCode(code.data.trim().toUpperCase());
          } else {
            setErrorMsg(tx("በተሰቀለው ፎቶ ላይ የQR ኮድ ማግኘት አልተቻለም። እባክዎ ጥራት ያለው ፎቶ ይጫኑ ወይም መታወቂያ በእጅ ያስገቡ። (Could not detect a valid QR code in the uploaded image. Please try a clearer photo or enter ID manually.)"));
            playInteractiveSound('wrong');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = manualStudentId.trim();
    if (!clean) return;
    setErrorMsg(null);
    handleScannedCode(clean);
    setManualStudentId('');
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[210] overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-fade-in"
      id="qr-scanner-modal-backdrop"
    >
      <div 
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        id="qr-scanner-modal-container"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{tx("የQR ኮድ ስካነር (QR Code Scanner)")}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Scan Student QR Code to Login or Register Attendance</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            id="qr-scanner-close-button"
            title={tx("ዝጋ (Close)")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs / Controls */}
        {!isLoggedIn ? (
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/10 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                playInteractiveSound('click');
                setScanMode('login');
                setScanResult(null);
                if (!isScanning && cameraPermission === 'granted') resumeScanning();
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                scanMode === 'login'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100'
              }`}
              id="scanner-tab-login"
            >
              <UserCheck className="w-4 h-4" />
              <span>{tx("ወደ ፖርታል መግቢያ (Portal Login)")}</span>
            </button>
            
            <button
              onClick={() => {
                playInteractiveSound('click');
                setScanMode('attendance');
                setScanResult(null);
                if (!isScanning && cameraPermission === 'granted') resumeScanning();
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                scanMode === 'attendance'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100'
              }`}
              id="scanner-tab-attendance"
            >
              <CalendarDays className="w-4 h-4" />
              <span>{tx("አቴንዳንስ መመዝገቢያ (Attendance)")}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/10 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-black text-indigo-900 dark:text-indigo-400">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>{tx("የተማሪዎች አቴንዳንስ መመዝገቢያ እና መረጃ መፈለጊያ (Students QR Reader)")}</span>
          </div>
        )}

        {/* Attendance Mode Specific Toggles: Check-In / Check-Out for Staff & Check-In for Students */}
        {scanMode === 'attendance' && (
          <div className="px-5 py-3 bg-emerald-50/50 dark:bg-emerald-950/10 border-b border-emerald-100/40 dark:border-emerald-900/20 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">{tx("አቴንዳንስ ዓይነት:")}</span>
              <div className="inline-flex rounded-xl p-1 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900 shadow-xs">
                <button
                  type="button"
                  onClick={() => { playInteractiveSound('click'); setAttendanceType('checkIn'); }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    attendanceType === 'checkIn'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🟢 {tx("መግቢያ (Check-in)")}
                </button>
                <button
                  type="button"
                  onClick={() => { playInteractiveSound('click'); setAttendanceType('checkOut'); }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    attendanceType === 'checkOut'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🟠 {tx("መውጫ (Check-out - ሰራተኛ ብቻ)")}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-800 dark:text-emerald-400">{tx("ፈጣን መመዝገቢያ (Kiosk)")}</span>
              <button
                onClick={() => {
                  playInteractiveSound('click');
                  setIsKioskMode(!isKioskMode);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isKioskMode ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
                id="scanner-kiosk-toggle"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isKioskMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Hidden canvas for image decoding */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input for uploading QR code images */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          className="hidden" 
          id="qr-image-upload-input"
        />

        {/* Scanner Content Body */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[320px] bg-slate-100/50 dark:bg-slate-950/30">
          {errorMsg ? (
            <div className="text-center p-6 max-w-sm space-y-4">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 leading-relaxed">{errorMsg}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{tx("በድጋሚ ሞክር (Retry Camera)")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{tx("የQR ፎቶ ጫን (Upload QR Image)")}</span>
                </button>
                
                <a 
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                >
                  <span>{tx("አዲስ ታብ ላይ ክፈት (Open in New Tab)")}</span>
                </a>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">{tx(
                "* ማሳሰቢያ፡ የካሜራ ፈቃድ ካልተገኘ ወይም በiFrame ምክንያት ከተከለከለ፣ ከላይ ባለው ቁልፍ የQR ፎቶ መጫን ወይም ከታች መታወቂያ በእጅ ማስገባት ይችላሉ። (Note: If camera is blocked, you can upload a QR image or enter student ID manually below.)"
              )}</p>
            </div>
          ) : cameraPermission === 'prompt' ? (
            <div className="text-center p-6 space-y-3">
              <Camera className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto animate-bounce" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{tx("ካሜራውን ለመክፈት ፍቃድ እየጠየቅን ነው...")}</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Please allow camera permissions in your browser to scan the QR codes.</p>
            </div>
          ) : (
            <>
              {/* Real-time Scan Status Banner */}
              <div className="w-full max-w-sm mb-4">
                {scanResult ? (
                  scanResult.success ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-2xl text-xs flex items-center gap-2 font-bold justify-center animate-fade-in shadow-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 animate-bounce" />
                      <span>{tx("ስካን ተሳክቷል! (Scan Successful!)")}</span>
                    </div>
                  ) : (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 p-2.5 rounded-2xl text-xs flex flex-col items-center gap-1 font-bold justify-center animate-fade-in shadow-xs">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
                        <span className="uppercase tracking-wide">{tx("የስካን ስህተት አጋጥሟል! (Scan Error!)")}</span>
                      </div>
                      <span className="text-[10px] text-rose-500/80 dark:text-rose-400/80 font-medium text-center">{tx("እባክዎ ትክክለኛውን የተማሪ QR ኮድ ያቅርቡ። (Please present a valid Student QR code)")}</span>
                    </div>
                  )
                ) : isScanning ? (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 p-2.5 rounded-2xl text-xs flex items-center gap-2 font-bold justify-center animate-fade-in">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500 shrink-0 animate-spin" />
                    <span>{tx("QR ኮዱን ለካሜራው ያቅርቡ... (Awaiting QR code scan...)")}</span>
                  </div>
                ) : (
                  <div className="bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-slate-400 p-2.5 rounded-2xl text-xs flex items-center gap-2 font-bold justify-center animate-fade-in">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{tx("ስካነር ተዘጋጅቷል (Scanner Standby)")}</span>
                  </div>
                )}
              </div>

              <div className={`relative w-full max-w-sm aspect-video sm:aspect-square bg-black rounded-3xl border-2 transition-all duration-300 overflow-hidden shadow-inner group ${
                scanResult 
                  ? scanResult.success 
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/20' 
                    : 'border-rose-500 shadow-lg shadow-rose-500/35 ring-2 ring-rose-500/20'
                  : 'border-slate-300 dark:border-slate-850 hover:border-indigo-400'
              }`}>
                {/* WebRTC Video Stream */}
                <video 
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  id="scanner-camera-feed"
                />

                {/* Laser Scanning Line Animation */}
                {isScanning && !scanResult && (
                  <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-md shadow-rose-500 top-0 animate-scan-laser z-10" />
                )}

                {/* Viewport scan square guide */}
                {!scanResult && (
                  <div className="absolute inset-0 flex items-center justify-center z-5">
                    <div className="w-48 h-48 border-2 border-dashed border-indigo-400 dark:border-indigo-400 rounded-2xl relative shadow-inner">
                      {/* Corner accents */}
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-600 rounded-tl-lg animate-pulse" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-600 rounded-tr-lg animate-pulse" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-600 rounded-bl-lg animate-pulse" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-600 rounded-br-lg animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Feedback Overlay upon scanning */}
                <AnimatePresence>
                  {scanResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={scanResult.success 
                        ? { opacity: 1, scale: 1 } 
                        : { opacity: 1, scale: 1, x: [0, -10, 10, -10, 10, -5, 5, 0] }
                      }
                      transition={{ duration: scanResult.success ? 0.35 : 0.55, ease: 'easeInOut' }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 ${
                        scanResult.success 
                          ? 'bg-emerald-950/95 text-white' 
                          : 'bg-rose-950/95 text-white'
                      }`}
                      id="scan-result-overlay"
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                        scanResult.success ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-rose-500/20 text-rose-400 animate-bounce'
                      }`}>
                        {scanResult.success ? (
                          <CheckCircle className="w-10 h-10" />
                        ) : (
                          <AlertTriangle className="w-10 h-10" />
                        )}
                      </div>

                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 mb-1">
                        {scanResult.timestamp} {scanResult.studentId && `| ${scanResult.studentId}`}
                      </span>
                      <h4 className="text-lg font-black">{scanResult.studentName}</h4>
                      <p className="text-xs mt-2 opacity-90 max-w-xs mx-auto leading-relaxed font-semibold">
                        {scanResult.message}
                      </p>

                      {/* Reset Button (If not in auto-kiosk mode) */}
                      {!isKioskMode && (
                        <button
                          onClick={resumeScanning}
                          className={`mt-4 px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 ${
                            scanResult.success 
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-white' 
                              : 'bg-rose-500 hover:bg-rose-400 text-white'
                          }`}
                          id="scanner-next-button"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{scanResult.success ? tx("ቀጣይ ተማሪ ስካን (Scan Next)") : tx("በድጋሚ ይሞክሩ (Try Again)")}</span>
                        </button>
                      )}

                      {isKioskMode && (
                        <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-300 font-bold animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />{tx(
                          "\n                          በ4 ሰከንድ ውስጥ በራሱ ዳግም ይጀምራል... (Auto-resuming in 4s...)\n                        "
                        )}</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Staff/Admin QR Login Options (For ease of use / testing) */}
        {scanMode === 'login' && isDemoAutoFillEnabled && (
          <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/25">
            <button
              type="button"
              onClick={() => {
                playInteractiveSound('click');
                setShowStaffQRs(!showStaffQRs);
              }}
              className="w-full px-5 py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
              id="staff-qr-collapse-toggle"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 animate-pulse text-indigo-600 dark:text-indigo-400" />
                <span>{tx("የአስተዳደር እና መምህራን QR መግቢያ ኮዶች (Staff QR Login)")}</span>
              </div>
              {showStaffQRs ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 animate-bounce" />
              )}
            </button>

            <AnimatePresence>
              {showStaffQRs && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden border-t border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900/60 p-4"
                  id="staff-qr-panel"
                >
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 text-left leading-relaxed">{tx(
                    "\n                    እነዚህን QR ኮዶች በሌላ ስልክ ስካን ማድረግ ወይም **ክሊክ በማድረግ** በቀጥታ ሲሙሌት አድርገው መግባት ይችላሉ። (Scan these QRs, or simply **click any card** to instantly simulate a scan!)\n                  "
                  )}</p>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Principal */}
                    <button 
                      type="button"
                      onClick={() => {
                        playInteractiveSound('success');
                        onLoginSuccess('ROLE-PRINCIPAL');
                        onClose();
                      }}
                      className="group cursor-pointer p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-center flex flex-col items-center hover:shadow-md"
                    >
                      <div className="relative mb-1 bg-white p-1 rounded-lg border border-slate-100 dark:border-slate-850 w-full flex justify-center">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=ROLE-PRINCIPAL" 
                          alt="Principal QR" 
                          className="w-14 h-14 object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-lg">
                          <span className="text-[8px] font-bold text-indigo-700 bg-white px-1 py-0.5 rounded shadow">Click to Login</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-900 dark:text-white block leading-tight">{tx("ርዕሰ መምህር")}</span>
                      <span className="text-[8px] text-slate-400 font-mono">Principal</span>
                    </button>

                    {/* Teacher */}
                    <button 
                      type="button"
                      onClick={() => {
                        playInteractiveSound('success');
                        onLoginSuccess('ROLE-TEACHER');
                        onClose();
                      }}
                      className="group cursor-pointer p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-center flex flex-col items-center hover:shadow-md"
                    >
                      <div className="relative mb-1 bg-white p-1 rounded-lg border border-slate-100 dark:border-slate-850 w-full flex justify-center">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=ROLE-TEACHER" 
                          alt="Teacher QR" 
                          className="w-14 h-14 object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-lg">
                          <span className="text-[8px] font-bold text-emerald-700 bg-white px-1 py-0.5 rounded shadow">Click to Login</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-900 dark:text-white block leading-tight">{tx("መምህር")}</span>
                      <span className="text-[8px] text-slate-400 font-mono">Teacher</span>
                    </button>

                    {/* Parent */}
                    <button 
                      type="button"
                      onClick={() => {
                        playInteractiveSound('success');
                        onLoginSuccess('ROLE-PARENT');
                        onClose();
                      }}
                      className="group cursor-pointer p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-amber-500 dark:hover:border-amber-500 transition-all text-center flex flex-col items-center hover:shadow-md"
                    >
                      <div className="relative mb-1 bg-white p-1 rounded-lg border border-slate-100 dark:border-slate-850 w-full flex justify-center">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=ROLE-PARENT" 
                          alt="Parent QR" 
                          className="w-14 h-14 object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-amber-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-lg">
                          <span className="text-[8px] font-bold text-amber-700 bg-white px-1 py-0.5 rounded shadow">Click to Login</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-900 dark:text-white block leading-tight">{tx("ወላጅ")}</span>
                      <span className="text-[8px] text-slate-400 font-mono">Parent</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Manual ID Input & Photo Upload Fallback Bar */}
        <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              {tx("መታወቂያ በእጅ ማስገቢያ ወይም የQR ፎቶ መስቀያ (Manual ID Entry / Upload QR)")}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Upload className="w-3 h-3" />
              <span>{tx("የQR ፎቶ ስቀል (Upload)")}</span>
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={manualStudentId}
              onChange={(e) => setManualStudentId(e.target.value)}
              placeholder={scanMode === 'attendance' ? tx("የተማሪ መታወቂያ አስገባ... (e.g. ID-1001)") : tx("መታወቂያ ወይም ኢሜይል... (e.g. ID-1001 or teacher@school.com)")}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!manualStudentId.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            >
              {tx("አስገባ (Enter)")}
            </button>
          </form>

          {/* Quick student chips for instant one-click testing */}
          {students && students.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">{tx("ናሙና:")}</span>
              {students.slice(0, 5).map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleScannedCode(st.id)}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-750 transition-colors shrink-0 cursor-pointer"
                  title={`${st.name} (${st.id})`}
                >
                  {st.id} ({st.name.split(' ')[0]})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              {isScanning ? tx("ካሜራው ገባሪ ነው (Camera Active)") : tx("ካሜራው ቆሟል (Camera Stopped)")}
            </span>
          </div>

          {true && (
            <button
              onClick={switchCamera}
              className="px-4 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-3xs"
              id="scanner-switch-camera-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{tx("ካሜራ ቀይር (Switch Camera)")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
