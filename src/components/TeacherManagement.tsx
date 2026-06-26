import React, { useState } from 'react';
import { Teacher, ClassSession, Course } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { Plus, Search, Edit2, Trash2, X, AlertCircle, GraduationCap, CheckCircle, Ban, DollarSign, Clock, Award, Phone, Mail, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDurationHours } from './DashboardOverview';

interface TeacherManagementProps {
  teachers: Teacher[];
  sessions: ClassSession[];
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
}

const AVAILABLE_SUBJECTS = ['Mathématiques', 'Physique-Chimie', 'Français', 'Anglais', 'SVT', 'Philosophie', 'Général'];

export default function TeacherManagement({
  teachers,
  sessions,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
}: TeacherManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tous');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlySalary, setHourlySalary] = useState('25');
  const [status, setStatus] = useState<'actif' | 'inactif'>('actif');
  const [errorMessage, setErrorMessage] = useState('');

  // Open modal for creation
  const handleOpenCreate = () => {
    setEditingTeacher(null);
    setFirstName('');
    setLastName('');
    setSubjects([]);
    setEmail('');
    setPhone('');
    setHourlySalary('25');
    setStatus('actif');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFirstName(teacher.firstName);
    setLastName(teacher.lastName);
    setSubjects(teacher.subjects);
    setEmail(teacher.email);
    setPhone(teacher.phone);
    setHourlySalary(teacher.hourlySalary.toString());
    setStatus(teacher.status);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Toggle subject selection inside form
  const handleToggleSubject = (subject: string) => {
    if (subjects.includes(subject)) {
      setSubjects(subjects.filter((s) => s !== subject));
    } else {
      setSubjects([...subjects, subject]);
    }
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !hourlySalary.trim()) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (subjects.length === 0) {
      setErrorMessage('Veuillez sélectionner au moins une matière enseignée.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Veuillez entrer une adresse email valide.');
      return;
    }

    const salary = parseFloat(hourlySalary);
    if (isNaN(salary) || salary <= 0) {
      setErrorMessage('La rémunération horaire doit être un montant valide supérieur à 0.');
      return;
    }

    if (editingTeacher) {
      onUpdateTeacher({
        id: editingTeacher.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        subjects,
        email: email.trim(),
        phone: phone.trim(),
        hourlySalary: salary,
        status,
      });
    } else {
      onAddTeacher({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        subjects,
        email: email.trim(),
        phone: phone.trim(),
        hourlySalary: salary,
        status,
      });
    }

    setIsModalOpen(false);
  };

  // Filter teachers
  const filteredTeachers = teachers.filter((teacher) => {
    const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.phone.includes(searchTerm);

    const matchesSubject =
      selectedSubject === 'Tous' ||
      teacher.subjects.includes(selectedSubject);

    return matchesSearch && matchesSubject;
  });

  // Calculate teacher stats: total hours taught, total monthly pay
  const calculateTeacherStats = (teacherId: string) => {
    const finishedTeacherSessions = sessions.filter(
      s => s.teacherId === teacherId && s.status === 'terminé'
    );
    const totalHours = finishedTeacherSessions.reduce((acc, sess) => {
      return acc + getDurationHours(sess.startTime, sess.endTime);
    }, 0);

    const plannedSessions = sessions.filter(
      s => s.teacherId === teacherId && s.status === 'planifié'
    );
    const plannedHours = plannedSessions.reduce((acc, sess) => {
      return acc + getDurationHours(sess.startTime, sess.endTime);
    }, 0);

    return {
      completedHours: totalHours,
      completedSessionsCount: finishedTeacherSessions.length,
      plannedHours: plannedHours,
      plannedSessionsCount: plannedSessions.length,
    };
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black font-display text-white tracking-tight">Grille des Professeurs & Émoluments</h1>
          <p className="text-slate-400 text-xs mt-1">
            Gérez la liste de vos enseignants, leurs matières de spécialité, leur taux de rémunération de base, et observez leurs calculs de salaires mensuels automatiques.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/15 self-start sm:self-center cursor-pointer"
          id="btn-add-teacher"
        >
          <Plus size={16} />
          <span>Nouveau Professeur</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Rechercher par nom, e-mail, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-sky-500 text-xs text-white"
          />
        </div>
        
        {/* Subject Filter dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono whitespace-nowrap">Matière :</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs py-2.5 px-3 rounded-xl focus:outline-none focus:border-sky-500"
          >
            <option value="Tous">Toutes les matières</option>
            {AVAILABLE_SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Teachers Grid */}
      {filteredTeachers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-xl">
          <GraduationCap size={40} className="mx-auto mb-3 text-slate-700" />
          <h3 className="text-base font-bold text-slate-300 font-display">Aucun professeur répertorié</h3>
          <p className="text-xs text-slate-500 mt-1">Modifiez vos critères ou ajoutez un premier profil enseignant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => {
            const stats = calculateTeacherStats(teacher.id);
            const theoreticalSalary = stats.completedHours * teacher.hourlySalary;
            const projectedSalary = stats.plannedHours * teacher.hourlySalary;

            return (
              <motion.div
                key={teacher.id}
                layout
                whileHover={{ y: -2 }}
                className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700/85 transition-all flex flex-col justify-between ${
                  teacher.status === 'inactif' ? 'opacity-70 border-dashed bg-slate-900/60' : ''
                }`}
              >
                <div className="space-y-4">
                  {/* Status header */}
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border ${
                      teacher.status === 'actif'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${teacher.status === 'actif' ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                      {teacher.status === 'actif' ? 'Actif' : 'Inactif'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(teacher)}
                        className="p-1.5 text-slate-500 hover:text-sky-400 hover:bg-slate-950 rounded-lg transition-all cursor-pointer"
                        title="Modifier l'enseignant"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          setTeacherToDelete(teacher);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-950 rounded-lg transition-all cursor-pointer"
                        title="Supprimer l'enseignant"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Profile info */}
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-1.5 space-y-0.5">
                      <p className="flex items-center gap-1 font-mono text-slate-400/85"><Mail size={11} /> {teacher.email}</p>
                      <p className="flex items-center gap-1 font-mono text-slate-400/85"><Phone size={11} /> {teacher.phone}</p>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.map((sub) => (
                      <span
                        key={sub}
                        className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>

                  {/* AUTOMATIC PAYROLL CALCULATION ENGINE (Requirement #6) */}
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2.5">
                    <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider font-mono block border-b border-slate-900 pb-1.5">
                      Contrôle Horaire & Rémunérations
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-slate-500 block">Fait ce mois</span>
                        <span className="text-white font-bold flex items-center gap-1">
                          <Clock size={11} className="text-emerald-400" />
                          {stats.completedHours}h <span className="text-[9px] text-slate-400">({stats.completedSessionsCount} crs)</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Planifié à venir</span>
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Clock size={11} className="text-sky-400" />
                          {stats.plannedHours}h <span className="text-[9px] text-slate-500">({stats.plannedSessionsCount} crs)</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-slate-900 pt-2">
                      <div>
                        <span className="text-[9px] text-emerald-400 block font-semibold">Salaire Dû</span>
                        <span className="text-emerald-400 font-extrabold text-sm">{theoreticalSalary} €</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Salaire Estimé</span>
                        <span className="text-slate-400 font-semibold text-xs">{projectedSalary} €</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wage and base footer */}
                <div className="border-t border-slate-800/60 pt-3 mt-4 flex justify-between items-center text-xs">
                  <span className="text-slate-500 flex items-center gap-1 font-semibold">
                    <DollarSign size={13} className="text-sky-400" />
                    Taux horaire professeur :
                  </span>
                  <span className="font-bold font-mono text-white text-sm">{teacher.hourlySalary} € <span className="text-[10px] text-slate-500 font-normal">/ h</span></span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Teacher Form Modal (Create / Edit) */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => teacherToDelete && onDeleteTeacher(teacherToDelete.id)}
        title="Désactiver le professeur"
        message={`Voulez-vous désactiver le professeur ${teacherToDelete?.firstName} ${teacherToDelete?.lastName} ? Cette action est irréversible.`}
      />
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                  {editingTeacher ? "Modifier la Fiche Professeur" : "Enregistrer un Nouveau Professeur"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                      placeholder="ex: Jean-Marc"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Nom *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Lefebvre"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
                    Matières Enseignées * (Sélectionnez au moins une)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_SUBJECTS.map((subjectItem) => {
                      const isSelected = subjects.includes(subjectItem);
                      return (
                        <button
                          key={subjectItem}
                          type="button"
                          onClick={() => handleToggleSubject(subjectItem)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                              : 'bg-slate-950 text-slate-500 border-slate-850 hover:bg-slate-900'
                          }`}
                        >
                          {subjectItem}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Taux Horaire (€/h) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="ex: 25"
                      value={hourlySalary}
                      onChange={(e) => setHourlySalary(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Statut d'activité *</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus('actif')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          status === 'actif'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/30'
                            : 'bg-slate-950 text-slate-500 border-slate-850'
                        }`}
                      >
                        <CheckCircle size={12} />
                        <span>Actif</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus('inactif')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          status === 'inactif'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 ring-1 ring-rose-500/30'
                            : 'bg-slate-950 text-slate-500 border-slate-850'
                        }`}
                      >
                        <Ban size={12} />
                        <span>Inactif</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email de Contact *</label>
                  <input
                    type="email"
                    required
                    placeholder="ex: jm.lefebvre@soutienscolaire.fr"
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
                    placeholder="ex: 06 11..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-950 transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/15 cursor-pointer"
                  >
                    {editingTeacher ? 'Mettre à jour' : 'Ajouter le Professeur'}
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
