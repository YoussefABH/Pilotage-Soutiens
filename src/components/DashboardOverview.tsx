import React, { useState } from 'react';
import { Course, Student, Teacher, ClassSession, AuditLogEntry } from '../types';
import { checkPlanningConflicts } from '../lib/planning';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle,
  Clock,
  Briefcase,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Send,
  Printer,
  Download,
  Bell,
  Plus,
  CalendarPlus,
  UserPlus,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { DashboardCharts } from './DashboardCharts';

export function getDurationHours(start: string, end: string): number {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 1.5;
  const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  return Math.max(0, diffMinutes / 60);
}

interface DashboardOverviewProps {
  currency: string;
  courses: Course[];
  students: Student[];
  teachers: Teacher[];
  sessions: ClassSession[];
  onNavigate: (tab: string) => void;
  onAddAuditLog: (action: string, entityType: string, entityId: string, description: string, status?: string) => void;
  onAddNotification: (message: string, type?: 'success' | 'warning') => void;
  onUpdateStudent: (student: Student) => void;
  auditLogs: AuditLogEntry[];
  academicYear?: string;
  academicYears?: string[];
  receipts?: any[];
  onGetYearData?: (year: string) => Promise<any>;
}

export default function DashboardOverview({
  currency,
  courses,
  students,
  teachers,
  sessions,
  onNavigate,
  onAddAuditLog,
  onAddNotification,
  onUpdateStudent,
  auditLogs,
  academicYear = 'A.S-2025-2026',
  academicYears = ['A.S-2025-2026'],
  receipts = [],
  onGetYearData
}: DashboardOverviewProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Year comparison states
  const [selectedCompareYear, setSelectedCompareYear] = useState<string>('');
  const [compareData, setCompareData] = useState<any>(null);
  const [isLoadingCompare, setIsLoadingCompare] = useState<boolean>(false);

  // Initialize selected comparison year
  React.useEffect(() => {
    const otherYears = academicYears.filter(y => y !== academicYear);
    if (otherYears.length > 0) {
      setSelectedCompareYear(otherYears[otherYears.length - 1]);
    } else {
      setSelectedCompareYear('');
    }
  }, [academicYears, academicYear]);

  // Load selected comparison year data
  React.useEffect(() => {
    if (!selectedCompareYear || !onGetYearData) {
      setCompareData(null);
      return;
    }

    let isMounted = true;
    const loadCompareData = async () => {
      setIsLoadingCompare(true);
      try {
        const data = await onGetYearData(selectedCompareYear);
        if (isMounted) {
          setCompareData(data);
        }
      } catch (err) {
        console.error("Error loading comparison year data:", err);
      } finally {
        if (isMounted) {
          setIsLoadingCompare(false);
        }
      }
    };

    loadCompareData();
    return () => {
      isMounted = false;
    };
  }, [selectedCompareYear, onGetYearData]);

  // Current Year Stats
  const currentYearReceiptsTotal = receipts ? receipts.reduce((acc, r) => acc + (r.amount || 0), 0) : 0;
  
  // Current year calculated revenue from completed sessions
  const currentYearSessionsTotal = sessions
    .filter(s => s.status === 'terminé')
    .reduce((acc, s) => {
      const course = courses.find(c => c.id === s.courseId);
      if (!course) return acc;
      const duration = getDurationHours(s.startTime, s.endTime);
      return acc + (duration * course.hourlyRate * s.studentIds.length);
    }, 0);

  // Previous Selected Year Stats
  const compareYearReceiptsTotal = compareData?.receipts 
    ? compareData.receipts.reduce((acc: number, r: any) => acc + (r.amount || 0), 0) 
    : 0;

  const compareYearSessionsTotal = compareData?.sessions 
    ? compareData.sessions
        .filter((s: any) => s.status === 'terminé')
        .reduce((acc: number, s: any) => {
          const course = (compareData.courses || []).find((c: any) => c.id === s.courseId);
          if (!course) return acc;
          const duration = getDurationHours(s.startTime, s.endTime);
          return acc + (duration * (course.hourlyRate || 0) * (s.studentIds || []).length);
        }, 0)
    : 0;

  // Differences
  const receiptsDiffAmount = currentYearReceiptsTotal - compareYearReceiptsTotal;
  const receiptsDiffPercent = compareYearReceiptsTotal > 0 
    ? Math.round((receiptsDiffAmount / compareYearReceiptsTotal) * 100)
    : 0;

  const sessionsDiffAmount = currentYearSessionsTotal - compareYearSessionsTotal;
  const sessionsDiffPercent = compareYearSessionsTotal > 0 
    ? Math.round((sessionsDiffAmount / compareYearSessionsTotal) * 100)
    : 0;

  // Comparison chart data formatted nicely for Recharts
  const comparisonChartData = [
    {
      name: "Recettes (Reçus)",
      [academicYear]: currentYearReceiptsTotal,
      [selectedCompareYear || 'N/A']: compareYearReceiptsTotal,
    },
    {
      name: "Chiffre d'Affaires (Heures)",
      [academicYear]: currentYearSessionsTotal,
      [selectedCompareYear || 'N/A']: compareYearSessionsTotal,
    }
  ];
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  
  // Filter state
  const [periodFilter, setPeriodFilter] = useState('month');
  const [teacherFilter, setTeacherFilter] = useState('Tous');
  
  // Date range filter
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');

  React.useEffect(() => {
    if (periodFilter === 'month') {
      setStartDate('2026-06-01');
      setEndDate('2026-06-30');
    } else if (periodFilter === 'quarter') {
      setStartDate('2026-04-01');
      setEndDate('2026-06-30');
    }
  }, [periodFilter]);

  const filteredSessions = sessions.filter(s => {
    const dateMatch = s.date >= startDate && s.date <= endDate;
    const teacherMatch = teacherFilter === 'Tous' || s.teacherId === teacherFilter;
    return dateMatch && teacherMatch;
  });
  const completedSessions = filteredSessions.filter(s => s.status === 'terminé');

  const monthlyRevenueByMonth = completedSessions
    .reduce((acc: any, s) => {
      const course = courses.find(c => c.id === s.courseId);
      if (!course) return acc;
      const duration = getDurationHours(s.startTime, s.endTime);
      const revenue = duration * course.hourlyRate * s.studentIds.length;
      const month = s.date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + revenue;
      return acc;
    }, {});

  const revenueChartData = Object.entries(monthlyRevenueByMonth)
    .map(([month, value]) => ({ month, value: Number(value) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const fillRateChartData = sessions
    .filter(s => s.status === 'terminé')
    .map(s => ({
      date: s.date,
      students: s.studentIds.length,
    }));

  const handleRelancer = async (student: Student) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: student.email, // Assuming student has email
          subject: 'Relance de paiement',
          message: `Bonjour ${student.firstName}, merci de régulariser votre situation.`
        })
      });
      if (response.ok) {
        onAddNotification(`Relance de paiement envoyée à ${student.firstName} ${student.lastName}`);
        onAddAuditLog('update', 'student', student.id, `Relance paiement envoyée à ${student.firstName} ${student.lastName}`, 'envoyé');
      } else {
        onAddNotification(`Erreur lors de l'envoi de la relance à ${student.firstName} ${student.lastName}`, 'warning');
      }
    } catch (e) {
      console.error(e);
      onAddNotification(`Erreur lors de l'envoi de la relance à ${student.firstName} ${student.lastName}`, 'warning');
    }
  };

  const handleRecharger = (student: Student) => {
    const updatedStudent = { ...student, totalHours: student.totalHours + 10, paymentStatus: 'en_attente' as const };
    onUpdateStudent(updatedStudent);
    onAddNotification(`10h ajoutées au forfait de ${student.firstName} ${student.lastName}. En attente de paiement.`);
    onAddAuditLog('update', 'student', student.id, `Rechargement 10h pour ${student.firstName} ${student.lastName}`);
  };

  // CSV Exporter functions
  const exportStudentsCSV = () => {
    const headers = [
      'ID', 'Nom', 'Prénom', 'Niveau', 'Email', 'Téléphone', 'Date d\'inscription', 'Statut', 'Type de Forfait', 'Heures Totales', 'Heures Utilisées', 'Heures Restantes', 'Statut Paiement', `Solde Facturé (${currency})`
    ];
    const rows = students.map(s => [
      s.id,
      s.lastName,
      s.firstName,
      s.gradeLevel,
      s.email,
      s.phone,
      s.enrollmentDate,
      s.status === 'actif' ? 'Actif' : 'Suspendu',
      s.packageType,
      s.totalHours,
      s.usedHours,
      s.totalHours - s.usedHours,
      s.paymentStatus === 'paye' ? 'Payé' : s.paymentStatus === 'en_attente' ? 'En attente' : 'En retard',
      s.balance
    ]);
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rapport_etudiants_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCoursesCSV = () => {
    const headers = [
      'ID', 'Titre', 'Description', 'Matière', 'Niveau', `Tarif Horaire (${currency}/h)`
    ];
    const rows = courses.map(c => [
      c.id,
      c.title,
      c.description,
      c.subject,
      c.level,
      c.hourlyRate
    ]);
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rapport_cours_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. COMPUTE KEY METRICS

  // A. Total hours taught this month (status: 'terminé')
  const totalHoursTaught = completedSessions.reduce((acc, s) => {
    return acc + getDurationHours(s.startTime, s.endTime);
  }, 0);

  // B. Taux de remplissage global des classes (number of active students in scheduled courses / max capacity, let's say average 4 students max)
  // Let's assume average course capacity of 5 students. Filling rate = average students count in session / 5
  const activeSessions = sessions.filter(s => s.status === 'planifié' || s.status === 'terminé');
  const avgSessionStudents = activeSessions.length > 0 
    ? activeSessions.reduce((acc, s) => acc + s.studentIds.length, 0) / activeSessions.length 
    : 0;
  const fillingRatePercent = Math.min(100, Math.round((avgSessionStudents / 4) * 100)); // normalized to max target of 4 students per class

  // C. Taux d'absentéisme (absent students in past sessions / total attendances taken)
  let totalAttendanceTaken = 0;
  let totalAbsences = 0;
  completedSessions.forEach(s => {
    if (s.attendance) {
      s.attendance.forEach(att => {
        totalAttendanceTaken++;
        if (att.status === 'absent_justifie' || att.status === 'absent_non_justifie') {
          totalAbsences++;
        }
      });
    }
  });
  const absenteeismRate = totalAttendanceTaken > 0 
    ? Math.round((totalAbsences / totalAttendanceTaken) * 100) 
    : 5; // fallback 5% if no attendance records yet

  // D. Chiffre d'affaires mensuel cumulé
  // This is calculated based on hours taught (usedHours) * hourly rate or total student pack balances
  // Let's calculate the total invoice value of active students to show the total value managed by the school.
  const activeStudents = students.filter(s => s.status === 'actif');
  const totalRevenue = students.reduce((acc, student) => {
    // Standard estimation of billing value based on total package hours purchased
    let studentRate = 25; // default rate
    // Let's find first course this student takes to fetch exact hourly rate
    const studentSessions = sessions.filter(s => s.studentIds.includes(student.id));
    if (studentSessions.length > 0) {
      const course = courses.find(c => c.id === studentSessions[0].courseId);
      if (course) studentRate = course.hourlyRate;
    }
    return acc + (student.totalHours * studentRate);
  }, 0);

  // E. Cash collection & pending invoice alerts
  const latePaymentStudents = students.filter(s => s.paymentStatus === 'en_retard');
  const pendingPaymentStudents = students.filter(s => s.paymentStatus === 'en_attente');
  const totalArrearsAmount = latePaymentStudents.reduce((acc, s) => {
    // Estimating unpaid balance based on package hours left or total rate
    return acc + (s.totalHours * 25); // standard estimation
  }, 0);

  // F. Forfaits alert: students with < 3 hours remaining
  const forfaitsInDanger = students.filter(s => {
    const remaining = s.totalHours - s.usedHours;
    return s.status === 'actif' && remaining <= 3 && s.packageType !== 'abonnement_mensuel';
  });

  // G. Conflicts detection
  const conflicts = checkPlanningConflicts(sessions);

  // Today's Date
  const TODAY_STR = '2026-06-23';
  const todaySessions = sessions
    .filter(s => s.date === TODAY_STR)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // NEW METRICS
  const activeStudentsCount = students.filter(s => s.status === 'actif').length;
  const sessionsTodayCount = filteredSessions.filter(s => s.date === TODAY_STR).length;
  const monthlyRevenue = completedSessions
    .filter(s => s.date.startsWith('2026-06'))
    .reduce((acc, s) => {
      const course = courses.find(c => c.id === s.courseId);
      return acc + (course ? getDurationHours(s.startTime, s.endTime) * course.hourlyRate * s.studentIds.length : 0);
    }, 0);

  const studentsFilteredByTeacher = teacherFilter === 'Tous' 
    ? students
    : students.filter(s => filteredSessions.some(sess => sess.studentIds.includes(s.id)));

  // NEW CHARTS DATA
  const packageDist = studentsFilteredByTeacher
    .filter(s => s.status === 'actif')
    .reduce((acc: any, s) => {
      acc[s.packageType] = (acc[s.packageType] || 0) + 1;
      return acc;
    }, {});

  const getPackageDisplayName = (type: string) => {
    switch (type) {
      case 'groupe_mensuel': return 'Groupe (Mensuel)';
      case 'individuel_seance': return 'Individuel (Séance)';
      case 'forfait_10h': return 'Forfait 10h';
      case 'forfait_20h': return 'Forfait 20h';
      case 'forfait_30h': return 'Forfait 30h';
      case 'abonnement_mensuel': return 'Abonnement Mensuel';
      default: return type.replace('_', ' ');
    }
  };

  const pieChartData = Object.entries(packageDist).map(([name, value]) => ({ 
    name: getPackageDisplayName(name), 
    value 
  }));

  const studentUsageData = studentsFilteredByTeacher
    .filter(s => s.status === 'actif' && s.totalHours > 0)
    .map(s => ({
      name: `${s.firstName.charAt(0)}. ${s.lastName}`,
      rate: Math.round((s.usedHours / s.totalHours) * 100)
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10); // Take top 10

  const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'];

  // H. Weekly Revenue Graph Calculation
  const daysOfWeek = [
    { key: '2026-06-22', name: 'Lun 22' },
    { key: '2026-06-23', name: 'Mar 23' },
    { key: '2026-06-24', name: 'Mer 24' },
    { key: '2026-06-25', name: 'Jeu 25' },
    { key: '2026-06-26', name: 'Ven 26' },
    { key: '2026-06-27', name: 'Sam 27' },
    { key: '2026-06-28', name: 'Dim 28' },
  ];

  const weeklyRevenueData = daysOfWeek.map(day => {
    const daySessions = sessions.filter(s => s.date === day.key && s.status !== 'annulé');
    const dayRevenue = daySessions.reduce((acc, sess) => {
      const course = courses.find(c => c.id === sess.courseId);
      if (!course) return acc;
      const hours = getDurationHours(sess.startTime, sess.endTime);
      return acc + (hours * course.hourlyRate * sess.studentIds.length);
    }, 0);

    return {
      day: day.name,
      revenue: dayRevenue,
      sessionCount: daySessions.length,
    };
  });

  const maxRevenue = Math.max(...weeklyRevenueData.map(d => d.revenue), 100);

  // I. Inscriptions par niveau
  const levels = ['Primaire', 'Collège', 'Lycée'];
  const studentsByLevel = levels.map(lvl => {
    const count = students.filter(s => {
      if (lvl === 'Lycée') return s.gradeLevel.includes('Terminale') || s.gradeLevel.includes('1ère') || s.gradeLevel.includes('Seconde');
      if (lvl === 'Collège') return s.gradeLevel.includes('3ème') || s.gradeLevel.includes('4ème') || s.gradeLevel.includes('5ème') || s.gradeLevel.includes('6ème');
      return s.gradeLevel.includes('CM2') || s.gradeLevel.includes('CM1') || s.gradeLevel.includes('CE2') || s.gradeLevel.includes('CE1') || s.gradeLevel.includes('CP');
    }).length;
    return { name: lvl, count };
  });

  const totalLevelInscriptions = studentsByLevel.reduce((acc, c) => acc + c.count, 0) || 1;

  // Group total revenue by package type (Monthly subscription / group vs per session / individual)
  const revenueByPackageType = students.reduce((acc, student) => {
    let packageCost = 0;
    if (student.packageType === 'groupe_mensuel') {
      packageCost = 120;
    } else if (student.packageType === 'individuel_seance') {
      packageCost = 300;
    } else if (student.packageType === 'forfait_10h') {
      packageCost = 250;
    } else if (student.packageType === 'forfait_20h') {
      packageCost = 480;
    } else if (student.packageType === 'forfait_30h') {
      packageCost = 690;
    } else if (student.packageType === 'abonnement_mensuel') {
      packageCost = 360;
    } else {
      packageCost = student.totalHours * 25; // fallback
    }

    const isMonthly = student.packageType === 'groupe_mensuel' || student.packageType === 'abonnement_mensuel';
    
    if (isMonthly) {
      acc.monthly += packageCost;
      acc.monthlyCount += 1;
    } else {
      acc.perSession += packageCost;
      acc.perSessionCount += 1;
    }
    return acc;
  }, { monthly: 0, perSession: 0, monthlyCount: 0, perSessionCount: 0 });

  // Resolve teacher name for conflict warnings
  const getTeacherFullName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `Prof. ${teacher.firstName} ${teacher.lastName}` : 'Enseignant';
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-white tracking-tight flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
              Pilotage Soutien
            </span>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-800 text-slate-400 rounded-md uppercase tracking-wider font-mono">
              PRO EDITION
            </span>
          </h1>
          <p className="text-slate-400 mt-1.5 text-sm max-w-2xl">
            Console de décision opérationnelle & financière. Éliminez les conflits, suivez les forfaits et maximisez la performance de votre école.
          </p>
        </div>
        {/* Filter controls */}
        <div className="flex gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 self-start">
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="bg-slate-950 p-2 rounded-lg text-xs">
            <option value="month">Mois</option>
            <option value="quarter">Trimestre</option>
          </select>
          <select value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)} className="bg-slate-950 p-2 rounded-lg text-xs">
            <option value="Tous">Tous les professeurs</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
          </select>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-950 p-2 rounded-lg text-xs" />
          <span className="self-center text-slate-500">à</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-950 p-2 rounded-lg text-xs" />
        </div>
        <div className="flex items-center gap-2.5 text-xs bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-slate-300 font-mono shadow-lg shadow-black/40 self-start md:self-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          <span>Simulation Active : 23 Juin 2026</span>
        </div>
      </div>

      {/* Console d'Alertes & Actions de Pilotage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alerts list */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Bell size={16} className="text-amber-500 animate-pulse" />
              Alertes Automatiques de Suivi
            </h3>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded-md border border-amber-500/20">
              {forfaitsInDanger.length + latePaymentStudents.length + conflicts.length} Incident(s)
            </span>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {conflicts.map((conf, index) => (
              <div key={`conf-${index}`} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle size={16} className="text-rose-400 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-1">
                  <span className="text-xs font-bold text-rose-300 block">
                    Conflit Planification : {conf.type === 'teacher' ? getTeacherFullName(conf.targetName) : `Salle ${conf.targetName}`}
                  </span>
                  <span className="text-[10px] text-rose-400/80 block">
                    Double réservation détectée : {conf.timeSlot} le {conf.date}.
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('planning')}
                  className="text-[10px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 px-2 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer"
                >
                  Résoudre
                </button>
              </div>
            ))}

            {latePaymentStudents.map((st) => (
              <div key={`late-${st.id}`} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">
                    {st.lastName.toUpperCase()} {st.firstName} ({st.gradeLevel})
                  </span>
                  <span className="text-[10px] text-rose-400 block font-mono">
                    Alerte : Facture impayée de {st.balance} {currency} depuis son forfait ({st.packageType})
                  </span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleRelancer(st)}
                    className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    Relancer
                  </button>
                </div>
              </div>
            ))}

            {forfaitsInDanger.map((st) => {
              const remaining = st.totalHours - st.usedHours;
              return (
                <div key={`exp-${st.id}`} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">
                      {st.lastName.toUpperCase()} {st.firstName} ({st.gradeLevel})
                    </span>
                    <span className="text-[10px] text-amber-400 block font-mono">
                      Forfait épuisé : {remaining}h restantes sur {st.totalHours}h ({st.usedHours}h consommées)
                    </span>
                  </div>
                  <button
                    onClick={() => handleRecharger(st)}
                    className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    Recharger
                  </button>
                </div>
              );
            })}

            {conflicts.length === 0 && latePaymentStudents.length === 0 && forfaitsInDanger.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                <ShieldCheck size={28} className="mx-auto mb-2 text-emerald-400/60" />
                <p className="text-xs font-medium">Excellent ! Aucune alerte de trésorerie, de forfait ou de planning à signaler.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Exports and report tools */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
              <Download size={15} className="text-sky-400" />
              Exports & Rapports Administratifs
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Exportez vos rapports d'activité pour les instances ou la gestion de compte.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4">
            <button
              onClick={exportStudentsCSV}
              className="flex flex-col items-center justify-center p-3.5 bg-slate-950 hover:bg-slate-950/70 border border-slate-800/80 rounded-xl transition-all cursor-pointer text-center group space-y-1.5 animate-none"
            >
              <Users size={18} className="text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10.5px] font-bold text-slate-300">Élèves (CSV/Excel)</span>
              <span className="text-[9px] text-slate-500 font-mono">Format tableur</span>
            </button>

            <button
              onClick={exportCoursesCSV}
              className="flex flex-col items-center justify-center p-3.5 bg-slate-950 hover:bg-slate-950/70 border border-slate-800/80 rounded-xl transition-all cursor-pointer text-center group space-y-1.5 animate-none"
            >
              <BookOpen size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10.5px] font-bold text-slate-300">Cours (CSV/Excel)</span>
              <span className="text-[9px] text-slate-500 font-mono">Liste complète</span>
            </button>
          </div>

          <button
            onClick={() => setShowPrintModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-500/10"
          >
            <Printer size={14} />
            Générer Rapport PDF Administratif
          </button>
        </div>
      </div>

      {/* NEW SUMMARY CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02]">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Active Students</div>
            <div className="text-2xl font-bold font-mono">{activeStudentsCount}</div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-4 border-l border-slate-800 pl-6 p-4 rounded-xl hover:bg-slate-800/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02]">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Sessions Today</div>
            <div className="text-2xl font-bold font-mono">{sessionsTodayCount}</div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-4 border-l border-slate-800 pl-6 p-4 rounded-xl hover:bg-slate-800/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02]">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Total Revenue</div>
            <div className="text-2xl font-bold font-mono">{monthlyRevenue.toLocaleString('fr-FR')} {currency}</div>
          </div>
        </motion.div>
      </div>

      {/* DETAILED REVENUE GROUPED BY PACKAGE TYPE */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4 }} 
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 relative overflow-hidden"
        id="package-revenue-summary-card"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-500/5 to-transparent rounded-full pointer-events-none"></div>
        
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
            <CreditCard size={16} className="text-sky-400" />
            Recettes par Type de Forfait (Mensuel vs Séance)
          </h3>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-md">
            Synthèse Financière Globale
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Monthly Subscriptions Group */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-slate-700/50 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-300 font-display">Abonnements & Forfaits Mensuels</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full">
                {revenueByPackageType.monthlyCount} élèves
              </span>
            </div>
            <div className="text-3xl font-black font-mono text-emerald-400">
              {revenueByPackageType.monthly.toLocaleString('fr-FR')} {currency}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Comprend les forfaits de groupe avec paiement mensuel ({students.filter(s => s.packageType === 'groupe_mensuel').length} élèves) et les abonnements mensuels fixes.
            </p>
            <div className="pt-2">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
                <span>Part des recettes</span>
                <span>{Math.round((revenueByPackageType.monthly / (revenueByPackageType.monthly + revenueByPackageType.perSession || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{ width: `${(revenueByPackageType.monthly / (revenueByPackageType.monthly + revenueByPackageType.perSession || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Per-Session / Individual Packages Group */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-slate-700/50 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-300 font-display">Paiements par Séance & Forfaits Horaires</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-sky-500/15 text-sky-400 rounded-full">
                {revenueByPackageType.perSessionCount} élèves
              </span>
            </div>
            <div className="text-3xl font-black font-mono text-sky-400">
              {revenueByPackageType.perSession.toLocaleString('fr-FR')} {currency}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Comprend les paiements individuels par séance ({students.filter(s => s.packageType === 'individuel_seance').length} élèves) et les anciens forfaits horaires (10h, 20h, 30h).
            </p>
            <div className="pt-2">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
                <span>Part des recettes</span>
                <span>{Math.round((revenueByPackageType.perSession / (revenueByPackageType.monthly + revenueByPackageType.perSession || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-400 rounded-full"
                  style={{ width: `${(revenueByPackageType.perSession / (revenueByPackageType.monthly + revenueByPackageType.perSession || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Financial Growth Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mt-8">
        <h2 className="text-xl font-bold mb-6">Financial Growth Trends</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NEW CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold font-display text-white mb-4">Répartition des Forfaits Actifs</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold font-display text-white mb-4">Taux d'Utilisation des Heures (Top 10)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="rate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <DashboardCharts revenueData={revenueChartData} fillRateData={fillRateChartData} />

      {/* COMPARISON CHART SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-display">
              <TrendingUp className="text-sky-400 w-4 h-4" /> Comparaison Financière Inter-Annuelle
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Comparez les recettes réelles issues des reçus et le chiffre d'affaires estimé basé sur les heures de cours dispensées.
            </p>
          </div>

          {/* Select year dropdown */}
          <div className="flex items-center gap-2 font-sans">
            <span className="text-xs font-bold text-slate-400">Comparer avec :</span>
            <select
              value={selectedCompareYear}
              onChange={(e) => setSelectedCompareYear(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              disabled={academicYears.filter(y => y !== academicYear).length === 0}
            >
              {academicYears.filter(y => y !== academicYear).length === 0 ? (
                <option value="">Aucun autre exercice</option>
              ) : (
                academicYears.filter(y => y !== academicYear).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))
              )}
            </select>
          </div>
        </div>

        {academicYears.filter(y => y !== academicYear).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center font-sans">
            <div className="p-3 bg-slate-800/50 rounded-2xl text-slate-400 mb-3">
              <TrendingUp size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-200 font-display">Une seule année scolaire enregistrée</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Ajoutez un autre exercice scolaire dans les paramètres ou via le menu du haut pour comparer les performances financières.
            </p>
          </div>
        ) : isLoadingCompare ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 font-sans">
            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-400 font-bold">Chargement des données historiques...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
            {/* Chart */}
            <div className="lg:col-span-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} 
                    formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} ${currency}`, '']}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey={academicYear} fill="#0ea5e9" radius={[4, 4, 0, 0]} name={`Année active (${academicYear})`} />
                  <Bar dataKey={selectedCompareYear} fill="#8b5cf6" radius={[4, 4, 0, 0]} name={`Année comparée (${selectedCompareYear})`} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Breakdown */}
            <div className="bg-slate-950/40 rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">Analyse comparative</h4>
                
                {/* Receipts Comparison Row */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold block">Recettes Réelles (Reçus)</span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {currentYearReceiptsTotal.toLocaleString('fr-FR')} {currency} <span className="text-xs text-slate-500 font-normal">vs {compareYearReceiptsTotal.toLocaleString('fr-FR')}</span>
                    </span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 ${receiptsDiffAmount >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {receiptsDiffAmount >= 0 ? '+' : ''}{receiptsDiffPercent}%
                    </span>
                  </div>
                </div>

                {/* Sessions CA Comparison Row */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold block">Chiffre d'Affaires (Séances validées)</span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-200 font-mono">
                      {currentYearSessionsTotal.toLocaleString('fr-FR')} {currency} <span className="text-xs text-slate-500 font-normal font-sans">vs {compareYearSessionsTotal.toLocaleString('fr-FR')}</span>
                    </span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 ${sessionsDiffAmount >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {sessionsDiffAmount >= 0 ? '+' : ''}{sessionsDiffPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary note */}
              <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60 text-xs text-slate-400 leading-relaxed">
                {receiptsDiffAmount >= 0 ? (
                  <span>
                    Les recettes de l'exercice <strong className="text-sky-400 font-bold">{academicYear}</strong> sont en hausse de <strong className="text-emerald-400 font-bold">{receiptsDiffPercent}%</strong> par rapport à <strong className="text-slate-300 font-bold">{selectedCompareYear}</strong>.
                  </span>
                ) : (
                  <span>
                    Les recettes de l'exercice <strong className="text-sky-400 font-bold">{academicYear}</strong> sont actuellement en baisse de <strong className="text-rose-400 font-bold">{Math.abs(receiptsDiffPercent)}%</strong> par rapport à <strong className="text-slate-300 font-bold">{selectedCompareYear}</strong>.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STRATEGIC KPI GRID (Premium look & feel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* KPI 1: Chiffre d'Affaires Global */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">Valeur d'Inscriptions</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">{totalRevenue.toLocaleString('fr-FR')} {currency}</div>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
            <span>Volume contracté</span>
            <span className="text-emerald-400 font-semibold font-mono flex items-center gap-0.5">
              <ArrowUpRight size={12} />
              +14.8%
            </span>
          </div>
        </div>

        {/* KPI 2: Taux de Remplissage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-500/5 to-transparent rounded-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">Taux de Remplissage</span>
              <div className="text-2xl font-bold font-mono text-sky-400">{fillingRatePercent}%</div>
            </div>
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
            <span>Cible : 4 élèves / classe</span>
            <span className="text-sky-400 font-semibold">{avgSessionStudents.toFixed(1)} moy.</span>
          </div>
        </div>

        {/* KPI 3: Heures Dispensées */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">Heures Effectuées</span>
              <div className="text-2xl font-bold font-mono text-indigo-400">{totalHoursTaught} h</div>
            </div>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
            <span>Cours validés ce mois</span>
            <span className="text-indigo-400 font-semibold">{completedSessions.length} séances</span>
          </div>
        </div>

        {/* KPI 4: Taux d'Absentéisme */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/5 to-transparent rounded-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">Absentéisme</span>
              <div className={`text-2xl font-bold font-mono ${absenteeismRate > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {absenteeismRate}%
              </div>
            </div>
            <div className={`p-2.5 rounded-xl ${absenteeismRate > 10 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
            <span>Seuil critique &gt; 15%</span>
            <span className="text-slate-400">{totalAbsences} absences suivies</span>
          </div>
        </div>

        {/* KPI 5: Alertes Financières */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group cursor-pointer hover:border-slate-700/85 transition-all"
          onClick={() => onNavigate('students')}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-transparent rounded-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">Alertes Paiements</span>
              <div className="text-2xl font-bold font-mono text-rose-400">
                {latePaymentStudents.length} <span className="text-xs text-slate-500 font-sans">retards</span>
              </div>
            </div>
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
            <span>Total impayé : {totalArrearsAmount}{currency}</span>
            <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px]">Relancer</span>
          </div>
        </div>

      </div>

      {/* CORE CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Revenue Glow Graph */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-white">Performances Financières de la Semaine</h3>
              <p className="text-xs text-slate-400 mt-0.5">Revenus cumulés générés par les réservations d’heures de cours</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Total : {weeklyRevenueData.reduce((acc, d) => acc + d.revenue, 0)} {currency}</span>
            </div>
          </div>

          {/* SVG Customized Dark Mode bar chart with gradients & highlights */}
          <div className="relative h-64 w-full flex items-end justify-between pt-8 px-2">
            
            {/* Horizontal Grid lines */}
            <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full border-t border-dashed border-slate-800/70 flex items-start">
                  <span className="text-[10px] font-mono text-slate-500 pr-2 -mt-2 bg-slate-900 z-10">
                    {Math.round((maxRevenue * (4 - i)) / 4)}{currency}
                  </span>
                </div>
              ))}
            </div>

            {/* Bars */}
            <div className="relative z-10 w-full h-full flex items-end justify-between px-4">
              {weeklyRevenueData.map((data, index) => {
                const heightPercent = maxRevenue > 0 ? (data.revenue / maxRevenue) * 75 : 0;
                const isHovered = hoveredBar === index;
                return (
                  <div key={data.day} className="flex flex-col items-center flex-1 group relative">
                    
                    {/* Tooltip on top of hover */}
                    <div 
                      className={`absolute bottom-28 bg-slate-950 border border-slate-800 text-slate-100 text-xs py-2 px-3.5 rounded-xl shadow-2xl font-mono transition-all duration-200 z-30 pointer-events-none flex flex-col items-center ${
                        isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-3'
                      }`}
                      style={{ left: '50%', transform: 'translateX(-50%)' }}
                    >
                      <span className="font-sans font-bold text-slate-400">{data.day}</span>
                      <span className="text-emerald-400 font-black mt-1 text-sm">{data.revenue} {currency}</span>
                      <span className="text-[10px] text-sky-400/90 mt-0.5">{data.sessionCount} cours validés</span>
                    </div>

                    {/* Interactive glowing Bar */}
                    <div 
                      className={`w-7 sm:w-11 transition-all duration-300 rounded-t-lg cursor-pointer relative ${
                        isHovered 
                          ? 'bg-gradient-to-t from-sky-600 via-sky-400 to-emerald-400 shadow-[0_0_15px_rgba(56,189,248,0.4)] scale-x-105' 
                          : 'bg-gradient-to-t from-sky-900 to-sky-600 shadow-[0_4px_10px_rgba(0,0,0,0.3)]'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 3)}%` }}
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-sky-300 rounded-t-lg"></div>
                    </div>

                    {/* Label */}
                    <span className="text-[11px] font-mono font-medium text-slate-400 mt-3">{data.day}</span>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Academic Levels breakdown & quick metrics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base font-bold font-display text-white">Répartition par Niveau</h3>
            <p className="text-xs text-slate-400 mt-0.5">Niveau scolaire des élèves suivis à l'école</p>
          </div>

          <div className="space-y-5">
            {studentsByLevel.map((level, idx) => {
              const colors = ['bg-sky-500', 'bg-violet-500', 'bg-emerald-500'];
              const glows = ['shadow-sky-500/20', 'shadow-violet-500/20', 'shadow-emerald-500/20'];
              const textColors = ['text-sky-400', 'text-violet-400', 'text-emerald-400'];
              const percentage = Math.round((level.count / totalLevelInscriptions) * 100);

              return (
                <div key={level.name} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors[idx]} shadow-md ${glows[idx]}`}></span>
                      {level.name}
                    </span>
                    <span className="font-mono text-slate-400">
                      <strong className="text-white">{level.count}</strong> élève{level.count > 1 ? 's' : ''} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className={`h-full ${colors[idx]} rounded-full transition-all duration-700`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Salles actives panel */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Contrôle du Plateau Salles</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 text-center">
                <span className="text-[10px] text-slate-500 block">Salles actives</span>
                <span className="text-sm font-bold text-sky-400 font-mono">4 / 5</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 text-center">
                <span className="text-[10px] text-slate-500 block">Occupation</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">80%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* TODAY'S PLANNING & LACK OF BALANCE ALERTS (Trésorerie & Forfaits) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Today's Agenda Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="text-sky-400" size={18} />
              <h3 className="text-base font-bold font-display text-white">Planning d'Aujourd'hui</h3>
            </div>
            <button 
              onClick={() => onNavigate('planning')} 
              className="text-xs text-sky-400 hover:text-sky-300 font-bold hover:underline transition-all"
            >
              Gérer l’agenda →
            </button>
          </div>

          {todaySessions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle size={32} className="mx-auto mb-2 text-slate-700" />
              <p className="text-sm">Aucune session programmée aujourd’hui.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50 max-h-[350px] overflow-y-auto pr-1 space-y-1">
              {todaySessions.map((sess) => {
                const course = courses.find(c => c.id === sess.courseId);
                const teacher = teachers.find(t => t.id === sess.teacherId);
                const hasOverlap = conflicts.some(c => c.id1 === sess.id || c.id2 === sess.id);

                return (
                  <div key={sess.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white hover:text-sky-300 transition-colors">{course?.title}</span>
                        {hasOverlap && (
                          <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20 font-bold flex items-center gap-1">
                            <AlertCircle size={10} />
                            Conflit !
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-slate-300 font-medium">Prof :</span> {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Aucun'}
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-300 font-medium">Salle :</span> {sess.room}
                        <span className="text-slate-600">•</span>
                        <span className="text-sky-400 font-semibold">{sess.studentIds.length} élève{sess.studentIds.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-mono font-bold text-white bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg shadow-inner">
                        {sess.startTime} - {sess.endTime}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block">{getDurationHours(sess.startTime, sess.endTime)}h de cours</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Financial & Packages alerts (Trésorerie & Forfaits) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
            <h3 className="text-base font-bold font-display text-white">Alertes Trésorerie & Forfaits Épuisés</h3>
            <span className="text-xs text-rose-400 font-bold font-mono bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/10">
              {forfaitsInDanger.length + latePaymentStudents.length} actions requises
            </span>
          </div>

          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
            
            {/* 1. Unpaid/Late students list */}
            {latePaymentStudents.map((st) => {
              const remaining = st.totalHours - st.usedHours;
              return (
                <div key={st.id} className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">
                      {st.firstName} {st.lastName} ({st.gradeLevel})
                    </span>
                    <span className="text-[11px] text-rose-300/80 block font-mono">
                      Statut : Impayé (Facture {st.balance} {currency})
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded-full font-bold border border-rose-500/20">
                      En retard
                    </span>
                    <button 
                      onClick={() => handleRelancer(st)}
                      className="text-[10px] text-white hover:text-emerald-300 bg-slate-950 hover:bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-800/80 font-mono font-medium block mt-1.5 transition-colors"
                    >
                      Relancer e-mail
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 2. Low hours packages list */}
            {forfaitsInDanger.map((st) => {
              const remaining = st.totalHours - st.usedHours;
              return (
                <div key={st.id} className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">
                      {st.firstName} {st.lastName} ({st.gradeLevel})
                    </span>
                    <span className="text-[11px] text-amber-300 block">
                      Forfait épuisé : <strong className="text-white font-mono font-bold">{remaining}h</strong> restantes sur {st.totalHours}h
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-bold border border-amber-500/20">
                      Épuisement imminent
                    </span>
                    <button 
                      onClick={() => handleRecharger(st)}
                      className="text-[10px] text-white hover:text-emerald-300 bg-slate-950 hover:bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-800/80 font-mono font-medium block mt-1.5 transition-colors"
                    >
                      Proposer Recharge
                    </button>
                  </div>
                </div>
              );
            })}

            {latePaymentStudents.length === 0 && forfaitsInDanger.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                <ShieldCheck size={32} className="mx-auto mb-2 text-emerald-500/40" />
                <p className="text-sm">Trésorerie et forfaits sous contrôle. Aucun incident à déplorer.</p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* PDF / Print Report Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 overflow-y-auto p-4 sm:p-8 flex justify-center text-slate-900 font-sans print:p-0 print:bg-white print:text-black">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-8 sm:p-12 shadow-2xl relative space-y-8 print:shadow-none print:p-0 print:max-w-full">
            
            {/* Action buttons (non-printable) */}
            <div className="flex justify-end gap-3 print:hidden mb-6">
              <button
                onClick={() => window.print()}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-600/15"
              >
                <Printer size={14} /> Imprimer ou Sauvegarder en PDF
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {/* Report Header */}
            <div className="border-b-2 border-slate-900 pb-6 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Rapport Administratif de Pilotage</h1>
                <p className="text-slate-500 text-sm mt-1">Généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} • Console Pilote</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-sky-600">PILOTAGE SOUTIEN</h2>
                <p className="text-xs text-slate-400">Soutien Scolaire de Précision</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Élèves Actifs</span>
                <span className="text-2xl font-black text-slate-900">{students.filter(s => s.status === 'actif').length}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Cours Proposés</span>
                <span className="text-2xl font-black text-slate-900">{courses.length}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Valeur Inscriptions</span>
                <span className="text-2xl font-black text-slate-900">{totalRevenue.toLocaleString('fr-FR')} {currency}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Impayés Détectés</span>
                <span className="text-2xl font-black text-rose-600">{totalArrearsAmount.toLocaleString('fr-FR')} {currency}</span>
              </div>
            </div>

            {/* Section 1: Low Hours */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">1. Alertes de Forfaits Épuisés (≤ 3h restantes)</h3>
              {forfaitsInDanger.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Aucune alerte de forfait sur cette période.</p>
              ) : (
                <table className="w-full text-left text-xs text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 font-semibold bg-slate-50">
                      <th className="p-2.5">Élève</th>
                      <th className="p-2.5">Niveau</th>
                      <th className="p-2.5">Type de Forfait</th>
                      <th className="p-2.5 text-center">Heures Totales</th>
                      <th className="p-2.5 text-center">Heures Utilisées</th>
                      <th className="p-2.5 text-center text-rose-600">Heures Restantes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {forfaitsInDanger.map(st => (
                      <tr key={st.id}>
                        <td className="p-2.5 font-bold">{st.lastName.toUpperCase()} {st.firstName}</td>
                        <td className="p-2.5">{st.gradeLevel}</td>
                        <td className="p-2.5">{st.packageType}</td>
                        <td className="p-2.5 text-center">{st.totalHours}h</td>
                        <td className="p-2.5 text-center">{st.usedHours}h</td>
                        <td className="p-2.5 text-center font-bold text-rose-600">{st.totalHours - st.usedHours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Section 2: Unpaid */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">2. Suivi des Impayés et Retards de Règlement</h3>
              {latePaymentStudents.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Aucun retard de paiement détecté.</p>
              ) : (
                <table className="w-full text-left text-xs text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 font-semibold bg-slate-50">
                      <th className="p-2.5">Élève</th>
                      <th className="p-2.5">Niveau</th>
                      <th className="p-2.5">E-mail</th>
                      <th className="p-2.5">Téléphone</th>
                      <th className="p-2.5 text-center text-rose-600">Montant Facturé</th>
                      <th className="p-2.5 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {latePaymentStudents.map(st => (
                      <tr key={st.id}>
                        <td className="p-2.5 font-bold">{st.lastName.toUpperCase()} {st.firstName}</td>
                        <td className="p-2.5">{st.gradeLevel}</td>
                        <td className="p-2.5">{st.email}</td>
                        <td className="p-2.5">{st.phone}</td>
                        <td className="p-2.5 text-center font-bold text-rose-600">{st.balance} {currency}</td>
                        <td className="p-2.5 text-center"><span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">En retard</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Section 3: Courses catalog */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">3. Catalogue de Cours & Tarifs Actuels</h3>
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 font-semibold bg-slate-50">
                    <th className="p-2.5">Cours</th>
                    <th className="p-2.5">Matière</th>
                    <th className="p-2.5">Niveau</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Tarif Horaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map(c => (
                    <tr key={c.id}>
                      <td className="p-2.5 font-bold">{c.title}</td>
                      <td className="p-2.5">{c.subject}</td>
                      <td className="p-2.5">{c.level}</td>
                      <td className="p-2.5 text-slate-500 max-w-xs truncate">{c.description}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{c.hourlyRate} {currency}/h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Report Footer */}
            <div className="border-t border-slate-200 pt-6 flex justify-between items-center text-[10px] text-slate-400">
              <span>Rapport de Synthèse Interne • Pilotage Soutien</span>
              <span>Page 1 / 1</span>
            </div>

          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isQuickActionsOpen && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex flex-col gap-2">
              <button onClick={() => { setIsQuickActionsOpen(false); onNavigate('planning'); }} className="bg-sky-600 text-white px-4 py-3 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-sky-500 transition-colors">
                <CalendarPlus size={16} /> Nouvelle Session
              </button>
              <button onClick={() => { setIsQuickActionsOpen(false); onNavigate('students'); }} className="bg-sky-600 text-white px-4 py-3 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-sky-500 transition-colors">
                <UserPlus size={16} /> Nouvel Élève
              </button>
              <button onClick={() => { setIsQuickActionsOpen(false); onNavigate('receipts'); }} className="bg-sky-600 text-white px-4 py-3 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-sky-500 transition-colors">
                <CreditCard size={16} /> Nouvelle Recette
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)} className="bg-white text-slate-900 p-4 rounded-full shadow-2xl hover:scale-105 transition-all">
          <Plus size={24} />
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mt-8">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {auditLogs.slice(-5).reverse().map(log => (
            <div key={log.id} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <div>
                <span className="font-semibold text-sky-400">{log.action.toUpperCase()}</span> - <span className="text-slate-300">{log.description}</span>
              </div>
              <div className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
