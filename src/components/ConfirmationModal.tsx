import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-500" /> {title}
              </h3>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 text-sm text-slate-300">
              {message}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={onClose} className="px-4 py-2 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-950 transition-all cursor-pointer">
                Annuler
              </button>
              <button onClick={() => { onConfirm(); onClose(); }} className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/15 cursor-pointer">
                Confirmer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
