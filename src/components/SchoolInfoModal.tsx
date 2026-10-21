import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, BookOpen, Award, CheckCircle } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface SchoolInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolConfig: any;
  themeColor: string;
}

export const SchoolInfoModal: React.FC<SchoolInfoModalProps> = ({ isOpen, onClose, schoolConfig, themeColor }) => {
  const { tx } = useLanguage();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className={`p-6 border-b border-slate-200 dark:border-slate-800 bg-${themeColor}-50/50 dark:bg-${themeColor}-900/20 flex items-start justify-between`}>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className={`w-6 h-6 text-${themeColor}-600 dark:text-${themeColor}-400`} />
                {schoolConfig.nameAmh}
              </h2>
              <p className={`text-sm font-medium text-${themeColor}-600 dark:text-${themeColor}-400 mt-1`}>
                {schoolConfig.nameEng}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
            
            {/* History Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5" />{tx(" የትምህርት ቤቱ ታሪክ (School History)\n              ")}</h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                  {schoolConfig.history || tx(
                    "ተቋሙ በ1990 ዓ.ም ተመስርቶ በስነ-ምግባር የታነጹ ዜጎችን በማፍራት ላይ ይገኛል። (Established in 1998, we have been producing well-disciplined citizens.)"
                  )}
                </p>
              </div>
            </div>

            {/* Mission Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Award className="w-4.5 h-4.5" />{tx(" ተልዕኮና ራዕይ (Mission & Vision)\n              ")}</h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                  {schoolConfig.mission || tx(
                    "ጥራት ያለው ትምህርት በመስጠት ብቁና ተወዳዳሪ ተማሪዎችን ማፍራት። (To provide quality education and produce competent students.)"
                  )}
                </p>
              </div>
            </div>

            {/* Accreditation Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5" />{tx(" የዕውቅና ደረጃ (Accreditation)\n              ")}</h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm font-medium">
                  {schoolConfig.accreditation || tx(
                    "ከትምህርት ሚኒስቴር ሙሉ ዕውቅና የተሰጠው (Fully Accredited by the Ministry of Education)"
                  )}
                </p>
              </div>
            </div>

          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
             <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
              >{tx("\n                ዝጋ (Close)\n              ")}</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
