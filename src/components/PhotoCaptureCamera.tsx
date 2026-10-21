import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Check, Trash2, X, AlertCircle } from 'lucide-react';
import { playInteractiveSound } from './AudioEngine';
import { useLanguage } from './LanguageContext';

interface PhotoCaptureCameraProps {
  currentPhoto?: string;
  onPhotoCapture: (base64Photo: string | undefined) => void;
  label?: string;
  shape?: 'circle' | 'rounded';
}

export const PhotoCaptureCamera: React.FC<PhotoCaptureCameraProps> = ({
  currentPhoto,
  onPhotoCapture,
  label,
  shape = 'rounded'
}) => {
  const { tx } = useLanguage();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(currentPhoto || null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (currentPhoto !== undefined) {
      setCapturedPhoto(currentPhoto || null);
    }
  }, [currentPhoto]);

  // Clean up media stream when component unmounts or camera is deactivated
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    stopCameraStream();

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported on this browser or environment.');
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 640 },
            height: { ideal: 640 }
          },
          audio: false
        });
      } catch (firstErr) {
        // Fallback to basic video constraint if ideal facingMode/dimensions fail
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
      playInteractiveSound('click');
    } catch (err: any) {
      console.warn('Camera stream notice (handled gracefully):', err?.message || err);
      setCameraError(tx('ካሜራ መክፈት አልተቻለም። እባክዎን የካሜራ ፈቃድ ይስጡ ወይም ፎቶ ከስልክዎ ይጫኑ (Could not access camera. Please allow permission or upload photo file)'));
      setIsCameraActive(false);
      playInteractiveSound('wrong');
    }
  };

  const switchFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const snapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
    canvas.width = 400;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop square
    const startX = ((video.videoWidth || 480) - size) / 2;
    const startY = ((video.videoHeight || 480) - size) / 2;

    // Flip horizontally if facing user for natural mirror experience
    if (facingMode === 'user') {
      ctx.translate(400, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    onPhotoCapture(dataUrl);
    playInteractiveSound('success');
    stopCameraStream();
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(tx('እባክዎን ትክክለኛ የፎቶ ፋይል ይምረጡ (Please select an image file)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setCapturedPhoto(compressed);
          onPhotoCapture(compressed);
          playInteractiveSound('success');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    playInteractiveSound('click');
    setCapturedPhoto(null);
    onPhotoCapture(undefined);
    stopCameraStream();
    setIsCameraActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
          {label}
        </label>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Camera Live Stream Viewfinder */}
      {isCameraActive ? (
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-indigo-600 shadow-xl max-w-sm mx-auto">
          <div className="relative aspect-square w-full max-w-[320px] mx-auto overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />

            {/* Target circular framing guide */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
            </div>

            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              {tx('ካሜራ ክፍት ነው (Live Camera)')}
            </div>
          </div>

          {/* Camera controls */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={switchFacingMode}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title={tx('ካሜራ ቀይር (Switch Front/Back Camera)')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={snapPhoto}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-transform cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{tx('ፎቶ አንሳ (Snap Photo)')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setIsCameraActive(false);
              }}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title={tx('ዝጋ (Close Camera)')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Display Photo Preview or Default Avatar with Action Buttons */
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            <div
              className={`w-24 h-24 overflow-hidden border-2 border-indigo-200 dark:border-indigo-900 shadow-sm bg-white dark:bg-slate-800 flex items-center justify-center ${
                shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
              }`}
            >
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt="Staff Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                  <Camera className="w-7 h-7 mb-1 text-slate-300 dark:text-slate-600" />
                  <span className="text-[10px] font-bold text-slate-400">{tx('ፎቶ የለም')}</span>
                </div>
              )}
            </div>

            {capturedPhoto && (
              <button
                type="button"
                onClick={removePhoto}
                className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors"
                title={tx('ፎቶ አጥፋ (Remove Photo)')}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex-1 space-y-2 w-full">
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="font-bold block text-slate-800 dark:text-slate-200 mb-0.5">
                {tx('የሰራተኛ መታወቂያ ፎቶ (Profile Photo):')}
              </span>
              {tx('የካሜራ ቁልፉን በመጫን በቀጥታ ፎቶ ያንሱ ወይም ከስልክዎ/ኮምፒውተርዎ ፎቶ ይጫኑ')}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => startCamera()}
                className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-[1.02] active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{tx('በካሜራ አንሳ (Live Camera)')}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{tx('ፎቶ ጫን (Upload)')}</span>
              </button>

              {capturedPhoto && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-3 h-3" />
                  {tx('ፎቶ ተዘጋጅቷል')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{cameraError}</span>
        </div>
      )}
    </div>
  );
};
