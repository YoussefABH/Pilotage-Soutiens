import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  GraduationCap, 
  Users, 
  Phone, 
  Mail, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  UserCheck, 
  ShieldAlert, 
  Send,
  User,
  HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateUserProfile } from '../lib/firebase';

interface GuestSpaceProps {
  userId: string;
  userEmail: string;
  onProfileUpdated: () => void;
  existingProfile?: any;
}

export default function GuestSpace({ userId, userEmail, onProfileUpdated, existingProfile }: GuestSpaceProps) {
  // If user already filled their onboarding form, we show the pending approval view.
  const [firstName, setFirstName] = useState(existingProfile?.firstName || '');
  const [lastName, setLastName] = useState(existingProfile?.lastName || '');
  const [phone, setPhone] = useState(existingProfile?.phone || '');
  const [userType, setUserType] = useState<'student' | 'parent'>(existingProfile?.userType || 'student');
  const [gradeLevel, setGradeLevel] = useState(existingProfile?.gradeLevel || '3ème');
  const [parentContact, setParentContact] = useState(existingProfile?.parentContact || '');
  const [childCode, setChildCode] = useState(existingProfile?.childCode || '');
  const [onboardingSubmitted, setOnboardingSubmitted] = useState(existingProfile?.status === 'pending' || !!existingProfile?.userType);
  const [pairingCode, setPairingCode] = useState(existingProfile?.pairingCode || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generate pairing code once if they select student and submit or when mounted if student
  useEffect(() => {
    if (!pairingCode && userType === 'student') {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = 'PS-';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setPairingCode(code);
    }
  }, [userType, pairingCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }

    setLoading(true);
    try {
      const dataToSave: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: userEmail,
        userType,
        status: 'pending',
        updatedAt: new Date().toISOString(),
      };

      if (userType === 'student') {
        dataToSave.gradeLevel = gradeLevel;
        dataToSave.pairingCode = pairingCode;
        if (parentContact.trim()) {
          dataToSave.parentContact = parentContact.trim();
        }
      } else {
        if (childCode.trim()) {
          dataToSave.childCode = childCode.trim().toUpperCase();
        }
      }

      await updateUserProfile(userId, dataToSave);
      setOnboardingSubmitted(true);
      setSuccess("Vos informations ont bien été transmises à l'administration !");
      onProfileUpdated();
    } catch (err: any) {
      console.error(err);
      setError("Une erreur est survenue lors de l'enregistrement de votre dossier.");
    } finally {
      setLoading(false);
    }
  };

  const reviews = [
    {
      text: "Grâce aux cours particuliers de Pilotage Soutien, notre fils Lucas a retrouvé confiance et ses notes en mathématiques ont grimpé !",
      author: "Thomas",
      role: "Parent de Lucas (3ème)",
      stars: 5
    },
    {
      text: "Les professeurs sont à l'écoute et très compétents. Le suivi par forfait d'heures est super transparent et pratique.",
      author: "Sarah",
      role: "Élève en Terminale",
      stars: 5
    },
    {
      text: "Le planning en ligne nous permet de gérer les cours de manière autonome sans stress. Une équipe en or !",
      author: "Camille",
      role: "Maman de Sofia (6ème)",
      stars: 5
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Introduction / Brand Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-sky-400"
        >
          <Sparkles size={14} className="animate-pulse text-sky-400" />
          <span>Notre Engagement, Votre Réussite Scolaire</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-black font-display tracking-tight text-white uppercase leading-none"
        >
          Bienvenue chez <span className="text-sky-400 bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Pilotage Soutien</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Un accompagnement scolaire sur mesure de premier choix pour libérer le potentiel de chaque élève. 
          Des professeurs rigoureusement sélectionnés, un suivi rigoureux en temps réel et des outils modernes 
          de pilotage de la progression.
        </motion.p>
      </div>

      {/* School Presentation & Stats Portal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Professeurs Certifiés</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nos enseignants sont des professionnels de l'éducation nationale ou des diplômés de grandes écoles, formés à notre méthodologie active.
            </p>
          </div>
          <span className="text-xs text-sky-400 font-bold tracking-widest uppercase">Équipe Dédiée</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Suivi & Flexibilité</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consommation d'heures à la minute, fiches de suivi pédagogiques détaillées après chaque cours et plannings interactifs.
            </p>
          </div>
          <span className="text-xs text-indigo-400 font-bold tracking-widest uppercase">Forfaits Transparents</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Progression Garantie</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Amélioration mesurable du niveau et du comportement scolaire dès les premiers cours, avec des objectifs personnalisés.
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-bold tracking-widest uppercase">Moyenne de +3.5 Points</span>
        </div>
      </div>

      {/* Main interactive area: Onboarding form OR Pending Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Onboarding Wizard (Left/Main side) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <AnimatePresence mode="wait">
            {!onboardingSubmitted ? (
              <motion.div
                key="form-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <HeartHandshake className="text-sky-400" size={20} />
                    Création de votre fiche d'inscription
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Renseignez vos informations initiales pour configurer votre compte. L'administrateur validera ensuite votre accès.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Role Type Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase">Qui êtes-vous ? *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserType('student')}
                        className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${userType === 'student' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        <GraduationCap size={16} />
                        <span>Je suis un Élève</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType('parent')}
                        className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${userType === 'parent' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        <Users size={16} />
                        <span>Je suis un Parent</span>
                      </button>
                    </div>
                  </div>

                  {/* Identity Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ex: Lucas"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 text-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Nom de famille *</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Ex: Bernard"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 text-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Numéro de téléphone *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: 06 12 34 56 78"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 text-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
                    />
                  </div>

                  {/* Student Specific Fields */}
                  {userType === 'student' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-2 border-t border-slate-800"
                    >
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase">Niveau scolaire *</label>
                        <select
                          value={gradeLevel}
                          onChange={(e) => setGradeLevel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 text-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
                        >
                          <option value="Primaire">Primaire</option>
                          <option value="6ème">6ème</option>
                          <option value="5ème">5ème</option>
                          <option value="4ème">4ème</option>
                          <option value="3ème">3ème</option>
                          <option value="Seconde">Seconde</option>
                          <option value="Première">Première</option>
                          <option value="Terminale">Terminale</option>
                          <option value="Supérieur">Études Supérieures / Autre</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <label className="text-xs font-bold text-slate-400 uppercase">Email ou Tél Parent (Facultatif)</label>
                          <span className="text-[10px] text-slate-500">Pour lier vos comptes</span>
                        </div>
                        <input
                          type="text"
                          value={parentContact}
                          onChange={(e) => setParentContact(e.target.value)}
                          placeholder="Ex: maman@gmail.com ou 06 99 ..."
                          className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 text-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
                        />
                        {parentContact.trim() && (
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 mt-2 space-y-1">
                            <span className="text-[10px] text-sky-400 font-mono font-bold uppercase tracking-wider block">Code de liaison généré :</span>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-black font-mono tracking-widest text-white">{pairingCode}</span>
                              <span className="text-[9px] text-slate-500 text-right max-w-[200px]">Partagez ce code temporaire de validation avec votre parent pour lier vos fiches.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Parent Specific Fields */}
                  {userType === 'parent' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-2 border-t border-slate-800"
                    >
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <label className="text-xs font-bold text-slate-400 uppercase">Code de liaison élève (Facultatif)</label>
                          <span className="text-[10px] text-slate-500">Fourni par votre enfant</span>
                        </div>
                        <input
                          type="text"
                          value={childCode}
                          onChange={(e) => setChildCode(e.target.value)}
                          placeholder="Ex: PS-R39F"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 text-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none uppercase font-mono tracking-wider transition-all"
                        />
                        <p className="text-[10px] text-slate-500">
                          Si votre enfant est déjà inscrit, indiquez son code de liaison. Sinon, laissez vide.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                      <ShieldAlert size={14} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle size={14} className="shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-600/15"
                  >
                    {loading ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    ) : (
                      <>
                        <span>Soumettre mon dossier d'inscription</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="pending-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-center py-6 space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 animate-pulse">
                  <Clock size={32} />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">Dossier en cours d'analyse</h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Vos informations d'inscription ont bien été transmises sous le profil <span className="font-bold text-sky-400 capitalize">{userType === 'student' ? 'Élève' : 'Parent'}</span>. 
                    L'équipe administrative de <span className="text-white font-semibold">Pilotage Soutien</span> examine votre demande.
                  </p>
                </div>

                {existingProfile?.pairingCode && userType === 'student' && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 max-w-sm mx-auto">
                    <span className="text-[10px] text-sky-400 font-mono font-bold uppercase tracking-wider block mb-1">Code de liaison pour votre parent :</span>
                    <span className="text-xl font-black font-mono tracking-widest text-white block">{existingProfile.pairingCode}</span>
                  </div>
                )}

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-w-md mx-auto text-left space-y-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-slate-800 pb-2">Que faire maintenant ?</span>
                  <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                    <li>Contactez l'administration pour accélérer l'activation manuelle de votre espace.</li>
                    <li>Expliquez brièvement vos besoins scolaires, vos matières cibles et vos disponibilités.</li>
                    <li>Dès l'activation, vous recevrez un accès immédiat à votre tableau de bord de suivi.</li>
                  </ul>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                  <a
                    href="mailto:youssef.a.b.h@gmail.com"
                    className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer border border-slate-700/50"
                  >
                    <Mail size={14} />
                    <span>Envoyer un E-mail</span>
                  </a>
                  <button
                    onClick={() => setOnboardingSubmitted(false)}
                    className="inline-flex items-center justify-center gap-2 bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer border border-sky-500/20"
                  >
                    <span>Modifier mes informations</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* School Showcase, Contacts & Live Reviews (Right/Side column) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Reviews Slider widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Avis de nos élèves & parents</span>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">★ 4.9/5</span>
            </div>
            
            <div className="space-y-4">
              {reviews.map((rev, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/60 relative space-y-2">
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{rev.text}"
                  </p>
                  <div className="flex justify-between items-center pt-1">
                    <div>
                      <h4 className="text-xs font-bold text-white">{rev.author}</h4>
                      <p className="text-[10px] text-slate-500">{rev.role}</p>
                    </div>
                    <div className="text-amber-400 text-xs font-bold">
                      {"★".repeat(rev.stars)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Support & Administration Contact Details */}
          <div className="bg-gradient-to-br from-slate-900 to-sky-950/20 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Secrétariat & Support</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pour toute question d'inscription, d'affectation de professeur ou d'activation de compte, n'hésitez pas à nous joindre.
            </p>
            
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="p-1.5 bg-slate-950 rounded-lg text-sky-400">
                  <Mail size={14} />
                </div>
                <a href="mailto:youssef.a.b.h@gmail.com" className="hover:underline font-medium">youssef.a.b.h@gmail.com</a>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="p-1.5 bg-slate-950 rounded-lg text-indigo-400">
                  <Phone size={14} />
                </div>
                <span className="font-medium">+33 (0)6 12 34 56 78</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="p-1.5 bg-slate-950 rounded-lg text-emerald-400">
                  <UserCheck size={14} />
                </div>
                <span className="font-semibold text-emerald-400">Youssef Ait Elhaj (Directeur)</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
