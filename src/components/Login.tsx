import React, { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { LogIn, Compass, GraduationCap, Calendar, Users, ShieldAlert, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError("Le pop-up d'authentification a été bloqué par votre navigateur. Veuillez autoriser les pop-ups pour ce site et réessayer.");
      } else {
        setError("Impossible de se connecter avec Google. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-slate-100">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.1),transparent_50%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6"
      >
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center font-display font-black text-white text-2xl shadow-xl shadow-sky-500/20">
            PS
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black font-display tracking-tight text-white uppercase">
              PILOTAGE SOUTIEN
            </h1>
            <span className="text-[10px] text-sky-400 uppercase tracking-widest font-black font-mono px-2 py-0.5 bg-slate-950 rounded-full border border-slate-800">
              Terminal d'Administration
            </span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 grid grid-cols-2 gap-4 text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg shrink-0">
              <Calendar size={14} />
            </div>
            <span className="text-[10.5px] font-semibold leading-tight">Plannings Salles</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
              <Users size={14} />
            </div>
            <span className="text-[10.5px] font-semibold leading-tight">Forfaits Éléves</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-violet-500/10 text-violet-400 rounded-lg shrink-0">
              <BookOpen size={14} />
            </div>
            <span className="text-[10.5px] font-semibold leading-tight">Cours & Tarifs</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
              <GraduationCap size={14} />
            </div>
            <span className="text-[10.5px] font-semibold leading-tight">Paies Professeurs</span>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs flex items-start gap-2">
            <ShieldAlert size={16} className="shrink-0 text-rose-400 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Google sign in button */}
        <div className="space-y-4 pt-2">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 px-5 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg hover:shadow-white/5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-slate-900 border-t-transparent animate-spin"></span>
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>Se connecter avec Google</span>
          </button>
        </div>

        <div className="text-center text-[10px] text-slate-500">
          <p>Accès réservé aux administrateurs autorisés.</p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <Compass size={11} className="text-sky-400" />
            <span>Pilotage décisionnel & sécurisé</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
