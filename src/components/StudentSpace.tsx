import React, { useState, useEffect, useRef } from 'react';
import { Student, ClassSession, Course, Objective, Theme } from '../types';
import { 
  Calendar as CalendarIcon, 
  BookOpen, 
  Target, 
  Clock, 
  History, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Bookmark, 
  Compass, 
  HelpCircle, 
  ExternalLink, 
  ArrowRight, 
  Award, 
  Flame, 
  Download,
  BookMarked,
  Info,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Check,
  Send,
  MessageSquare,
  User,
  ShieldCheck,
  CalendarPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

interface StudentSpaceProps {
  student: Student;
  sessions: ClassSession[];
  courses: Course[];
  objectives: Objective[];
  themes: Theme[];
  userProfile?: any;
  onUpdateSession?: (updatedSession: ClassSession) => void;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'student' | 'teacher' | 'admin';
  recipient: 'teacher' | 'admin';
  text: string;
  timestamp: string;
}

const EDUCATIONAL_RESOURCES = [
  {
    id: 'res_1',
    title: "Méthodologie d'Apprentissage & Organisation",
    description: "Guide complet pour structurer ses révisions à la maison, optimiser sa prise de notes et arriver serein le jour de l'examen.",
    category: "Méthodologie",
    detail: "5 min de lecture",
    icon: Compass,
    color: "from-sky-500 to-indigo-500"
  },
  {
    id: 'res_2',
    title: "Annales Officielles Corrigées - Mathématiques",
    description: "Sujets de brevets et de bacs blancs entièrement rédigés et commentés pas-à-pas par notre équipe enseignante.",
    category: "Mathématiques",
    detail: "Fichier PDF • 2.4 Mo",
    icon: FileText,
    color: "from-purple-500 to-pink-500"
  },
  {
    id: 'res_3',
    title: "Fiches de Révision Flash : Physique-Chimie",
    description: "Les formules clés, théorèmes et définitions fondamentales résumés en une page de récapitulatif graphique.",
    category: "Physique-Chimie",
    detail: "Document PDF • 1.8 Mo",
    icon: Bookmark,
    color: "from-amber-500 to-orange-500"
  },
  {
    id: 'res_4',
    title: "Quiz d'Évaluation de Rentrée & Diagnostic",
    description: "Déterminez vos points forts et ciblez vos priorités d'apprentissage grâce à notre test de positionnement rapide.",
    category: "Positionnement",
    detail: "Test en 15 questions",
    icon: HelpCircle,
    color: "from-emerald-500 to-teal-500"
  }
];

export default function StudentSpace({ 
  student, 
  sessions, 
  courses, 
  objectives, 
  themes, 
  userProfile, 
  onUpdateSession,
  currentTab,
  onTabChange
}: StudentSpaceProps) {
  // Account activation helper
  const isActivated = userProfile ? userProfile.status === 'activated' : student.id !== 'temp_student';

  const studentSessions = sessions.filter(s => s.studentIds.includes(student.id));
  const upcomingSessions = studentSessions.filter(s => s.status === 'planifié').sort((a, b) => a.date.localeCompare(b.date));
  const pastSessions = studentSessions.filter(s => s.status === 'terminé').sort((a, b) => b.date.localeCompare(a.date));

  // Remaining hours calculation
  const totalHours = student.totalHours || 10;
  const usedHours = student.usedHours || 0;
  const remainingHours = Math.max(0, totalHours - usedHours);
  const percentRemaining = totalHours > 0 ? Math.round((remainingHours / totalHours) * 100) : 0;

  // Mini-calendar date logic (next 7 days starting today)
  const today = new Date();
  const formatDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayNameFr = (date: Date) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() + i);
    return {
      dateStr: formatDateStr(d),
      dayName: getDayNameFr(d),
      dayNum: d.getDate(),
      isToday: i === 0
    };
  });

  const [selectedDate, setSelectedDate] = useState<string>(next7Days[0].dateStr);

  const getSessionsForDate = (dateStr: string) => {
    return studentSessions.filter(s => s.date === dateStr);
  };

  const selectedDateSessions = getSessionsForDate(selectedDate);

  // Resource notification helper
  const [downloadedResource, setDownloadedResource] = useState<string | null>(null);

  const triggerDownload = (title: string) => {
    setDownloadedResource(title);
    setTimeout(() => {
      setDownloadedResource(null);
    }, 3000);
  };

  // Local Success Notification state for Confirmed attendance
  const [confirmationSuccess, setConfirmationSuccess] = useState<string | null>(null);

  // Presence Confirmation Handler
  const handleConfirmAttendance = (session: ClassSession) => {
    const attendanceList = session.attendance ? [...session.attendance] : [];
    const existingRecordIndex = attendanceList.findIndex(a => a.studentId === student.id);
    
    if (existingRecordIndex > -1) {
      attendanceList[existingRecordIndex] = {
        ...attendanceList[existingRecordIndex],
        status: 'present',
        comment: 'Présence confirmée en ligne par l\'élève'
      };
    } else {
      attendanceList.push({
        studentId: student.id,
        status: 'present',
        comment: 'Présence confirmée en ligne par l\'élève'
      });
    }
    
    const updatedSession: ClassSession = {
      ...session,
      attendance: attendanceList
    };
    
    if (onUpdateSession) {
      onUpdateSession(updatedSession);
    }
    
    const course = courses.find(c => c.id === session.courseId);
    setConfirmationSuccess(`Présence confirmée avec succès pour le cours de ${course?.title || 'Cours'} le ${session.date} !`);
    setTimeout(() => {
      setConfirmationSuccess(null);
    }, 4000);
  };

  // .ICS Exporter for Calendar integration
  const handleExportIcs = (session: ClassSession) => {
    const course = courses.find(c => c.id === session.courseId);
    const courseTitle = course?.title || 'Accompagnement Scolaire';
    
    // Format dates to standard ICS timestamp (YYYYMMDDTHHMMSSZ)
    const dateClean = session.date.replace(/-/g, ''); // YYYYMMDD
    const startClean = session.startTime.replace(/:/g, ''); // HHMM
    const endClean = session.endTime.replace(/:/g, ''); // HHMM
    
    const startStr = `${dateClean}T${startClean}00`;
    const endStr = `${dateClean}T${endClean}00`;
    
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Soutien Scolaire//Calendar Event Export//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:session-${session.id}@soutienscolaire.fr`,
      `DTSTAMP:${dateClean}T090000`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:Soutien Scolaire - ${courseTitle}`,
      `DESCRIPTION:Cours de soutien scolaire: ${courseTitle}. Salle: ${session.room || 'Non assignée'}`,
      `LOCATION:${session.room || 'Salle de classe'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    const icsContent = icsLines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cours-${courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${session.date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setConfirmationSuccess(`Événement calendrier téléchargé avec succès (.ics) !`);
    setTimeout(() => setConfirmationSuccess(null), 3000);
  };

  // Simple Messaging System State & Logic
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [messageRecipient, setMessageRecipient] = useState<'teacher' | 'admin'>('teacher');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load and save message history
  useEffect(() => {
    const storageKey = `soutien_student_messages_${student.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved student messages", e);
      }
    } else {
      // Setup initial beautiful messages so the inbox is never blank
      const defaultMessages: ChatMessage[] = [
        {
          id: 'init_1',
          sender: 'admin',
          recipient: 'admin',
          text: "Bonjour ! Bienvenue sur ton espace de messagerie directe. N'hésite pas à nous poser des questions sur tes forfaits d'heures ou sur tes facturations ici.",
          timestamp: new Date(Date.now() - 3600000 * 24).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: 'init_2',
          sender: 'teacher',
          recipient: 'teacher',
          text: "Bonjour ! C'est ton enseignant référent. Si tu as des questions sur le dernier cours, des doutes sur un exercice, ou si tu veux préparer notre prochaine séance, écris-moi ici.",
          timestamp: new Date(Date.now() - 3600000 * 12).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(defaultMessages);
      localStorage.setItem(storageKey, JSON.stringify(defaultMessages));
    }
  }, [student.id]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'student',
      recipient: messageRecipient,
      text: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, newMessage];
    setMessages(updated);
    localStorage.setItem(`soutien_student_messages_${student.id}`, JSON.stringify(updated));
    setMessageInput('');

    // Trigger elegant instant automated response to simulate live help desk
    setIsTyping(true);
    setTimeout(() => {
      const responseText = messageRecipient === 'teacher' 
        ? "Merci pour ton message ! J'ai bien reçu ta question et je vais y répondre avec attention lors de notre prochaine session de soutien ou directement par écrit sous peu. Bonnes révisions !"
        : "Bonjour. Votre message a bien été transmis à l'équipe de coordination administrative d'Espoir de Réussite Académique. Un conseiller reviendra vers vous sous 24 heures pour traiter votre demande.";
      
      const autoReply: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        sender: messageRecipient,
        recipient: messageRecipient,
        text: responseText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      setIsTyping(false);
      const finalMessages = [...updated, autoReply];
      setMessages(finalMessages);
      localStorage.setItem(`soutien_student_messages_${student.id}`, JSON.stringify(finalMessages));
    }, 2000);
  };

  // Urgent Upcoming Classes & Payment Status alerts calculation
  const isOverdue = student.paymentStatus === 'en_retard';
  const todayStr = formatDateStr(today);
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatDateStr(tomorrow);

  const urgentSessions = upcomingSessions.filter(s => s.date === todayStr || s.date === tomorrowStr);

  // Tabs for progression chart
  const [progressionTab, setProgressionTab] = useState<'grades' | 'themes'>('grades');

  // Grades progression dataset parser
  const gradesList = student.grades || [];
  const hasGrades = gradesList.length > 0;
  
  const gradesChartData = hasGrades
    ? gradesList.map(g => ({
        name: g.title,
        score: Math.round((g.score / g.maxScore) * 100),
        rawScore: `${g.score}/${g.maxScore}`,
        date: g.date
      })).sort((a, b) => a.date.localeCompare(b.date))
    : [
        { name: "Diag Rentrée", score: 60, rawScore: "12/20", date: "2026-06-01" },
        { name: "Éval Trigonométrie", score: 75, rawScore: "15/20", date: "2026-06-10" },
        { name: "Devoir Fonctions", score: 85, rawScore: "17/20", date: "2026-06-18" },
        { name: "Sujet Blanc N°1", score: 90, rawScore: "18/20", date: "2026-06-23" }
      ];

  // Theme mastery progression dataset
  const themeMasteryData = themes.map(t => {
    const themeObjectives = objectives.filter(o => o.themeId === t.id);
    const sessionCount = studentSessions.filter(s => s.themeIds?.includes(t.id)).length;
    const workedOnCount = Math.min(themeObjectives.length, Math.round(sessionCount * 1.5));
    const percentage = themeObjectives.length > 0 
      ? Math.round((workedOnCount / themeObjectives.length) * 100) 
      : 35;
      
    return {
      name: t.name,
      maitrise: Math.min(100, Math.max(30, percentage)),
      objectifs: themeObjectives.length || 3,
      seances: sessionCount
    };
  });

  // Recharts Custom Tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border-2 border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <p className="font-extrabold text-white text-sm">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            <p className="text-sky-400 font-bold">
              Score : <span className="text-base font-black">{payload[0].value}%</span>
            </p>
          </div>
          {payload[0].payload.rawScore && (
            <p className="text-slate-300 text-[11px] font-mono mt-1">Note de l'élève : <span className="text-white font-bold">{payload[0].payload.rawScore}</span></p>
          )}
          {payload[0].payload.date && (
            <p className="text-slate-500 text-[10px] font-mono">Enregistré le : {payload[0].payload.date}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomThemeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border-2 border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <p className="font-extrabold text-white text-sm">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
            <p className="text-indigo-300 font-bold">
              Acquisition : <span className="text-base font-black">{payload[0].value}%</span>
            </p>
          </div>
          <p className="text-slate-300 text-[11px]">
            Nombre d'objectifs : <strong className="text-white">{payload[0].payload.objectifs}</strong>
          </p>
          <p className="text-slate-300 text-[11px]">
            Séances suivies : <strong className="text-white">{payload[0].payload.seances}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderResources = () => (
    <section className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Compass size={18} className="text-indigo-400" />
            Ressources Pédagogiques d'Excellence
          </h2>
          <p className="text-slate-300 text-xs">Fiches de synthèse et annales corrigées libres d'accès</p>
        </div>
        <span className="text-[10px] font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
          Biblio {EDUCATIONAL_RESOURCES.length} éléments
        </span>
      </div>

      <AnimatePresence>
        {downloadedResource && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-2.5 rounded-xl mb-4 flex items-center justify-between"
          >
            <span className="font-medium">📥 Téléchargement démarré : {downloadedResource}</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">Prêt</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EDUCATIONAL_RESOURCES.map((res) => {
          const IconComp = res.icon;
          return (
            <div 
              key={res.id} 
              className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-black tracking-widest text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded-full uppercase">
                    {res.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{res.detail}</span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight">
                  {res.title}
                </h4>
                <p className="text-[11px] text-slate-300 leading-normal">
                  {res.description}
                </p>
              </div>

              <button 
                onClick={() => triggerDownload(res.title)}
                className="mt-4 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg transition-all cursor-pointer w-full"
              >
                <Download size={13} className="text-indigo-400" />
                <span>Consulter la ressource</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="space-y-8 p-1 sm:p-4">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 bg-sky-500/15 border border-sky-500/30 px-3.5 py-1 rounded-full text-[11px] font-bold text-sky-400 font-mono">
              <Award size={13} className="text-sky-400 animate-pulse" />
              <span>Espoir de Réussite Académique</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black font-display tracking-tight text-white uppercase leading-none">
              Bienvenue, {student.firstName} !
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
              Ravi de vous accompagner cette année. Retrouvez ici tous vos plannings, vos bilans d'acquis de cours et vos supports pédagogiques d'excellence.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-700 rounded-2xl p-4 md:self-center">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Flame size={20} className="text-indigo-400" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-black block">Niveau Scolaire</span>
              <span className="text-sm font-extrabold text-white">{student.gradeLevel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Activation Status Banner */}
      {(!currentTab || currentTab === 'student_dashboard') && (
        <div className={`p-4 rounded-2xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
          isActivated 
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
            : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`p-2 rounded-xl shrink-0 ${isActivated ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isActivated ? <CheckCircle2 size={18} /> : <AlertCircle size={18} className="animate-pulse" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-white">Activation de votre Espace :</span>
                <span className={`text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isActivated ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                }`}>
                  {isActivated ? 'Entièrement Activé' : 'En cours de liaison'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-normal">
                {isActivated 
                  ? "Félicitations ! Votre compte est entièrement synchronisé avec l'administration. Vos bilans pédagogiques personnalisés et vos statistiques de forfaits se mettront à jour en temps réel."
                  : "Votre profil est en attente d'attribution finale de vos groupes de cours ou de votre forfait d'heures par l'administration. Vous pouvez en attendant consulter nos ressources de révision ci-dessous."}
              </p>
            </div>
          </div>
          {!isActivated && (
            <div className="text-[10px] bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-slate-300 shrink-0 md:max-w-[240px]">
              📧 Liaison automatique à l'adresse : <span className="text-sky-400 font-bold">{student.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Interactive Visual Urgent Alerts / Overdue Payments box */}
      <AnimatePresence>
        {(isOverdue || urgentSessions.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-4 overflow-hidden"
          >
            {isOverdue && (
              <motion.div 
                whileHover={{ scale: 1.005 }}
                className="bg-rose-950/50 border-2 border-rose-500/50 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl shadow-rose-950/20"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl animate-pulse shrink-0 border border-rose-500/30">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-rose-300 uppercase tracking-wider font-mono">Retard de paiement détecté</h4>
                    <p className="text-xs text-slate-200 font-medium mt-1 leading-relaxed">
                      L'administration signale un retard important dans la régularisation de votre solde ou de vos derniers forfaits d'heures. Veuillez procéder au règlement pour éviter l'interruption des cours programmés.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-rose-300 uppercase tracking-widest bg-rose-500/30 border-2 border-rose-500/50 px-3 py-1 rounded-full shrink-0">
                  Action Urgente
                </span>
              </motion.div>
            )}

            {urgentSessions.map((s) => {
              const course = courses.find(c => c.id === s.courseId);
              const isToday = s.date === todayStr;
              const hasConfirmed = s.attendance?.some(att => att.studentId === student.id && att.status === 'present');
              
              return (
                <motion.div 
                  key={`urgent-alert-${s.id}`}
                  whileHover={{ scale: 1.005 }}
                  className="bg-amber-950/40 border-2 border-amber-500/40 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl shadow-amber-950/10"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl animate-pulse shrink-0 border border-amber-500/30">
                      <Clock size={22} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-amber-300 uppercase tracking-wider font-mono flex items-center gap-2">
                        <span>⏰ Cours urgent : {isToday ? "Aujourd'hui !" : "Demain"}</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">Rappel</span>
                      </h4>
                      <p className="text-xs text-slate-200 font-medium mt-1 leading-relaxed">
                        Votre session de <strong className="text-white">{course?.title || 'Accompagnement'}</strong> est planifiée pour de <strong className="text-amber-300 font-bold">{s.startTime} à {s.endTime}</strong>. Salle : <strong className="text-white">{s.room || 'Salle dédiée'}</strong>.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 shrink-0 self-end md:self-auto">
                    {/* Add to calendar button */}
                    <button
                      onClick={() => handleExportIcs(s)}
                      className="bg-slate-900 border-2 border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-100 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
                      title="Télécharger l'événement au format .ics pour Google Calendar / Outlook"
                    >
                      <CalendarPlus size={14} className="text-sky-400" />
                      <span>Ajouter à l'agenda</span>
                    </button>

                    {hasConfirmed ? (
                      <div className="text-xs font-mono font-black text-emerald-300 bg-emerald-500/20 border-2 border-emerald-500/40 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-inner">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        Présence Confirmée
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConfirmAttendance(s)}
                        className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black px-4.5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} className="stroke-[3]" />
                        <span>Confirmer ma présence</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Visual Hours + Welcome Instructions */}
      {(!currentTab || currentTab === 'student_dashboard') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left column (8 cols): Welcome Instructions */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Onboarding Welcome Instructions */}
            <section className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl relative">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2.5">
                <BookMarked size={18} className="text-sky-400" />
                Comment optimiser votre accompagnement ?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 space-y-1.5 hover:border-slate-700 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs">1</div>
                  <h4 className="font-bold text-white">Suivi d'Heures</h4>
                  <p className="text-slate-300 leading-normal">Consultez votre compteur à droite pour suivre votre consommation de séances.</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 space-y-1.5 hover:border-slate-700 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">2</div>
                  <h4 className="font-bold text-white">Devoirs & Bilans</h4>
                  <p className="text-slate-300 leading-normal">Vérifiez l'historique en bas pour voir les devoirs demandés par vos enseignants.</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 space-y-1.5 hover:border-slate-700 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">3</div>
                  <h4 className="font-bold text-white">Ressources Libres</h4>
                  <p className="text-slate-300 leading-normal">Téléchargez nos fiches méthodologiques et sujets corrigés à tout moment.</p>
                </div>
              </div>
            </section>

            {/* Resources nested inside grid only if no currentTab (e.g. showing everything) */}
            {!currentTab && renderResources()}

          </div>

          {/* Right column (4 cols): Sleek Hour Meter Card with dynamic framer-motion loader */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Hour Meter Card */}
            <section className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-3 text-sky-400 border-b border-slate-800 pb-3">
                <Clock size={20} />
                <div>
                  <h3 className="font-bold text-white text-sm">Mon Forfait d'Heures</h3>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {student.packageType === 'groupe_mensuel' ? 'Groupe (Paiement Mensuel)' : 
                     student.packageType === 'individuel_seance' ? 'Individuel (Paiement par séance)' : 
                     student.packageType.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Visual Gauge with framer motion loading */}
              <div className="space-y-3">
                <div className="flex justify-between items-end text-xs">
                  <span className="text-slate-300">Heures consommées</span>
                  <span className="font-mono text-white font-black">{usedHours} h / {totalHours} h</span>
                </div>
                
                {/* Progress bar container with fluid motion */}
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, (usedHours / totalHours) * 100))}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full shadow-[0_0_12px_rgba(14,165,233,0.4)]" 
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 flex-1 mr-2">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block leading-none mb-1">Restantes</span>
                    <motion.span 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="text-lg font-black text-white block"
                    >
                      {remainingHours} h
                    </motion.span>
                  </div>
                  <div className="text-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 flex-1">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block leading-none mb-1">Consommé</span>
                    <motion.span 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="text-lg font-black text-sky-400 block"
                    >
                      {percentRemaining}%
                    </motion.span>
                  </div>
                </div>
              </div>

              {/* Quick Billing Alert */}
              {student.paymentStatus === 'en_retard' ? (
                <div className="bg-rose-500/15 border border-rose-500/30 p-3 rounded-xl text-rose-200 text-xs flex gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-400 mt-0.5" />
                  <p><strong>Régularisation requise.</strong> Veuillez contacter l'administration de l'établissement pour solder vos heures.</p>
                </div>
              ) : student.paymentStatus === 'en_attente' ? (
                <div className="bg-amber-500/15 border border-amber-500/30 p-3 rounded-xl text-amber-200 text-xs flex gap-2">
                  <Info size={15} className="shrink-0 text-amber-400 mt-0.5" />
                  <p>Facture en cours de validation par votre tuteur/parent.</p>
                </div>
              ) : (
                <div className="bg-emerald-500/15 border border-emerald-500/30 p-3 rounded-xl text-emerald-200 text-xs flex gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400 mt-0.5" />
                  <p>Forfait d'heures à jour et validé. Merci pour votre confiance !</p>
                </div>
              )}
            </section>

            {/* Quick Stats: Achievements */}
            <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-300 text-xs uppercase font-mono tracking-wider">Objectifs Validés</h3>
                <p className="text-3xl font-black text-white">{student.progressReports.filter(r => r.reportedToParents).length}</p>
              </div>
              <div className="w-12 h-12 bg-sky-500/15 border border-sky-500/30 rounded-xl flex items-center justify-center text-sky-400">
                <Target size={22} />
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Standalone Resources Block for resources tab */}
      {currentTab === 'student_resources' && renderResources()}

      {/* Recharts Progression Dashboard Section with optimized contrast and framer motion on change */}
      {(!currentTab || currentTab === 'student_grades') && (
        <section className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <TrendingUp size={20} className="text-sky-400" />
              Progression Pédagogique & Évaluation
            </h2>
            <p className="text-xs text-slate-300">Visualisez vos résultats scolaires et le taux d'acquisition de vos compétences</p>
          </div>

          {/* Graphical Tabs */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs shrink-0 font-medium">
            <button
              onClick={() => setProgressionTab('grades')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                progressionTab === 'grades' 
                  ? 'bg-sky-500 text-slate-950 font-extrabold shadow-md' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Évolution des Évaluations
            </button>
            <button
              onClick={() => setProgressionTab('themes')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                progressionTab === 'themes' 
                  ? 'bg-indigo-500 text-white font-extrabold shadow-md' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Maîtrise des Thèmes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart area with slide motion wrapper */}
          <div className="lg:col-span-2 bg-slate-950 p-4 rounded-xl border-2 border-slate-800/80 min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={progressionTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="w-full h-full"
              >
                {progressionTab === 'grades' ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1 mb-2">
                      <span className="text-xs text-sky-400 font-mono font-bold">Performance moyenne (% de réussite)</span>
                      {!hasGrades && (
                        <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
                          Données illustratives
                        </span>
                      )}
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={gradesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} fontWeight="600" />
                          <YAxis stroke="#94a3b8" domain={[0, 100]} fontSize={11} tickLine={false} fontWeight="600" />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#0ea5e9" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorScore)" 
                            isAnimationActive={true}
                            animationDuration={1000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs text-indigo-400 font-mono font-bold block px-1 mb-2">Taux d'acquisition estimé par thème d'étude</span>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={themeMasteryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} fontWeight="600" />
                          <YAxis stroke="#94a3b8" domain={[0, 100]} fontSize={11} tickLine={false} fontWeight="600" />
                          <Tooltip content={<CustomThemeTooltip />} />
                          <Bar 
                            dataKey="maitrise" 
                            fill="#6366f1" 
                            radius={[6, 6, 0, 0]} 
                            barSize={30} 
                            isAnimationActive={true}
                            animationDuration={1000}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Summary / List of grades area with optimized colors */}
          <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-800/80 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-widest font-mono">
                {progressionTab === 'grades' ? 'Détail des notes obtenues' : 'Compétences Travaillées'}
              </h3>
              
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {progressionTab === 'grades' ? (
                  hasGrades ? (
                    gradesList.map((g) => (
                      <div key={g.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-xs hover:border-slate-700 transition-colors">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white text-xs">{g.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{g.subject} • {g.date}</p>
                        </div>
                        <span className="text-xs font-black text-sky-400 font-mono bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded-lg">
                          {g.score}/{g.maxScore}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg leading-normal">
                        ℹ️ Aucune note n'a été officiellement enregistrée pour l'instant. Les données de simulation ci-contre vous montrent comment s'affichera votre courbe d'excellence.
                      </p>
                      {[
                        { title: "Diag de Rentrée", score: "12/20", subject: "Soutien Général" },
                        { title: "Éval Trigonométrie", score: "15/20", subject: "Mathématiques" },
                        { title: "Devoir Fonctions", score: "17/20", subject: "Mathématiques" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex items-center justify-between text-[11px] opacity-75">
                          <div>
                            <p className="font-semibold text-slate-200">{item.title}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{item.subject}</p>
                          </div>
                          <span className="font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">{item.score}</span>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  themeMasteryData.map((theme, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg space-y-1.5 text-xs hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white truncate max-w-[120px]">{theme.name}</span>
                        <span className="text-[10px] font-mono font-black text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">{theme.maitrise}% acquis</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${theme.maitrise}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick action helper / tip */}
            <div className="border-t border-slate-800 pt-3.5 mt-3 text-[10px] text-slate-400 leading-normal flex items-start gap-2 bg-slate-900/40 p-2 rounded-lg">
              <Award size={14} className="shrink-0 text-sky-400 mt-0.5 animate-pulse" />
              <span>Votre objectif d'ici la fin du forfait est de valider la maîtrise globale de tous les thèmes planifiés à 100%.</span>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Simple Messaging System Block */}
      {(!currentTab || currentTab === 'student_messages') && (
        <section className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <MessageSquare size={20} className="text-sky-400" />
              Messagerie & Questions Rapides
            </h2>
            <p className="text-xs text-slate-300 font-medium">Posez vos questions directement à vos enseignants ou à l'administration</p>
          </div>

          {/* Recipient Toggles */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs shrink-0 font-medium">
            <button
              onClick={() => setMessageRecipient('teacher')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                messageRecipient === 'teacher' 
                  ? 'bg-sky-500 text-slate-950 font-extrabold shadow-md' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <User size={13} />
              Mon Enseignant
            </button>
            <button
              onClick={() => setMessageRecipient('admin')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                messageRecipient === 'admin' 
                  ? 'bg-indigo-500 text-white font-extrabold shadow-md' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck size={13} />
              L'Administration
            </button>
          </div>
        </div>

        {/* Chat Interface Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[380px] bg-slate-950 rounded-2xl border-2 border-slate-850 overflow-hidden">
          
          {/* Chat Recipient Info Sidebar */}
          <div className="md:col-span-4 bg-slate-900/60 p-4 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between text-xs space-y-3 shrink-0">
            <div className="space-y-3">
              <h3 className="font-extrabold uppercase text-slate-400 tracking-wider font-mono text-[10px]">Interlocuteur Actif</h3>
              
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${messageRecipient === 'teacher' ? 'bg-sky-400' : 'bg-indigo-400'}`} />
                  <span className="font-bold text-white text-xs">
                    {messageRecipient === 'teacher' ? 'Professeur Référent' : 'Service Clientèle'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {messageRecipient === 'teacher' 
                    ? "Posez des questions d'explications sur vos exercices, demandez de l'aide sur vos fiches de révisions ou ajustez votre méthodologie scolaire."
                    : "Pour toute question concernant la facturation de vos forfaits d'heures, l'accès à la plateforme, ou l'organisation administrative de l'année."}
                </p>
              </div>
            </div>

            <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-xl space-y-1 text-[11px]">
              <p className="font-bold flex items-center gap-1">
                <span>⚡ Support Prioritaire</span>
              </p>
              <p className="text-slate-300 leading-normal">Espoir de Réussite Académique s'engage à vous répondre par retour d'enseignant sous 24h.</p>
            </div>
          </div>

          {/* Chat message flow */}
          <div className="md:col-span-8 flex flex-col justify-between h-full relative">
            {/* Scrollable messages container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[300px]">
              {messages
                .filter(m => m.recipient === messageRecipient || m.sender === 'student')
                .map((msg) => {
                  const isMe = msg.sender === 'student';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-md border ${
                        isMe 
                          ? 'bg-sky-600 border-sky-500 text-white rounded-br-none' 
                          : msg.sender === 'admin' 
                            ? 'bg-slate-900 border-slate-800 text-slate-100 rounded-bl-none'
                            : 'bg-indigo-950/40 border-indigo-500/20 text-indigo-100 rounded-bl-none'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <span className="text-[9px] text-slate-400 font-mono mt-1 block text-right font-medium">
                          {isMe ? 'Moi' : msg.sender === 'admin' ? 'Coordinateur' : 'Enseignant'} • {msg.timestamp}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

              {/* Typing simulation */}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl px-4 py-2.5 text-xs flex items-center gap-1.5 rounded-bl-none font-mono">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span>L'interlocuteur écrit...</span>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-850 flex gap-2.5 items-center bg-slate-900/40">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={messageRecipient === 'teacher' ? "Posez une question sur vos cours..." : "Rédigez votre demande administrative..."}
                className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
              />
              <button
                type="submit"
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 p-2.5 rounded-xl transition-all font-black flex items-center justify-center shrink-0 cursor-pointer shadow-lg shadow-sky-500/10"
              >
                <Send size={14} className="stroke-[2.5]" />
              </button>
            </form>
          </div>

        </div>
      </section>
      )}

      {/* Interactive Mini-Calendar Section with ics exporter option */}
      {(!currentTab || currentTab === 'student_planning') && (
        <section className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <CalendarIcon size={18} className="text-sky-400" />
              Mon Calendrier de Cours
            </h2>
            <p className="text-xs text-slate-300">Planification personnalisée de vos séances sur 7 jours</p>
          </div>
          <span className="text-[10px] font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            {studentSessions.length} cours au total
          </span>
        </div>

        {/* 7 Days Slider Grid */}
        <div className="grid grid-cols-7 gap-2">
          {next7Days.map((day) => {
            const hasSessions = getSessionsForDate(day.dateStr).length > 0;
            const isSelected = selectedDate === day.dateStr;
            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDate(day.dateStr)}
                className={`py-3 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  isSelected 
                    ? 'bg-sky-600/20 border-sky-500/50 text-white shadow-[0_0_12px_rgba(14,165,233,0.15)]' 
                    : 'bg-slate-950 hover:bg-slate-800/40 border-slate-800/80 text-slate-400'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{day.dayName}</span>
                <span className="text-sm font-black mt-1">{day.dayNum}</span>
                
                {/* Glowing Dot representing courses */}
                <div className="h-1.5 w-1.5 mt-1 rounded-full bg-sky-400 shrink-0" style={{ opacity: hasSessions ? 1 : 0 }} />
              </button>
            );
          })}
        </div>

        {/* Details of Selected Date's Classes with Presence Confirmation & .ics calendars */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 min-h-[100px] flex flex-col justify-center">
          {selectedDateSessions.length > 0 ? (
            <div className="space-y-4">
              {selectedDateSessions.map((s) => {
                const course = courses.find(c => c.id === s.courseId);
                const hasConfirmed = s.attendance?.some(att => att.studentId === student.id && att.status === 'present');
                
                return (
                  <div 
                    key={s.id} 
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-750 transition-all"
                  >
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold uppercase text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-full">
                        {s.room || 'Salle non assignée'}
                      </span>
                      <h4 className="font-bold text-white text-sm">{course?.title || 'Cours particulier'}</h4>
                      <p className="text-xs text-slate-300">
                        Date de séance : {s.date} • Plage horaire : <strong className="text-indigo-400">{s.startTime} - {s.endTime}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto flex-wrap justify-end">
                      {/* Add to Calendar Event .ics */}
                      <button
                        onClick={() => handleExportIcs(s)}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-medium"
                        title="Ajouter à Google Calendar / Outlook (.ics)"
                      >
                        <CalendarPlus size={13} className="text-sky-400" />
                        <span>Agenda</span>
                      </button>

                      {s.status === 'planifié' && (
                        hasConfirmed ? (
                          <div className="text-[10px] font-mono font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-400" />
                            Présence Confirmée
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConfirmAttendance(s)}
                            className="bg-sky-600 hover:bg-sky-500 active:scale-95 text-slate-950 text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-sky-600/10"
                          >
                            <Check size={12} className="stroke-[3]" />
                            <span>Présence</span>
                          </button>
                        )
                      )}

                      <div className="text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-mono text-center shrink-0">
                        <span>Statut : </span>
                        <span className={`font-bold capitalize ${
                          s.status === 'planifié' ? 'text-sky-400' : s.status === 'terminé' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <CalendarIcon size={24} className="mx-auto mb-2 text-slate-600" />
              <p className="text-xs font-bold">Aucun cours planifié pour le {selectedDate}</p>
              <p className="text-[10px] text-slate-500 mt-1">Sélectionnez un autre jour ci-dessus ou contactez votre référent.</p>
            </div>
          )}
        </div>
      </section>
      )}

      {/* personal notes and past sessions summary list */}
      {(!currentTab || currentTab === 'student_history') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {student.notes && (
          <section className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2"><FileText size={18} className="text-sky-400" /> Notes Personnelles de l'Administration</h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{student.notes}</p>
            </div>
          </section>
        )}

        <section className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl flex flex-col h-full">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><History size={18} className="text-indigo-400" /> Bilans récents des Enseignants</h2>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {pastSessions.length > 0 ? (
              pastSessions.map(s => {
                const course = courses.find(c => c.id === s.courseId);
                return (
                  <div key={s.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-xs text-white">{course?.title || 'Cours inconnu'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{s.date}</p>
                    </div>
                    {s.summary ? (
                      <div className="text-[11px] text-slate-300 space-y-1 pt-1 border-t border-slate-800/60">
                        <p><strong className="text-sky-400">Travail effectué :</strong> {s.summary.workDone}</p>
                        <p><strong className="text-indigo-400">Devoirs demandés :</strong> {s.summary.homework}</p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">Bilan en attente de saisie par le professeur.</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-800 rounded-xl bg-slate-950/30 flex-1 flex flex-col justify-center">
                <History size={24} className="mx-auto mb-1 text-slate-600" />
                <p className="text-xs font-bold">Aucun historique disponible</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Vos rapports de cours s'afficheront ici au fur et à mesure.</p>
              </div>
            )}
          </div>
        </section>

      </div>
      )}
    </div>
  );
}
