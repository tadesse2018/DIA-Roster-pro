import React, { useState, useEffect } from 'react';
import { Mail, Trash2, ChevronDown, ChevronUp, CheckCircle, Clock, Info, Send } from 'lucide-react';
import { ParentNotificationService, SimulatedEmail } from '../lib/notificationService';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageContext';

export const SimulatedEmailOutbox: React.FC = () => {
  const { tx } = useLanguage();
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = ParentNotificationService.subscribe((updatedEmails) => {
      setEmails(updatedEmails);
    });
    return unsubscribe;
  }, []);

  const handleClear = () => {
    ParentNotificationService.clearInbox();
    setExpandedId(null);
    setShowConfirm(false);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString('am-ET', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm animate-pulse">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[var(--text-primary)] font-black">{tx("\n                📧 የወላጅ ኢሜል ማሳወቂያ ሲሙሌተር\n              ")}</h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest animate-bounce">
                Simulation Active
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-bold mt-1">{tx(
              "\n              ተማሪ ሲመዘገብ ለወላጅ በራስ-ሰር የሚላኩ የኢሜል ማሳወቂያዎች መከታተያ (Simulated automated outbox for parent notification triggers)\n            "
            )}</p>
          </div>
        </div>
        
        {emails.length > 0 && (
          <div className="flex items-center gap-2">
            {showConfirm ? (
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-1 rounded-xl">
                <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold px-1.5">{tx("\n                  እርግጠኛ ነዎት? (Confirm?)\n                ")}</span>
                <button
                  onClick={handleClear}
                  className="px-2 py-1 bg-rose-600 text-white hover:bg-rose-700 text-[10px] font-black rounded-lg transition-all cursor-pointer"
                >{tx("\n                  አዎ (Yes)\n                ")}</button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-2 py-1 bg-[var(--bg-input)] dark:bg-slate-800 text-[var(--text-secondary)] font-bold dark:text-slate-300 hover:bg-slate-200 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                >{tx("\n                  አይ (No)\n                ")}</button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{tx("ሲሙሌሽን አጽዳ (Clear Outbox)")}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-app)]/50">
          <div className="p-3 bg-[var(--bg-input)] text-[var(--text-secondary)] font-bold rounded-full mb-3">
            <Send className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h4 className="text-sm font-bold text-[var(--text-primary)] font-black">{tx("እስካሁን የተላከ የኢሜል ማሳወቂያ የለም")}</h4>
          <p className="text-xs text-[var(--text-secondary)] font-bold max-w-md mt-1.5 leading-relaxed">{tx(
            "\n            በPrincipal ወይም በTeacher ክፍል ውስጥ አዲስ ተማሪ በተሳካ ሁኔታ ሲመዘገብ፣ ለወላጅ በራስ-ሰር የሚላከው የኢሜል ማሳወቂያ እዚህ ላይ በቀጥታ ይፈጠራል!\n          "
          )}</p>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[var(--text-primary)] bg-[var(--bg-card)] px-3 py-1.5 rounded-lg border border-[var(--border-color)] font-bold shadow-sm">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{tx(
              "የወላጅ ኢሜል ባይሞላም ሲስተሙ በራስ-ሰር አስመስሎ ይልካል። (Always simulates even if parent email is left blank!)"
            )}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {emails.map((email) => {
              const isExpanded = expandedId === email.id;
              return (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`border rounded-xl transition-all ${
                    isExpanded 
                      ? 'border-indigo-400 bg-[var(--bg-card)] shadow-md' 
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-200 hover:shadow-xs'
                  }`}
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : email.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${isExpanded ? 'bg-indigo-100 text-indigo-700' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] font-bold'}`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-black text-[var(--text-primary)] font-black truncate">
                            {email.studentName}
                          </span>
                          <span className="text-[10px] bg-[var(--bg-input)] text-[var(--text-secondary)] font-bold px-1.5 py-0.5 rounded font-mono">
                            {email.studentId}
                          </span>
                          <span className="text-[10px] text-[var(--text-secondary)] font-bold font-medium">{tx("\n                            ወደ: ")}{email.to}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)] font-black mt-1 truncate">
                          {email.subject}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--border-color)]">
                      <span className="text-[10px] text-[var(--text-secondary)] font-bold font-mono">
                        ⏱️ {formatDate(email.timestamp)}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {email.status === 'Delivered' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>{tx(
                            "\n                            ደርሷል (Delivered)\n                          "
                          )}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>{tx(
                            "\n                            በመላክ ላይ... (Sending)\n                          "
                          )}</span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[var(--text-secondary)] font-bold" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] font-bold" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Email Body Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-[var(--border-color)]"
                      >
                        <div className="p-4 bg-[var(--bg-input)]/50 space-y-3">
                          {/* Simulated Email Client Header */}
                          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-lg p-3 text-xs space-y-1.5 shadow-2xs">
                            <div className="flex justify-between border-b border-[var(--border-color)] pb-1.5 mb-1.5 text-[var(--text-secondary)] font-bold">
                              <span className="font-semibold uppercase tracking-wider text-[9px] text-indigo-600/80">{tx("Simulated Email Client (ኢሜይል ሲሙሌተር)")}</span>
                              <span className="font-mono text-[9px]">{email.id}</span>
                            </div>
                            <div>
                              <strong className="text-[var(--text-secondary)] font-bold">{tx("ከ (From):")}</strong> <span className="text-[var(--text-primary)] font-black font-bold">{tx("office@diligentschool.edu (የደሊጀንት አካዳሚ)")}</span>
                            </div>
                            <div>
                              <strong className="text-[var(--text-secondary)] font-bold">{tx("ለ (To):")}</strong> <span className="text-indigo-600 font-bold font-mono">{email.to}</span>
                            </div>
                            <div>
                              <strong className="text-[var(--text-secondary)] font-bold">{tx("ርዕስ (Subject):")}</strong> <span className="text-[var(--text-primary)] font-black font-extrabold">{email.subject}</span>
                            </div>
                          </div>

                          {/* Email Content Box */}
                          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
                            {/* Brand Header */}
                            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🏫</span>
                                <div>
                                  <h5 className="font-black text-[var(--text-primary)] font-black text-xs tracking-tight">{tx("ኪብር መካከለኛ ደረጃ ትምህርት ቤት")}</h5>
                                  <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest font-bold">Diligent Academy</p>
                                </div>
                              </div>
                              <span className="text-[9px] text-[var(--text-secondary)] font-bold font-mono">{new Date(email.timestamp).toLocaleDateString('am-ET')}</span>
                            </div>

                            {/* Main Text Content */}
                            <div className="text-[var(--text-primary)] font-black text-xs leading-relaxed space-y-3 whitespace-pre-line font-medium border-l-2 border-indigo-500/30 pl-3">
                              {email.body}
                            </div>

                            {/* Footer Banner */}
                            <div className="border-t border-[var(--border-color)] pt-3 text-[10px] text-[var(--text-secondary)] font-bold text-center">{tx(
                              "\n                              ይህ የኢሜል ማሳወቂያ ሲሙሌሽን ማሳያ ሲሆን ተማሪ ሲመዘገብ የሚላክበትን ትክክለኛ ሁኔታ ያሳያል።\n                              "
                            )}<br />
                              <span className="font-mono text-[9px]">© 2026 Diligent School Management System. All rights reserved.</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
