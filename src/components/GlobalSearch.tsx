import React, { useState, useEffect, useRef } from 'react';
import { Student, Teacher, ClassSession, Course, Workspace } from '../types';
import { 
  Search, 
  User, 
  GraduationCap, 
  Calendar, 
  X, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  Phone, 
  Mail, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  CreditCard 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalSearchProps {
  students: Student[];
  teachers: Teacher[];
  sessions: ClassSession[];
  courses: Course[];
  currency: string;
  onNavigate: (tab: string, workspace: Workspace) => void;
}

type SearchResult = 
  | { type: 'student'; item: Student; id: string; name: string; subtitle: string }
  | { type: 'teacher'; item: Teacher; id: string; name: string; subtitle: string }
  | { type: 'session'; item: ClassSession; id: string; name: string; subtitle: string };

export default function GlobalSearch({
  students,
  teachers,
  sessions,
  courses,
  currency,
  onNavigate
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<{ type: 'student' | 'teacher' | 'session'; data: any } | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K to focus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search filter logic
  const getResults = (): SearchResult[] => {
    if (!query.trim()) return [];
    
    const cleanQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // 1. Search Students
    students.forEach(student => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      if (fullName.includes(cleanQuery) || student.email.toLowerCase().includes(cleanQuery)) {
        results.push({
          type: 'student',
          item: student,
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          subtitle: `Élève • ${student.gradeLevel} • ${student.email}`
        });
      }
    });

    // 2. Search Teachers
    teachers.forEach(teacher => {
      const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
      const subjectsStr = teacher.subjects.join(' ').toLowerCase();
      if (fullName.includes(cleanQuery) || teacher.email.toLowerCase().includes(cleanQuery) || subjectsStr.includes(cleanQuery)) {
        results.push({
          type: 'teacher',
          item: teacher,
          id: teacher.id,
          name: `${teacher.firstName} ${teacher.lastName}`,
          subtitle: `Professeur • ${teacher.subjects.join(', ')}`
        });
      }
    });

    // 3. Search Sessions
    sessions.forEach(session => {
      const course = courses.find(c => c.id === session.courseId);
      const courseTitle = course ? course.title : 'Session de soutien';
      const teacher = teachers.find(t => t.id === session.teacherId);
      const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : '';
      
      const matchCourse = courseTitle.toLowerCase().includes(cleanQuery);
      const matchTeacher = teacherName.toLowerCase().includes(cleanQuery);
      const matchDate = session.date.includes(cleanQuery);
      const matchRoom = session.room.toLowerCase().includes(cleanQuery);
      
      // Match students attending
      const attendingStudents = students.filter(s => session.studentIds.includes(s.id));
      const matchStudentName = attendingStudents.some(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(cleanQuery));

      if (matchCourse || matchTeacher || matchDate || matchRoom || matchStudentName) {
        results.push({
          type: 'session',
          item: session,
          id: session.id,
          name: courseTitle,
          subtitle: `Session • Le ${new Date(session.date).toLocaleDateString('fr-FR')} • Animée par ${teacherName || 'Inconnu'}`
        });
      }
    });

    return results.slice(0, 8); // return top 8 results
  };

  const results = getResults();

  // Keyboard navigation inside dropdown list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectItem(results[selectedIndex]);
      }
    }
  };

  const handleSelectItem = (res: SearchResult) => {
    setSelectedItem({ type: res.type, data: res.item });
    setIsOpen(false);
    setQuery('');
  };

  const getPackageLabel = (type: string) => {
    switch (type) {
      case 'groupe_mensuel': return 'Groupe (Paiement Mensuel)';
      case 'individuel_seance': return 'Individuel (Paiement par séance)';
      case 'forfait_10h': return 'Forfait 10 Heures';
      case 'forfait_20h': return 'Forfait 20 Heures';
      case 'forfait_30h': return 'Forfait 30 Heures';
      case 'abonnement_mensuel': return 'Abonnement Mensuel';
      default: return type;
    }
  };

  const getBadgeColorFinancial = (status: string) => {
    switch (status) {
      case 'paye': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'en_attente': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'en_retard': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const calculateAverageGrade = (grades: any[]) => {
    if (!grades || grades.length === 0) return 'N/A';
    const total = grades.reduce((acc, g) => acc + (g.score / g.maxScore) * 20, 0);
    return (total / grades.length).toFixed(1);
  };

  return (
    <div className="relative flex-1 max-w-md mx-4" ref={searchRef}>
      {/* Search Bar Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher élève, prof, session... (⌘K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-16 py-2 bg-slate-900/90 border border-slate-800 focus:border-sky-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-9 top-2.5 hover:text-white text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="absolute right-3 top-2 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] text-slate-400 font-mono select-none pointer-events-none">
          ⌘K
        </div>
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && query.trim() && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 right-0 mt-2 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[420px] overflow-y-auto backdrop-blur-xl"
          >
            <div className="p-3 border-b border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Résultats de recherche</span>
              <span className="text-[9px] text-slate-500">{results.length} trouvé{results.length > 1 ? 's' : ''}</span>
            </div>

            {results.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-slate-600" />
                <p className="text-xs">Aucun résultat pour "{query}"</p>
                <p className="text-[10px] text-slate-600 mt-1">Essayez un autre mot-clé ou vérifiez l'orthographe.</p>
              </div>
            ) : (
              <div className="p-1.5 divide-y divide-slate-800/30">
                {results.map((res, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={`${res.type}-${res.id}`}
                      onClick={() => handleSelectItem(res)}
                      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                          : 'hover:bg-slate-800/40 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${
                        res.type === 'student' ? 'bg-sky-500/10 text-sky-400' :
                        res.type === 'teacher' ? 'bg-indigo-500/10 text-indigo-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {res.type === 'student' && <User size={14} />}
                        {res.type === 'teacher' && <GraduationCap size={14} />}
                        {res.type === 'session' && <Calendar size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate text-white">
                          {res.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {res.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Information Quick View Drawer / Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${
                    selectedItem.type === 'student' ? 'bg-sky-500/10 text-sky-400' :
                    selectedItem.type === 'teacher' ? 'bg-indigo-500/10 text-indigo-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {selectedItem.type === 'student' && <User size={20} />}
                    {selectedItem.type === 'teacher' && <GraduationCap size={20} />}
                    {selectedItem.type === 'session' && <Calendar size={20} />}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Aperçu direct</span>
                    <h2 className="text-base font-black text-white mt-0.5">
                      {selectedItem.type === 'student' && `${selectedItem.data.firstName} ${selectedItem.data.lastName}`}
                      {selectedItem.type === 'teacher' && `${selectedItem.data.firstName} ${selectedItem.data.lastName}`}
                      {selectedItem.type === 'session' && (courses.find(c => c.id === selectedItem.data.courseId)?.title || 'Cours de soutien')}
                    </h2>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. STUDENT QUICK VIEW */}
                {selectedItem.type === 'student' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wide">Informations Générales</h3>
                        <div className="space-y-1.5 text-xs text-slate-300">
                          <p>Niveau : <strong className="text-white">{selectedItem.data.gradeLevel}</strong></p>
                          <p className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedItem.data.email || 'Pas d\'email'}</p>
                          <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedItem.data.phone || 'Pas de téléphone'}</p>
                          <p>Inscrit le : <strong className="text-white">{new Date(selectedItem.data.enrollmentDate).toLocaleDateString('fr-FR')}</strong></p>
                        </div>
                      </div>

                      <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Forfait &amp; Solde</h3>
                        <div className="space-y-2 text-xs text-slate-300">
                          <div>
                            <span className="font-semibold block text-white">{getPackageLabel(selectedItem.data.packageType)}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Total d'heures : {selectedItem.data.totalHours}h</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] mt-1">
                            <span>Consommées : {selectedItem.data.usedHours}h</span>
                            <span>Moyenne : {calculateAverageGrade(selectedItem.data.grades)}/20</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div 
                              className="bg-sky-500 h-1.5 rounded-full transition-all" 
                              style={{ width: `${Math.min(100, Math.round((selectedItem.data.usedHours / selectedItem.data.totalHours) * 100))}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-semibold">Solde : {selectedItem.data.balance} {currency}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] border font-bold ${getBadgeColorFinancial(selectedItem.data.paymentStatus)}`}>
                              {selectedItem.data.paymentStatus === 'paye' ? 'PAYÉ' : selectedItem.data.paymentStatus === 'en_attente' ? 'EN ATTENTE' : 'EN RETARD'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Evaluations history */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-sky-400" />
                        Évaluations Récentes ({selectedItem.data.grades?.length || 0})
                      </h4>
                      {(!selectedItem.data.grades || selectedItem.data.grades.length === 0) ? (
                        <p className="text-[11px] text-slate-500 bg-slate-950/20 p-4 rounded-xl border border-dashed border-slate-800 text-center">Aucune évaluation saisie pour le moment.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedItem.data.grades.map((grade: any) => (
                            <div key={grade.id} className="p-3 bg-slate-950/30 rounded-xl border border-slate-800/60 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-bold text-white">{grade.title}</p>
                                <p className="text-[10px] text-slate-400">{grade.subject} • {new Date(grade.date).toLocaleDateString('fr-FR')}</p>
                              </div>
                              <span className="font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg text-xs">
                                {grade.score}/{grade.maxScore}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Compte-rendus */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        Comptes-rendus Pédagogiques ({selectedItem.data.progressReports?.length || 0})
                      </h4>
                      {(!selectedItem.data.progressReports || selectedItem.data.progressReports.length === 0) ? (
                        <p className="text-[11px] text-slate-500 bg-slate-950/20 p-4 rounded-xl border border-dashed border-slate-800 text-center">Aucun compte-rendu disponible.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedItem.data.progressReports.map((report: any) => (
                            <div key={report.id} className="p-4 bg-slate-950/30 rounded-xl border border-slate-800/60 text-xs space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-200">{report.sessionTitle}</span>
                                <span className="text-[10px] text-slate-500">{new Date(report.date).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <p className="text-slate-300 leading-relaxed"><strong className="text-slate-400">Travail fait:</strong> {report.workDone}</p>
                              {report.homework && <p className="text-slate-300 leading-relaxed"><strong className="text-slate-400 font-normal">Devoirs:</strong> {report.homework}</p>}
                              {report.comment && <p className="text-slate-400 italic">"{report.comment}"</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. TEACHER QUICK VIEW */}
                {selectedItem.type === 'teacher' && (
                  <div className="space-y-6">
                    <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Informations de contact</h3>
                        <div className="space-y-1.5 text-xs text-slate-300">
                          <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedItem.data.email}</p>
                          <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedItem.data.phone}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Statut &amp; Salaire</h3>
                        <div className="space-y-1.5 text-xs text-slate-300">
                          <p>Tarif Horaire : <strong className="text-white">{selectedItem.data.hourlySalary} {currency}/h</strong></p>
                          <p className="flex items-center gap-1.5">
                            Statut : 
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${selectedItem.data.status === 'actif' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                              {selectedItem.data.status === 'actif' ? 'ACTIF' : 'INACTIF'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Matières Enseignées</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.data.subjects.map((subject: string) => (
                          <span key={subject} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-bold text-indigo-300">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Associated sessions */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Sessions de cours associées</h4>
                      {(() => {
                        const teacherSessions = sessions.filter(s => s.teacherId === selectedItem.data.id);
                        if (teacherSessions.length === 0) {
                          return <p className="text-[11px] text-slate-500 bg-slate-950/20 p-4 rounded-xl border border-dashed border-slate-800 text-center">Aucune session planifiée avec ce professeur.</p>;
                        }
                        return (
                          <div className="space-y-2">
                            {teacherSessions.map((session) => {
                              const course = courses.find(c => c.id === session.courseId);
                              return (
                                <div key={session.id} className="p-3 bg-slate-950/30 rounded-xl border border-slate-800/60 flex justify-between items-center text-xs">
                                  <div>
                                    <p className="font-bold text-white">{course?.title || 'Cours de soutien'}</p>
                                    <p className="text-[10px] text-slate-400">Le {new Date(session.date).toLocaleDateString('fr-FR')} • {session.startTime} - {session.endTime}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                    session.status === 'planifié' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 
                                    session.status === 'terminé' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  }`}>
                                    {session.status.toUpperCase()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* 3. SESSION QUICK VIEW */}
                {selectedItem.type === 'session' && (
                  <div className="space-y-6">
                    <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Date &amp; Heures</span>
                          <p className="flex items-center gap-1.5 font-semibold text-white">
                            <Clock className="w-3.5 h-3.5 text-sky-400" />
                            {new Date(selectedItem.data.date).toLocaleDateString('fr-FR')} ({selectedItem.data.startTime} - {selectedItem.data.endTime})
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Lieu / Salle</span>
                          <p className="flex items-center gap-1.5 font-semibold text-white">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            {selectedItem.data.room}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Statut</span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${
                            selectedItem.data.status === 'planifié' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 
                            selectedItem.data.status === 'terminé' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {selectedItem.data.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-800/80 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Professeur</span>
                          <p className="font-semibold text-white">
                            {(() => {
                              const t = teachers.find(teach => teach.id === selectedItem.data.teacherId);
                              return t ? `${t.firstName} ${t.lastName}` : 'Aucun';
                            })()}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Niveau scolaire du cours</span>
                          <p className="font-semibold text-white">
                            {courses.find(c => c.id === selectedItem.data.courseId)?.level || 'Non spécifié'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Attending Students */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Élèves inscrits à cette session</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(() => {
                          const attending = students.filter(s => selectedItem.data.studentIds.includes(s.id));
                          if (attending.length === 0) {
                            return <p className="text-xs text-slate-500 italic">Aucun élève inscrit.</p>;
                          }
                          return attending.map(student => (
                            <div key={student.id} className="p-3 bg-slate-950/30 rounded-xl border border-slate-800/60 flex items-center gap-2.5 text-xs">
                              <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                                {student.firstName[0]}
                              </div>
                              <div>
                                <p className="font-bold text-white">{student.firstName} {student.lastName}</p>
                                <p className="text-[10px] text-slate-500">{student.gradeLevel}</p>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Summary Pedagogical */}
                    {selectedItem.data.summary && (
                      <div className="p-4 bg-slate-950/30 border border-slate-800/60 rounded-xl space-y-2.5 text-xs">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Compte-rendu de la séance</h4>
                        <div className="space-y-1.5 text-slate-300">
                          <p><strong className="text-slate-400 font-normal">Contenu abordé :</strong> {selectedItem.data.summary.workDone || 'Non renseigné'}</p>
                          <p><strong className="text-slate-400 font-normal">Devoirs demandés :</strong> {selectedItem.data.summary.homework || 'Aucun'}</p>
                          <p className="capitalize">
                            <strong className="text-slate-400 font-normal">Comportement général :</strong> 
                            <span className="font-semibold text-white ml-1">{selectedItem.data.summary.globalBehavior || 'moyen'}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Modal Footer / Navigation Actions */}
              <div className="p-5 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-2.5">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    if (selectedItem.type === 'student') {
                      onNavigate('students', 'finance');
                    } else if (selectedItem.type === 'teacher') {
                      onNavigate('teachers', 'finance');
                    } else if (selectedItem.type === 'session') {
                      onNavigate('planning', 'planning');
                    }
                    setSelectedItem(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-500/10"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Gérer dans l'onglet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
