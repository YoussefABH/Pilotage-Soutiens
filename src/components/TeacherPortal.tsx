import React, { useState, useEffect } from 'react';
import { Student, ClassSession, Course, Teacher, Objective, Theme, StudentGrade, ProgressReport, AttendanceRecord, SessionSummary } from '../types';
import { 
  Calendar, 
  User, 
  Clock, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  CreditCard, 
  MessageSquare, 
  History, 
  Compass, 
  Download, 
  CheckCircle2, 
  Send, 
  Star, 
  Search, 
  ChevronRight, 
  Award, 
  Lock, 
  ArrowRight, 
  Sparkles,
  Info,
  BookOpen,
  Plus,
  Users,
  Check,
  CheckSquare,
  FileCheck2,
  Euro,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface TeacherPortalProps {
  teacher: Teacher;
  students: Student[];
  sessions: ClassSession[];
  courses: Course[];
  objectives: Objective[];
  themes: Theme[];
  currentTab: string;
  onTabChange: (tab: string) => void;
  onUpdateSession: (session: ClassSession) => void;
  onUpdateStudent: (student: Student) => void;
  onAddAuditLog?: (action: 'create' | 'update' | 'delete', entityType: any, entityId: string, description: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'teacher' | 'recipient';
  text: string;
  timestamp: string;
}

export default function TeacherPortal({
  teacher,
  students,
  sessions,
  courses,
  objectives,
  themes,
  currentTab = 'teacher_dashboard',
  onTabChange,
  onUpdateSession,
  onUpdateStudent,
  onAddAuditLog
}: TeacherPortalProps) {
  
  // Find sessions assigned to this specific teacher
  const teacherSessions = sessions.filter(s => s.teacherId === teacher.id);
  const isDemoMode = teacherSessions.length === 0;

  // Fallback demo sessions if no sessions exist in the system for this teacher
  const activeSessions = isDemoMode 
    ? sessions.slice(0, 4).map(s => ({ ...s, teacherId: teacher.id }))
    : teacherSessions;

  // Active students under this teacher
  const studentIdsSet = new Set(activeSessions.flatMap(s => s.studentIds));
  const activeStudents = students.filter(s => studentIdsSet.has(s.id) || isDemoMode);

  // Filter selected student in evaluations
  const [selectedStudentId, setSelectedStudentId] = useState<string>(activeStudents[0]?.id || '');
  const activeStudentObj = students.find(s => s.id === selectedStudentId);

  // Modal / form states for validation (Cahier de Texte)
  const [selectedSessionForValidation, setSelectedSessionForValidation] = useState<ClassSession | null>(null);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent_justifie' | 'absent_non_justifie'>>({});
  const [attendanceComments, setAttendanceComments] = useState<Record<string, string>>({});
  const [workDone, setWorkDone] = useState('');
  const [homework, setHomework] = useState('');
  const [behaviorRating, setBehaviorRating] = useState<'excellent' | 'bon' | 'moyen' | 'difficile'>('bon');
  const [reportedToParents, setReportedToParents] = useState(true);
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Evaluation / Grade states
  const [gradeSubject, setGradeSubject] = useState(teacher.subjects[0] || 'Mathématiques');
  const [gradeTitle, setGradeTitle] = useState('');
  const [gradeScore, setGradeScore] = useState<number>(14);
  const [gradeMaxScore, setGradeMaxScore] = useState<number>(20);
  const [gradeDate, setGradeDate] = useState(new Date().toISOString().split('T')[0]);

  // Messaging state
  const [activeContact, setActiveContact] = useState<'director' | string>('director'); // director or studentId
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({
    director: [
      { id: '1', sender: 'recipient', text: "Bonjour, je suis le directeur d'établissement. Comment se passe la progression de vos élèves cette semaine ?", timestamp: '09:00' }
    ]
  });
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Setup conversations automatically when students are loaded
  useEffect(() => {
    activeStudents.forEach(st => {
      if (!conversations[st.id]) {
        setConversations(prev => ({
          ...prev,
          [st.id]: [
            { id: st.id + '_1', sender: 'recipient', text: `Bonjour Monsieur, je suis le parent de ${st.firstName}. Je voulais savoir s'il a bien assimilé le dernier cours d'approfondissement.`, timestamp: '14:30' }
          ]
        }));
      }
    });
  }, [activeStudents]);

  // Utility to find course name
  const getCourseTitle = (courseId: string) => {
    const c = courses.find(item => item.id === courseId);
    return c ? c.title : 'Cours de soutien';
  };

  const getStudentName = (id: string) => {
    const s = students.find(item => item.id === id);
    return s ? `${s.firstName} ${s.lastName}` : 'Élève';
  };

  // Duration parser in hours
  const calculateSessionDuration = (startTime: string, endTime: string): number => {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
      return Math.max(0, diffMinutes / 60);
    } catch {
      return 2; // default fallback 2 hours
    }
  };

  // Statistics calculation
  const completedSessions = activeSessions.filter(s => s.status === 'terminé');
  const upcomingSessions = activeSessions.filter(s => s.status === 'planifié');
  const totalCompletedHours = completedSessions.reduce((acc, s) => acc + calculateSessionDuration(s.startTime, s.endTime), 0);
  const totalUpcomingHours = upcomingSessions.reduce((acc, s) => acc + calculateSessionDuration(s.startTime, s.endTime), 0);
  
  // Salary estimate (based on completed hours)
  const monthlySalaryEstimate = totalCompletedHours * (teacher.hourlySalary || 18);

  // Initialize validation form
  const handleOpenValidation = (session: ClassSession) => {
    setSelectedSessionForValidation(session);
    
    // Default attendance: everyone present
    const initialAttendance: Record<string, 'present' | 'absent_justifie' | 'absent_non_justifie'> = {};
    const initialComments: Record<string, string> = {};
    session.studentIds.forEach(id => {
      initialAttendance[id] = 'present';
      initialComments[id] = '';
    });
    setAttendance(initialAttendance);
    setAttendanceComments(initialComments);

    setWorkDone(session.summary?.workDone || '');
    setHomework(session.summary?.homework || '');
    setBehaviorRating(session.summary?.globalBehavior || 'bon');
    setReportedToParents(session.summary?.reportedToParents ?? true);
    setSelectedObjectiveIds(session.summary?.objectiveIds || []);
  };

  // Validate session / Fill "Cahier de texte"
  const handleSaveValidation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForValidation) return;

    const duration = calculateSessionDuration(selectedSessionForValidation.startTime, selectedSessionForValidation.endTime);

    // 1. Prepare attendance records
    const attendanceRecords: AttendanceRecord[] = selectedSessionForValidation.studentIds.map(stId => ({
      studentId: stId,
      status: attendance[stId] || 'present',
      comment: attendanceComments[stId] || ''
    }));

    // 2. Prepare session summary
    const summary: SessionSummary = {
      workDone,
      homework,
      globalBehavior: behaviorRating,
      reportedToParents,
      objectiveIds: selectedObjectiveIds
    };

    // 3. Update Class Session in DB
    const updatedSession: ClassSession = {
      ...selectedSessionForValidation,
      status: 'terminé',
      attendance: attendanceRecords,
      summary
    };

    onUpdateSession(updatedSession);

    // 4. Update present students: increment usedHours and push progressReports
    selectedSessionForValidation.studentIds.forEach(stId => {
      const studentObj = students.find(s => s.id === stId);
      if (studentObj && attendance[stId] === 'present') {
        // Create pedagogical progress report
        const newReport: ProgressReport = {
          id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          date: selectedSessionForValidation.date,
          sessionTitle: getCourseTitle(selectedSessionForValidation.courseId),
          workDone,
          homework,
          behaviorRating: behaviorRating === 'excellent' ? 5 : behaviorRating === 'bon' ? 4 : behaviorRating === 'moyen' ? 3 : 2,
          comment: `Cours dispensé par M./Mme ${teacher.lastName}. ` + (attendanceComments[stId] ? `Commentaire : ${attendanceComments[stId]}` : ''),
          reportedToParents
        };

        const updatedStudentObj: Student = {
          ...studentObj,
          usedHours: Math.min(studentObj.totalHours, (studentObj.usedHours || 0) + duration),
          progressReports: [newReport, ...(studentObj.progressReports || [])]
        };

        onUpdateStudent(updatedStudentObj);
      }
    });

    // Logging action
    if (onAddAuditLog) {
      onAddAuditLog(
        'update',
        'session',
        selectedSessionForValidation.id,
        `Cahier de texte rempli par M./Mme ${teacher.lastName} pour la séance du ${selectedSessionForValidation.date}`
      );
    }

    setToastMessage("Cahier de texte enregistré et heures de soutien validées avec succès !");
    setSelectedSessionForValidation(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Add Grade / Evaluation action
  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentObj || !gradeTitle) return;

    const newGrade: StudentGrade = {
      id: 'g_' + Date.now(),
      subject: gradeSubject,
      title: gradeTitle,
      score: Number(gradeScore),
      maxScore: Number(gradeMaxScore),
      date: gradeDate
    };

    const updatedStudentObj: Student = {
      ...activeStudentObj,
      grades: [newGrade, ...(activeStudentObj.grades || [])]
    };

    onUpdateStudent(updatedStudentObj);

    if (onAddAuditLog) {
      onAddAuditLog(
        'update',
        'student',
        activeStudentObj.id,
        `Nouvelle note saisie pour ${activeStudentObj.firstName} (${gradeTitle}: ${gradeScore}/${gradeMaxScore})`
      );
    }

    setGradeTitle('');
    setToastMessage(`Note ajoutée avec succès à la fiche de ${activeStudentObj.firstName} !`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Chat message sending
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const currentRoom = activeContact;
    const teacherMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'teacher',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => ({
      ...prev,
      [currentRoom]: [...(prev[currentRoom] || []), teacherMsg]
    }));
    setNewMessage('');
    setIsTyping(true);

    // Auto simulated response
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "Merci pour votre retour professionnel ! J'en parlerai avec mon enfant pour qu'il redouble d'efforts lors des prochains exercices.";
      
      if (currentRoom === 'director') {
        replyText = "Parfait, merci pour le suivi rigoureux. N'oubliez pas d'émarger vos heures de soutien à la fin de la semaine pour la mise à jour de la paye.";
      } else {
        const student = students.find(s => s.id === currentRoom);
        if (student) {
          replyText = `Merci M./Mme ${teacher.lastName}, c'est noté pour la séance du ${student.firstName}. Nous ferons l'exercice recommandé ensemble ce soir.`;
        }
      }

      const recipientMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'recipient',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations(prev => ({
        ...prev,
        [currentRoom]: [...(prev[currentRoom] || []), recipientMsg]
      }));
    }, 1500);
  };

  // Toggle objective selection helper
  const handleToggleObjective = (id: string) => {
    setSelectedObjectiveIds(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  // Aggregate stats for charts
  const averageGradesData = activeStudents.map(st => {
    const gradesList = st.grades || [];
    const avg = gradesList.length > 0
      ? (gradesList.reduce((acc, g) => acc + (g.score / g.maxScore) * 20, 0) / gradesList.length)
      : null;
    return {
      name: `${st.firstName} ${st.lastName[0]}.`,
      moyenne: avg ? Number(avg.toFixed(1)) : 0
    };
  }).filter(d => d.moyenne > 0);

  const colors = ['#0ea5e9', '#818cf8', '#a855f7', '#ec4899', '#f43f5e', '#eab308', '#22c55e'];

  return (
    <div className="space-y-8 p-1 sm:p-4">
      
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 border-2 border-emerald-500/40 text-emerald-300 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md"
          >
            <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full uppercase font-bold border border-indigo-500/25">
              Espace Enseignant Restreint
            </span>
            {isDemoMode && (
              <span className="text-[10px] font-mono tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full uppercase font-bold border border-amber-500/25">
                Profil Démo
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Bonjour, M./Mme {teacher.firstName} {teacher.lastName}
          </h1>
          <p className="text-slate-400 text-xs">Gérez vos cours, saisissez les cahiers de texte, et suivez la progression de vos élèves.</p>
        </div>

        {/* Subjects list as badges */}
        <div className="flex flex-wrap gap-2">
          {teacher.subjects.map((sub, idx) => (
            <span 
              key={idx}
              className="text-[11px] bg-slate-950 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl font-medium"
            >
              📚 {sub}
            </span>
          ))}
        </div>
      </div>

      {/* =============================================================================================== */}
      {/* TAB 1: TEACHER DASHBOARD */}
      {/* =============================================================================================== */}
      {currentTab === 'teacher_dashboard' && (
        <div className="space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-900 border-2 border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Heures dispensées</span>
                <p className="text-2xl font-black text-white">{totalCompletedHours} h</p>
                <span className="text-[10px] text-slate-400">Ce mois-ci</span>
              </div>
              <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                <Clock size={20} />
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Rémunération estimée</span>
                <p className="text-2xl font-black text-emerald-400">{monthlySalaryEstimate} €</p>
                <span className="text-[10px] text-slate-400">Taux : {teacher.hourlySalary}€/h</span>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Euro size={20} />
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Élèves suivis</span>
                <p className="text-2xl font-black text-indigo-400">{activeStudents.length} élèves</p>
                <span className="text-[10px] text-slate-400">Soutien individuel</span>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Séances à venir</span>
                <p className="text-2xl font-black text-amber-400">{upcomingSessions.length} cours</p>
                <span className="text-[10px] text-slate-400">{totalUpcomingHours}h planifiées</span>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Calendar size={20} />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Today/Upcoming sessions agenda */}
            <div className="lg:col-span-8 bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-400" />
                  Vos prochaines séances de soutien
                </h3>
                <button
                  onClick={() => onTabChange('teacher_planning')}
                  className="text-xs text-sky-400 hover:text-sky-300 font-bold"
                >
                  Voir tout le planning →
                </button>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="text-center p-8 text-slate-400 italic">
                  Aucun cours planifié à venir dans votre agenda.
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.slice(0, 3).map(sess => (
                    <div 
                      key={sess.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase">
                            {getCourseTitle(sess.courseId)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{sess.room}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white">
                          Élève(s) : {sess.studentIds.map(stId => getStudentName(stId)).join(', ')}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Clock size={12} />
                          <span>Le {sess.date} de {sess.startTime} à {sess.endTime} ({calculateSessionDuration(sess.startTime, sess.endTime)}h)</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenValidation(sess)}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <FileCheck2 size={13} />
                        <span>Remplir cahier de texte</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Teaching info panel */}
            <div className="lg:col-span-4 bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Star size={16} className="text-amber-400" />
                  Rappel Déontologique
                </h3>
                <ul className="text-xs text-slate-400 space-y-2.5 leading-normal">
                  <li className="flex gap-2">
                    <CheckCircle2 size={14} className="text-sky-400 shrink-0 mt-0.5" />
                    <span><strong>Saisie ponctuelle :</strong> Veuillez émarger la présence et remplir le cahier de texte de chaque élève à la fin de chaque séance.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 size={14} className="text-sky-400 shrink-0 mt-0.5" />
                    <span><strong>Suivi Devoirs :</strong> N'hésitez pas à noter des exercices spécifiques pour la séance suivante afin de consolider l'autonomie.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 size={14} className="text-sky-400 shrink-0 mt-0.5" />
                    <span><strong>Signalement :</strong> En cas de baisse flagrante de motivation ou d'absences répétées, informez directement la direction.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl text-center space-y-1 mt-4">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Votre contact direct direction</span>
                <p className="text-xs font-bold text-white">Sécrétariat d'Excellence</p>
                <button
                  onClick={() => {
                    setActiveContact('director');
                    onTabChange('teacher_messages');
                  }}
                  className="mt-1 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-[11px] py-1 px-3 rounded-lg border border-slate-800 transition-all inline-flex items-center gap-1.5"
                >
                  <MessageSquare size={12} />
                  <span>Poser une question</span>
                </button>
              </div>
            </div>

          </div>

          {/* Roster overview chart */}
          {averageGradesData.length > 0 && (
            <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                <TrendingUp size={16} className="text-emerald-400" />
                Aperçu de la moyenne générale de vos élèves
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={averageGradesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis domain={[0, 20]} stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                    <Bar dataKey="moyenne" radius={[4, 4, 0, 0]}>
                      {averageGradesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =============================================================================================== */}
      {/* TAB 2: TEACHER PLANNING & CAHIER DE TEXTE */}
      {/* =============================================================================================== */}
      {currentTab === 'teacher_planning' && (
        <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                <Calendar size={18} className="text-indigo-400" />
                Mon Agenda & Cahiers de texte
              </h2>
              <p className="text-slate-400 text-xs">Suivez vos séances passées et futures, et complétez les bilans pédagogiques.</p>
            </div>
          </div>

          <div className="space-y-4">
            {activeSessions.length === 0 ? (
              <div className="text-center p-12 text-slate-400 border border-dashed border-slate-800 rounded-xl">
                Aucun cours particulier n'est planifié dans votre emploi du temps.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                      <th className="pb-3 font-semibold">Date & Heures</th>
                      <th className="pb-3 font-semibold">Cours / Discipline</th>
                      <th className="pb-3 font-semibold">Élève(s)</th>
                      <th className="pb-3 font-semibold">Lieu / Salle</th>
                      <th className="pb-3 font-semibold">Cahier de Texte</th>
                      <th className="pb-3 font-semibold text-right">Action / Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {activeSessions.map(session => {
                      const duration = calculateSessionDuration(session.startTime, session.endTime);
                      return (
                        <tr key={session.id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="py-4 space-y-0.5">
                            <p className="text-white font-semibold font-mono">{session.date}</p>
                            <p className="text-slate-400 text-[11px] font-mono">{session.startTime} - {session.endTime} ({duration}h)</p>
                          </td>
                          <td className="py-4 font-bold text-indigo-400 text-sm">
                            {getCourseTitle(session.courseId)}
                          </td>
                          <td className="py-4 text-white font-medium">
                            <div className="flex flex-wrap gap-1">
                              {session.studentIds.map(stId => (
                                <span key={stId} className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full text-[10px]">
                                  {getStudentName(stId)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="font-mono text-[11px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                              {session.room}
                            </span>
                          </td>
                          <td className="py-4 max-w-xs">
                            {session.status === 'terminé' && session.summary ? (
                              <div className="space-y-1">
                                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                                  <CheckSquare size={11} /> Cahier rempli
                                </p>
                                <p className="text-[10px] text-slate-400 line-clamp-1 italic">"{session.summary.workDone}"</p>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                                <AlertTriangle size={11} /> À compléter
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            {session.status === 'terminé' ? (
                              <span className="px-2.5 py-1 rounded-full font-bold text-[10px] border uppercase font-mono bg-emerald-500/10 border-emerald-500/20 text-emerald-400 inline-block">
                                Validé (Rémunéré)
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenValidation(session)}
                                className="bg-sky-500/20 border border-sky-500/30 hover:bg-sky-500/30 text-sky-300 font-bold text-[11px] py-1.5 px-3 rounded-xl transition-all cursor-pointer"
                              >
                                Émarger & Saisir
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =============================================================================================== */}
      {/* TAB 3: TEACHER STUDENTS & EVALUATIONS */}
      {/* =============================================================================================== */}
      {currentTab === 'teacher_students' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: student selector & stats summary */}
          <div className="lg:col-span-4 bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users size={16} className="text-indigo-400" />
              Vos élèves assignés
            </h3>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {activeStudents.map(st => {
                const isSelected = st.id === selectedStudentId;
                const gradesCount = st.grades?.length || 0;
                return (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex justify-between items-center cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-500/10 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs text-white">{st.firstName} {st.lastName}</h4>
                      <p className="text-[10px] text-slate-400">{st.gradeLevel} • {st.email}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {gradesCount} eval.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: student detailed grades, progress, and quick add evaluation form */}
          <div className="lg:col-span-8 space-y-6">
            
            {activeStudentObj ? (
              <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-6">
                
                {/* Active Student Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-white text-base">{activeStudentObj.firstName} {activeStudentObj.lastName}</h3>
                    <p className="text-xs text-slate-400">Classe : {activeStudentObj.gradeLevel} • Forfait de {activeStudentObj.totalHours}h (consommé : {activeStudentObj.usedHours}h)</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold font-mono">Moyenne élève :</span>
                    <span className="text-sm font-black font-mono text-white bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl">
                      {activeStudentObj.grades && activeStudentObj.grades.length > 0
                        ? (activeStudentObj.grades.reduce((acc, g) => acc + (g.score / g.maxScore) * 20, 0) / activeStudentObj.grades.length).toFixed(1)
                        : 'N/A'
                      } <span className="text-xs text-slate-400">/20</span>
                    </span>
                  </div>
                </div>

                {/* Form: Add a new Evaluation */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Plus size={14} className="text-indigo-400" />
                    Ajouter une nouvelle note ou évaluation pour {activeStudentObj.firstName}
                  </h4>
                  
                  <form onSubmit={handleAddGrade} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Matière / Discipline</label>
                      <select
                        value={gradeSubject}
                        onChange={(e) => setGradeSubject(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      >
                        {teacher.subjects.map((sub, i) => (
                          <option key={i} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Intitulé de l'évaluation</label>
                      <input
                        type="text"
                        value={gradeTitle}
                        onChange={(e) => setGradeTitle(e.target.value)}
                        placeholder="e.g., DS Dérivées & Tangentes"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Note / Barème</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={gradeScore}
                          onChange={(e) => setGradeScore(Number(e.target.value))}
                          className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white text-center focus:outline-none"
                          min="0"
                          max={gradeMaxScore}
                          required
                        />
                        <span className="text-xs text-slate-400">/</span>
                        <input
                          type="number"
                          value={gradeMaxScore}
                          onChange={(e) => setGradeMaxScore(Number(e.target.value))}
                          className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white text-center focus:outline-none"
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1"
                      >
                        <Check size={14} />
                        <span>Enregistrer</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Listing Grades & progress reports */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <History size={14} className="text-indigo-400" />
                    Historique des évaluations & bilans
                  </h4>

                  {(!activeStudentObj.grades || activeStudentObj.grades.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-4">Aucune évaluation enregistrée pour cet élève.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeStudentObj.grades.map(g => (
                        <div key={g.id} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex justify-between items-center">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-black text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded">
                              {g.subject}
                            </span>
                            <h5 className="text-xs font-bold text-white">{g.title}</h5>
                            <span className="text-[10px] text-slate-500 font-mono">{g.date}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-base font-black font-mono ${g.score / g.maxScore >= 0.75 ? 'text-emerald-400' : g.score / g.maxScore >= 0.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {g.score}/{g.maxScore}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-mono">({((g.score / g.maxScore) * 20).toFixed(1)}/20)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-slate-900 border-2 border-slate-800 p-8 rounded-2xl text-center text-slate-400 italic">
                Sélectionnez un élève pour gérer ses évaluations et son suivi.
              </div>
            )}

          </div>

        </div>
      )}

      {/* =============================================================================================== */}
      {/* TAB 4: TEACHER PAY & EARNINGS ESTIMATION */}
      {/* =============================================================================================== */}
      {currentTab === 'teacher_pay' && (
        <div className="space-y-6">
          
          {/* Pay details banner */}
          <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 block">Fiche d'Émouluments</span>
              <h2 className="text-lg font-black text-white">Vos conditions de rémunérations</h2>
              <p className="text-xs text-slate-400 leading-normal">
                Votre salaire horaire de soutien scolaire est fixé par l'administration d'Excellence selon vos diplômes et spécialités.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tarif Horaire Contractuel</span>
              <p className="text-3xl font-black text-indigo-400">{teacher.hourlySalary || 18} € <span className="text-xs text-slate-400 font-normal">/ heure</span></p>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">Tarif Net Brut d'impôt</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Salaire Mensuel Estimé</span>
              <p className="text-3xl font-black text-emerald-400">{monthlySalaryEstimate} €</p>
              <span className="text-[10px] text-slate-400">Pour {totalCompletedHours}h de soutien validées</span>
            </div>
          </div>

          {/* Validation report list of sessions */}
          <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
              <Euro size={16} className="text-indigo-400" />
              Récapitulatif de vos prestations du mois
            </h3>

            {completedSessions.length === 0 ? (
              <div className="text-center p-8 text-slate-400 italic">
                Aucune séance émargée et validée ce mois-ci.
              </div>
            ) : (
              <div className="space-y-3">
                {completedSessions.map(sess => {
                  const duration = calculateSessionDuration(sess.startTime, sess.endTime);
                  const payout = duration * (teacher.hourlySalary || 18);
                  return (
                    <div 
                      key={sess.id}
                      className="bg-slate-950 border border-slate-800/60 p-4 rounded-xl flex justify-between items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                            {getCourseTitle(sess.courseId)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{sess.date}</span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Élève(s) : {sess.studentIds.map(stId => getStudentName(stId)).join(', ')} ({duration}h de cours)
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-sm font-black font-mono text-emerald-400 block">
                          +{payout} €
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          ({duration}h x {teacher.hourlySalary || 18}€/h)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* =============================================================================================== */}
      {/* TAB 5: TEACHER MESSAGING & CONTACTS */}
      {/* =============================================================================================== */}
      {currentTab === 'teacher_messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel - contact list */}
          <div className="lg:col-span-4 bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
              <MessageSquare size={16} className="text-indigo-400" />
              Vos conversations
            </h3>

            <div className="space-y-2">
              
              {/* Director static contact */}
              <button
                onClick={() => setActiveContact('director')}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                  activeContact === 'director'
                    ? 'bg-sky-500/10 border-sky-500 text-white'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="w-8 h-8 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center font-bold font-mono text-xs border border-sky-500/20 shrink-0">
                  DIR
                </div>
                <div className="truncate">
                  <h4 className="font-bold text-xs text-white">Directeur d'Établissement</h4>
                  <p className="text-[10px] text-slate-400 truncate">Soutien Scolaire d'Excellence</p>
                </div>
              </button>

              {/* Student/Parent dynamic contacts */}
              {activeStudents.map(st => {
                const isSelected = activeContact === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setActiveContact(st.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center font-bold font-mono text-xs border border-indigo-500/20 shrink-0">
                      {st.firstName[0]}{st.lastName[0]}
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-xs text-white">Parent de {st.firstName}</h4>
                      <p className="text-[10px] text-slate-400 truncate">Famille {st.lastName}</p>
                    </div>
                  </button>
                );
              })}

            </div>
          </div>

          {/* Right Panel - Chat area */}
          <div className="lg:col-span-8 bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
            
            {/* Active Contact Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="font-bold text-xs text-white">
                  {activeContact === 'director' ? "Directeur d'Établissement" : `Parent de ${getStudentName(activeContact)}`}
                </h4>
              </div>
              <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                Ligne Sécurisée
              </span>
            </div>

            {/* Chat message flow container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/20">
              {(conversations[activeContact] || []).map(msg => {
                const isMe = msg.sender === 'teacher';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                      isMe 
                        ? 'bg-indigo-500 text-white rounded-br-none' 
                        : 'bg-slate-900 border border-slate-850 text-slate-200 rounded-bl-none'
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <span className="text-[9px] font-mono text-slate-400 block text-right mt-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-850 text-slate-400 p-3 rounded-2xl rounded-bl-none text-xs flex items-center gap-1.5 font-mono">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce [animation-delay:0.2s]">●</span>
                    <span className="animate-bounce [animation-delay:0.4s]">●</span>
                  </div>
                </div>
              )}
            </div>

            {/* Send form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Rédigez votre message de suivi pédagogique..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1"
              >
                <Send size={14} />
                <span className="hidden sm:inline">Envoyer</span>
              </button>
            </form>

          </div>

        </div>
      )}

      {/* =============================================================================================== */}
      {/* VALDIATION/EMARGEMENT DIALOG MODAL SHEET */}
      {/* =============================================================================================== */}
      <AnimatePresence>
        {selectedSessionForValidation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border-2 border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 size={18} className="text-sky-400" />
                  <div>
                    <h3 className="font-bold text-white text-sm">Émarger & Cahier de Texte</h3>
                    <p className="text-[10px] text-slate-400">Cours : {getCourseTitle(selectedSessionForValidation.courseId)} • Le {selectedSessionForValidation.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSessionForValidation(null)}
                  className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
                >
                  Fermer
                </button>
              </div>

              {/* Modal Body form */}
              <form onSubmit={handleSaveValidation} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                
                {/* 1. Student list / Attendance */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white flex items-center gap-1">
                    <Users size={14} className="text-indigo-400" />
                    1. Présence des élèves
                  </h4>
                  
                  <div className="space-y-3 bg-slate-950 p-4 border border-slate-850 rounded-xl">
                    {selectedSessionForValidation.studentIds.map(stId => (
                      <div key={stId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/60 pb-3 last:border-b-0 last:pb-0">
                        <span className="font-bold text-white text-xs">{getStudentName(stId)}</span>
                        
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                          {/* Attendance selector */}
                          <div className="flex bg-slate-900 border border-slate-800 rounded-lg overflow-hidden p-0.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setAttendance(prev => ({ ...prev, [stId]: 'present' }))}
                              className={`px-2.5 py-1 rounded font-bold transition-all ${
                                attendance[stId] === 'present'
                                  ? 'bg-emerald-500 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Présent
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttendance(prev => ({ ...prev, [stId]: 'absent_justifie' }))}
                              className={`px-2.5 py-1 rounded font-bold transition-all ${
                                attendance[stId] === 'absent_justifie'
                                  ? 'bg-amber-500 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Abs. Justifiée
                            </button>
                            <button
                              type="button"
                              onClick={() => setAttendance(prev => ({ ...prev, [stId]: 'absent_non_justifie' }))}
                              className={`px-2.5 py-1 rounded font-bold transition-all ${
                                attendance[stId] === 'absent_non_justifie'
                                  ? 'bg-rose-500 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Abs. Non Justifiée
                            </button>
                          </div>

                          {/* Mini comment input for attendance details */}
                          <input
                            type="text"
                            placeholder="Retard 10 min, attitude..."
                            value={attendanceComments[stId] || ''}
                            onChange={(e) => setAttendanceComments(prev => ({ ...prev, [stId]: e.target.value }))}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none flex-1 sm:w-36"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Work Done in class */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-white flex items-center gap-1">
                    <FileText size={14} className="text-indigo-400" />
                    2. Travail fait en classe (Cahier de texte)
                  </h4>
                  <textarea
                    rows={2}
                    value={workDone}
                    onChange={(e) => setWorkDone(e.target.value)}
                    placeholder="Résolution de l'exercice 4 page 102. Révision complète sur les limites de fonctions trigonométriques..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* 3. Homework assigned */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-white flex items-center gap-1">
                    <BookOpen size={14} className="text-indigo-400" />
                    3. Devoirs pour la prochaine séance
                  </h4>
                  <textarea
                    rows={2}
                    value={homework}
                    onChange={(e) => setHomework(e.target.value)}
                    placeholder="Refaire l'exercice 5 et apprendre le théorème page 105 pour la prochaine fois..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* 4. Pedagogical ratings & Objectives */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Rating selection */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-white">4. Comportement & Motivation</h4>
                    <select
                      value={behaviorRating}
                      onChange={(e: any) => setBehaviorRating(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none"
                    >
                      <option value="excellent">Excellent - Participation active, grande autonomie</option>
                      <option value="bon">Bon - Travailleur, motivé</option>
                      <option value="moyen">Moyen - Concentration intermittente</option>
                      <option value="difficile">Difficile - Difficulté de concentration/travail</option>
                    </select>
                  </div>

                  {/* Share to parents */}
                  <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">Transmettre le rapport aux parents</p>
                      <p className="text-[10px] text-slate-400">Rapports envoyés sur l'Espace Parent.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={reportedToParents}
                      onChange={(e) => setReportedToParents(e.target.checked)}
                      className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-800 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                </div>

                {/* Objectives checklist lookup from global themes */}
                {objectives.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="font-bold text-white flex items-center gap-1">
                      <Compass size={14} className="text-indigo-400" />
                      5. Objectifs pédagogiques visés
                    </h4>
                    <p className="text-[10px] text-slate-400">Associez ce cours aux compétences ou thèmes correspondants :</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-3 border border-slate-850 rounded-xl max-h-36 overflow-y-auto">
                      {objectives.map(obj => {
                        const isChecked = selectedObjectiveIds.includes(obj.id);
                        return (
                          <button
                            key={obj.id}
                            type="button"
                            onClick={() => handleToggleObjective(obj.id)}
                            className={`p-2 rounded-lg text-left border flex items-center gap-2 cursor-pointer transition-colors ${
                              isChecked 
                                ? 'bg-indigo-500/10 border-indigo-500/40 text-white' 
                                : 'bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-800'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center shrink-0 ${isChecked ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700'}`}>
                              {isChecked && <Check size={10} className="text-white" />}
                            </div>
                            <span className="truncate text-[10px]">{obj.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submit actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSessionForValidation(null)}
                    className="bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={15} />
                    <span>Valider l'émargement</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
