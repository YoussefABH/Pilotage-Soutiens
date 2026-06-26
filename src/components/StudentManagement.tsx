import React, { useState } from 'react';
import { Student, StudentGrade, ProgressReport } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle, 
  Users, 
  CheckCircle, 
  Ban, 
  Calendar,
  CreditCard,
  TrendingUp,
  Award,
  FileText,
  Star,
  BookOpen,
  DollarSign,
  AlertTriangle,
  Mail,
  Phone,
  Eye,
  CheckCircle2,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentManagementProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id' | 'enrollmentDate' | 'grades' | 'progressReports'>) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

const GRADE_LEVELS = ['Tous', 'Primaire', 'Collège', 'Lycée', '6ème', '5ème', '4ème', '3ème', 'Seconde', '1ère', 'Terminale'];
const PAYMENT_STATUS_FILTERS = ['Tous', 'paye', 'en_attente', 'en_retard'];

export default function StudentManagement({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
}: StudentManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Tous');
  const [paymentFilter, setPaymentFilter] = useState('Tous');

  // Modal and Drawer States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<Student | null>(null);

  // Form states (Create / Edit basic info & forfait)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Terminale');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'actif' | 'suspendu'>('actif');
  const [packageType, setPackageType] = useState<Student['packageType']>('forfait_10h');
  const [totalHours, setTotalHours] = useState(10);
  const [usedHours, setUsedHours] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<Student['paymentStatus']>('paye');
  const [balance, setBalance] = useState(250);
  const [notes, setNotes] = useState('');
  const [parentId, setParentId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Inside Drawer: Grade addition state
  const [newGradeSubject, setNewGradeSubject] = useState('Mathématiques');
  const [newGradeTitle, setNewGradeTitle] = useState('');
  const [newGradeScore, setNewGradeScore] = useState(15);
  const [newGradeMax, setNewGradeMax] = useState(20);

  // Inside Drawer: Progress Report addition state
  const [newReportSession, setNewReportSession] = useState('');
  const [newReportWork, setNewReportWork] = useState('');
  const [newReportHomework, setNewReportHomework] = useState('');
  const [newReportRating, setNewReportRating] = useState(5);
  const [newReportComment, setNewReportComment] = useState('');
  const [newReportReported, setNewReportReported] = useState(true);

  // Sync drawer selection helper
  const refreshSelectedStudent = (id: string) => {
    const updated = students.find(s => s.id === id);
    if (updated) {
      setSelectedStudentForDetails(updated);
    }
  };

  // Open creation modal
  const handleOpenCreate = () => {
    setEditingStudent(null);
    setFirstName('');
    setLastName('');
    setGradeLevel('Terminale');
    setEmail('');
    setPhone('');
    setStatus('actif');
    setPackageType('forfait_10h');
    setTotalHours(10);
    setUsedHours(0);
    setPaymentStatus('paye');
    setBalance(250);
    setNotes('');
    setParentId('');
    setErrorMessage('');
    setIsFormModalOpen(true);
  };

  // Open basic edit modal
  const handleOpenEdit = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening detail drawer
    setEditingStudent(student);
    setFirstName(student.firstName);
    setLastName(student.lastName);
    setGradeLevel(student.gradeLevel);
    setEmail(student.email);
    setPhone(student.phone);
    setStatus(student.status);
    setPackageType(student.packageType);
    setTotalHours(student.totalHours);
    setUsedHours(student.usedHours);
    setPaymentStatus(student.paymentStatus);
    setBalance(student.balance);
    setNotes(student.notes || '');
    setParentId(student.parentId || '');
    setErrorMessage('');
    setIsFormModalOpen(true);
  };

  // Submit main student form (create / update)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Veuillez entrer un e-mail valide.');
      return;
    }

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gradeLevel,
        email: email.trim(),
        phone: phone.trim(),
        status,
        packageType,
        totalHours: Number(totalHours),
        usedHours: Number(usedHours),
        paymentStatus,
        balance: Number(balance),
        notes: notes.trim(),
        parentId: parentId.trim() || undefined,
      });
    } else {
      onAddStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gradeLevel,
        email: email.trim(),
        phone: phone.trim(),
        status,
        packageType,
        totalHours: Number(totalHours),
        usedHours: Number(usedHours),
        paymentStatus,
        balance: Number(balance),
        notes: notes.trim(),
        parentId: parentId.trim() || undefined,
        groupIds: [],
      });
    }

    setIsFormModalOpen(false);
  };

  // Add academic grade inside drawer
  const handleAddGrade = (student: Student) => {
    if (!newGradeTitle.trim()) return;

    const newGrade: StudentGrade = {
      id: 'g_' + Date.now(),
      subject: newGradeSubject,
      title: newGradeTitle.trim(),
      score: Number(newGradeScore),
      maxScore: Number(newGradeMax),
      date: new Date().toISOString().split('T')[0]
    };

    const updatedStudent: Student = {
      ...student,
      grades: [...student.grades, newGrade]
    };

    onUpdateStudent(updatedStudent);
    setNewGradeTitle('');
    
    // Refresh local drawer state
    setTimeout(() => refreshSelectedStudent(student.id), 50);
  };

  // Delete academic grade
  const handleDeleteGrade = (student: Student, gradeId: string) => {
    const updatedStudent: Student = {
      ...student,
      grades: student.grades.filter(g => g.id !== gradeId)
    };
    onUpdateStudent(updatedStudent);
    setTimeout(() => refreshSelectedStudent(student.id), 50);
  };

  // Add progress report inside drawer
  const handleAddProgressReport = (student: Student) => {
    if (!newReportSession.trim() || !newReportWork.trim()) return;

    const newReport: ProgressReport = {
      id: 'pr_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      sessionTitle: newReportSession.trim(),
      workDone: newReportWork.trim(),
      homework: newReportHomework.trim(),
      behaviorRating: newReportRating,
      comment: newReportComment.trim(),
      reportedToParents: newReportReported
    };

    // Auto increment used hours for students when adding a progress report!
    const newUsedHours = Math.min(student.totalHours, student.usedHours + 1);

    const updatedStudent: Student = {
      ...student,
      usedHours: newUsedHours,
      progressReports: [newReport, ...student.progressReports]
    };

    onUpdateStudent(updatedStudent);
    setNewReportSession('');
    setNewReportWork('');
    setNewReportHomework('');
    setNewReportComment('');
    
    setTimeout(() => refreshSelectedStudent(student.id), 50);
  };

  // Toggle reported status for parents
  const handleToggleParentReport = (student: Student, reportId: string) => {
    const updatedReports = student.progressReports.map(r => 
      r.id === reportId ? { ...r, reportedToParents: !r.reportedToParents } : r
    );
    const updatedStudent: Student = {
      ...student,
      progressReports: updatedReports
    };
    onUpdateStudent(updatedStudent);
    setTimeout(() => refreshSelectedStudent(student.id), 50);
  };

  // Delete progress report
  const handleDeleteProgressReport = (student: Student, reportId: string) => {
    const updatedStudent: Student = {
      ...student,
      progressReports: student.progressReports.filter(r => r.id !== reportId)
    };
    onUpdateStudent(updatedStudent);
    setTimeout(() => refreshSelectedStudent(student.id), 50);
  };

  // Filter students logic
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.includes(searchTerm);

    let matchesGrade = false;
    if (selectedGrade === 'Tous') {
      matchesGrade = true;
    } else if (selectedGrade === 'Primaire') {
      matchesGrade = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'].includes(student.gradeLevel);
    } else if (selectedGrade === 'Collège') {
      matchesGrade = ['6ème', '5ème', '4ème', '3ème'].includes(student.gradeLevel);
    } else if (selectedGrade === 'Lycée') {
      matchesGrade = ['Seconde', '1ère', 'Terminale'].includes(student.gradeLevel);
    } else {
      matchesGrade = student.gradeLevel === selectedGrade;
    }

    const matchesPayment =
      paymentFilter === 'Tous' || student.paymentStatus === paymentFilter;

    return matchesSearch && matchesGrade && matchesPayment;
  });

  // Calculate generic French translation for package labels
  const getPackageLabel = (type: Student['packageType']) => {
    switch(type) {
      case 'groupe_mensuel': return 'Groupe (Paiement Mensuel)';
      case 'individuel_seance': return 'Individuel (Paiement par séance)';
      case 'forfait_10h': return 'Forfait 10 Heures';
      case 'forfait_20h': return 'Forfait 20 Heures';
      case 'forfait_30h': return 'Forfait 30 Heures';
      case 'abonnement_mensuel': return 'Abonnement Mensuel';
      default: return type;
    }
  };

  const getPaymentStatusBadge = (status: Student['paymentStatus']) => {
    switch (status) {
      case 'paye':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'en_attente':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'en_retard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  const getPaymentStatusText = (status: Student['paymentStatus']) => {
    switch (status) {
      case 'paye': return 'Payé';
      case 'en_attente': return 'Facturé';
      case 'en_retard': return 'En Retard';
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black font-display text-white tracking-tight">Fiches Profils Multi-Rôles : Élèves</h1>
          <p className="text-slate-400 text-xs mt-1">
            Gérez les informations scolaires des élèves, l'état de leurs forfaits d'heures de soutien, leurs notes, et rédigez des fiches de suivi pour les parents.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/15 self-start sm:self-center cursor-pointer"
          id="btn-add-student"
        >
          <Plus size={16} />
          <span>Inscrire un Élève</span>
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Rechercher par élève, e-mail, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 text-xs text-white"
          />
        </div>

        {/* Grade Filters */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono whitespace-nowrap">Niveau :</span>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-sky-500"
          >
            {GRADE_LEVELS.map(lvl => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>

        {/* Payment Filters */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono whitespace-nowrap">Finances :</span>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-sky-500"
          >
            <option value="Tous">Tous les paiements</option>
            <option value="paye">Frais réglés (Payé)</option>
            <option value="en_attente">En attente (Facturé)</option>
            <option value="en_retard">Impayés (En retard)</option>
          </select>
        </div>
      </div>

      {/* STUDENTS LISTING GRID */}
      {filteredStudents.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-xl">
          <Users size={40} className="mx-auto mb-3 text-slate-700" />
          <h3 className="text-base font-bold text-slate-300 font-display">Aucun profil élève trouvé</h3>
          <p className="text-xs text-slate-500 mt-1">Ajustez vos filtres ou lancez l'inscription d'un nouvel élève.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
            const consumedPercent = student.totalHours > 0 
              ? Math.round((student.usedHours / student.totalHours) * 100) 
              : 0;
            const remainingHours = student.totalHours - student.usedHours;

            return (
              <motion.div
                key={student.id}
                layout
                whileHover={{ y: -2 }}
                onClick={() => setSelectedStudentForDetails(student)}
                className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden cursor-pointer hover:border-slate-700/85 transition-all flex flex-col justify-between ${
                  student.status === 'suspendu' ? 'opacity-70 border-dashed bg-slate-900/60' : ''
                }`}
              >
                {/* Background soft glow for danger packages */}
                {remainingHours <= 3 && student.status === 'actif' && student.packageType !== 'abonnement_mensuel' && student.packageType !== 'groupe_mensuel' && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full pointer-events-none"></div>
                )}

                <div className="space-y-4">
                  {/* Status & Grade Header */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-slate-950 text-slate-300 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-md border border-slate-800">
                        {student.gradeLevel}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border ${
                        student.status === 'actif'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${student.status === 'actif' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        {student.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEdit(student, e)}
                        className="p-1.5 text-slate-500 hover:text-sky-400 hover:bg-slate-950 rounded-lg transition-all"
                        title="Modifier les infos de base"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStudentToDelete(student);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-950 rounded-lg transition-all"
                        title="Désinscrire l'élève"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Student Title */}
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {student.lastName.toUpperCase()} {student.firstName}
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                      <p className="flex items-center gap-1 font-mono text-slate-400/80"><Mail size={11} /> {student.email}</p>
                      <p className="flex items-center gap-1 font-mono text-slate-400/80"><Phone size={11} /> {student.phone}</p>
                    </div>
                  </div>

                  {/* VISUAL FORFAIT PROGRESSION BAR (Requirement #5) */}
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-slate-300">
                        <CreditCard size={11} className="text-sky-400" />
                        {getPackageLabel(student.packageType)}
                      </span>
                      <span>
                        <strong className="text-white font-bold">{student.usedHours}h</strong> / {student.totalHours}h
                      </span>
                    </div>

                    {/* Progress slider */}
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          remainingHours <= 3 && student.packageType !== 'abonnement_mensuel' && student.packageType !== 'groupe_mensuel'
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                            : 'bg-gradient-to-r from-sky-500 to-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, consumedPercent)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-slate-500">Heures consommées</span>
                      <span className={`font-bold ${remainingHours <= 3 && student.packageType !== 'abonnement_mensuel' && student.packageType !== 'groupe_mensuel' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {remainingHours}h restantes
                      </span>
                    </div>
                  </div>

                  {/* BILLING AND ACADEMIC SUMMARY */}
                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className="text-slate-500">Solde : <strong className="text-slate-300 font-bold font-mono">{student.balance} €</strong></span>
                    <span className={`border px-2 py-0.5 rounded text-[10px] font-bold ${getBadgeColorFinancial(student.paymentStatus)}`}>
                      {getPaymentStatusText(student.paymentStatus)}
                    </span>
                  </div>
                </div>

                {/* Footer with summary indicators */}
                <div className="border-t border-slate-800/60 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Award size={11} className="text-emerald-400" />
                    Moyenne : <strong className="text-white">{calculateAverageGrade(student.grades)}/20</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={11} className="text-indigo-400" />
                    Fiches parent : <strong className="text-white">{student.progressReports.length}</strong>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => studentToDelete && onDeleteStudent(studentToDelete.id)}
        title="Désinscrire l'élève"
        message={`Voulez-vous supprimer la fiche de ${studentToDelete?.firstName} ${studentToDelete?.lastName} ? Cette action est irréversible.`}
      />

      {/* STUDENT DETAILED DRAWER (Full Academic, Forfaits, parent follow-up module) */}
      <AnimatePresence>
        {selectedStudentForDetails && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-screen overflow-y-auto flex flex-col justify-between shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg font-display">
                    {selectedStudentForDetails.firstName[0]}{selectedStudentForDetails.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-display">
                      {selectedStudentForDetails.lastName.toUpperCase()} {selectedStudentForDetails.firstName}
                    </h2>
                    <p className="text-xs text-slate-400">Classe : <strong className="text-white">{selectedStudentForDetails.gradeLevel}</strong> • Inscrit le {new Date(selectedStudentForDetails.enrollmentDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-8 flex-1">
                
                {/* 1. FINANCIAL REGISTER & FORFAIT TRACKING (Requirement #5) */}
                <section className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                    <CreditCard size={14} />
                    Contrôle Financier & Forfaits d’Heures
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Formule Choisie</span>
                      <span className="text-xs font-bold text-white block">{getPackageLabel(selectedStudentForDetails.packageType)}</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">Heures contractées : {selectedStudentForDetails.totalHours}h</span>
                    </div>

                    <div className="space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Trésorerie & Facturation</span>
                      <span className="text-xs font-bold text-white block">Solde total : {selectedStudentForDetails.balance} €</span>
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border mt-1 ${getBadgeColorFinancial(selectedStudentForDetails.paymentStatus)}`}>
                        {getPaymentStatusText(selectedStudentForDetails.paymentStatus).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Hourly tracker gauge */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Consommation du forfait :</span>
                      <span className="text-white font-bold">{selectedStudentForDetails.usedHours}h utilisées / {selectedStudentForDetails.totalHours}h</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
                        style={{ width: `${Math.round((selectedStudentForDetails.usedHours / selectedStudentForDetails.totalHours) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400/90 italic">
                      * Les fiches de suivi pédagogiques ajoutées ci-dessous décomptent automatiquement 1 heure de forfait à l'étudiant.
                    </p>
                  </div>
                </section>

                {/* 2. ACADEMIC MARKS - BULLETIN SCOLAIRE (Requirement #3) */}
                <section className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Award size={14} />
                      Historique des Évaluations (Moyenne : {calculateAverageGrade(selectedStudentForDetails.grades)}/20)
                    </h3>
                  </div>

                  {/* Add Score Inline Form */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono block">Enregistrer une note de classe</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <select
                        value={newGradeSubject}
                        onChange={(e) => setNewGradeSubject(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-300 text-xs py-2 px-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Mathématiques">Mathématiques</option>
                        <option value="Physique-Chimie">Physique-Chimie</option>
                        <option value="Français">Français</option>
                        <option value="Anglais">Anglais</option>
                        <option value="SVT">SVT</option>
                        <option value="Philosophie">Philosophie</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Titre (ex: DS Dérivées)"
                        value={newGradeTitle}
                        onChange={(e) => setNewGradeTitle(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-300 text-xs py-2 px-2.5 rounded-lg focus:outline-none focus:border-emerald-500 col-span-2 sm:col-span-1"
                      />

                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 rounded-lg">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="20"
                          value={newGradeScore}
                          onChange={(e) => setNewGradeScore(Number(e.target.value))}
                          className="w-10 bg-transparent text-center text-xs text-white focus:outline-none"
                        />
                        <span className="text-slate-500 text-xs">/</span>
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={newGradeMax}
                          onChange={(e) => setNewGradeMax(Number(e.target.value))}
                          className="w-10 bg-transparent text-center text-xs text-slate-400 focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddGrade(selectedStudentForDetails)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>

                  {/* Grades list table */}
                  {selectedStudentForDetails.grades.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-4">Aucune note saisie pour l'instant.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-400 font-mono">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500">
                            <th className="py-2">Date</th>
                            <th className="py-2">Matière</th>
                            <th className="py-2">Intitulé</th>
                            <th className="py-2 text-right">Note</th>
                            <th className="py-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {selectedStudentForDetails.grades.map(grade => (
                            <tr key={grade.id} className="hover:bg-slate-900/30">
                              <td className="py-2">{new Date(grade.date).toLocaleDateString('fr-FR')}</td>
                              <td className="py-2 font-sans font-bold text-slate-300">{grade.subject}</td>
                              <td className="py-2 font-sans">{grade.title}</td>
                              <td className="py-2 text-right font-bold text-emerald-400">{grade.score} / {grade.maxScore}</td>
                              <td className="py-2 text-center">
                                <button
                                  onClick={() => handleDeleteGrade(selectedStudentForDetails, grade.id)}
                                  className="p-1 text-slate-500 hover:text-rose-400"
                                >
                                  <Trash size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* 3. PEDAGOGICAL FOLLOW-UP & PARENT CARD GENERATION (Requirement #4) */}
                <section className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                    <FileText size={14} />
                    Fiches de Suivi Pédagogiques & Liaison Parents
                  </h3>

                  {/* Add report Form */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono block">Rédiger un nouveau compte-rendu de cours</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Thématique abordée *</label>
                        <input
                          type="text"
                          required
                          placeholder="ex: Résolution de problèmes dérivés"
                          value={newReportSession}
                          onChange={(e) => setNewReportSession(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-300 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Évaluation comportement / travail</label>
                        <div className="flex gap-1.5 pt-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setNewReportRating(star)}
                              className={`p-0.5 transition-colors ${star <= newReportRating ? 'text-amber-400' : 'text-slate-700'}`}
                            >
                              <Star size={16} fill={star <= newReportRating ? "currentColor" : "none"} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Travail effectué durant l'heure *</label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Décrivez les chapitres traités, exercices résolus..."
                          value={newReportWork}
                          onChange={(e) => setNewReportWork(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-300 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-violet-500 resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Devoirs à préparer pour la suite</label>
                        <textarea
                          rows={2}
                          placeholder="ex: Finir exercice 3 page 14..."
                          value={newReportHomework}
                          onChange={(e) => setNewReportHomework(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-300 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-violet-500 resize-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Commentaire qualitatif (Liaison parent)</label>
                      <textarea
                        rows={2}
                        placeholder="ex: Thomas a fourni d'importants efforts. Comportement très sérieux."
                        value={newReportComment}
                        onChange={(e) => setNewReportComment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-violet-500 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newReportReported}
                          onChange={(e) => setNewReportReported(e.target.checked)}
                          className="rounded border-slate-800 text-violet-500 focus:ring-0 bg-slate-950"
                        />
                        <span>Partager immédiatement avec les parents par e-mail / SMS</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddProgressReport(selectedStudentForDetails)}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer text-xs"
                      >
                        Valider & Décompter 1h
                      </button>
                    </div>
                  </div>

                  {/* Reports list cards */}
                  {selectedStudentForDetails.progressReports.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-4">Aucun compte-rendu saisi pour le moment.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {selectedStudentForDetails.progressReports.map(report => (
                        <div key={report.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs relative">
                          <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                            <div>
                              <span className="font-mono text-slate-500 block">{new Date(report.date).toLocaleDateString('fr-FR')}</span>
                              <h4 className="font-bold text-white text-xs font-sans mt-0.5">{report.sessionTitle}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Behavior stars rating */}
                              <div className="flex text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} size={11} fill={i < report.behaviorRating ? "currentColor" : "none"} className={i < report.behaviorRating ? 'text-amber-400' : 'text-slate-700'} />
                                ))}
                              </div>
                              <button
                                onClick={() => handleDeleteProgressReport(selectedStudentForDetails, report.id)}
                                className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                            <div>
                              <strong className="text-[10px] uppercase font-mono text-slate-500 block">Travail Fait :</strong>
                              <p className="mt-0.5 leading-relaxed text-slate-300">{report.workDone}</p>
                            </div>
                            <div>
                              <strong className="text-[10px] uppercase font-mono text-slate-500 block">Devoirs :</strong>
                              <p className="mt-0.5 leading-relaxed text-slate-300">{report.homework || 'Aucun devoir demandé.'}</p>
                            </div>
                          </div>

                          {report.comment && (
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-slate-400 italic">
                              "{report.comment}"
                            </div>
                          )}

                          {/* Parental visibility toggle */}
                          <div className="flex items-center justify-between border-t border-slate-850 pt-2 text-[10px] font-mono text-slate-500">
                            <span className="flex items-center gap-1">
                              Visibilité Parents : 
                              <span className={`font-bold ${report.reportedToParents ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {report.reportedToParents ? 'PARTAGÉ' : 'SÉCURISÉ INTERNE'}
                              </span>
                            </span>
                            <button
                              onClick={() => handleToggleParentReport(selectedStudentForDetails, report.id)}
                              className="text-[10px] text-sky-400 hover:text-sky-300 font-bold hover:underline"
                            >
                              {report.reportedToParents ? 'Suspendre partage' : 'Envoyer aux parents'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 text-right">
                <button
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-bold py-2 px-5 rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STUDENT MAIN FORM MODAL (Create / Edit) */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                  {editingStudent ? "Modifier la Fiche d'Inscription" : "Inscrire un Nouvel Étudiant"}
                </h3>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {errorMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Prénom *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Thomas"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Nom de Famille *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Dubois"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Classe académique *</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                    >
                      <option value="Terminale">Terminale</option>
                      <option value="1ère">1ère</option>
                      <option value="Seconde">Seconde</option>
                      <option value="3ème">3ème</option>
                      <option value="4ème">4ème</option>
                      <option value="5ème">5ème</option>
                      <option value="6ème">6ème</option>
                      <option value="CM2">CM2</option>
                      <option value="CM1">CM1</option>
                      <option value="CE2">CE2</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Statut *</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus('actif')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          status === 'actif'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/30'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        <CheckCircle size={12} />
                        <span>Actif</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus('suspendu')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          status === 'suspendu'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 ring-1 ring-rose-500/30'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        <Ban size={12} />
                        <span>Suspendu</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contact basic infos */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Adresse Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="thomas@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Numéro de Téléphone *</label>
                  <input
                    type="text"
                    required
                    placeholder="06 12..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">E-mail du Parent (Liaison)</label>
                    <span className="text-[9px] text-slate-500 font-mono">Permet de lier l'espace parent</span>
                  </div>
                  <input
                    type="email"
                    placeholder="parent@example.com"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Forfait configuration details */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 space-y-3.5">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono block border-b border-slate-800 pb-1.5">Forfait & Tarifs d’Heures</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Formule Forfait *</label>
                      <select
                        value={packageType}
                        onChange={(e) => {
                          const val = e.target.value as Student['packageType'];
                          setPackageType(val);
                          // Auto configure preset hours & rates
                          if (val === 'groupe_mensuel') { setTotalHours(16); setBalance(120); }
                          else if (val === 'individuel_seance') { setTotalHours(10); setBalance(300); }
                          else if (val === 'forfait_10h') { setTotalHours(10); setBalance(250); }
                          else if (val === 'forfait_20h') { setTotalHours(20); setBalance(480); }
                          else if (val === 'forfait_30h') { setTotalHours(30); setBalance(690); }
                          else { setTotalHours(12); setBalance(300); } // monthly subscription
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                      >
                        <option value="groupe_mensuel">Groupe - Paiement Mensuel (120€/mois)</option>
                        <option value="individuel_seance">Individuel - Paiement par séance (30€/séance)</option>
                        <option value="forfait_10h">Forfait 10h (25€/h)</option>
                        <option value="forfait_20h">Forfait 20h (24€/h)</option>
                        <option value="forfait_30h">Forfait 30h (23€/h)</option>
                        <option value="abonnement_mensuel">Abonnement Mensuel (12h/mois)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">État de Paiement *</label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value as Student['paymentStatus'])}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                      >
                        <option value="paye">Frais réglés (Payé)</option>
                        <option value="en_attente">En attente (Facturé)</option>
                        <option value="en_retard">Impayé (En retard)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Volume Heures total</label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={totalHours}
                        onChange={(e) => setTotalHours(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Heures Consommées</label>
                      <input
                        type="number"
                        min="0"
                        max={totalHours}
                        value={usedHours}
                        onChange={(e) => setUsedHours(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Prix Total Forfait (€)</label>
                      <input
                        type="number"
                        min="0"
                        value={balance}
                        onChange={(e) => setBalance(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Observations Administratives / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Saisissez vos remarques..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-950 transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/15 cursor-pointer"
                  >
                    {editingStudent ? 'Mettre à jour' : 'Inscrire l’élève'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helpers for averages and styles
function calculateAverageGrade(grades: StudentGrade[]): string {
  if (!grades || grades.length === 0) return 'N/A';
  const sum = grades.reduce((acc, curr) => acc + (curr.score / curr.maxScore * 20), 0);
  return (sum / grades.length).toFixed(1);
}

function getBadgeColorFinancial(status: Student['paymentStatus']) {
  switch (status) {
    case 'paye': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'en_attente': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'en_retard': return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  }
}
