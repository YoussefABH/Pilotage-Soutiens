import React, { useState, useEffect } from 'react';
import { Student, ClassSession, Course, Teacher, Objective, Theme, StudentGrade } from '../types';
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
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface ParentSpaceProps {
  students: Student[];
  sessions: ClassSession[];
  courses: Course[];
  teachers: Teacher[];
  objectives: Objective[];
  themes: Theme[];
  parentEmail: string;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  onUpdateStudent?: (student: Student) => void;
}

interface ChatMessage {
  id: string;
  sender: 'parent' | 'staff';
  text: string;
  timestamp: string;
}

export default function ParentSpace({ 
  students, 
  sessions, 
  courses, 
  teachers, 
  objectives, 
  themes, 
  parentEmail, 
  currentTab = 'parent_dashboard', 
  onTabChange,
  onUpdateStudent 
}: ParentSpaceProps) {
  
  // 1. Identify children linked to this parent email
  const linkedChildren = students.filter(s => s.parentId === parentEmail);
  const isDemoMode = linkedChildren.length === 0;

  // If in demo mode, show first 2 students as demo data so parent space is not blank
  const children = isDemoMode ? students.slice(0, 2) : linkedChildren;

  // Selected child filter (ID or 'all')
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const activeChildren = selectedChildId === 'all' ? children : children.filter(c => c.id === selectedChildId);

  // States for interactive features
  const [linkingOpen, setLinkingOpen] = useState(false);
  const [studentToLinkId, setStudentToLinkId] = useState('');
  const [linkMessage, setLinkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Billing states
  const [payingStudent, setPayingStudent] = useState<Student | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');

  // Messaging state
  const [activeContact, setActiveContact] = useState<'director' | string>('director'); // director or teacherId
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({
    director: [
      { id: '1', sender: 'staff', text: "Bonjour, je suis le directeur de l'établissement. Comment puis-je vous aider aujourd'hui ?", timestamp: '10:00' }
    ]
  });
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Download notification
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Lookup helpers
  const getTeacherName = (teacherId: string) => {
    const t = teachers.find(item => item.id === teacherId);
    return t ? `M./Mme ${t.firstName} ${t.lastName}` : 'Professeur de soutien';
  };

  const getCourseTitle = (courseId: string) => {
    const c = courses.find(item => item.id === courseId);
    return c ? c.title : 'Cours de soutien';
  };

  // Link account action
  const handleLinkStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToLinkId) return;

    const studentToLink = students.find(s => s.id === studentToLinkId);
    if (!studentToLink) {
      setLinkMessage({ type: 'error', text: "Élève introuvable." });
      return;
    }

    if (studentToLink.parentId) {
      setLinkMessage({ 
        type: 'error', 
        text: `Cet élève est déjà rattaché à un compte parent (${studentToLink.parentId}).` 
      });
      return;
    }

    if (onUpdateStudent) {
      onUpdateStudent({
        ...studentToLink,
        parentId: parentEmail
      });
      setLinkMessage({ 
        type: 'success', 
        text: `Félicitations ! ${studentToLink.firstName} ${studentToLink.lastName} est maintenant associé à votre compte parent.` 
      });
      setStudentToLinkId('');
      setTimeout(() => {
        setLinkMessage(null);
        setLinkingOpen(false);
      }, 3000);
    }
  };

  // Payment simulated action
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingStudent) return;

    setPaymentStep('processing');
    
    // Simulate API call
    setTimeout(() => {
      if (onUpdateStudent) {
        onUpdateStudent({
          ...payingStudent,
          paymentStatus: 'paye',
          balance: 0
        });
      }
      setPaymentStep('success');
      setTimeout(() => {
        setPayingStudent(null);
        setPaymentStep('form');
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        setCardName('');
      }, 2500);
    }, 2000);
  };

  // Send message simulation
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const currentRoom = activeContact;
    const parentMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'parent',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => ({
      ...prev,
      [currentRoom]: [...(prev[currentRoom] || []), parentMsg]
    }));
    setNewMessage('');
    setIsTyping(true);

    // Auto response from teacher / staff
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "Bonjour, j'ai bien pris note de votre message. Je vous recontacte au plus vite d'ici la fin de journée.";
      
      if (currentRoom === 'director') {
        replyText = "Bonjour, j'ai bien reçu votre demande d'ordre administratif. Notre secrétariat l'étudie et reviendra vers vous par téléphone ou e-mail sous 24h.";
      } else {
        const teacher = teachers.find(t => t.id === currentRoom);
        if (teacher) {
          replyText = `Bonjour, c'est M./Mme ${teacher.lastName}. Merci pour votre retour concernant le travail à la maison. Je ferai un point détaillé avec votre enfant lors de notre prochaine séance de soutien.`;
        }
      }

      const staffMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'staff',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations(prev => ({
        ...prev,
        [currentRoom]: [...(prev[currentRoom] || []), staffMsg]
      }));
    }, 1500);
  };

  // Export calendar sessions of children to ICS file format
  const handleExportICS = (studentName: string, childSessions: ClassSession[]) => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Soutien Scolaire d Excellence//Parent Calendar//FR\n";
    
    childSessions.forEach(s => {
      const courseTitle = getCourseTitle(s.courseId);
      const teacherName = getTeacherName(s.teacherId);
      const cleanDate = s.date.replace(/-/g, '');
      const cleanStartTime = s.startTime.replace(/:/g, '') + '00';
      const cleanEndTime = s.endTime.replace(/:/g, '') + '00';
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:Soutien ${courseTitle} - ${studentName}\n`;
      icsContent += `DTSTART:${cleanDate}T${cleanStartTime}\n`;
      icsContent += `DTEND:${cleanDate}T${cleanEndTime}\n`;
      icsContent += `DESCRIPTION:Séance dispensée par ${teacherName} en ${s.room}\n`;
      icsContent += `LOCATION:${s.room}\n`;
      icsContent += "END:VEVENT\n";
    });
    
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `planning_soutien_${studentName.toLowerCase().replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadNotice(`Calendrier de ${studentName} exporté au format .ics avec succès !`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  // Setup conversations automatically when teachers are loaded
  useEffect(() => {
    teachers.forEach(t => {
      if (!conversations[t.id]) {
        setConversations(prev => ({
          ...prev,
          [t.id]: [
            { id: t.id + '_1', sender: 'staff', text: `Bonjour ! Je suis M./Mme ${t.lastName}, enseignant(e) de soutien. N'hésitez pas à me poser vos questions sur les devoirs ou l'attitude de votre enfant.`, timestamp: '09:00' }
          ]
        }));
      }
    });
  }, [teachers]);

  // Aggregate stats across all children
  const totalHoursPurchased = children.reduce((acc, c) => acc + c.totalHours, 0);
  const totalHoursUsed = children.reduce((acc, c) => acc + c.usedHours, 0);
  const totalRemainingHours = totalHoursPurchased - totalHoursUsed;
  
  const unpaidInvoicesCount = children.filter(c => c.paymentStatus !== 'paye').length;
  
  const allGrades = children.flatMap(c => c.grades || []);
  const averageGrade = allGrades.length > 0 
    ? (allGrades.reduce((acc, g) => acc + (g.score / g.maxScore) * 20, 0) / allGrades.length).toFixed(1)
    : 'N/A';

  const childSessionsList = sessions.filter(s => 
    children.some(c => s.studentIds.includes(c.id))
  );
  const upcomingSessionsCount = childSessionsList.filter(s => s.status === 'planifié').length;

  return (
    <div className="space-y-8 p-1 sm:p-4">
      
      {/* Premium Notification Banner */}
      <AnimatePresence>
        {downloadNotice && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 border-2 border-emerald-500/40 text-emerald-300 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md"
          >
            <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
            <span className="text-xs font-semibold">{downloadNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with quick child context selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full uppercase font-bold border border-sky-500/25">
              Portail Parents
            </span>
            {isDemoMode && (
              <span className="text-[10px] font-mono tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full uppercase font-bold border border-amber-500/25">
                Données d'exemple
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Bienvenue sur votre Espace Parent
          </h1>
          <p className="text-slate-400 text-xs">Visualisez l'évolution scolaire et gérez la facturation de vos enfants.</p>
        </div>

        {/* Child filter tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedChildId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedChildId === 'all'
                ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            Tous les enfants ({children.length})
          </button>
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedChildId === child.id
                  ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0" />
              {child.firstName}
            </button>
          ))}
          <button
            onClick={() => setLinkingOpen(!linkingOpen)}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-950 border border-slate-800 hover:border-sky-500 text-sky-400 hover:bg-sky-500/10 transition-all flex items-center gap-1 cursor-pointer"
          >
            Lier un enfant +
          </button>
        </div>
      </div>

      {/* Linking panel */}
      <AnimatePresence>
        {linkingOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-xl"
          >
            <form onSubmit={handleLinkStudent} className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-sky-400" />
                  <h3 className="font-bold text-white text-sm">Associer un nouvel enfant à votre compte parent</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setLinkingOpen(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Fermer
                </button>
              </div>

              {linkMessage && (
                <div className={`p-3 rounded-xl text-xs border ${
                  linkMessage.type === 'success' 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200' 
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                }`}>
                  {linkMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-9 space-y-1.5">
                  <label className="text-xs text-slate-300 font-bold block">Sélectionnez l'élève à lier :</label>
                  <select
                    value={studentToLinkId}
                    onChange={(e) => setStudentToLinkId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    required
                  >
                    <option value="">-- Choisir un élève non-lié --</option>
                    {students
                      .filter(s => !s.parentId)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} ({s.gradeLevel}) - {s.email}
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={15} />
                    <span>Lier cet élève</span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal italic mt-1">
                Note : Pour le test, tous les élèves libres n'ayant pas de compte parent assigné apparaissent dans cette liste. La liaison se fera de façon persistante en modifiant la fiche de l'élève.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo warning card */}
      {isDemoMode && !linkingOpen && (
        <div className="bg-sky-950/20 border-2 border-sky-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sky-200">
          <div className="flex gap-2.5 items-start">
            <Info size={18} className="text-sky-400 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-xs leading-normal">
              <strong>Mode d'évaluation parent</strong> : Aucun élève n'étant rattaché à l'adresse parent <strong>{parentEmail}</strong>, nous affichons des élèves factices ({children.map(c=>c.firstName).join(', ')}) à titre de démonstration. Vous pouvez cliquer sur <strong>Lier un enfant</strong> ci-dessus pour rattacher un élève réel existant.
            </p>
          </div>
        </div>
      )}

      {/* =============================================================================================== */}
      {/* TAB 1: PARENT DASHBOARD */}
      {/* =============================================================================================== */}
      {currentTab === 'parent_dashboard' && (
        <div className="space-y-6">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-900 border-2 border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Heures Restantes</span>
                <p className="text-2xl font-black text-white">{totalRemainingHours} h</p>
                <span className="text-[10px] text-slate-400">Total consommé : {totalHoursUsed} h</span>
              </div>
              <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                <Clock size={20} />
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Moyenne Générale</span>
                <p className="text-2xl font-black text-indigo-400">{averageGrade} <span className="text-xs text-slate-400 font-normal">/20</span></p>
                <span className="text-[10px] text-slate-400">{allGrades.length} notes saisies</span>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Séances planifiées</span>
                <p className="text-2xl font-black text-amber-400">{upcomingSessionsCount} séances</p>
                <span className="text-[10px] text-slate-400">Cette semaine</span>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Calendar size={20} />
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Alertes Facturation</span>
                <p className={`text-2xl font-black ${unpaidInvoicesCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {unpaidInvoicesCount} en attente
                </p>
                <span className="text-[10px] text-slate-400">Factures ou découverts d'heures</span>
              </div>
              <div className={`p-3 rounded-xl border ${unpaidInvoicesCount > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                <CreditCard size={20} />
              </div>
            </div>

          </div>

          {/* Children Summaries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeChildren.map(child => {
              const childSessions = sessions.filter(s => s.studentIds.includes(child.id));
              const upcomingChildSessions = childSessions.filter(s => s.status === 'planifié');
              const recentChildGrades = child.grades ? child.grades.slice(0, 3) : [];
              const percentUsed = Math.min(100, Math.round((child.usedHours / child.totalHours) * 100));

              return (
                <div key={child.id} className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 space-y-6">
                  
                  {/* Child header info */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center font-bold font-mono text-sm border border-indigo-500/20">
                        {child.firstName[0]}{child.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{child.firstName} {child.lastName}</h3>
                        <p className="text-xs text-slate-400">{child.gradeLevel} • Inscrit(e) le {child.enrollmentDate}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      child.paymentStatus === 'paye'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : child.paymentStatus === 'en_attente'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                      {child.paymentStatus === 'paye' ? 'À Jour' : child.paymentStatus === 'en_attente' ? 'Facture Émise' : 'Régularisation requise'}
                    </span>
                  </div>

                  {/* Hourly package progress circle gauge */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-8 space-y-2">
                      <div className="flex justify-between items-end text-xs">
                        <span className="text-slate-300">Consommation du Forfait d'Heures</span>
                        <span className="font-mono text-white font-black">{child.usedHours} h / {child.totalHours} h</span>
                      </div>
                      
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-sky-500 h-full rounded-full"
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Il reste <strong className="text-white font-bold">{child.totalHours - child.usedHours} heures</strong> de cours disponibles à planifier pour ce forfait ({child.packageType.replace('_', ' ')}).
                      </p>
                    </div>

                    <div className="md:col-span-4 bg-slate-950 border border-slate-800 p-3 rounded-xl text-center space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Moyenne</span>
                      <p className="text-xl font-black text-white">
                        {child.grades && child.grades.length > 0 
                          ? (child.grades.reduce((a, g) => a + (g.score / g.maxScore) * 20, 0) / child.grades.length).toFixed(1)
                          : 'N/A'
                        } <span className="text-xs text-slate-400 font-normal">/20</span>
                      </p>
                    </div>
                  </div>

                  {/* Calendar highlight */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Calendar size={13} className="text-indigo-400" /> Prochains cours planifiés
                    </h4>
                    <div className="space-y-2">
                      {upcomingChildSessions.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Aucune séance planifiée de soutien en cours.</p>
                      ) : (
                        upcomingChildSessions.slice(0, 2).map(s => (
                          <div key={s.id} className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 flex justify-between items-center hover:border-slate-700 transition-colors">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-sky-400 uppercase">{getCourseTitle(s.courseId)}</span>
                              <p className="text-xs text-white font-semibold">{s.date} à {s.startTime}</p>
                            </div>
                            <span className="text-[10px] text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md font-mono">
                              {s.room}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Grades highlight */}
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <TrendingUp size={13} className="text-sky-400" /> Évaluations récentes
                    </h4>
                    <div className="space-y-2">
                      {recentChildGrades.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Aucune note saisie par les enseignants pour le moment.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {recentChildGrades.map(g => (
                            <div key={g.id} className="bg-slate-950 border border-slate-800/60 rounded-xl p-2.5 space-y-1">
                              <span className="text-[9px] font-mono uppercase text-slate-400 block truncate">{g.subject}</span>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-300 font-bold block truncate max-w-[50px]">{g.title}</span>
                                <span className={`text-xs font-mono font-black ${g.score / g.maxScore >= 0.7 ? 'text-emerald-400' : g.score / g.maxScore >= 0.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                                  {g.score}/{g.maxScore}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onTabChange?.('parent_grades')}
                      className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Résultats Détaillés</span>
                      <ChevronRight size={13} />
                    </button>
                    
                    {child.paymentStatus !== 'paye' && (
                      <button
                        onClick={() => {
                          setPayingStudent(child);
                          onTabChange?.('parent_billing');
                        }}
                        className="flex-1 bg-rose-500/20 border border-rose-500/30 hover:border-rose-400 text-rose-300 hover:text-white font-semibold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CreditCard size={13} />
                        <span>Régler la facture</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* =============================================================================================== */}
      {/* TAB 2: PARENT PLANNING */}
      {/* =============================================================================================== */}
      {currentTab === 'parent_planning' && (
        <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                <Calendar size={18} className="text-indigo-400" />
                Planning Complet des Enfants
              </h2>
              <p className="text-slate-400 text-xs">Suivi des séances de cours particuliers et d'accompagnement.</p>
            </div>
            
            {activeChildren.length === 1 && (
              <button
                onClick={() => handleExportICS(activeChildren[0].firstName, childSessionsList.filter(s => s.studentIds.includes(activeChildren[0].id)))}
                className="bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:text-indigo-400 text-slate-300 font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer font-mono"
              >
                <Download size={14} />
                <span>Exporter vers Google / Apple (.ics)</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {childSessionsList.length === 0 ? (
              <div className="text-center p-12 text-slate-400 border border-dashed border-slate-800 rounded-xl">
                Aucun cours particulier n'est actuellement programmé pour vos enfants.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                      <th className="pb-3 font-semibold">Élève</th>
                      <th className="pb-3 font-semibold">Matière / Cours</th>
                      <th className="pb-3 font-semibold">Date & Horaire</th>
                      <th className="pb-3 font-semibold">Enseignant</th>
                      <th className="pb-3 font-semibold">Salle / Lieu</th>
                      <th className="pb-3 font-semibold text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {childSessionsList.map(session => {
                      const childAttending = children.filter(c => session.studentIds.includes(c.id));
                      return (
                        <tr key={session.id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="py-4 font-bold text-white">
                            <div className="flex flex-wrap gap-1">
                              {childAttending.map(c => (
                                <span key={c.id} className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full text-[10px]">
                                  {c.firstName}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="font-bold text-indigo-400 text-sm block">
                              {getCourseTitle(session.courseId)}
                            </span>
                          </td>
                          <td className="py-4 space-y-0.5">
                            <p className="text-white font-semibold font-mono">{session.date}</p>
                            <p className="text-slate-400 text-[11px] font-mono">{session.startTime} - {session.endTime}</p>
                          </td>
                          <td className="py-4 text-slate-300 font-medium">
                            {getTeacherName(session.teacherId)}
                          </td>
                          <td className="py-4">
                            <span className="font-mono text-[11px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                              {session.room}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border uppercase font-mono ${
                              session.status === 'planifié'
                                ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                                : session.status === 'terminé'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}>
                              {session.status === 'planifié' ? 'À venir' : session.status === 'terminé' ? 'Réalisé' : 'Annulé'}
                            </span>
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
      {/* TAB 3: PARENT GRADES */}
      {/* =============================================================================================== */}
      {currentTab === 'parent_grades' && (
        <div className="space-y-6">
          
          {/* Performance chart */}
          <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <TrendingUp size={18} className="text-sky-400" />
              Courbe d'Évolution des Notes
            </h2>
            
            {allGrades.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">Aucune note disponible pour tracer les courbes.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={children.flatMap(c => 
                      (c.grades || []).map(g => ({
                        date: g.date,
                        [c.firstName]: Number(((g.score / g.maxScore) * 20).toFixed(1)),
                        evaluation: g.title
                      }))
                    ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} fontClassName="font-mono" />
                    <YAxis domain={[0, 20]} stroke="#64748b" fontSize={10} fontClassName="font-mono" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} 
                      labelClassName="text-slate-400 text-xs"
                    />
                    <Legend verticalAlign="top" height={36} />
                    {children.map((child, idx) => (
                      <Line 
                        key={child.id} 
                        type="monotone" 
                        dataKey={child.firstName} 
                        stroke={idx === 0 ? '#0ea5e9' : '#818cf8'} 
                        strokeWidth={3} 
                        activeDot={{ r: 8 }} 
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Grades Listing with competencies badges */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeChildren.map(child => (
              <div key={child.id} className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <User size={16} className="text-indigo-400" />
                    Relevé : {child.firstName} {child.lastName}
                  </h3>
                  <span className="text-xs bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full font-bold text-slate-300">
                    {child.gradeLevel}
                  </span>
                </div>

                <div className="space-y-3">
                  {!child.grades || child.grades.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">Aucune note de contrôle enregistrée.</p>
                  ) : (
                    child.grades.map(grade => {
                      const ratio = grade.score / grade.maxScore;
                      return (
                        <div key={grade.id} className="bg-slate-950 border border-slate-800/60 p-4 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                                {grade.subject}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{grade.date}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white leading-none">{grade.title}</h4>
                          </div>

                          <div className="text-right space-y-1">
                            <span className={`text-sm font-black font-mono block ${ratio >= 0.75 ? 'text-emerald-400' : ratio >= 0.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {grade.score} / {grade.maxScore}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Moyenne : {((grade.score / grade.maxScore) * 20).toFixed(1)} / 20
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* =============================================================================================== */}
      {/* TAB 4: PARENT BILLING */}
      {/* =============================================================================================== */}
      {currentTab === 'parent_billing' && (
        <div className="space-y-6">
          
          {/* Packages overview & balance summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {activeChildren.map(child => {
              const packageCost = child.packageType === 'groupe_mensuel' ? 120 : child.packageType === 'individuel_seance' ? 300 : child.packageType === 'forfait_10h' ? 250 : child.packageType === 'forfait_20h' ? 450 : child.packageType === 'forfait_30h' ? 600 : 180;
              const percentUsed = Math.round((child.usedHours / child.totalHours) * 100);
              
              return (
                <div key={child.id} className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-5 flex flex-col justify-between relative overflow-hidden">
                  {child.paymentStatus !== 'paye' && (
                    <div className="absolute top-3 right-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 font-black text-[9px] font-mono tracking-widest px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                      <AlertTriangle size={11} className="text-rose-400" />
                      <span>Règlement attendu</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Compte Forfait Éléve</span>
                      <h3 className="font-black text-white text-lg">{child.firstName} {child.lastName}</h3>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">Type de forfait :</span>
                        <span className="font-mono text-white font-bold capitalize">{child.packageType.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">Heures consommées :</span>
                        <span className="font-mono text-white font-bold">{child.usedHours}h / {child.totalHours}h</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">Coût total forfait :</span>
                        <span className="font-mono text-emerald-400 font-black">{packageCost} €</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-2">
                        <span className="text-slate-300 font-semibold">Statut Solde :</span>
                        <span className={`font-bold font-mono text-xs uppercase ${child.paymentStatus === 'paye' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {child.paymentStatus === 'paye' ? 'Soldé (0 €)' : `${child.balance || packageCost} € dûs`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    {child.paymentStatus === 'paye' ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span className="font-bold">Règlement à jour</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPayingStudent(child)}
                        className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <CreditCard size={14} />
                        <span>Solder la facture ({child.balance || packageCost} €)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          </div>

          {/* Checkout modal sheet simulated */}
          <AnimatePresence>
            {payingStudent && (
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
                  className="bg-slate-900 border-2 border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                >
                  
                  {/* Modal Header */}
                  <div className="bg-slate-950 p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Lock size={18} className="text-sky-400" />
                      <div>
                        <h3 className="font-bold text-white text-base">Paiement Sécurisé SSL</h3>
                        <p className="text-[10px] text-slate-400">Compte : {payingStudent.firstName} {payingStudent.lastName}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPayingStudent(null)}
                      className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>

                  {/* Modal steps */}
                  <div className="p-6">
                    {paymentStep === 'form' && (
                      <form onSubmit={handleProcessPayment} className="space-y-4">
                        <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl flex justify-between items-center">
                          <span className="text-xs text-slate-300">Montant total à régulariser :</span>
                          <span className="text-base font-black text-emerald-400 font-mono">
                            {payingStudent.balance || (payingStudent.packageType === 'groupe_mensuel' ? 120 : payingStudent.packageType === 'individuel_seance' ? 300 : payingStudent.packageType === 'forfait_10h' ? 250 : payingStudent.packageType === 'forfait_20h' ? 450 : 600)} €
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-300 font-bold block">Nom sur la carte :</label>
                            <input 
                              type="text"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              placeholder="M. ou Mme Youssef"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-300 font-bold block font-mono">Numéro de carte bancaire :</label>
                            <input 
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="4242 4242 4242 4242"
                              maxLength={19}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-300 font-bold block">Date d'expiration :</label>
                              <input 
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="MM/YY"
                                maxLength={5}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-slate-300 font-bold block font-mono">Code CVC / CVV :</label>
                              <input 
                                type="password"
                                value={cardCvc}
                                onChange={(e) => setCardCvc(e.target.value)}
                                placeholder="123"
                                maxLength={3}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-bold text-xs py-3 px-4 rounded-xl cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                          <Lock size={14} />
                          <span>Confirmer le règlement sécurisé</span>
                        </button>
                      </form>
                    )}

                    {paymentStep === 'processing' && (
                      <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        <h4 className="font-bold text-white text-sm">Authentification 3D Secure en cours...</h4>
                        <p className="text-xs text-slate-400">Veuillez patienter pendant la validation de la transaction bancaire.</p>
                      </div>
                    )}

                    {paymentStep === 'success' && (
                      <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/30">
                          <CheckCircle2 size={36} />
                        </div>
                        <h4 className="font-bold text-white text-base">Règlement enregistré avec succès !</h4>
                        <p className="text-xs text-slate-300 max-w-sm leading-normal">
                          La facture a été marquée comme payée. Les heures associées sont créditées et synchronisées en temps réel avec l'administration.
                        </p>
                      </div>
                    )}
                  </div>

                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* =============================================================================================== */}
      {/* TAB 5: PARENT MESSAGES */}
      {/* =============================================================================================== */}
      {currentTab === 'parent_messages' && (
        <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <MessageSquare size={18} className="text-indigo-400" />
              Messagerie & Liaison Enseignants
            </h2>
            <p className="text-slate-400 text-xs">Posez vos questions ou signalez une absence directement aux équipes pédagogiques.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[400px]">
            
            {/* Contacts Sidebar List */}
            <div className="md:col-span-4 bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
              <h3 className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mb-2">Destinataires disponibles</h3>
              
              {/* Director contact */}
              <button
                onClick={() => setActiveContact('director')}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                  activeContact === 'director'
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/30">
                  DIR
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Directeur d'Établissement</h4>
                  <span className="text-[9px] text-slate-400">Questions Administratives</span>
                </div>
              </button>

              {/* Teachers contact list */}
              {teachers.map(teacher => (
                <button
                  key={teacher.id}
                  onClick={() => setActiveContact(teacher.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                    activeContact === teacher.id
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                    {teacher.firstName[0]}{teacher.lastName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">M./Mme {teacher.lastName}</h4>
                    <span className="text-[9px] text-slate-400">Soutien {teacher.subjects.join(', ')}</span>
                  </div>
                </button>
              ))}

            </div>

            {/* Chat Conversation Box */}
            <div className="md:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden relative">
              
              {/* Box header */}
              <div className="bg-slate-900/60 p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">
                    {activeContact === 'director' 
                      ? 'Administration - Directeur' 
                      : `Discussion avec ${getTeacherName(activeContact)}`
                    }
                  </h4>
                  <span className="text-[9px] text-slate-400 font-mono">● Réponse rapide généralement sous 24h</span>
                </div>
              </div>

              {/* Message scroll section */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1 max-h-[300px]">
                {(conversations[activeContact] || []).map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[85%] space-y-1 ${msg.sender === 'parent' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className={`p-3 rounded-xl text-xs leading-normal ${
                      msg.sender === 'parent' 
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-tr-none' 
                        : 'bg-slate-900 text-slate-300 border border-slate-800 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">{msg.timestamp}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="mr-auto items-start flex gap-1 bg-slate-900 border border-slate-800 p-3 rounded-xl rounded-tl-none max-w-[20%]">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                )}
              </div>

              {/* Box inputs */}
              <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/60 border-t border-slate-800 flex gap-2">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Send size={15} />
                </button>
              </form>

            </div>

          </div>
        </div>
      )}

      {/* =============================================================================================== */}
      {/* TAB 6: PARENT HISTORY (TEACHER REPORTS) */}
      {/* =============================================================================================== */}
      {currentTab === 'parent_history' && (
        <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <History size={18} className="text-indigo-400" />
              Bilans de séances & Devoirs à faire
            </h2>
            <p className="text-slate-400 text-xs">Suivi en continu des rapports pédagogiques renseignés par les enseignants après chaque cours.</p>
          </div>

          <div className="space-y-6">
            {activeChildren.map(child => {
              const childReports = child.progressReports || [];
              return (
                <div key={child.id} className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">
                      Historique pédagogique de : {child.firstName} {child.lastName}
                    </h3>
                    <span className="text-xs text-indigo-400 font-bold">{childReports.length} comptes-rendus</span>
                  </div>

                  {childReports.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">Aucun compte-rendu d'évaluation ou de bilan rédigé par un enseignant pour le moment.</p>
                  ) : (
                    <div className="relative border-l-2 border-slate-800 pl-6 ml-3 space-y-6">
                      {childReports.map(report => (
                        <div key={report.id} className="relative space-y-2">
                          
                          {/* Circle dot on timeline */}
                          <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-slate-950 border-2 border-sky-500 rounded-full" />

                          <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-3.5">
                            
                            {/* Report Header */}
                            <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-800 pb-2.5">
                              <div>
                                <span className="text-[10px] font-mono text-slate-400">{report.date}</span>
                                <h4 className="font-bold text-white text-xs">{report.sessionTitle}</h4>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 mr-1">Comportement :</span>
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    size={11} 
                                    className={i < report.behaviorRating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} 
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Report Body Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-normal">
                              <div className="space-y-1">
                                <strong className="text-slate-300 block font-bold font-mono text-[10px] uppercase tracking-wider">📚 Notion Travaillée :</strong>
                                <p className="text-slate-400">{report.workDone || "Notion de cours."}</p>
                              </div>
                              <div className="space-y-1">
                                <strong className="text-indigo-400 block font-bold font-mono text-[10px] uppercase tracking-wider">📝 Devoirs assignés :</strong>
                                <p className="text-slate-400 italic">{report.homework || "Aucun devoir particulier pour le prochain cours."}</p>
                              </div>
                            </div>

                            {/* Personal comments */}
                            {report.comment && (
                              <div className="bg-slate-900 border border-slate-800/60 p-3 rounded-xl text-xs">
                                <strong className="text-sky-300 block font-bold mb-1 font-mono text-[10px] uppercase">Observations de l'Enseignant :</strong>
                                <p className="text-slate-300 leading-relaxed italic">"{report.comment}"</p>
                              </div>
                            )}

                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
